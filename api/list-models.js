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

  if (!apiKey) {
    return res.status(200).json({
      status: 'error',
      message: 'GEMINI_API_KEY no está configurada'
    });
  }

  try {
    // Llamar al endpoint de Google para listar modelos
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({
        status: 'error',
        message: `Error al obtener modelos (${response.status})`,
        errorDetail: errorText.substring(0, 500)
      });
    }

    const data = await response.json();

    // Filtrar solo modelos de Gemini que soporten generateContent
    const geminiModels = data.models
      ?.filter(model =>
        model.name.includes('gemini') &&
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map(model => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName,
        description: model.description,
        inputTokenLimit: model.inputTokenLimit,
        outputTokenLimit: model.outputTokenLimit
      }));

    return res.status(200).json({
      status: 'success',
      totalModels: geminiModels?.length || 0,
      models: geminiModels || [],
      apiKeyPreview: `${apiKey.substring(0, 10)}...`
    });

  } catch (error) {
    return res.status(200).json({
      status: 'error',
      message: `Error: ${error.message}`
    });
  }
}
