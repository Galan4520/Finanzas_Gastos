// Diagnostic endpoint to test Gemini 2.5 Flash OCR
// Call: GET /api/test-scan to verify the API is working
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  const results = {};

  // Test 1: Simple text prompt (no image, no thinking config)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: 'Responde solo con el JSON: {"test": "ok", "numero": 42}' }] }],
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    results.test1_textOnly = {
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
    results.test1_textOnly = { error: e.message };
  }

  // Test 2: Same but WITHOUT thinkingConfig
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: 'Responde solo con el JSON: {"test": "ok_noThinkConfig", "numero": 99}' }] }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    results.test2_noThinkConfig = {
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
    results.test2_noThinkConfig = { error: e.message };
  }

  // Test 3: A tiny 1x1 white pixel JPEG as base64 to test image processing
  try {
    // Minimal JPEG: 1x1 white pixel
    const tinyJpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpgA//Z';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: 'Describe esta imagen en 1 oración corta. Responde en JSON: {"descripcion": "..."}' },
          { inline_data: { mime_type: "image/jpeg", data: tinyJpeg } }
        ]
      }],
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    results.test3_tinyImage = {
      status: response.status,
      partsCount: parts.length,
      finishReason: data.candidates?.[0]?.finishReason,
      parts: parts.map((p, i) => ({
        index: i,
        thought: !!p.thought,
        textLength: p.text?.length || 0,
        text: p.text?.substring(0, 300) || null
      })),
      error: data.error || null,
      usageMetadata: data.usageMetadata
    };
  } catch (e) {
    results.test3_tinyImage = { error: e.message };
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    model: 'gemini-2.5-flash',
    results
  });
}
