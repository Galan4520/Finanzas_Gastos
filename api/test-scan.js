// Diagnostic endpoint to test Gemini 2.5 Flash OCR with the real scan prompt
// Call: GET /api/test-scan to verify the API is working
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  // Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  // If POST with image, test the real scan pipeline
  if (req.method === 'POST' && req.body?.image) {
    try {
      const { image } = req.body;
      const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
      const today = new Date().toISOString().split('T')[0];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      // Simplified prompt just to test OCR
      const promptText =
        "Lee esta imagen y extrae cualquier texto que veas.\n" +
        "Responde SOLO con JSON (sin markdown):\n" +
        '{"texto_encontrado": "el texto que veas", "es_ticket": true/false, "monto_total": numero_o_null, "fecha": "YYYY-MM-DD" o null}\n';

      const payload = {
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
          ]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      // Extract non-thought text
      let aiText = null;
      for (let i = parts.length - 1; i >= 0; i--) {
        if (!parts[i].thought && parts[i].text) {
          aiText = parts[i].text;
          break;
        }
      }
      if (!aiText) aiText = parts.find(p => p.text)?.text;

      return res.status(200).json({
        timestamp: new Date().toISOString(),
        imageSize: `${(cleanBase64.length / 1024).toFixed(0)}KB base64`,
        geminiStatus: response.status,
        partsCount: parts.length,
        finishReason: data.candidates?.[0]?.finishReason,
        partsDetail: parts.map((p, i) => ({
          index: i,
          thought: !!p.thought,
          textLen: p.text?.length || 0,
          preview: p.text?.substring(0, 300) || null
        })),
        rawText: aiText,
        usageMetadata: data.usageMetadata,
        error: data.error || null
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET: run basic API health checks
  const results = {};

  // Test: Simple OCR prompt with thinking enabled
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: 'Responde solo JSON sin markdown: {"status": "ok", "timestamp": "now"}' }] }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    results.apiHealth = {
      status: response.status,
      partsCount: parts.length,
      finishReason: data.candidates?.[0]?.finishReason,
      parts: parts.map((p, i) => ({
        index: i,
        thought: !!p.thought,
        textLength: p.text?.length || 0,
        text: p.text?.substring(0, 300) || null
      })),
      usageMetadata: data.usageMetadata
    };
  } catch (e) {
    results.apiHealth = { error: e.message };
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    model: 'gemini-3-flash-preview',
    thinkingBudget: 1024,
    note: 'POST an image with {image: "base64..."} to test real OCR',
    results
  });
}
