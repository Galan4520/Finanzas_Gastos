// ═══════════════════════════════════════════════════════════════
// CÓDIGO COMPLETO PARA GOOGLE APPS SCRIPT v5.0
// Sistema de Pagos con Tracking de MONTO PAGADO TOTAL
// Incluye: PIN Security, SUSCRIPCIONES, CRUD y PERFIL
// 🆕 NUEVA COLUMNA: monto_pagado_total (L) - Soluciona bug de pagos parciales
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// VALIDACIÓN DE PIN - SISTEMA DE SEGURIDAD
// ═══════════════════════════════════════════════════════════════
function validatePin(providedPin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config');

    // Si no existe Config, crearla con PIN por defecto
    if (!configSheet) {
      const newConfig = ss.insertSheet('Config');
      newConfig.getRange('A1').setValue('PIN');
      newConfig.getRange('A2').setValue('1234');
      return providedPin === '1234';
    }

    // Obtener PIN de Config (celda A2)
    const storedPin = configSheet.getRange('A2').getValue().toString();

    return providedPin === storedPin;
  } catch (error) {
    Logger.log('Error validando PIN: ' + error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🆕 FUNCIONES DE PERFIL DE USUARIO
// ═══════════════════════════════════════════════════════════════
function getProfile(sheet) {
  let perfilSheet = sheet.getSheetByName('Perfil');

  // Si no existe la hoja Perfil, crearla
  if (!perfilSheet) {
    perfilSheet = sheet.insertSheet('Perfil');
    perfilSheet.getRange('A1').setValue('avatar_id');
    perfilSheet.getRange('B1').setValue('nombre');
    return null; // Perfil vacío
  }

  const data = perfilSheet.getDataRange().getValues();

  // Si solo hay encabezados o la fila 2 está vacía
  if (data.length < 2 || !data[1][0]) {
    return null; // Perfil vacío
  }

  return {
    avatar_id: data[1][0],
    nombre: data[1][1]
  };
}

function saveProfile(sheet, params) {
  let perfilSheet = sheet.getSheetByName('Perfil');

  // Si no existe la hoja Perfil, crearla
  if (!perfilSheet) {
    perfilSheet = sheet.insertSheet('Perfil');
    perfilSheet.getRange('A1').setValue('avatar_id');
    perfilSheet.getRange('B1').setValue('nombre');
  }

  // Guardar o actualizar en fila 2
  perfilSheet.getRange('A2').setValue(params.avatar_id);
  perfilSheet.getRange('B2').setValue(params.nombre);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Perfil guardado correctamente',
    profile: {
      avatar_id: params.avatar_id,
      nombre: params.nombre
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// POST - REGISTRO DE DATOS CON VALIDACIÓN DE PIN
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  const params = e.parameter;

  // VALIDAR PIN PRIMERO
  const providedPin = params.pin;
  if (!validatePin(providedPin)) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'PIN inválido'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet();

  // ═══════════════════════════════════════════════════════════════
  // Manejar acciones especiales
  // ═══════════════════════════════════════════════════════════════
  const action = params.action;

  // 🆕 Guardar perfil
  if (action === 'saveProfile') {
    return saveProfile(sheet, params);
  }

  // 📧 Guardar configuración de notificaciones
  if (action === 'saveNotificationConfig') {
    saveNotificationConfig(params);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Configuración de notificaciones guardada'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 📧 Enviar notificaciones manualmente
  if (action === 'sendNotifications') {
    var result = enviarNotificacionesVencimiento();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 📧 Enviar email de prueba
  if (action === 'sendTestEmail') {
    var testResult = enviarEmailPrueba();
    return ContentService.createTextOutput(JSON.stringify(testResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 📧 Configurar trigger diario
  if (action === 'setupDailyTrigger') {
    try {
      configurarTriggerDiario();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Trigger diario configurado para las 8:00 AM'
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'update') {
    return handleUpdate(sheet, params);
  }

  if (action === 'delete') {
    return handleDelete(sheet, params);
  }

  // Si no hay acción especial, es un INSERT normal
  const targetSheet = sheet.getSheetByName(params.tipo);

  if (!targetSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Hoja no encontrada - ' + params.tipo
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let row = [];

  if (params.tipo === 'Gastos' || params.tipo === 'Ingresos') {
    // ===== HOJAS SIMPLES: Gastos e Ingresos =====
    row = [
      params.fecha,
      params.categoria,
      params.descripcion,
      parseFloat(params.monto),
      params.notas || '',
      params.timestamp
    ];

  } else if (params.tipo === 'Tarjetas') {
    // ===== HOJA: Tarjetas =====
    row = [
      params.banco,
      params.tipo_tarjeta,
      params.alias,
      params.url_imagen || '',
      parseInt(params.dia_cierre),
      parseInt(params.dia_pago),
      parseFloat(params.limite),
      params.timestamp
    ];

  } else if (params.tipo === 'Gastos_Pendientes') {
    // ===== HOJA: Gastos_Pendientes (CON monto_pagado_total) =====
    const numCuotas = parseInt(params.num_cuotas) || 1;
    const cuotasPagadas = parseFloat(params.cuotas_pagadas) || 0;
    const montoPagadoTotal = parseFloat(params.monto_pagado_total) || 0; // 🆕 NUEVA COLUMNA
    const gastoId = params.id || generateId();
    const tipoGasto = params.tipo_gasto || 'deuda';

    row = [
      gastoId,                              // A: ID único del gasto
      formatDateForSheet(params.fecha_gasto),  // B: Fecha del gasto
      params.tarjeta,                       // C: Tarjeta utilizada
      params.categoria,                     // D: Categoría
      params.descripcion,                   // E: Descripción
      parseFloat(params.monto),             // F: Monto total
      formatDateForSheet(params.fecha_cierre), // G: Fecha de cierre
      formatDateForSheet(params.fecha_pago),   // H: Fecha de pago
      params.estado,                        // I: Estado (Pendiente/Pagado)
      numCuotas,                            // J: Número de cuotas
      cuotasPagadas,                        // K: Cuotas pagadas
      montoPagadoTotal,                     // L: 🆕 Monto pagado total (suma acumulada)
      tipoGasto,                            // M: Tipo (deuda/suscripcion)
      params.notas || '',                   // N: Notas
      params.timestamp                      // O: Timestamp
    ];

  } else if (params.tipo === 'Pagos') {
    // ===== HOJA NUEVA: Pagos =====
    const numCuota = params.num_cuota && params.num_cuota !== '0' ? parseInt(params.num_cuota) : null;

    row = [
      params.fecha_pago,            // A: Fecha del pago
      params.id_gasto,              // B: ID del gasto relacionado
      params.tarjeta,               // C: Tarjeta
      params.descripcion_gasto,     // D: Descripción del gasto
      parseFloat(params.monto_pagado), // E: Monto pagado
      params.tipo_pago,             // F: Tipo (Cuota/Total/Parcial)
      numCuota,                     // G: Número de cuota (si aplica)
      params.notas || '',           // H: Notas
      params.timestamp              // I: Timestamp
    ];

    // ACTUALIZAR el gasto en Gastos_Pendientes
    actualizarGastoPendiente(sheet, params);
  }

  targetSheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PARA ACTUALIZAR REGISTROS
// ═══════════════════════════════════════════════════════════════
function handleUpdate(sheet, params) {
  const tipo = params.tipo;
  const targetSheet = sheet.getSheetByName(tipo);

  if (!targetSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Hoja no encontrada - ' + tipo
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = targetSheet.getDataRange().getValues();

  if (tipo === 'Gastos_Pendientes') {
    const gastoId = params.id;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === gastoId) {
        targetSheet.getRange(i + 1, 2).setValue(formatDateForSheet(params.fecha_gasto));
        targetSheet.getRange(i + 1, 3).setValue(params.tarjeta);
        targetSheet.getRange(i + 1, 4).setValue(params.categoria);
        targetSheet.getRange(i + 1, 5).setValue(params.descripcion);
        targetSheet.getRange(i + 1, 6).setValue(parseFloat(params.monto));
        targetSheet.getRange(i + 1, 7).setValue(formatDateForSheet(params.fecha_cierre));
        targetSheet.getRange(i + 1, 8).setValue(formatDateForSheet(params.fecha_pago));
        targetSheet.getRange(i + 1, 9).setValue(params.estado);
        targetSheet.getRange(i + 1, 10).setValue(parseInt(params.num_cuotas) || 1);
        targetSheet.getRange(i + 1, 11).setValue(parseFloat(params.cuotas_pagadas) || 0);
        targetSheet.getRange(i + 1, 12).setValue(parseFloat(params.monto_pagado_total) || 0); // 🆕 NUEVA COLUMNA
        targetSheet.getRange(i + 1, 13).setValue(params.tipo_original || params.tipo_gasto || 'deuda');
        targetSheet.getRange(i + 1, 14).setValue(params.notas || '');

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Registro actualizado'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } else if (tipo === 'Tarjetas') {
    const searchAlias = params.originalAlias || params.alias;

    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === searchAlias) {
        targetSheet.getRange(i + 1, 1).setValue(params.banco);
        targetSheet.getRange(i + 1, 2).setValue(params.tipo_tarjeta);
        targetSheet.getRange(i + 1, 3).setValue(params.alias);
        targetSheet.getRange(i + 1, 4).setValue(params.url_imagen || '');
        targetSheet.getRange(i + 1, 5).setValue(parseInt(params.dia_cierre));
        targetSheet.getRange(i + 1, 6).setValue(parseInt(params.dia_pago));
        targetSheet.getRange(i + 1, 7).setValue(parseFloat(params.limite));

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Tarjeta actualizada'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } else if (tipo === 'Gastos' || tipo === 'Ingresos') {
    // Buscar por timestamp (columna F, index 5) como identificador único
    const timestampOriginal = params.timestamp_original;

    for (let i = 1; i < data.length; i++) {
      const rowTimestamp = data[i][5] ? data[i][5].toString() : '';
      if (rowTimestamp === timestampOriginal) {
        targetSheet.getRange(i + 1, 1).setValue(formatDateForSheet(params.fecha));
        targetSheet.getRange(i + 1, 2).setValue(params.categoria);
        targetSheet.getRange(i + 1, 3).setValue(params.descripcion);
        targetSheet.getRange(i + 1, 4).setValue(parseFloat(params.monto));
        targetSheet.getRange(i + 1, 5).setValue(params.notas || '');
        // Mantener el timestamp original (columna F) para no perder la referencia

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Registro actualizado'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    error: 'Registro no encontrado'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PARA ELIMINAR REGISTROS
// ═══════════════════════════════════════════════════════════════
function handleDelete(sheet, params) {
  const tipo = params.tipo;
  const targetSheet = sheet.getSheetByName(tipo);

  if (!targetSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Hoja no encontrada - ' + tipo
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = targetSheet.getDataRange().getValues();
  const idToDelete = params.id;

  if (tipo === 'Gastos_Pendientes') {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idToDelete) {
        targetSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Registro eliminado'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } else if (tipo === 'Tarjetas') {
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === idToDelete) {
        targetSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Tarjeta eliminada'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } else if (tipo === 'Gastos' || tipo === 'Ingresos') {
    // Buscar por timestamp (columna F, index 5) como identificador único
    for (let i = 1; i < data.length; i++) {
      const rowTimestamp = data[i][5] ? data[i][5].toString() : '';
      if (rowTimestamp === idToDelete) {
        targetSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Registro eliminado'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    error: 'Registro no encontrado'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// 🆕 FUNCIÓN MEJORADA: Actualizar Gasto Pendiente con monto_pagado_total
// ═══════════════════════════════════════════════════════════════
function actualizarGastoPendiente(sheet, params) {
  const gastosSheet = sheet.getSheetByName('Gastos_Pendientes');
  if (!gastosSheet) return;

  const data = gastosSheet.getDataRange().getValues();
  const gastoId = params.id_gasto;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === gastoId) {
      const montoTotal = parseFloat(data[i][5]);
      const numCuotas = parseInt(data[i][9]);
      const montoPagadoAnterior = parseFloat(data[i][11]) || 0; // 🆕 Columna L
      const tipoGasto = data[i][12]; // 🆕 Ahora en columna M

      const tipoPago = params.tipo_pago;
      const montoPagado = parseFloat(params.monto_pagado);

      if (tipoGasto === 'suscripcion') {
        // LÓGICA PARA SUSCRIPCIONES: Renovar al próximo mes
        const fechaActual = new Date(data[i][7]);
        const diaOriginal = fechaActual.getDate();
        const proximaFecha = new Date(fechaActual);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
        // Fix month overflow (e.g., Jan 31 → setMonth(1) = Mar 3 → clamp to Feb 28)
        if (proximaFecha.getDate() !== diaOriginal) {
          proximaFecha.setDate(0); // Last day of previous month
        }

        // Formatear fecha como YYYY-MM-DD antes de guardar
        const fechaFormateada = formatDateForSheet(proximaFecha);

        gastosSheet.getRange(i + 1, 8).setValue(fechaFormateada);  // Fecha_Pago
        gastosSheet.getRange(i + 1, 7).setValue(fechaFormateada);  // Fecha_Cierre
        gastosSheet.getRange(i + 1, 9).setValue('Pendiente');

      } else {
        // 🆕 LÓGICA MEJORADA PARA DEUDAS
        // Actualizar el monto pagado total sumando el nuevo pago
        const nuevoMontoPagadoTotal = montoPagadoAnterior + montoPagado;

        // Calcular cuotas pagadas basándose en el monto pagado total
        const montoCuota = montoTotal / numCuotas;
        const nuevasCuotasPagadas = nuevoMontoPagadoTotal / montoCuota;

        // Limitar al máximo de cuotas (no puede pagar más de lo debido)
        const cuotasPagadasFinal = Math.min(nuevasCuotasPagadas, numCuotas);
        const montoPagadoFinal = Math.min(nuevoMontoPagadoTotal, montoTotal);

        // Actualizar columna K (cuotas_pagadas) - Ahora permite decimales
        gastosSheet.getRange(i + 1, 11).setValue(cuotasPagadasFinal);

        // 🆕 Actualizar columna L (monto_pagado_total)
        gastosSheet.getRange(i + 1, 12).setValue(montoPagadoFinal);

        // Si ya se pagó todo, marcar como "Pagado"
        if (cuotasPagadasFinal >= numCuotas) {
          gastosSheet.getRange(i + 1, 9).setValue('Pagado');
        }
      }

      break;
    }
  }
}

function generateId() {
  return 'GP' + Date.now().toString().substring(7);
}

// ═══════════════════════════════════════════════════════════════
// GET - OBTENER DATOS CON VALIDACIÓN DE PIN
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  // VALIDAR PIN PRIMERO
  const providedPin = e.parameter.pin;
  if (!validatePin(providedPin)) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'PIN inválido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet();

  // 🆕 Obtener Perfil
  const profile = getProfile(sheet);

  // 1. Obtener Tarjetas
  const tarjetasSheet = sheet.getSheetByName('Tarjetas');
  let cards = [];
  if (tarjetasSheet) {
    const data = tarjetasSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        cards.push({
          banco: data[i][0],
          tipo_tarjeta: data[i][1],
          alias: data[i][2],
          url_imagen: data[i][3],
          dia_cierre: data[i][4],
          dia_pago: data[i][5],
          limite: data[i][6],
          timestamp: data[i][7]
        });
      }
    }
  }

  // 2. Obtener Gastos Pendientes (Deudas y Suscripciones)
  const pendientesSheet = sheet.getSheetByName('Gastos_Pendientes');
  let pending = [];
  if (pendientesSheet) {
    const data = pendientesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        pending.push({
          id: data[i][0],
          fecha_gasto: formatDate(data[i][1]),
          tarjeta: data[i][2],
          categoria: data[i][3],
          descripcion: data[i][4],
          monto: data[i][5],
          fecha_cierre: formatDate(data[i][6]),
          fecha_pago: formatDate(data[i][7]),
          estado: data[i][8],
          num_cuotas: data[i][9],
          cuotas_pagadas: data[i][10],
          monto_pagado_total: data[i][11] || 0, // 🆕 NUEVA COLUMNA
          tipo: data[i][12] || 'deuda',          // 🆕 Ahora en columna M
          notas: data[i][13],                    // 🆕 Ahora en columna N
          timestamp: data[i][14]                 // 🆕 Ahora en columna O
        });
      }
    }
  }

  // 3. Obtener Historial (Gastos e Ingresos)
  const history = [];
  const gastosSheet = sheet.getSheetByName('Gastos');
  if (gastosSheet) {
    const data = gastosSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        history.push({
          fecha: formatDate(data[i][0]),
          categoria: data[i][1],
          descripcion: data[i][2],
          monto: data[i][3],
          notas: data[i][4],
          timestamp: data[i][5],
          tipo: 'Gastos'
        });
      }
    }
  }

  const ingresosSheet = sheet.getSheetByName('Ingresos');
  if (ingresosSheet) {
    const data = ingresosSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        history.push({
          fecha: formatDate(data[i][0]),
          categoria: data[i][1],
          descripcion: data[i][2],
          monto: data[i][3],
          notas: data[i][4],
          timestamp: data[i][5],
          tipo: 'Ingresos'
        });
      }
    }
  }

  // 4. Obtener Propiedades Disponibles (Catálogo Inmobiliario)
  const propiedadesSheet = sheet.getSheetByName('Propiedades_Disponibles');
  let availableProperties = [];
  if (propiedadesSheet) {
    const data = propiedadesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Si tiene título
        availableProperties.push({
          id: 'PROP' + i,
          titulo: data[i][0],
          tipo: data[i][1],
          zona: data[i][2],
          precio: data[i][3],
          area_m2: data[i][4] || null,
          dormitorios: data[i][5] || null,
          banos: data[i][6] || null,
          descripcion: data[i][7] || '',
          url_imagen: data[i][8] || '',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // 📧 Obtener configuración de notificaciones
  var notificationConfig = getNotificationConfig();

  // 🆕 Retornar JSON con perfil incluido
  return ContentService.createTextOutput(JSON.stringify({
    profile: profile,  // null si no existe, o { avatar_id, nombre }
    cards: cards,
    pending: pending,
    history: history,
    availableProperties: availableProperties, // 🆕 Catálogo de propiedades
    notificationConfig: notificationConfig    // 📧 Config de notificaciones
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════
function formatDate(date) {
  if (!date) return '';
  if (date instanceof Date) return date.toISOString().split('T')[0];
  // Si es un string con formato ISO completo (2026-01-20T08:00:00.000Z), extraer solo fecha
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0];
  }
  return date;
}

function formatDateForSheet(dateInput) {
  if (!dateInput) return '';

  // Si es un objeto Date
  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Si es un string
  if (typeof dateInput === 'string') {
    // Si tiene timestamp (2026-01-20T08:00:00.000Z), extraer solo fecha
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    // Si ya está en formato correcto (2026-01-20)
    return dateInput;
  }

  return '';
}

/**
 * 🆕 Función mejorada para obtener el resumen de un gasto específico
 * Ahora usa monto_pagado_total en lugar de calcular desde cuotas
 */
function obtenerResumenGasto(gastoId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const gastosSheet = sheet.getSheetByName('Gastos_Pendientes');
  const pagosSheet = sheet.getSheetByName('Pagos');

  if (!gastosSheet || !pagosSheet) return null;

  const gastosData = gastosSheet.getDataRange().getValues();
  const pagosData = pagosSheet.getDataRange().getValues();

  let gasto = null;

  for (let i = 1; i < gastosData.length; i++) {
    if (gastosData[i][0] === gastoId) {
      const montoTotal = parseFloat(gastosData[i][5]);
      const montoPagadoTotal = parseFloat(gastosData[i][11]) || 0; // 🆕 Columna L

      gasto = {
        id: gastosData[i][0],
        descripcion: gastosData[i][4],
        montoTotal: montoTotal,
        numCuotas: gastosData[i][9],
        cuotasPagadas: gastosData[i][10],
        montoPagadoTotal: montoPagadoTotal, // 🆕 Nuevo campo
        tipo: gastosData[i][12] || 'deuda',
        estado: gastosData[i][8]
      };
      break;
    }
  }

  if (!gasto) return null;

  // 🆕 Calcular deuda restante directamente desde monto_pagado_total
  if (gasto.tipo === 'deuda') {
    gasto.deudaRestante = gasto.montoTotal - gasto.montoPagadoTotal;
  } else {
    gasto.deudaRestante = 0;
  }

  // Validar contra historial de pagos (opcional, para auditoría)
  let totalPagadoHistorial = 0;
  for (let i = 1; i < pagosData.length; i++) {
    if (pagosData[i][1] === gastoId) {
      totalPagadoHistorial += parseFloat(pagosData[i][4]);
    }
  }
  gasto.totalPagadoHistorial = totalPagadoHistorial;

  return gasto;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES POR EMAIL - Vencimiento de Tarjetas de Crédito
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el email de notificación desde la hoja Config.
 * Celda B1 = "email_notificacion", B2 = email del usuario.
 * Celda C1 = "dias_anticipacion", C2 = días antes del vencimiento (default: 3).
 */
function getNotificationConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName('Config');
  if (!configSheet) return null;

  var email = '';
  var diasAnticipacion = 3;
  var notificacionesActivas = true;

  // Leer email (B2)
  try { email = configSheet.getRange('B2').getValue().toString().trim(); } catch(e) {}
  // Leer días de anticipación (C2)
  try {
    var dias = parseInt(configSheet.getRange('C2').getValue());
    if (!isNaN(dias) && dias > 0) diasAnticipacion = dias;
  } catch(e) {}
  // Leer si notificaciones están activas (D2)
  try {
    var activas = configSheet.getRange('D2').getValue();
    if (activas === false || activas === 'false' || activas === 'no' || activas === 0) {
      notificacionesActivas = false;
    }
  } catch(e) {}

  return {
    email: email,
    diasAnticipacion: diasAnticipacion,
    notificacionesActivas: notificacionesActivas
  };
}

/**
 * Guarda la configuración de notificaciones en la hoja Config.
 */
function saveNotificationConfig(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName('Config');
  if (!configSheet) return;

  // Asegurar encabezados
  configSheet.getRange('B1').setValue('email_notificacion');
  configSheet.getRange('C1').setValue('dias_anticipacion');
  configSheet.getRange('D1').setValue('notificaciones_activas');

  if (params.email !== undefined) configSheet.getRange('B2').setValue(params.email);
  if (params.dias_anticipacion !== undefined) configSheet.getRange('C2').setValue(parseInt(params.dias_anticipacion) || 3);
  if (params.notificaciones_activas !== undefined) {
    configSheet.getRange('D2').setValue(params.notificaciones_activas === 'true' || params.notificaciones_activas === true);
  }
}

/**
 * Función principal: Revisa deudas próximas a vencer y envía email.
 * Se puede llamar manualmente o con un trigger diario.
 */
function enviarNotificacionesVencimiento() {
  var config = getNotificationConfig();
  if (!config || !config.email || !config.notificacionesActivas) {
    Logger.log('Notificaciones desactivadas o email no configurado');
    return { enviado: false, razon: 'Notificaciones desactivadas o email no configurado' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pendientesSheet = ss.getSheetByName('Gastos_Pendientes');
  var tarjetasSheet = ss.getSheetByName('Tarjetas');

  if (!pendientesSheet) {
    return { enviado: false, razon: 'No existe hoja Gastos_Pendientes' };
  }

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var diasAnticipacion = config.diasAnticipacion;

  // Obtener datos de tarjetas para info extra
  var tarjetas = {};
  if (tarjetasSheet) {
    var tarjetasData = tarjetasSheet.getDataRange().getValues();
    for (var t = 1; t < tarjetasData.length; t++) {
      if (tarjetasData[t][2]) {
        tarjetas[tarjetasData[t][2]] = {
          banco: tarjetasData[t][0],
          tipo: tarjetasData[t][1],
          dia_pago: tarjetasData[t][5],
          limite: tarjetasData[t][6]
        };
      }
    }
  }

  // Buscar deudas próximas a vencer
  var data = pendientesSheet.getDataRange().getValues();
  var porVencer = [];
  var vencidas = [];

  for (var i = 1; i < data.length; i++) {
    var estado = data[i][8];
    if (estado === 'Pagado') continue;

    var fechaPagoStr = data[i][7];
    if (!fechaPagoStr) continue;

    var fechaPago = new Date(fechaPagoStr);
    fechaPago.setHours(0, 0, 0, 0);

    var diffDias = Math.floor((fechaPago - hoy) / (1000 * 60 * 60 * 24));
    var montoTotal = parseFloat(data[i][5]) || 0;
    var montoPagado = parseFloat(data[i][11]) || 0;
    var saldoPendiente = montoTotal - montoPagado;

    if (saldoPendiente <= 0) continue;

    var item = {
      descripcion: data[i][4],
      tarjeta: data[i][2],
      monto: montoTotal,
      saldo_pendiente: saldoPendiente,
      fecha_pago: formatDate(fechaPagoStr),
      dias_restantes: diffDias,
      num_cuotas: data[i][9],
      cuotas_pagadas: data[i][10],
      tipo: data[i][12] || 'deuda',
      banco: tarjetas[data[i][2]] ? tarjetas[data[i][2]].banco : ''
    };

    if (diffDias < 0) {
      vencidas.push(item);
    } else if (diffDias <= diasAnticipacion) {
      porVencer.push(item);
    }
  }

  if (porVencer.length === 0 && vencidas.length === 0) {
    Logger.log('No hay pagos próximos a vencer');
    return { enviado: false, razon: 'No hay pagos próximos a vencer', revisados: data.length - 1 };
  }

  // Construir email HTML
  var htmlBody = construirEmailHTML(porVencer, vencidas, config.diasAnticipacion);
  var asunto = '';

  if (vencidas.length > 0 && porVencer.length > 0) {
    asunto = '⚠️ Tienes ' + vencidas.length + ' pago(s) vencido(s) y ' + porVencer.length + ' próximo(s) a vencer';
  } else if (vencidas.length > 0) {
    asunto = '🔴 Tienes ' + vencidas.length + ' pago(s) vencido(s)';
  } else {
    asunto = '📅 Tienes ' + porVencer.length + ' pago(s) próximo(s) a vencer';
  }

  try {
    MailApp.sendEmail({
      to: config.email,
      subject: asunto + ' - MoneyCrock',
      htmlBody: htmlBody
    });

    Logger.log('Email enviado a ' + config.email);
    return {
      enviado: true,
      email: config.email,
      por_vencer: porVencer.length,
      vencidas: vencidas.length,
      asunto: asunto
    };
  } catch (error) {
    Logger.log('Error enviando email: ' + error);
    return { enviado: false, razon: error.toString() };
  }
}

/**
 * Construye el HTML del email de notificación.
 */
function construirEmailHTML(porVencer, vencidas, diasAnticipacion) {
  var html = '<div style="font-family: \'Segoe UI\', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">';

  // Header
  html += '<div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">';
  html += '<h1 style="color: white; margin: 0; font-size: 24px;">💳 MoneyCrock</h1>';
  html += '<p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Recordatorio de Pagos</p>';
  html += '</div>';

  html += '<div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">';

  // Vencidas (urgentes)
  if (vencidas.length > 0) {
    html += '<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 16px;">';
    html += '<h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 18px;">🔴 Pagos Vencidos</h2>';

    for (var v = 0; v < vencidas.length; v++) {
      var item = vencidas[v];
      html += '<div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid #dc2626;">';
      html += '<strong style="color: #1e293b;">' + item.descripcion + '</strong>';
      if (item.banco) html += ' <span style="color: #64748b; font-size: 12px;">(' + item.banco + ' - ' + item.tarjeta + ')</span>';
      html += '<br>';
      html += '<span style="color: #dc2626; font-weight: bold; font-size: 18px;">S/ ' + item.saldo_pendiente.toFixed(2) + '</span>';
      html += ' <span style="color: #64748b; font-size: 12px;">pendiente</span><br>';
      html += '<span style="color: #dc2626; font-size: 12px;">Venció hace ' + Math.abs(item.dias_restantes) + ' día(s) - Fecha: ' + item.fecha_pago + '</span>';
      if (item.tipo === 'suscripcion') {
        html += ' <span style="background: #7c3aed; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Suscripción</span>';
      } else if (item.num_cuotas > 1) {
        html += ' <span style="color: #64748b; font-size: 11px;">(Cuota ' + (Math.floor(item.cuotas_pagadas) + 1) + '/' + item.num_cuotas + ')</span>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  // Por vencer
  if (porVencer.length > 0) {
    html += '<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 16px;">';
    html += '<h2 style="color: #d97706; margin: 0 0 12px 0; font-size: 18px;">📅 Próximos a Vencer (' + diasAnticipacion + ' días)</h2>';

    for (var p = 0; p < porVencer.length; p++) {
      var pItem = porVencer[p];
      var urgencia = pItem.dias_restantes === 0 ? '#dc2626' : pItem.dias_restantes === 1 ? '#ea580c' : '#d97706';
      html += '<div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid ' + urgencia + ';">';
      html += '<strong style="color: #1e293b;">' + pItem.descripcion + '</strong>';
      if (pItem.banco) html += ' <span style="color: #64748b; font-size: 12px;">(' + pItem.banco + ' - ' + pItem.tarjeta + ')</span>';
      html += '<br>';
      html += '<span style="color: ' + urgencia + '; font-weight: bold; font-size: 18px;">S/ ' + pItem.saldo_pendiente.toFixed(2) + '</span>';
      html += ' <span style="color: #64748b; font-size: 12px;">pendiente</span><br>';
      if (pItem.dias_restantes === 0) {
        html += '<span style="color: #dc2626; font-weight: bold; font-size: 12px;">¡VENCE HOY! - ' + pItem.fecha_pago + '</span>';
      } else if (pItem.dias_restantes === 1) {
        html += '<span style="color: #ea580c; font-weight: bold; font-size: 12px;">Vence MAÑANA - ' + pItem.fecha_pago + '</span>';
      } else {
        html += '<span style="color: #d97706; font-size: 12px;">Vence en ' + pItem.dias_restantes + ' día(s) - ' + pItem.fecha_pago + '</span>';
      }
      if (pItem.tipo === 'suscripcion') {
        html += ' <span style="background: #7c3aed; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Suscripción</span>';
      } else if (pItem.num_cuotas > 1) {
        html += ' <span style="color: #64748b; font-size: 11px;">(Cuota ' + (Math.floor(pItem.cuotas_pagadas) + 1) + '/' + pItem.num_cuotas + ')</span>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  // Footer
  html += '<div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">';
  html += '<p style="color: #94a3b8; font-size: 12px; margin: 0;">Enviado automáticamente por MoneyCrock</p>';
  html += '<p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Para desactivar estas notificaciones, ve a Configuración en la app.</p>';
  html += '</div>';

  html += '</div></div>';

  return html;
}

/**
 * Configura el trigger diario automático para notificaciones.
 * Ejecutar UNA VEZ manualmente desde el editor de Apps Script.
 */
function configurarTriggerDiario() {
  // Eliminar triggers anteriores de esta función
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'enviarNotificacionesVencimiento') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Crear nuevo trigger diario a las 8:00 AM
  ScriptApp.newTrigger('enviarNotificacionesVencimiento')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log('Trigger diario configurado para las 8:00 AM');
}

/**
 * Envía un email de prueba para verificar que la configuración funciona.
 */
function enviarEmailPrueba() {
  var config = getNotificationConfig();
  if (!config || !config.email) {
    return { enviado: false, razon: 'Email no configurado en Config (celda B2)' };
  }

  try {
    MailApp.sendEmail({
      to: config.email,
      subject: '✅ Prueba de Notificaciones - MoneyCrock',
      htmlBody: '<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">' +
        '<div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 16px; text-align: center;">' +
        '<h1 style="color: white; margin: 0;">💳 MoneyCrock</h1>' +
        '<p style="color: #d1fae5; margin: 8px 0 0 0;">¡Notificaciones configuradas correctamente!</p>' +
        '</div>' +
        '<div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px; text-align: center;">' +
        '<p style="color: #10b981; font-size: 48px; margin: 0;">✓</p>' +
        '<h2 style="color: #1e293b;">Prueba Exitosa</h2>' +
        '<p style="color: #64748b;">Recibirás notificaciones cuando tus pagos estén próximos a vencer (' + config.diasAnticipacion + ' días antes).</p>' +
        '</div></div>'
    });

    return { enviado: true, email: config.email };
  } catch (error) {
    return { enviado: false, razon: error.toString() };
  }
}

/**
 * Función para generar reporte mensual de pagos
 */
function generarReporteMensual(mes, anio) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const pagosSheet = sheet.getSheetByName('Pagos');

  if (!pagosSheet) return [];

  const data = pagosSheet.getDataRange().getValues();
  const reporte = [];

  for (let i = 1; i < data.length; i++) {
    const fechaPago = new Date(data[i][0]);
    if (fechaPago.getMonth() === mes - 1 && fechaPago.getFullYear() === anio) {
      reporte.push({
        fecha: data[i][0],
        tarjeta: data[i][2],
        descripcion: data[i][3],
        monto: data[i][4],
        tipo: data[i][5]
      });
    }
  }

  return reporte;
}
