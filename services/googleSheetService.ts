import { Transaction, CreditCard, PendingExpense } from "../types";

// ═══════════════════════════════════════════════════════════════
// ARQUITECTURA CORREGIDA: Backend es la única fuente de verdad
// ═══════════════════════════════════════════════════════════════
// CAMBIO CRÍTICO: Eliminado "mode: no-cors" de todas las peticiones
// RAZÓN: no-cors impide leer respuestas, causando falsos positivos
// AHORA: Todas las peticiones verifican la respuesta del servidor
// ═══════════════════════════════════════════════════════════════

// Helper to convert object to URL-encoded string (mejor compatibilidad con GAS)
const objectToUrlEncoded = (obj: Record<string, any>): string => {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key].toString())}`)
    .join('&');
};

// Helper para manejar la respuesta de Google Apps Script
const handleGASResponse = async (response: Response, operation: string): Promise<any> => {
  // Google Apps Script siempre debería retornar 200, pero verificamos
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} en ${operation}`);
  }

  try {
    const json = await response.json();

    // Verificar si el backend reportó un error
    if (json.error) {
      throw new Error(`Error del servidor: ${json.error}`);
    }

    return json;
  } catch (parseError) {
    // Si no podemos parsear JSON, algo salió muy mal
    console.error(`Error parseando respuesta de ${operation}:`, parseError);
    throw new Error(`Respuesta inválida del servidor en ${operation}`);
  }
};

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
  const body = objectToUrlEncoded(payload);

  console.log(`📤 [sendToSheet] Enviando ${tipo}:`, { id: data.id || 'nuevo' });

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
      redirect: 'follow'
    });

    const result = await handleGASResponse(response, `sendToSheet(${tipo})`);

    console.log(`✅ [sendToSheet] ${tipo} guardado exitosamente:`, result);
    return { success: true, message: result.message };

  } catch (error) {
    console.error(`❌ [sendToSheet] Error en ${tipo}:`, error);
    throw error;
  }
};

// Update an existing record in Google Sheet
export const updateInSheet = async (
  scriptUrl: string,
  pin: string,
  data: PendingExpense | CreditCard | any,
  tipo: string
): Promise<{ success: boolean; message?: string }> => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { ...data, tipo, pin, action: 'update' };
  const body = objectToUrlEncoded(payload);

  console.log(`📤 [updateInSheet] Actualizando ${tipo}:`, { id: data.id, monto_pagado_total: data.monto_pagado_total });

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
      redirect: 'follow'
    });

    const result = await handleGASResponse(response, `updateInSheet(${tipo})`);

    console.log(`✅ [updateInSheet] ${tipo} actualizado exitosamente:`, result);
    return { success: true, message: result.message };

  } catch (error) {
    console.error(`❌ [updateInSheet] Error actualizando ${tipo}:`, error);
    throw error;
  }
};

// Delete a record from Google Sheet
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
  const body = objectToUrlEncoded(payload);

  console.log(`🗑️ [deleteFromSheet] Eliminando ${tipo}:`, { id });

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
      redirect: 'follow'
    });

    const result = await handleGASResponse(response, `deleteFromSheet(${tipo})`);

    console.log(`✅ [deleteFromSheet] ${tipo} eliminado exitosamente:`, result);
    return { success: true, message: result.message };

  } catch (error) {
    console.error(`❌ [deleteFromSheet] Error eliminando ${tipo}:`, error);
    throw error;
  }
};

export const fetchData = async (scriptUrl: string, pin: string) => {
  if (!scriptUrl) throw new Error("URL no configurada");
  if (!pin) throw new Error("PIN no configurado");

  console.log('🔄 [fetchData] Sincronizando datos desde el servidor...');

  try {
    // We add PIN and a timestamp to prevent browser caching
    const response = await fetch(`${scriptUrl}?pin=${encodeURIComponent(pin)}&t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const json = await response.json();

    // Verificar si hay error de PIN u otro error del servidor
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

// Save user profile to Google Sheet
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

  const body = objectToUrlEncoded(payload);

  console.log('📤 [saveProfile] Guardando perfil...');

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
      redirect: 'follow'
    });

    const result = await handleGASResponse(response, 'saveProfile');

    console.log('✅ [saveProfile] Perfil guardado exitosamente');
    return { success: true, profile: result.profile };

  } catch (error) {
    console.error("❌ [saveProfile] Error guardando perfil:", error);
    throw error;
  }
};

// Fetch properties from separate properties spreadsheet
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
