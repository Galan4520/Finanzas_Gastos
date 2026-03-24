export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
    }

    const { audio, mimeType, cuentas, categorias } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'No se recibió audio para procesar.' });
    }

    const cleanBase64 = audio.includes('base64,') ? audio.split('base64,')[1] : audio;
    const audioMime = mimeType || 'audio/webm';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    const categoriasGastos = categorias?.gastos || [
      '🏠 Vivienda', '💡 Servicios', '🍕 Alimentación', '🚗 Transporte',
      '💊 Salud', '📚 Educación', '🎮 Entretenimiento', '👕 Ropa',
      '💅 Cuidado Personal', '📱 Tecnología', '🎁 Regalos', '✈️ Viajes',
      '🐕 Mascotas', '💳 Otros'
    ];
    const categoriasIngresos = categorias?.ingresos || [
      '💼 Salario', '💻 Freelance', '📈 Inversiones', '🏦 Intereses',
      '🎁 Bonos', '🏠 Rentas', '💰 Otros'
    ];

    // Build detailed cuentas description for the AI
    // cuentas can be either:
    // - Array of strings (legacy): ['Billetera', 'Visa BCP']
    // - Array of objects (new): [{alias, banco, tipo, tipo_tarjeta}]
    let cuentasDescription = '';
    const cuentasList = cuentas || [{ alias: 'Billetera', banco: 'Efectivo', tipo: 'efectivo' }];

    if (cuentasList.length > 0 && typeof cuentasList[0] === 'object') {
      cuentasDescription = cuentasList.map(c => {
        const saldo = c.saldo !== undefined ? ` | Saldo: S/${Number(c.saldo).toFixed(2)}` : '';
        if (c.tipo === 'efectivo') return `- ALIAS: "${c.alias}" | TIPO: EFECTIVO${saldo}`;
        const nivel = c.tipo_tarjeta ? ` | NIVEL: ${c.tipo_tarjeta}` : '';
        return `- ALIAS: "${c.alias}" | BANCO: ${c.banco} | TIPO: ${c.tipo === 'credito' ? 'CRÉDITO' : 'DÉBITO'}${nivel}${saldo}`;
      }).join('\n');
    } else {
      cuentasDescription = cuentasList.map(c => `- "${c}"`).join('\n');
    }

    const promptText =
      "Eres Yunai, un asistente financiero peruano inteligente. El usuario está dictando movimientos financieros en español.\n\n" +

      "═══ PROCESAMIENTO DE AUDIO ═══\n" +
      "IMPORTANTE: El audio puede tener RUIDO DE CALLE (claxon, viento, motores, gente hablando).\n" +
      "- IGNORA todo sonido de fondo y palabras incoherentes que parecen ruido.\n" +
      "- Concéntrate SOLO en la voz principal que dicta montos y conceptos.\n" +
      "- Si no estás seguro de un valor por el ruido, baja la confianza y agrégalo a campos_inciertos.\n" +
      "- Si el audio es puro ruido sin voz clara, devuelve un array vacío: []\n\n" +

      "═══ REGLA PRINCIPAL: MÚLTIPLES MOVIMIENTOS ═══\n" +
      "El usuario puede mencionar VARIOS movimientos en un solo audio.\n" +
      "Ejemplo: 'Gasté 50 en pizza y me pagaron 3000 de sueldo'\n" +
      "→ Eso son 2 movimientos separados. Devuelve CADA UNO como un objeto en el array.\n" +
      "Si solo hay 1 movimiento, devuelve un array con 1 elemento.\n" +
      "SIEMPRE devuelve un array JSON, nunca un objeto suelto.\n\n" +

      "═══ RECONOCIMIENTO FONÉTICO (CONTEXTO PERÚ) ═══\n" +
      "- 'Luca'/'Luquita' = 1 Sol. 'Ferro' = 10 soles. 'Gamba' = 100 soles.\n" +
      "- 'Gold' puede sonar como 'Gol', 'Gols', 'la dorada'.\n" +
      "- 'Signature' puede sonar como 'Sinnachur', 'Sinaitur', 'la negra'.\n" +
      "- 'Platinum' puede sonar como 'Platino', 'Platinun'.\n" +
      "- 'Yape'/'Plin' → buscar la tarjeta de DÉBITO del banco correspondiente.\n\n" +

      "═══ CUENTAS Y TARJETAS DEL USUARIO ═══\n" +
      cuentasDescription + "\n\n" +

      "═══ MATCHING INTELIGENTE DE CUENTAS ═══\n" +
      "- NO esperes que digan 'Crédito' o 'Débito'. Si dice 'pagué con mi Interbank Gold', " +
      "busca el ALIAS que contenga 'Gold' o 'Interbank'. Al ver su TIPO en la lista, sabrás si es crédito.\n" +
      "- Si el nombre del alias contiene el nivel de tarjeta (Gold, Signature, Platinum, Classic), " +
      "úsalo para hacer match fonético.\n" +
      "- Siempre devuelve el ALIAS exacto tal como aparece en la lista, nunca lo modifiques.\n\n" +

      "═══ CASUÍSTICAS FINANCIERAS (TIPOS DE MOVIMIENTO) ═══\n" +
      "1. GASTO CORRIENTE: 'Gasté 10 soles en pan' → tipo: 'gasto'\n" +
      "   - Sale de Billetera o tarjeta de débito. cuenta = la cuenta origen.\n" +
      "2. INGRESO: 'Me depositaron 2000 de sueldo' → tipo: 'ingreso'\n" +
      "   - Entra a Billetera o tarjeta de débito. NUNCA a tarjeta de crédito.\n" +
      "3. TARJETA DE CRÉDITO (compra): 'Compré una TV de 2000 en 12 cuotas con mi visa' → tipo: 'tarjeta'\n" +
      "   - Va a tarjeta de crédito. num_cuotas según lo que diga.\n" +
      "4. PAGO DE TARJETA: 'Pagué 500 de mi tarjeta desde mi cuenta sueldo' → tipo: 'pago_tarjeta'\n" +
      "   - Es un pago de deuda, NO un gasto en comida/ropa.\n" +
      "   - cuenta_origen = la cuenta de débito/billetera de donde sale el dinero\n" +
      "   - cuenta_destino = la tarjeta de crédito que se está pagando\n" +
      "   - categoria = '💳 Otros'\n" +
      "5. TRANSFERENCIA: 'Pasé 100 soles de mi BCP a Interbank' → tipo: 'transferencia'\n" +
      "   - Dinero que pasa de una cuenta a otra del mismo usuario.\n" +
      "   - cuenta_origen = de donde sale\n" +
      "   - cuenta_destino = a donde llega\n" +
      "   - categoria = '💳 Otros'\n\n" +

      "═══ REGLAS CRÍTICAS PARA SELECCIONAR CUENTA ═══\n" +
      "1. Si el usuario menciona un BANCO (ej: 'Interbank', 'IBK', 'BCP', 'BBVA', 'Scotia'), " +
      "busca en la lista la tarjeta que corresponda a ese banco.\n" +
      "2. Si es un INGRESO → SOLO puede ir a DÉBITO o Billetera. NUNCA a CRÉDITO.\n" +
      "3. Si es un GASTO con cuotas → SOLO puede ir a CRÉDITO.\n" +
      "4. Si es un GASTO sin cuotas → puede ir a Billetera, débito o crédito.\n" +
      "5. 'IBK'/'inter' = Interbank. 'BCP' = BCP. 'BBVA'/'continental' = BBVA. 'Scotia' = Scotiabank.\n" +
      "6. Si el banco tiene VARIAS tarjetas, elige según el tipo de movimiento (reglas 2-4).\n" +
      "7. El valor de 'cuenta' DEBE ser EXACTAMENTE el alias de la lista, NO el nombre del banco.\n" +
      "8. 'efectivo'/'cash'/'plata' → cuenta = 'Billetera'\n" +
      "9. Si no menciona banco ni cuenta → cuenta = null, agregar a campos_inciertos\n\n" +

      "═══ VALIDACIÓN DE SALDO ═══\n" +
      "- Si es un GASTO y el monto > saldo de la cuenta mencionada:\n" +
      "  → Agrega 'cuenta' a campos_inciertos\n" +
      "  → En 'pregunta' di algo como: 'Causa, tu [cuenta] solo tiene S/X.XX, ¿seguro que pagaste de ahí?'\n" +
      "  → En 'opciones' pon la cuenta mencionada + cuentas con saldo suficiente\n" +
      "- Si es un INGRESO, no validar saldo\n\n" +

      "═══ CATEGORÍAS DE GASTOS (usar EXACTAMENTE con emoji) ═══\n" +
      categoriasGastos.map(c => `- ${c}`).join('\n') + "\n\n" +

      "═══ CATEGORÍAS DE INGRESOS (usar EXACTAMENTE con emoji) ═══\n" +
      categoriasIngresos.map(c => `- ${c}`).join('\n') + "\n\n" +

      "═══ CAMPOS POR CADA MOVIMIENTO ═══\n" +
      "- tipo: 'gasto' | 'ingreso' | 'tarjeta' | 'pago_tarjeta' | 'transferencia'\n" +
      "- monto: número decimal (ej: 45.50)\n" +
      "- descripcion: qué se compró/recibió (máx 60 chars)\n" +
      "- categoria: EXACTAMENTE una de las categorías listadas (con emoji)\n" +
      "- cuenta: alias de la cuenta principal (origen si es gasto/transferencia, destino si es ingreso), o null\n" +
      "- cuenta_destino: SOLO para 'transferencia' y 'pago_tarjeta'. Alias de la cuenta destino.\n" +
      "- fecha: YYYY-MM-DD. Si no dice fecha, usar hoy: " + today + "\n" +
      "- notas: detalles adicionales, o vacío\n" +
      "- num_cuotas: número de cuotas si mencionó. Si no, usar 1\n" +
      "- tipo_gasto: 'deuda' (compra normal) o 'suscripcion' (recurrente)\n" +
      "- confianza: 0-1 qué tan seguro estás\n" +
      "- campos_inciertos: array de campos donde no estás seguro\n\n" +

      "═══ CAMPOS_INCIERTOS ═══\n" +
      "Cuando no estés seguro de un campo, agrega un objeto con:\n" +
      "- campo: nombre del campo\n" +
      "- valor_sugerido: tu mejor opción (o null)\n" +
      "- opciones: SOLO las opciones relevantes (ej: si dijo 'interbank', solo las tarjetas de Interbank)\n" +
      "- pregunta: pregunta en tono peruano amigable ('causa', 'pata')\n\n" +

      "═══ FORMATO DE SALIDA (SIEMPRE array JSON, sin markdown) ═══\n" +
      '[\n' +
      '  {\n' +
      '    "tipo": "gasto",\n' +
      '    "monto": 50,\n' +
      '    "descripcion": "Pizza con amigos",\n' +
      '    "categoria": "🍕 Alimentación",\n' +
      '    "cuenta": "Billetera",\n' +
      '    "fecha": "' + today + '",\n' +
      '    "notas": "",\n' +
      '    "num_cuotas": 1,\n' +
      '    "tipo_gasto": "deuda",\n' +
      '    "confianza": 0.95,\n' +
      '    "campos_inciertos": []\n' +
      '  },\n' +
      '  {\n' +
      '    "tipo": "pago_tarjeta",\n' +
      '    "monto": 500,\n' +
      '    "descripcion": "Pago tarjeta Visa",\n' +
      '    "categoria": "💳 Otros",\n' +
      '    "cuenta": "Débito Interbank",\n' +
      '    "cuenta_destino": "Visa Signature",\n' +
      '    "fecha": "' + today + '",\n' +
      '    "notas": "",\n' +
      '    "num_cuotas": 1,\n' +
      '    "tipo_gasto": "deuda",\n' +
      '    "confianza": 0.90,\n' +
      '    "campos_inciertos": []\n' +
      '  }\n' +
      ']\n\n' +
      "RESPONDE AHORA CON EL ARRAY JSON:";

    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: audioMime, data: cleanBase64 } }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    };

    // Model fallback chain
    const voiceModels = ['gemini-2.5-flash-lite', 'gemini-2.0-flash'];

    let response = null;
    let usedModel = null;

    for (const model of voiceModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      console.log(`[yunai-voice] Trying model: ${model}`);
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        usedModel = model;
        console.log(`[yunai-voice] Success with model: ${model}`);
        break;
      }

      if (response.status === 429 || response.status === 503) {
        console.log(`[yunai-voice] ${model} returned ${response.status}, trying next...`);
        continue;
      }

      // Other errors: don't fallback
      const errorText = await response.text();
      console.error(`[yunai-voice] ${model} error (${response.status}):`, errorText);
      throw new Error(`Error desde Google Gemini (${response.status})`);
    }

    if (!response || !response.ok) {
      throw new Error('Todos los modelos de IA están saturados. Intenta en unos minutos.');
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
      throw new Error("Yunai no pudo entender el audio.");
    }

    aiText = aiText.replace(/```json/gi, "").replace(/```/gi, "").trim();

    // Try to match array first, then fall back to object
    const arrayMatch = aiText.match(/\[[\s\S]*\]/);
    const objectMatch = aiText.match(/\{[\s\S]*\}/);

    if (arrayMatch) {
      aiText = arrayMatch[0];
    } else if (objectMatch) {
      aiText = objectMatch[0];
    }

    let parsedData = JSON.parse(aiText);

    // Normalize: always return an array of movements
    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    // Ensure each movement has campos_inciertos as array
    parsedData = parsedData.map(mov => ({
      ...mov,
      campos_inciertos: Array.isArray(mov.campos_inciertos) ? mov.campos_inciertos : []
    }));

    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error("Yunai Voice API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando el audio'
    });
  }
}
