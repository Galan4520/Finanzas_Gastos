export interface CreditCard {
  banco: string;
  tipo_tarjeta: string;
  alias: string;
  url_imagen?: string;
  dia_cierre: number;
  dia_pago: number;
  limite: number;
  tea?: number | null; // TEA: Tasa Efectiva Anual (porcentaje, ej: 60 = 60%). Solo para tarjetas de crédito.
  tipo_cuenta?: 'credito' | 'debito'; // 'credito' = solo en tab Tarjeta; 'debito' = en Gasto/Ingreso
  moneda?: 'PEN' | 'USD'; // Moneda de la cuenta (default PEN)
  timestamp: string;
}

/** Devuelve la moneda de una tarjeta. Billetera siempre es PEN. */
export const getCardMoneda = (card: CreditCard): 'PEN' | 'USD' => {
  return card.moneda === 'USD' ? 'USD' : 'PEN';
};

/**
 * Determina si una tarjeta es de débito o crédito.
 * Usa tipo_cuenta si está disponible, de lo contrario infiere del nombre de tipo_tarjeta.
 */
export const getCardType = (card: CreditCard): 'credito' | 'debito' => {
  if (card.tipo_cuenta === 'credito' || card.tipo_cuenta === 'debito') return card.tipo_cuenta;
  const t = (card.tipo_tarjeta || '').toLowerCase();
  if (t.includes('déb') || t.includes('deb') || t === 'débito') return 'debito';
  return 'credito';
};

// ═══════════════════════════════════════════════════════════════
// SIMULACIÓN DE CUOTAS CON INTERÉS (TEA)
// Solo informativo. NO altera monto_pagado_total ni cuotas_pagadas.
// ═══════════════════════════════════════════════════════════════
export interface SimulacionCuotas {
  cuotaMensual: number;
  totalAPagar: number;
  interesesTotales: number;
  porcentajeExtraPagado: number;
}

/**
 * Simula una compra en cuotas con interés usando sistema francés (cuota fija).
 *
 * @param monto - Monto total de la compra
 * @param numCuotas - Número de cuotas
 * @param tea - Tasa Efectiva Anual (porcentaje, ej: 60 = 60%)
 * @returns SimulacionCuotas o null si la TEA no está disponible
 */
export function simularCompraEnCuotas(monto: number, numCuotas: number, tea: number | null | undefined): SimulacionCuotas | null {
  if (!tea || tea <= 0 || !monto || monto <= 0 || !numCuotas || numCuotas < 1) {
    return null;
  }

  if (numCuotas === 1) {
    return { cuotaMensual: monto, totalAPagar: monto, interesesTotales: 0, porcentajeExtraPagado: 0 };
  }

  // Tasa mensual = (1 + TEA/100)^(1/12) - 1   (PROHIBIDO usar TEA/12)
  const tasaMensual = Math.pow(1 + tea / 100, 1 / 12) - 1;

  // Cuota fija - Sistema francés: cuota = monto * i / (1 - (1 + i)^(-n))
  const cuotaMensual = monto * tasaMensual / (1 - Math.pow(1 + tasaMensual, -numCuotas));

  const totalAPagar = cuotaMensual * numCuotas;
  const interesesTotales = totalAPagar - monto;
  const porcentajeExtraPagado = (interesesTotales / monto) * 100;

  return {
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    totalAPagar: Math.round(totalAPagar * 100) / 100,
    interesesTotales: Math.round(interesesTotales * 100) / 100,
    porcentajeExtraPagado: Math.round(porcentajeExtraPagado * 100) / 100,
  };
}

export interface Transaction {
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  notas?: string;
  timestamp: string;
  tipo: 'Gastos' | 'Ingresos' | 'Aporte_Meta' | 'Ruptura_Meta';
  meta_id?: string;
  cuenta?: string; // Cuenta/tarjeta asociada al movimiento
  moneda?: 'PEN' | 'USD'; // Moneda heredada de la cuenta (default PEN)
}

export interface PendingExpense {
  id: string;
  fecha_gasto: string;
  tarjeta: string; // Alias
  categoria: string;
  descripcion: string;
  monto: number;
  fecha_cierre: string;
  fecha_pago: string;
  estado: 'Pendiente' | 'Pagado';
  num_cuotas: number;
  cuotas_pagadas: number;
  monto_pagado_total?: number; // Monto total pagado acumulado (soluciona bug de pagos parciales)
  tipo?: 'deuda' | 'suscripcion'; // Nueva propiedad para diferenciar
  notas?: string;
  moneda?: 'PEN' | 'USD'; // Moneda del cargo (puede diferir de la moneda de la tarjeta)
  timestamp: string;
}

