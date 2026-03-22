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

    // Build detailed cuentas description for the AI
    // cuentas can be either:
    // - Array of strings (legacy): ['Billetera', 'Visa BCP']
    // - Array of objects (new): [{alias, banco, tipo, tipo_tarjeta}]
    let cuentasDescription = '';
    const cuentasList = cuentas || [{ alias: 'Billetera', banco: 'Efectivo', tipo: 'efectivo' }];

    if (cuentasList.length > 0 && typeof cuentasList[0] === 'object') {
      cuentasDescription = cuentasList.map(c => {
        if (c.tipo === 'efectivo') return `- "${c.alias}" (Efectivo/Cash)`;
        return `- "${c.alias}" → Banco: ${c.banco}, Tipo: ${c.tipo === 'credito' ? 'CRÉDITO' : 'DÉBITO'}, Tarjeta: ${c.tipo_tarjeta || 'N/A'}`;
      }).join('\n');
    } else {
      cuentasDescription = cuentasList.map(c => `- "${c}"`).join('\n');
    }

    const promptText =
      "Eres Yunai, un asistente financiero peruano inteligente. El usuario está dictando un movimiento financiero en español.\n\n" +

      "═══ CUENTAS Y TARJETAS DEL USUARIO ═══\n" +
      cuentasDescription + "\n\n" +

      "═══ REGLAS CRÍTICAS PARA SELECCIONAR CUENTA ═══\n" +
      "1. Si el usuario menciona un BANCO (ej: 'Interbank', 'IBK', 'BCP', 'BBVA', 'Scotia'), " +
      "busca en la lista la tarjeta que corresponda a ese banco.\n" +
      "2. Si es un INGRESO (sueldo, pago recibido, transferencia) → SOLO puede ir a una tarjeta de DÉBITO o a Billetera. " +
      "NUNCA a una tarjeta de CRÉDITO. Si el banco mencionado solo tiene crédito, pregunta.\n" +
      "3. Si es un GASTO con cuotas → SOLO puede ir a una tarjeta de CRÉDITO.\n" +
      "4. Si es un GASTO sin cuotas → puede ir a Billetera, débito o crédito.\n" +
      "5. Si el usuario dice 'IBK' o 'inter' = Interbank. 'BCP' = BCP. 'BBVA' o 'continental' = BBVA. 'Scotia' = Scotiabank.\n" +
      "6. Si el banco mencionado tiene VARIAS tarjetas (ej: débito y crédito de Interbank), " +
      "elige la correcta según el tipo de movimiento (reglas 2-4). " +
      "Si no estás seguro, agrega a campos_inciertos con SOLO las opciones de ese banco.\n" +
      "7. El valor de 'cuenta' DEBE ser EXACTAMENTE el alias de la lista (ej: 'Visa Signature', 'Débito Interbank'), NO el nombre del banco.\n" +
      "8. Si dice 'efectivo', 'cash', 'plata' → cuenta = 'Billetera'\n" +
      "9. Si no menciona banco ni cuenta → cuenta = null y agregar a campos_inciertos\n\n" +

      "═══ CATEGORÍAS DE GASTOS (usar EXACTAMENTE con emoji) ═══\n" +
      categoriasGastos.map(c => `- ${c}`).join('\n') + "\n\n" +

      "═══ CATEGORÍAS DE INGRESOS (usar EXACTAMENTE con emoji) ═══\n" +
      categoriasIngresos.map(c => `- ${c}`).join('\n') + "\n\n" +

      "═══ CAMPOS A EXTRAER ═══\n" +
      "- tipo: 'gasto' (efectivo/débito), 'ingreso', o 'tarjeta' (crédito/cuotas)\n" +
      "- monto: número decimal (ej: 45.50)\n" +
      "- descripcion: qué se compró/recibió (máx 60 chars)\n" +
      "- categoria: EXACTAMENTE una de las categorías listadas (con emoji)\n" +
      "- cuenta: EXACTAMENTE el alias de la cuenta/tarjeta, o null\n" +
      "- fecha: YYYY-MM-DD. Si no dice fecha, usar hoy: " + today + "\n" +
      "- notas: detalles adicionales, o vacío\n" +
      "- num_cuotas: número de cuotas si mencionó. Si no, usar 1\n" +
      "- tipo_gasto: 'deuda' (compra normal) o 'suscripcion' (recurrente)\n" +
      "- confianza: 0-1 qué tan seguro estás\n" +
      "- campos_inciertos: array de campos donde no estás seguro\n\n" +

      "═══ CAMPOS_INCIERTOS ═══\n" +
      "Cuando no estés seguro de un campo, agrega un objeto con:\n" +
      "- campo: nombre del campo\n" +
      "- valor_sugerido: tu mejor opción (o null)\n" +
      "- opciones: SOLO las opciones relevantes (ej: si dijo 'interbank', solo las tarjetas de Interbank)\n" +
      "- pregunta: pregunta en tono peruano amigable ('causa', 'pata')\n\n" +

      "═══ FORMATO DE SALIDA (solo JSON, sin markdown) ═══\n" +
      '{\n' +
      '  "tipo": "ingreso",\n' +
      '  "monto": 3000,\n' +
      '  "descripcion": "Sueldo marzo",\n' +
      '  "categoria": "💼 Salario",\n' +
      '  "cuenta": "Débito Interbank",\n' +
      '  "fecha": "' + today + '",\n' +
      '  "notas": "",\n' +
      '  "num_cuotas": 1,\n' +
      '  "meta_id": "",\n' +
      '  "tipo_gasto": "deuda",\n' +
      '  "confianza": 0.95,\n' +
      '  "campos_inciertos": [],\n' +
      '  "pregunta_seguimiento": null\n' +
      '}\n\n' +
      "RESPONDE AHORA CON EL JSON:";

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
