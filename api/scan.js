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
      "Eres un asistente financiero experto para la aplicación 'Yunai'. " +
      "Analiza la foto de este recibo o ticket de compra y extrae los siguientes campos en un objeto JSON puro:\n" +
      "1. monto: el total final pagado (número sin símbolos ni comas, usa punto para decimales).\n" +
      "2. fecha: la fecha del ticket en formato YYYY-MM-DD.\n" +
      "3. categoria: clasifica de manera inteligente el gasto en UNA de estas: [Alimentos, Transporte, Salud, Entretenimiento, Servicios, Ropa, Restaurantes, Supermercado, Otros].\n" +
      "4. descripcion: usa el establecimiento principal y una descripción muy breve (ej: 'Compra Plaza Vea', 'Cena Pollería').\n\n" +
      "REGLAS CRÍTICAS:\n" +
      "- Responde ÚNICAMENTE con el objeto JSON.\n" +
      "- No incluyas explicaciones ni bloques de código.\n" +
      "- Si un dato exacto no es legible o deducible, el valor debe ser null.";

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
