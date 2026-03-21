export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Test 1: Check if key exists
  if (!apiKey) {
    return res.status(200).json({
      status: 'error',
      test: 'key_exists',
      result: false,
      message: 'GEMINI_API_KEY no está configurada en Vercel Environment Variables'
    });
  }

  // Test 2: Check key format
  const isValidFormat = apiKey.startsWith('AIza') && apiKey.length > 30;
  if (!isValidFormat) {
    return res.status(200).json({
      status: 'warning',
      test: 'key_format',
      result: false,
      message: `La clave no tiene el formato correcto. Longitud: ${apiKey.length}, Empieza con AIza: ${apiKey.startsWith('AIza')}`,
      keyPreview: `${apiKey.substring(0, 10)}...`
    });
  }

  // Test 3: Test actual API call
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const testPayload = {
      contents: [{
        parts: [{ text: "Say 'test successful' in JSON format: {\"result\": \"test successful\"}" }]
      }]
    };

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(200).json({
        status: 'error',
        test: 'api_call',
        result: false,
        httpStatus: response.status,
        message: `Gemini API rechazó la solicitud (${response.status})`,
        errorDetail: responseText.substring(0, 500),
        possibleCauses: [
          'La API key expiró o fue revocada',
          'La API key no tiene permisos para Gemini 1.5 Flash',
          'Has excedido la cuota gratuita de Google AI',
          'La API key fue generada para un proyecto diferente'
        ]
      });
    }

    return res.status(200).json({
      status: 'success',
      test: 'api_call',
      result: true,
      message: '✅ La API key funciona correctamente',
      keyPreview: `${apiKey.substring(0, 10)}...`,
      response: responseText.substring(0, 200)
    });

  } catch (error) {
    return res.status(200).json({
      status: 'error',
      test: 'api_call',
      result: false,
      message: `Error al llamar a Gemini: ${error.message}`
    });
  }
}
