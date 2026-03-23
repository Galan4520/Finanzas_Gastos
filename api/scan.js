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

    // Build detailed cuentas description (supports both legacy string array and new object array)
    const cuentasList = cuentas || [{ alias: 'Billetera', banco: 'Efectivo', tipo: 'efectivo' }];
    let cuentasDescription = '';
    if (cuentasList.length > 0 && typeof cuentasList[0] === 'object') {
      cuentasDescription = cuentasList.map(c => {
        const saldo = c.saldo !== undefined ? ` | Saldo: S/${Number(c.saldo).toFixed(2)}` : '';
        if (c.tipo === 'efectivo') return `- "${c.alias}" (Efectivo/Cash)${saldo}`;
        return `- "${c.alias}" → Banco: ${c.banco}, Tipo: ${c.tipo === 'credito' ? 'CRÉDITO' : 'DÉBITO'}${saldo}`;
      }).join('\n');
    } else {
      cuentasDescription = cuentasList.map(c => `- "${c}"`).join('\n');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const promptText =
      "Eres Yunai, un asistente OCR financiero experto para tickets/boletas/recibos peruanos.\n\n" +

      "═══ CUENTAS Y TARJETAS DEL USUARIO ═══\n" +
      cuentasDescription + "\n\n" +

      "REGLAS PARA CUENTA:\n" +
      "- Si ves nombre de banco en el voucher, busca la tarjeta que corresponda\n" +
      "- Si es un ingreso/depósito → SOLO tarjetas de DÉBITO o Billetera\n" +
      "- Si ves cuotas → SOLO tarjetas de CRÉDITO\n" +
      "- El valor de 'cuenta' DEBE ser EXACTAMENTE el alias de la lista\n" +
      "- Si no puedes inferir, cuenta = null y agregar a campos_inciertos\n\n" +

      "VALIDACIÓN DE SALDO:\n" +
      "- Cada cuenta tiene un SALDO mostrado arriba. REVÍSALO.\n" +
      "- Si es un GASTO y el monto > saldo de la cuenta inferida:\n" +
      "  → Agrega 'cuenta' a campos_inciertos\n" +
      "  → En 'pregunta': 'Causa, tu [cuenta] solo tiene S/X.XX, ¿seguro pagaste de ahí?'\n" +
      "  → En 'opciones': la cuenta inferida + cuentas con saldo suficiente\n" +
      "- Si es ingreso, no validar saldo\n\n" +

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

    // Try array first (multi-movement), then single object
    const arrayMatch = aiText.match(/\[[\s\S]*\]/);
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    if (arrayMatch) {
      aiText = arrayMatch[0];
    } else if (jsonMatch) {
      aiText = jsonMatch[0];
    }

    let parsedData = JSON.parse(aiText);

    // Normalize: always return an array
    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    // Ensure each movement has campos_inciertos as array
    parsedData = parsedData.map(mov => ({
      ...mov,
      campos_inciertos: Array.isArray(mov.campos_inciertos) ? mov.campos_inciertos : []
    }));

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
