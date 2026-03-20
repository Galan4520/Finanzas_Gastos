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
      error: 'GEMINI_API_KEY no configurada'
    });
  }

  try {
    // List all available models
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response = await fetch(listUrl, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({
        error: `Error listando modelos (${response.status})`,
        detail: errorText
      });
    }

    const data = await response.json();

    // Filter only models that support generateContent
    const modelsWithGenerate = data.models?.filter(m =>
      m.supportedGenerationMethods?.includes('generateContent')
    ) || [];

    return res.status(200).json({
      success: true,
      totalModels: data.models?.length || 0,
      modelsWithGenerateContent: modelsWithGenerate.length,
      availableModels: modelsWithGenerate.map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description?.substring(0, 100),
        supportedMethods: m.supportedGenerationMethods
      }))
    });

  } catch (error) {
    return res.status(200).json({
      error: `Error: ${error.message}`
    });
  }
}
