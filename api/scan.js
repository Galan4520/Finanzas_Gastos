export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in Vercel Environment Variables");
      return res.status(500).json({ error: 'La plataforma no tiene la clave de IA configurada. (GEMINI_API_KEY faltante en Vercel)' });
    }

    const { image, cuentas } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen para analizar.' });
    }

    const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
    const today = new Date().toISOString().split('T')[0];

    // Build detailed cuentas description (supports both legacy string array and new object array)
    const cuentasList = cuentas || [{ alias: 'Billetera', banco: 'Efectivo', tipo: 'efectivo' }];
    let cuentasDescription = '';
    if (cuentasList.length > 0 && typeof cuentasList[0] === 'object') {
      cuentasDescription = cuentasList.map(c => {
        const saldo = c.saldo !== undefined ? ` | Saldo: S/${Number(c.saldo).toFixed(2)}` : '';
        if (c.tipo === 'efectivo') return `- "${c.alias}" (Efectivo/Cash)${saldo}`;
        return `- "${c.alias}" → Banco: ${c.banco}, Tipo: ${c.tipo === 'credito' ? 'CRÉDITO' : 'DÉBITO'}${saldo}`;
      }).join('\n');
    } else {
      cuentasDescription = cuentasList.map(c => `- "${c}"`).join('\n');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText =
      "TAREA: Analiza esta imagen de ticket/boleta/recibo y extrae los datos financieros.\n\n" +

      "PASO 1 — LEE TODO EL TEXTO DE LA IMAGEN:\n" +
      "Primero, lee cuidadosamente TODA la imagen. Busca:\n" +
      "- Nombre del establecimiento/tienda (arriba del ticket)\n" +
      "- RUC (número de 11 dígitos)\n" +
      "- Fecha (formato DD/MM/YYYY o similar)\n" +
      "- Lista de productos/items comprados\n" +
      "- Subtotal, IGV/impuestos\n" +
      "- TOTAL o IMPORTE TOTAL (el monto final más grande)\n" +
      "- Método de pago (efectivo, tarjeta, Yape, Plin)\n" +
      "- Número de cuotas si aplica\n\n" +

      "PASO 2 — EXTRAE LOS CAMPOS:\n\n" +

      "tipo: 'gasto' (compras/pagos), 'ingreso' (depósitos/abonos), o 'tarjeta' (crédito/cuotas). Default: 'gasto'\n" +
      "monto: El TOTAL final (después de IGV). Número con punto decimal (ej: 45.50). Si no lo encuentras: null\n" +
      "fecha: Formato YYYY-MM-DD. Si no encuentras fecha, usa: " + today + "\n" +
      "descripcion: 'NOMBRE_TIENDA - productos principales' (máx 60 chars)\n" +
      "categoria: EXACTAMENTE una de: '🍕 Alimentación', '🚗 Transporte', '💊 Salud', '🎮 Entretenimiento', '💡 Servicios', '👕 Ropa', '🏠 Vivienda', '📚 Educación', '💅 Cuidado Personal', '📱 Tecnología', '🎁 Regalos', '✈️ Viajes', '🐕 Mascotas', '💳 Otros'\n" +
      "num_cuotas: Número de cuotas (default: 1)\n" +
      "notas: Detalles extra o vacío\n" +
      "tipo_gasto: 'deuda' (default)\n\n" +

      "PASO 3 — ASIGNA CUENTA:\n" +
      "Cuentas del usuario:\n" + cuentasDescription + "\n\n" +
      "- Si el voucher muestra un banco, busca la tarjeta correspondiente\n" +
      "- Si dice Yape/Plin → busca la tarjeta del banco de Yape/Plin del usuario\n" +
      "- Si ves cuotas → solo tarjetas de CRÉDITO\n" +
      "- El valor DEBE ser exactamente un alias de la lista. Si no puedes inferir: null\n" +
      "- Si es gasto y monto > saldo de la cuenta → agregar a campos_inciertos\n\n" +

      "PASO 4 — CAMPOS INCIERTOS:\n" +
      "Si no estás seguro de un campo, agrega un objeto a campos_inciertos con:\n" +
      "{ campo, valor_sugerido, opciones: [...], pregunta: '...' }\n" +
      "Pregunta en tono peruano amigable (usa 'causa', 'pata')\n\n" +

      "RESPONDE CON ESTE JSON:\n" +
      '{\n' +
      '  "tipo": "gasto",\n' +
      '  "monto": 45.50,\n' +
      '  "descripcion": "Plaza Vea - Manzanas, pan, leche",\n' +
      '  "categoria": "🍕 Alimentación",\n' +
      '  "cuenta": null,\n' +
      '  "fecha": "' + today + '",\n' +
      '  "notas": "",\n' +
      '  "num_cuotas": 1,\n' +
      '  "tipo_gasto": "deuda",\n' +
      '  "confianza": 0.85,\n' +
      '  "campos_inciertos": []\n' +
      '}';

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: cleanBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      throw new Error(`Error desde Google Gemini (${response.status})`);
    }

    const data = await response.json();
    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error("La Inteligencia Artificial devolvió una respuesta vacía.");
    }

    // Clean generic Markdown/JSON wrappers
    aiText = aiText.replace(/```json/gi, "").replace(/```/gi, "").trim();

    // Try array first (multi-movement), then single object
    const arrayMatch = aiText.match(/\[[\s\S]*\]/);
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    if (arrayMatch) {
      aiText = arrayMatch[0];
    } else if (jsonMatch) {
      aiText = jsonMatch[0];
    }

    let parsedData = JSON.parse(aiText);

    // Normalize: always return an array
    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    // Ensure each movement has campos_inciertos as array
    parsedData = parsedData.map(mov => ({
      ...mov,
      campos_inciertos: Array.isArray(mov.campos_inciertos) ? mov.campos_inciertos : []
    }));

    return res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("Scan API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando la IA'
    });
  }
}
