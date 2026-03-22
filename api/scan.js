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
    const cuentasDisponibles = cuentas || ['Billetera'];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const promptText =
      "Eres Yunai, un asistente OCR financiero experto para tickets/boletas/recibos peruanos.\n\n" +

      "CUENTAS/MÉTODOS DE PAGO del usuario:\n" +
      cuentasDisponibles.map(c => `- ${c}`).join('\n') + "\n\n" +

      "INSTRUCCIONES CRÍTICAS:\n\n" +

      "1. TIPO (campo 'tipo'):\n" +
      "   - 'gasto' — Compras, pagos, servicios (la mayoría de boletas)\n" +
      "   - 'ingreso' — Depósitos, transferencias recibidas, vouchers de abono\n" +
      "   - 'tarjeta' — Si ves cuotas, crédito, o estado de cuenta de tarjeta\n" +
      "   - Si no estás seguro, usa 'gasto' y agrégalo a campos_inciertos\n\n" +

      "2. MONTO (campo 'monto'):\n" +
      "   - Busca: 'TOTAL', 'IMPORTE TOTAL', 'TOTAL A PAGAR', 'MONTO TOTAL'\n" +
      "   - Es el ÚLTIMO monto grande del ticket (después de impuestos/IGV)\n" +
      "   - Formato: número decimal con punto (ej: 45.50)\n" +
      "   - Si no encuentras el total, usa null\n\n" +

      "3. FECHA (campo 'fecha'):\n" +
      "   - Busca: 'FECHA', 'DATE', 'FECHA DE EMISIÓN'\n" +
      "   - Formato OBLIGATORIO: YYYY-MM-DD\n" +
      "   - Si NO encuentras la fecha, usa hoy: " + today + "\n\n" +

      "4. CATEGORIA (campo 'categoria'):\n" +
      "   - Lee el NOMBRE del establecimiento para determinar la categoría\n" +
      "   - DEBE ser EXACTAMENTE una de estas (con emoji):\n" +
      "     '🍕 Alimentación', '🚗 Transporte', '💊 Salud', '🎮 Entretenimiento',\n" +
      "     '💡 Servicios', '👕 Ropa', '🏠 Vivienda', '📚 Educación',\n" +
      "     '💅 Cuidado Personal', '📱 Tecnología', '🎁 Regalos', '✈️ Viajes',\n" +
      "     '🐕 Mascotas', '💳 Otros'\n" +
      "   - Si no estás seguro, usa '💳 Otros'\n\n" +

      "5. DESCRIPCION (campo 'descripcion'):\n" +
      "   - Formato: 'NOMBRE_TIENDA - productos'\n" +
      "   - Máximo 60 caracteres\n\n" +

      "6. CUENTA (campo 'cuenta'):\n" +
      "   - Si ves nombre de banco/tarjeta en el voucher, asócialo con las cuentas del usuario\n" +
      "   - Si no puedes inferir, usa null y agrégalo a campos_inciertos\n\n" +

      "7. CUOTAS (campo 'num_cuotas'):\n" +
      "   - Si ves 'CUOTAS', 'NRO CUOTAS', extraer el número\n" +
      "   - Si no hay cuotas, usar 1\n\n" +

      "8. CAMPOS_INCIERTOS:\n" +
      "   - Si NO estás seguro de algún campo, agrégalo al array\n" +
      "   - Cada campo incierto debe tener: campo, valor_sugerido, opciones[], pregunta\n" +
      "   - La pregunta debe ser en tono peruano amigable (usa 'causa', 'pata', etc.)\n\n" +

      "FORMATO DE SALIDA (solo JSON, sin markdown):\n" +
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
      '  "campos_inciertos": [\n' +
      '    { "campo": "cuenta", "valor_sugerido": null, "opciones": ["Billetera", "Visa BCP"], "pregunta": "¿De qué cuenta salieron estos S/45.50, causa?" }\n' +
      '  ]\n' +
      '}\n\n' +
      "RESPONDE AHORA CON EL JSON:";

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
      }]
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
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
    }

    const parsedData = JSON.parse(aiText);

    // Ensure campos_inciertos is always an array
    if (!Array.isArray(parsedData.campos_inciertos)) {
      parsedData.campos_inciertos = [];
    }

    // Backward compat: also include legacy fields for ScanResultSummary
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
