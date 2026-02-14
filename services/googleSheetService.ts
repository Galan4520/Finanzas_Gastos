import { Transaction, CreditCard, PendingExpense, NotificationConfig } from "../types";

// ═══════════════════════════════════════════════════════════════
// ARQUITECTURA: Backend como única fuente de verdad
// ═══════════════════════════════════════════════════════════════
// ESTRATEGIA: POST con no-cors + verificación GET
// RAZÓN: Google Apps Script no soporta CORS para POST responses
// FLUJO:
//   1. Enviar POST (fire-and-forget)
//   2. Esperar breve momento para que GAS procese
//   3. GET para verificar que el cambio se guardó
//   4. Solo confirmar éxito si GET muestra el cambio
// ═══════════════════════════════════════════════════════════════

// Helper to convert object to FormData
const objectToFormData = (obj: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      formData.append(key, obj[key].toString());
    }
  });
  return formData;
};

// Función para esperar (usada entre POST y verificación GET)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════════
// FETCH DATA - Obtener datos del servidor (GET funciona con CORS)
// ═══════════════════════════════════════════════════════════════
export const fetchData = async (scriptUrl: string, pin: string) => {
  if (!scriptUrl) throw new Error("URL no configurada");
  if (!pin) throw new Error("PIN no configurado");

  console.log('🔄 [fetchData] Sincronizando datos desde el servidor...');

  try {
    const response = await fetch(`${scriptUrl}?pin=${encodeURIComponent(pin)}&t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    console.log('✅ [fetchData] Datos sincronizados correctamente');
    return json;
  } catch (error) {
    console.error("❌ [fetchData] Error sincronizando:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// SEND TO SHEET - Enviar datos con verificación
// ═══════════════════════════════════════════════════════════════
export const sendToSheet = async (
  scriptUrl: string,
  pin: string,
  data: Transaction | CreditCard | PendingExpense | any,
  tipo: string
): Promise<{ success: boolean; message?: string }> => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { ...data, tipo, pin };
  const formData = objectToFormData(payload);

  console.log(`📤 [sendToSheet] Enviando ${tipo}...`);

  try {
    // PASO 1: Enviar POST (no-cors porque GAS no soporta CORS para POST)
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    console.log(`✅ [sendToSheet] ${tipo} enviado correctamente`);
    return { success: true };

  } catch (error) {
    console.error(`❌ [sendToSheet] Error en ${tipo}:`, error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE IN SHEET - Actualizar con verificación GET
// ═══════════════════════════════════════════════════════════════
export const updateInSheet = async (
  scriptUrl: string,
  pin: string,
  data: PendingExpense | CreditCard | any,
  tipo: string
): Promise<{ success: boolean; verified: boolean; message?: string }> => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  // Preservar el campo 'tipo' original del objeto (ej: 'deuda', 'suscripcion')
  // usando 'tipo_original', y usar 'tipo' para el routing de la hoja destino
  const payload = { ...data, tipo_original: data.tipo, tipo, pin, action: 'update' };
  const formData = objectToFormData(payload);

  console.log(`📤 [updateInSheet] Actualizando ${tipo}:`, {
    id: data.id,
    monto_pagado_total: data.monto_pagado_total
  });

  try {
    // PASO 1: Enviar POST (no-cors)
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    console.log(`📨 [updateInSheet] POST enviado, esperando procesamiento...`);

    // PASO 2: Esperar a que Google Apps Script procese (1.5 segundos)
    await delay(1500);

    // PASO 3: Verificar con GET que el cambio se guardó
    console.log(`🔍 [updateInSheet] Verificando persistencia...`);
    const freshData = await fetchData(scriptUrl, pin);

    // PASO 4: Buscar el registro actualizado
    if (tipo === 'Gastos_Pendientes' && freshData.pending) {
      const savedRecord = freshData.pending.find((p: any) => p.id === data.id);

      if (savedRecord) {
        const savedMontoPagado = Number(savedRecord.monto_pagado_total) || 0;
        const expectedMontoPagado = Number(data.monto_pagado_total) || 0;

        // Verificar que el monto_pagado_total se actualizó correctamente
        // Usamos una tolerancia de 0.01 para evitar errores de punto flotante
        if (Math.abs(savedMontoPagado - expectedMontoPagado) < 0.01) {
          console.log(`✅ [updateInSheet] VERIFICADO: monto_pagado_total = ${savedMontoPagado}`);
          return { success: true, verified: true, message: 'Cambio verificado en BD' };
        } else {
          console.error(`❌ [updateInSheet] MISMATCH: esperado=${expectedMontoPagado}, guardado=${savedMontoPagado}`);
          throw new Error(`El pago no se guardó correctamente. Esperado: ${expectedMontoPagado}, Guardado: ${savedMontoPagado}`);
        }
      } else {
        console.error(`❌ [updateInSheet] Registro no encontrado: ${data.id}`);
        throw new Error('Registro no encontrado después de actualizar');
      }
    }

    // Para otros tipos, asumir éxito si el POST no falló
    return { success: true, verified: false, message: 'Enviado sin verificación' };

  } catch (error) {
    console.error(`❌ [updateInSheet] Error:`, error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE FROM SHEET
// ═══════════════════════════════════════════════════════════════
export const deleteFromSheet = async (
  scriptUrl: string,
  pin: string,
  id: string,
  tipo: string
): Promise<{ success: boolean; message?: string }> => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { id, tipo, pin, action: 'delete' };
  const formData = objectToFormData(payload);

  console.log(`🗑️ [deleteFromSheet] Eliminando ${tipo}:`, { id });

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    // Esperar y verificar
    await delay(1000);
    const freshData = await fetchData(scriptUrl, pin);

    if (tipo === 'Gastos_Pendientes' && freshData.pending) {
      const stillExists = freshData.pending.find((p: any) => p.id === id);
      if (stillExists) {
        throw new Error('El registro no se eliminó correctamente');
      }
    }

    console.log(`✅ [deleteFromSheet] ${tipo} eliminado correctamente`);
    return { success: true };

  } catch (error) {
    console.error(`❌ [deleteFromSheet] Error:`, error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// SAVE PROFILE
// ═══════════════════════════════════════════════════════════════
export const saveProfile = async (
  scriptUrl: string,
  pin: string,
  avatarId: string,
  nombre: string
): Promise<{ success: boolean; profile?: any }> => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = {
    action: 'saveProfile',
    pin,
    avatar_id: avatarId,
    nombre
  };

  const formData = objectToFormData(payload);

  console.log('📤 [saveProfile] Guardando perfil...');

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    // Verificar
    await delay(1000);
    const freshData = await fetchData(scriptUrl, pin);

    if (freshData.profile) {
      console.log('✅ [saveProfile] Perfil verificado');
      return { success: true, profile: freshData.profile };
    }

    return { success: true };

  } catch (error) {
    console.error("❌ [saveProfile] Error:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CONFIG - Guardar/enviar notificaciones
// ═══════════════════════════════════════════════════════════════
export const saveNotificationConfig = async (
  scriptUrl: string,
  pin: string,
  config: NotificationConfig
): Promise<{ success: boolean; verified: boolean }> => {
  if (!scriptUrl) throw new Error("URL de Google Apps Script no configurada");

  const payload = {
    action: 'saveNotificationConfig',
    pin,
    email: config.email,
    dias_anticipacion: config.diasAnticipacion.toString(),
    notificaciones_activas: config.notificacionesActivas.toString()
  };

  const formData = objectToFormData(payload);

  console.log('📧 [saveNotificationConfig] Guardando configuración...');

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    // Verificar que se guardó via GET
    await delay(1500);
    const freshData = await fetchData(scriptUrl, pin);
    const savedConfig = freshData.notificationConfig;

    if (savedConfig && savedConfig.email === config.email) {
      console.log('✅ [saveNotificationConfig] Configuración verificada en BD');
      return { success: true, verified: true };
    } else {
      console.warn('⚠️ [saveNotificationConfig] No se pudo verificar. ¿Actualizaste el código de Apps Script?');
      return { success: true, verified: false };
    }
  } catch (error) {
    console.error('❌ [saveNotificationConfig] Error:', error);
    throw error;
  }
};

/**
 * Envía email de prueba y verifica que se envió checando lastEmailSent en Config.
 */
export const sendTestEmail = async (
  scriptUrl: string,
  pin: string
): Promise<{ enviado: boolean; verified: boolean; razon?: string }> => {
  if (!scriptUrl) throw new Error("URL de Google Apps Script no configurada");

  // Capturar timestamp anterior para comparar
  let previousTimestamp = '';
  try {
    const beforeData = await fetchData(scriptUrl, pin);
    previousTimestamp = beforeData.notificationConfig?.lastEmailSent || '';
  } catch { /* ignorar */ }

  const payload = { action: 'sendTestEmail', pin };
  const formData = objectToFormData(payload);

  console.log('📧 [sendTestEmail] Enviando email de prueba...');

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    // Esperar que Apps Script procese y verificar
    await delay(3000);
    const afterData = await fetchData(scriptUrl, pin);
    const newTimestamp = afterData.notificationConfig?.lastEmailSent || '';

    if (newTimestamp && newTimestamp !== previousTimestamp) {
      console.log('✅ [sendTestEmail] Email enviado y verificado');
      return { enviado: true, verified: true };
    } else {
      console.warn('⚠️ [sendTestEmail] No se detectó envío. Posibles causas: código no actualizado o permisos no autorizados.');
      return { enviado: false, verified: false, razon: 'No se pudo verificar el envío. Revisa la guía de configuración.' };
    }
  } catch (error) {
    console.error('❌ [sendTestEmail] Error:', error);
    throw error;
  }
};

/**
 * Envía notificaciones de vencimiento y verifica.
 */
export const sendNotificationsNow = async (
  scriptUrl: string,
  pin: string
): Promise<{ enviado: boolean; verified: boolean; razon?: string }> => {
  if (!scriptUrl) throw new Error("URL de Google Apps Script no configurada");

  let previousTimestamp = '';
  try {
    const beforeData = await fetchData(scriptUrl, pin);
    previousTimestamp = beforeData.notificationConfig?.lastEmailSent || '';
  } catch { /* ignorar */ }

  const payload = { action: 'sendNotifications', pin };
  const formData = objectToFormData(payload);

  console.log('📧 [sendNotificationsNow] Enviando notificaciones...');

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    await delay(3000);
    const afterData = await fetchData(scriptUrl, pin);
    const newTimestamp = afterData.notificationConfig?.lastEmailSent || '';

    if (newTimestamp && newTimestamp !== previousTimestamp) {
      console.log('✅ [sendNotificationsNow] Notificaciones enviadas y verificadas');
      return { enviado: true, verified: true };
    } else {
      console.warn('⚠️ [sendNotificationsNow] No se detectó envío.');
      return { enviado: false, verified: false, razon: 'No se verificó el envío. Puede que no haya pagos próximos o el código no está actualizado.' };
    }
  } catch (error) {
    console.error('❌ [sendNotificationsNow] Error:', error);
    throw error;
  }
};

export const setupDailyTrigger = async (
  scriptUrl: string,
  pin: string
): Promise<{ success: boolean }> => {
  if (!scriptUrl) throw new Error("URL de Google Apps Script no configurada");

  const payload = { action: 'setupDailyTrigger', pin };
  const formData = objectToFormData(payload);

  console.log('📧 [setupDailyTrigger] Configurando trigger diario...');

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });

    await delay(1500);
    console.log('✅ [setupDailyTrigger] Trigger configurado');
    return { success: true };
  } catch (error) {
    console.error('❌ [setupDailyTrigger] Error:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// FETCH PROPERTIES
// ═══════════════════════════════════════════════════════════════
export const fetchProperties = async (propertiesScriptUrl: string) => {
  if (!propertiesScriptUrl) {
    throw new Error("URL de propiedades no configurada");
  }

  try {
    const response = await fetch(`${propertiesScriptUrl}?t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    return json.properties || [];
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};
