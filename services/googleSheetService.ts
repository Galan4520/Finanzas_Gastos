import { Transaction, CreditCard, PendingExpense } from "../types";

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

export const sendToSheet = async (
  scriptUrl: string,
  pin: string,
  data: Transaction | CreditCard | PendingExpense | any,
  tipo: string
) => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { ...data, tipo, pin };
  const formData = objectToFormData(payload);

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
    return true;
  } catch (error) {
    console.error("Error sending to sheet:", error);
    throw error;
  }
};

// Update an existing record in Google Sheet
export const updateInSheet = async (
  scriptUrl: string,
  pin: string,
  data: PendingExpense | CreditCard | any,
  tipo: string
) => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { ...data, tipo, pin, action: 'update' };
  console.log('📤 Sending UPDATE to Sheet:', { tipo, data: payload });

  const formData = objectToFormData(payload);

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
    console.log('✅ UPDATE request sent successfully');
    return true;
  } catch (error) {
    console.error("❌ Error updating in sheet:", error);
    throw error;
  }
};

// Delete a record from Google Sheet
export const deleteFromSheet = async (
  scriptUrl: string,
  pin: string,
  id: string,
  tipo: string
) => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { id, tipo, pin, action: 'delete' };
  console.log('🗑️ Sending DELETE to Sheet:', payload);

  const formData = objectToFormData(payload);

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
    console.log('✅ DELETE request sent successfully');
    return true;
  } catch (error) {
    console.error("❌ Error deleting from sheet:", error);
    throw error;
  }
};

export const fetchData = async (scriptUrl: string, pin: string) => {
  if (!scriptUrl) throw new Error("URL no configurada");
  if (!pin) throw new Error("PIN no configurado");

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
    return json;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Save user profile to Google Sheet
export const saveProfile = async (
  scriptUrl: string,
  pin: string,
  avatarId: string,
  nombre: string
) => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = {
    action: 'saveProfile',
    pin,
    avatar_id: avatarId,
    nombre
  };

  const formData = new FormData();
  Object.keys(payload).forEach(key => {
    formData.append(key, (payload as any)[key].toString());
  });

  try {
    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
    console.log('✅ Profile saved successfully');
    return true;
  } catch (error) {
    console.error("❌ Error saving profile:", error);
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
