export interface CreditCard {
  banco: string;
  tipo_tarjeta: string;
  alias: string;
  url_imagen?: string;
  dia_cierre: number;
  dia_pago: number;
  limite: number;
  timestamp: string;
}

export interface Transaction {
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  notas?: string;
  timestamp: string;
  tipo: 'Gastos' | 'Ingresos';
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
  tipo?: 'deuda' | 'suscripcion'; // Nueva propiedad para diferenciar
  notas?: string;
  timestamp: string;
}

export interface SavingsGoalConfig {
  meta_anual: number;
  ahorro_mensual_necesario: number;
  proposito: string;
  anio: number;
  timestamp: string;
}

export interface MonthlyGoalProgress {
  mes: string;
  ingresos: number;
  gastos: number;
  ahorro_real: number;
  acumulado: number;
  porcentaje_meta: number;
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
  "Banbif", "Falabella", "Ripley", "Otro"
];

// User Profile
export interface UserProfile {
  avatar_id: string;
  nombre: string;
}