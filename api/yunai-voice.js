export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
    }

    const { audio, mimeType, cuentas, categorias } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'No se recibió audio para procesar.' });
    }

    const cleanBase64 = audio.includes('base64,') ? audio.split('base64,')[1] : audio;
    const audioMime = mimeType || 'audio/webm';

    const today = new Date().toISOString().split('T')[0];

    const categoriasGastos = categorias?.gastos || [
      '🏠 Vivienda', '💡 Servicios', '🍕 Alimentación', '🚗 Transporte',
      '💊 Salud', '📚 Educación', '🎮 Entretenimiento', '👕 Ropa',
      '💅 Cuidado Personal', '📱 Tecnología', '🎁 Regalos', '✈️ Viajes',
      '🐕 Mascotas', '💳 Otros'
    ];
    const categoriasIngresos = categorias?.ingresos || [
      '💼 Salario', '💻 Freelance', '📈 Inversiones', '🏦 Intereses',
      '🎁 Bonos', '🏠 Rentas', '💰 Otros'
    ];
    const cuentasDisponibles = cuentas || ['Billetera'];

    const promptText =
      "Eres Yunai, un asistente financiero peruano inteligente. El usuario está dictando un movimiento financiero en español.\n\n" +

      "CUENTAS/MÉTODOS DE PAGO DISPONIBLES del usuario:\n" +
      cuentasDisponibles.map(c => `- ${c}`).join('\n') + "\n\n" +

      "CATEGORÍAS DE GASTOS disponibles (usar EXACTAMENTE con emoji):\n" +
      categoriasGastos.map(c => `- ${c}`).join('\n') + "\n\n" +

      "CATEGORÍAS DE INGRESOS disponibles (usar EXACTAMENTE con emoji):\n" +
      categoriasIngresos.map(c => `- ${c}`).join('\n') + "\n\n" +

      "Tu tarea es extraer UN movimiento financiero del audio.\n\n" +

      "CAMPOS A EXTRAER:\n" +
      "- tipo: 'gasto', 'ingreso', o 'tarjeta' (crédito/cuotas)\n" +
      "- monto: número decimal (ej: 45.50)\n" +
      "- descripcion: qué se compró/recibió (máx 60 chars)\n" +
      "- categoria: EXACTAMENTE una de las categorías listadas arriba (con emoji)\n" +
      "- cuenta: EXACTAMENTE una de las cuentas listadas arriba, o null si no la mencionó\n" +
      "- fecha: formato YYYY-MM-DD. Si no dice fecha, usar hoy: " + today + "\n" +
      "- notas: detalles adicionales que mencionó, o vacío\n" +
      "- num_cuotas: número de cuotas si mencionó (ej: 'a 3 cuotas' → 3). Si no mencionó, usar 1\n" +
      "- tipo_gasto: 'deuda' (compra normal) o 'suscripcion' (pago recurrente mensual como Netflix)\n\n" +

      "REGLAS IMPORTANTES:\n" +
      "1. Si el usuario dice algo ambiguo, infiere lo más lógico\n" +
      "2. Si NO estás seguro de un campo, agrégalo a 'campos_inciertos' con opciones\n" +
      "3. Si menciona cuotas o tarjeta de crédito, tipo debe ser 'tarjeta'\n" +
      "4. La cuenta DEBE coincidir EXACTAMENTE con una de la lista o ser null\n" +
      "5. Si dice 'efectivo', 'cash', 'plata' → cuenta = 'Billetera'\n" +
      "6. 'confianza' es un número 0-1 de qué tan seguro estás de la extracción general\n\n" +

      "FORMATO DE SALIDA (solo JSON, sin markdown):\n" +
      '{\n' +
      '  "tipo": "gasto",\n' +
      '  "monto": 45.50,\n' +
      '  "descripcion": "Pizza familiar",\n' +
      '  "categoria": "🍕 Alimentación",\n' +
      '  "cuenta": "Billetera",\n' +
      '  "fecha": "' + today + '",\n' +
      '  "notas": "",\n' +
      '  "num_cuotas": 1,\n' +
      '  "meta_id": "",\n' +
      '  "tipo_gasto": "deuda",\n' +
      '  "confianza": 0.9,\n' +
      '  "campos_inciertos": [\n' +
      '    { "campo": "cuenta", "valor_sugerido": "Billetera", "opciones": ["Billetera", "Visa BCP"], "pregunta": "¿De qué cuenta sale, causa?" }\n' +
      '  ],\n' +
      '  "pregunta_seguimiento": null\n' +
      '}\n\n' +
      "Si campos_inciertos está vacío, usar []. RESPONDE AHORA CON EL JSON:";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: audioMime,
              data: cleanBase64
            }
          }
        ]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Voice API Error:", errorText);
      throw new Error(`Error desde Google Gemini (${response.status})`);
    }

    const data = await response.json();
    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error("Yunai no pudo entender el audio.");
    }

    aiText = aiText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) aiText = jsonMatch[0];

    const parsedData = JSON.parse(aiText);

    // Ensure campos_inciertos is always an array
    if (!Array.isArray(parsedData.campos_inciertos)) {
      parsedData.campos_inciertos = [];
    }

    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error("Yunai Voice API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando el audio'
    });
  }
}
