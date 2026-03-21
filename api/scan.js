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

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen para analizar.' });
    }

    const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const promptText =
      "Eres un asistente OCR experto para extraer datos de tickets/boletas de compra peruanos.\n\n" +

      "INSTRUCCIONES CRÍTICAS:\n\n" +

      "1. MONTO (campo 'monto'):\n" +
      "   - Busca las palabras: 'TOTAL', 'IMPORTE TOTAL', 'TOTAL A PAGAR', 'MONTO TOTAL'\n" +
      "   - Es el ÚLTIMO monto grande del ticket (después de impuestos/IGV)\n" +
      "   - Formato: número decimal con punto (ej: 45.50)\n" +
      "   - NO usar comas ni símbolos de moneda\n" +
      "   - Si no encuentras el total, usa null\n\n" +

      "2. FECHA (campo 'fecha'):\n" +
      "   - Busca las palabras: 'FECHA', 'DATE', 'FECHA DE EMISIÓN'\n" +
      "   - Formato OBLIGATORIO: YYYY-MM-DD (ej: 2026-03-20)\n" +
      "   - Si NO encuentras la fecha en el ticket, usa la fecha de HOY: " + new Date().toISOString().split('T')[0] + "\n" +
      "   - Si ves solo día/mes, usa el año actual: 2026\n\n" +

      "3. CATEGORIA (campo 'categoria'):\n" +
      "   - Lee el NOMBRE del establecimiento para determinar la categoría\n" +
      "   - DEBE ser EXACTAMENTE una de estas (copia exacta):\n" +
      "     * 'Supermercado' - Plaza Vea, Metro, Tottus, Wong, bodegas\n" +
      "     * 'Restaurantes' - Pollerías, chifas, comida rápida, cafeterías\n" +
      "     * 'Alimentos' - Panaderías, fruterías, carnicerías, mercados\n" +
      "     * 'Transporte' - Taxis, buses, gasolina, peajes, Uber\n" +
      "     * 'Salud' - Farmacias, clínicas, laboratorios\n" +
      "     * 'Entretenimiento' - Cines, juegos, conciertos\n" +
      "     * 'Servicios' - Luz, agua, internet, teléfono\n" +
      "     * 'Ropa' - Tiendas de ropa, zapatos\n" +
      "     * 'Otros' - Todo lo demás\n" +
      "   - Si no estás seguro, usa 'Otros'\n\n" +

      "4. DESCRIPCION (campo 'descripcion'):\n" +
      "   - Formato: 'NOMBRE_TIENDA - productos'\n" +
      "   - Lee los 3-5 productos PRINCIPALES del ticket\n" +
      "   - Máximo 60 caracteres total\n" +
      "   - Ejemplos reales:\n" +
      "     * 'Plaza Vea - Manzanas, pan, leche, huevos'\n" +
      "     * 'Pollería Norky - 1/4 pollo + papas + gaseosa'\n" +
      "     * 'Farmacia Universal - Paracetamol 500mg'\n" +
      "   - Si no hay productos legibles, solo pon el nombre de la tienda\n\n" +

      "FORMATO DE SALIDA:\n" +
      "- SOLO el objeto JSON, sin explicaciones\n" +
      "- NO usar markdown ni bloques de código\n" +
      "- Estructura exacta:\n" +
      '{"monto": 45.50, "fecha": "2026-03-20", "categoria": "Supermercado", "descripcion": "Plaza Vea - Manzanas, pan, leche"}\n\n' +

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
    
    return res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("Scan API API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando la IA'
    });
  }
}
