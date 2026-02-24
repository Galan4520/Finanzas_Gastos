export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formato compacto para displays con espacio limitado.
 * < 10K: "S/ 9,999.99" (completo)
 * 10K–999K: "S/ 25.3K"
 * 1M+: "S/ 1.2M"
 */
export const formatCompact = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs < 10_000) {
    return formatCurrency(amount);
  }
  if (abs < 1_000_000) {
    const k = abs / 1_000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return `${sign}S/ ${formatted}K`;
  }
  const m = abs / 1_000_000;
  const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1);
  return `${sign}S/ ${formatted}M`;
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const generateId = () => {
  return 'GP' + Date.now().toString().substring(7);
};

// Generate local timestamp in ISO format (without UTC conversion)
export const getLocalISOString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

/**
 * Parsea un string numérico con formato local a un número JS válido.
 * Maneja formatos:
 * - "2.500,00" (LATAM/EU) -> 2500.00
 * - "2,500.00" (US) -> 2500.00
 * - "2500" -> 2500
 */
export const parseNumber = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;

  // Limpiar caracteres extraños (moneda, espacios)
  let clean = value.toString().replace(/[^0-9.,-]/g, '');

  if (!clean) return 0;

  // Caso de notación científica o simple
  if (/^-?\d+(\.\d+)?$/.test(clean)) return parseFloat(clean);

  // Detectar formato "2.500,00" (Euro/LATAM) vs "2,500.00" (US)
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      // Formato 1.000,00 -> Quitar puntos, cambiar coma a punto
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato 1,000.00 -> Quitar comas
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Solo comas: "10,50" o "1,000"
    // Si hay muchas comas, son miles
    if ((clean.match(/,/g) || []).length > 1) {
      clean = clean.replace(/,/g, '');
    } else {
      // Una sola coma.
      // Si tiene 2 decimales exactos ("10,50"), es decimal (común en precios)
      const parts = clean.split(',');
      if (parts[1].length === 2) {
        clean = clean.replace(',', '.');
      } else {
        // Si tiene 3 ("1,000"), es miles.
        clean = clean.replace(',', '');
      }
    }
  } else if (clean.includes('.')) {
    // Solo puntos: "10.50" o "1.000"
    if ((clean.match(/\./g) || []).length > 1) {
      clean = clean.replace(/\./g, '');
    } else {
      const parts = clean.split('.');
      // Si tiene 3 dígitos después del punto ("1.000"), asumimos miles en LATAM
      // PERO cuidado con "1.234" (puede ser 1,234 miles o 1.234 unidad)
      // Asumiremos que si viene de un input financiero LATAM, .000 es miles.
      if (parts[1].length === 3) {
        clean = clean.replace('.', '');
      }
    }
  }

  return parseFloat(clean) || 0;
};