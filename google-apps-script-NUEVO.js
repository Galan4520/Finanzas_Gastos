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
    const numCuota = params.num_cuota ? parseInt(params.num_cuota) : null;

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
        targetSheet.getRange(i + 1, 13).setValue(params.tipo || 'deuda');
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
        const proximaFecha = new Date(fechaActual);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);

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

  // 🆕 Retornar JSON con perfil incluido
  return ContentService.createTextOutput(JSON.stringify({
    profile: profile,  // null si no existe, o { avatar_id, nombre }
    cards: cards,
    pending: pending,
    history: history,
    availableProperties: availableProperties // 🆕 Catálogo de propiedades
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
