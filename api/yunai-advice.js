import { verifyAuth } from './_lib/verifyAuth.js';

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Auth check
  const { error: authError, status: authStatus } = await verifyAuth(req);
  if (authError) {
    return res.status(authStatus).json({ error: authError });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in Vercel Environment Variables");
      return res.status(500).json({ error: 'GEMINI_API_KEY faltante en Vercel' });
    }

    const { contexto } = req.body;
    if (!contexto) {
      return res.status(400).json({ error: 'No se recibió contexto financiero.' });
    }

    const { semana, mes, categoriasTop, cuentas, pagos, nombreUsuario } = contexto;

    const promptText =
      "Eres Yunai, un carpincho financiero peruano sabio y amigable.\n\n" +

      "PERSONALIDAD:\n" +
      "- Hablas en español peruano casual ('chévere', 'pila', 'pucha', 'bacán', 'vamos con todo', 'causa')\n" +
      "- Eres motivador, NUNCA crítico ni condescendiente\n" +
      "- Usas máximo 3-4 oraciones cortas y directas\n" +
      "- Siempre das UN consejo accionable específico basado en los datos\n" +
      "- Menciona números concretos del usuario (no inventes datos)\n\n" +

      `DATOS FINANCIEROS DE ${nombreUsuario || 'amigo'}:\n\n` +

      "📊 COMPARACIÓN SEMANAL:\n" +
      `- Gasto esta semana: S/${(semana?.gastoEstaSemana || 0).toFixed(2)}\n` +
      `- Gasto semana anterior: S/${(semana?.gastoSemanaAnterior || 0).toFixed(2)}\n` +
      `- Cambio: ${(semana?.porcentajeCambio || 0).toFixed(1)}%\n\n` +

      "💰 RESUMEN DEL MES:\n" +
      `- Ingresos del mes: S/${(mes?.ingresosMes || 0).toFixed(2)}\n` +
      `- Gastos del mes: S/${(mes?.gastosMes || 0).toFixed(2)}\n` +
      `- Balance total: S/${(mes?.balanceTotal || 0).toFixed(2)}\n` +
      `- Deuda tarjetas: S/${(mes?.deudaTotal || 0).toFixed(2)}\n` +
      `- Uso de crédito: ${(mes?.usoCredito || 0).toFixed(1)}%\n` +
      `- Límite total crédito: S/${(mes?.limiteTotal || 0).toFixed(2)}\n\n` +

      "📁 TOP CATEGORÍAS DE GASTO (del período seleccionado):\n" +
      (categoriasTop || []).map(c => `- ${c.nombre}: S/${(c.monto || 0).toFixed(2)}`).join('\n') + "\n\n" +

      "💳 CUENTAS:\n" +
      `- Billetera (efectivo): S/${(cuentas?.billetera || 0).toFixed(2)}\n` +
      (cuentas?.tarjetasDebito || []).map(t => `- Débito ${t.alias}: S/${(t.balance || 0).toFixed(2)}`).join('\n') +
      (cuentas?.tarjetasDebito?.length ? '\n' : '') +
      (cuentas?.tarjetasCredito || []).map(t => `- Crédito ${t.alias}: deuda S/${(t.deuda || 0).toFixed(2)}, disponible S/${(t.disponible || 0).toFixed(2)}`).join('\n') + "\n\n" +

      "📅 PAGOS PRÓXIMOS:\n" +
      `- A pagar este mes: S/${(pagos?.esteMes || 0).toFixed(2)}\n` +
      `- A pagar próximo mes: S/${(pagos?.proximoMes || 0).toFixed(2)}\n\n` +

      "ANÁLISIS REQUERIDO:\n" +
      "1. Compara esta semana vs la anterior y comenta la tendencia (subió/bajó/igual)\n" +
      "2. Si hay una categoría que domina el gasto, menciónala y da un tip de ahorro REAL y específico\n" +
      "3. Si el uso de crédito es alto (>60%), alerta amigablemente\n" +
      "4. Si los pagos próximos son altos respecto al balance, avisa\n" +
      "5. Si todo va bien, felicita con entusiasmo\n\n" +

      "FORMATO DE SALIDA:\n" +
      "- SOLO el objeto JSON, sin explicaciones ni markdown\n" +
      "- El consejo DEBE ser personalizado con los números reales del usuario\n" +
      "- Máximo 3-4 oraciones en el consejo\n" +
      "- Estructura exacta:\n" +
      '{"consejo": "texto del análisis personalizado aquí", "estado": "bien", "categoriaDestacada": "🍕 Alimentación", "tipAhorro": "tip corto específico"}\n\n' +
      "- estado: 'bien' si gastó menos o va bien, 'alerta' si hay algo que cuidar, 'mal' si gastó mucho más\n" +
      "- categoriaDestacada: la categoría con más gasto (con emoji)\n" +
      "- tipAhorro: un tip corto y accionable de máximo 15 palabras\n\n" +
      "RESPONDE AHORA CON EL JSON:";

    const payload = {
      contents: [{
        parts: [{ text: promptText }]
      }]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;

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

    // Extract actual text response (skip thinking parts if any)
    const parts = data.candidates?.[0]?.content?.parts || [];
    let aiText = null;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!parts[i].thought && parts[i].text) {
        aiText = parts[i].text;
        break;
      }
    }
    if (!aiText) {
      aiText = parts.find(p => p.text)?.text;
    }

    if (!aiText) {
      throw new Error("Yunai no pudo generar un consejo.");
    }

    // Clean markdown/JSON wrappers
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
    console.error("Yunai Advice API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error generando consejo de Yunai'
    });
  }
}