// Legacy - kept for API sync compatibility
export interface SavingsGoalConfig {
  meta_anual: number;
  ahorro_mensual_necesario: number;
  proposito: string;
  anio: number;
  timestamp: string;
}

export interface Goal {
  id: string;
  nombre: string;
  monto_objetivo: number;
  monto_ahorrado: number;
  notas?: string;
  estado: 'activa' | 'completada';
  icono?: string; // Key from ICON_OPTIONS (e.g. 'car', 'plane', 'house')
  timestamp: string;
}

export const CATEGORIAS_GASTOS = [
  "🏠 Vivienda", "💡 Servicios", "🍕 Alimentación", "🚗 Transporte",
  "💊 Salud", "📚 Educación", "🎮 Entretenimiento", "👕 Ropa",
  "💅 Cuidado Personal", "📱 Tecnología", "🎁 Regalos", "✈️ Viajes",
  "🐕 Mascotas", "💳 Otros"
];

export const CATEGORIAS_INGRESOS = [
  "💼 Salario", "💻 Freelance", "📈 Inversiones", "🏦 Intereses",
  "🎁 Bonos", "🏠 Rentas", "💰 Otros"
];

export const BANCOS = [
  "BCP", "Interbank", "Scotiabank", "BBVA", "Banco Pichincha",
  "Banbif", "Falabella", "Ripley", "Corredor Azul", "Metropolitano", "Otro"
];

// Real Estate Investments
export interface RealEstateInvestment {
  id: string;
  nombre: string; // Nombre o dirección de la propiedad
  tipo: 'Casa' | 'Departamento' | 'Terreno' | 'Local Comercial' | 'Otro';
  valor_compra: number;
  valor_actual: number;
  fecha_adquisicion: string;
  genera_renta: boolean;
  renta_mensual?: number; // Solo si genera_renta es true
  notas?: string;
  timestamp: string;
}

// Real Estate Catalog (Properties available for purchase)
export interface RealEstateProperty {
  id: string;
  titulo: string;
  tipo: 'Casa' | 'Departamento' | 'Terreno' | 'Local Comercial' | 'Otro';
  zona: string; // Distrito o zona (ej: San Isidro, Miraflores, etc.)
  precio: number;
  area_m2?: number;
  dormitorios?: number;
  banos?: number;
  descripcion?: string;
  url_imagen?: string; // Primera imagen (compatibilidad)
  imagenes?: string[]; // Array de todas las imágenes para carrusel
  timestamp: string;
}

// Family Plan - single member
export interface FamilyMember {
  url: string;
  pin: string;
  name: string;
  avatarId: string;
}

// Family Plan Config - supports multiple members
export interface FamilyConfig {
  members: FamilyMember[];
  // Legacy fields (backward compat - auto-migrated on load)
  partnerUrl?: string;
  partnerPin?: string;
  partnerName?: string;
  partnerAvatarId?: string;
}

// User Profile
export interface UserProfile {
  id: string;
  avatar_id: string;
  nombre: string;
  email?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
  familyConfig?: FamilyConfig;
}

// Notification Config (from Google Sheet Config tab)
export interface NotificationConfig {
  email: string;
  diasAnticipacion: number;
  notificacionesActivas: boolean;
  lastEmailSent?: string; // ISO timestamp of last successfully sent email
}

// ═══════════════════════════════════════════════════════════════
// YUNAI IA — Extracción por voz y foto
// ═══════════════════════════════════════════════════════════════

export interface CampoIncierto {
  campo: string;
  valor_sugerido: string | null;
  opciones: string[];
  pregunta: string;
}

export interface YunaiExtractionResult {
  tipo: 'gasto' | 'ingreso' | 'tarjeta' | 'pago_tarjeta' | 'transferencia';
  monto: number;
  descripcion: string;
  categoria: string;
  cuenta: string | null;
  cuenta_destino?: string | null;
  fecha: string;
  notas: string;
  num_cuotas: number;
  meta_id: string;
  tipo_gasto: 'deuda' | 'suscripcion';
  confianza: number;
  campos_inciertos: CampoIncierto[];
  pregunta_seguimiento: string | null;
}

export interface YunaiAdviceResult {
  consejo: string;
  estado: 'bien' | 'alerta' | 'mal';
  categoriaDestacada: string;
  tipAhorro: string;
}