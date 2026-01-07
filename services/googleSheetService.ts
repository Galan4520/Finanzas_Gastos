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
  data: Transaction | CreditCard | PendingExpense | any, 
  tipo: string
) => {
  if (!scriptUrl) {
    throw new Error("URL de Google Apps Script no configurada");
  }

  const payload = { ...data, tipo };
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

export const fetchData = async (scriptUrl: string) => {
  if (!scriptUrl) throw new Error("URL no configurada");

  try {
    // We add a timestamp to prevent browser caching
    const response = await fetch(`${scriptUrl}?t=${Date.now()}`, {
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