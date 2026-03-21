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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const promptText =
      "Eres un asistente financiero experto para la aplicación 'Yunai'. " +
      "Analiza la foto de este recibo o ticket de compra y extrae los siguientes campos en un objeto JSON puro:\n\n" +

      "1. monto: el total final pagado (número sin símbolos ni comas, usa punto para decimales).\n" +
      "   Ejemplo: 45.50\n\n" +

      "2. fecha: la fecha del ticket en formato YYYY-MM-DD.\n" +
      "   Ejemplo: 2026-03-20\n\n" +

      "3. categoria: clasifica de manera PRECISA en UNA de estas categorías:\n" +
      "   - Supermercado: compras en supermercados, mercados, bodegas\n" +
      "   - Restaurantes: comida en restaurantes, cafeterías, food courts\n" +
      "   - Alimentos: frutas, verduras, panadería, carnicería\n" +
      "   - Transporte: taxis, buses, combustible, Uber, peajes\n" +
      "   - Salud: farmacias, medicinas, consultas médicas\n" +
      "   - Entretenimiento: cine, conciertos, juegos, streaming\n" +
      "   - Servicios: agua, luz, internet, teléfono\n" +
      "   - Ropa: tiendas de ropa, zapatos, accesorios\n" +
      "   - Otros: todo lo demás\n" +
      "   Ejemplo: 'Supermercado'\n\n" +

      "4. descripcion: usa el nombre del establecimiento + lista breve de productos principales (máximo 60 caracteres).\n" +
      "   Ejemplos:\n" +
      "   - 'Plaza Vea - Frutas, verduras, pan, leche'\n" +
      "   - 'Pollería Los Ángeles - 1/4 pollo + papas'\n" +
      "   - 'Farmacia Universal - Paracetamol, alcohol'\n" +
      "   - 'Metro - Arroz, aceite, huevos, pollo'\n\n" +

      "REGLAS CRÍTICAS:\n" +
      "- Responde ÚNICAMENTE con el objeto JSON.\n" +
      "- No incluyas explicaciones ni bloques de código markdown.\n" +
      "- La categoría DEBE ser exactamente una de las 9 opciones listadas.\n" +
      "- La descripción DEBE incluir productos/items cuando sea posible.\n" +
      "- Si un dato no es legible, usa null.\n\n" +

      "Formato de respuesta:\n" +
      '{"monto": 45.50, "fecha": "2026-03-20", "categoria": "Supermercado", "descripcion": "Plaza Vea - Frutas, verduras, pan"}';

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
