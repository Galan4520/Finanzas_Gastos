import { PendingExpense } from '../types';
import { parseNumber } from './format';

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES CENTRALIZADAS PARA DEUDAS
// ═══════════════════════════════════════════════════════════════════════════
// REGLAS INVARIANTES (NUNCA deben violarse):
// 1. saldo_pendiente = monto - monto_pagado_total
// 2. Una deuda es ACTIVA si saldo_pendiente > 0
// 3. El campo 'estado' del backend es informativo, pero saldo_pendiente manda
// 4. Frontend NUNCA decide si una deuda existe - solo renderiza
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FUNCIÓN ÚNICA para calcular el saldo pendiente de una deuda.
 * Esta es la ÚNICA fuente de verdad para este cálculo.
 *
 * @param deuda - El objeto de deuda/gasto pendiente
 * @returns El saldo pendiente (monto - monto_pagado_total)
 */
export function calcularSaldoPendiente(deuda: PendingExpense): number {
  const monto = Number(deuda.monto) || 0;
  const montoPagadoTotal = Number(deuda.monto_pagado_total) || 0;
  return Math.max(0, monto - montoPagadoTotal); // Nunca negativo
}

/**
 * FUNCIÓN ÚNICA para determinar si una deuda está activa y debe mostrarse.
 *
 * REGLA INVARIANTE: Una deuda está activa si:
 * - Es tipo 'deuda' (no suscripción)
 * - Tiene saldo pendiente > 0
 *
 * El campo 'estado' es SECUNDARIO - el saldo pendiente es la verdad.
 * Esto previene bugs donde 'estado' no está sincronizado.
 *
 * @param deuda - El objeto de deuda
 * @returns true si la deuda debe mostrarse en la lista de deudas activas
 */
export function isDeudaActiva(deuda: PendingExpense): boolean {
  // Suscripciones no son "deudas" en este contexto
  if (deuda.tipo === 'suscripcion') {
    return false;
  }

  const saldoPendiente = calcularSaldoPendiente(deuda);

  // REGLA INVARIANTE: Si hay saldo pendiente > 0, la deuda DEBE mostrarse
  // Usamos tolerancia de 0.01 para evitar errores de punto flotante
  return saldoPendiente > 0.01;
}

/**
 * FUNCIÓN ÚNICA para determinar si una suscripción está activa.
 *
 * @param item - El objeto de suscripción/gasto pendiente
 * @returns true si es una suscripción activa
 */
export function isSuscripcionActiva(item: PendingExpense): boolean {
  return item.tipo === 'suscripcion' && item.estado === 'Pendiente';
}

/**
 * Calcula los días de retraso de una deuda.
 * Si es negativo, faltan días para vencer.
 * Si es positivo, son días de retraso.
 * 
 * @param fechaPago - Fecha de vencimiento (YYYY-MM-DD)
 * @returns número de días (positivo = vencido)
 */
export function getDiasVencidos(fechaPago: string): number {
  if (!fechaPago) return 0;

  const fechaVencimiento = new Date(fechaPago);
  const hoy = new Date();

  // Resetear horas para comparar solo fechas
  fechaVencimiento.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const diffTime = hoy.getTime() - fechaVencimiento.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina si una deuda está vencida (fecha de pago anterior a hoy).
 * 
 * @param deuda - El objeto de deuda
 * @returns true si está vencida
 */
export function isDeudaVencida(deuda: PendingExpense): boolean {
  if (deuda.estado === 'Pagado') return false;
  return getDiasVencidos(deuda.fecha_pago) > 0;
}

/**
 * Normaliza una deuda asegurando que todos los campos críticos existan.
 * DEBE usarse al cargar datos del backend o localStorage.
 *
 * @param deuda - El objeto de deuda (posiblemente incompleto)
 * @returns Objeto de deuda con todos los campos normalizados
 */
export function normalizarDeuda(deuda: Partial<PendingExpense>): PendingExpense {
  console.log(`🔍 [normalizarDeuda] Procesando "${deuda.descripcion}": monto=${deuda.monto}, monto_pagado_total=${deuda.monto_pagado_total}, cuotas_pagadas=${deuda.cuotas_pagadas}, num_cuotas=${deuda.num_cuotas}, tipo=${deuda.tipo}`);

  const monto = parseNumber(deuda.monto);
  const numCuotas = Number(deuda.num_cuotas) || 1;
  const cuotasPagadas = Number(deuda.cuotas_pagadas) || 0;

  // CORRECCIÓN: Si monto_pagado_total no existe, calcularlo basado en cuotas
  let montoPagadoTotal = parseNumber(deuda.monto_pagado_total);
  if (montoPagadoTotal === 0 && cuotasPagadas > 0) {
    // Calcular basado en cuotas pagadas
    const montoCuota = monto / numCuotas;
    montoPagadoTotal = cuotasPagadas * montoCuota;
    console.log(`🔍 [normalizarDeuda] monto_pagado_total calculado: ${cuotasPagadas} cuotas * ${montoCuota} = ${montoPagadoTotal}`);
  }

  const saldoPendiente = Math.max(0, monto - montoPagadoTotal);

  console.log(`🔍 [normalizarDeuda] Después de parsear: monto=${monto}, montoPagado=${montoPagadoTotal}, saldo=${saldoPendiente}, cuotasPagadas=${cuotasPagadas}/${numCuotas}`);

  // Determinar estado basado en saldo (el saldo es la verdad)
  let estadoNormalizado: 'Pendiente' | 'Pagado' = deuda.estado as 'Pendiente' | 'Pagado';

  // CORRECCIÓN AUTOMÁTICA: Si el estado no coincide con el saldo, corregir
  if (saldoPendiente > 0.01 && estadoNormalizado === 'Pagado') {
    console.warn(
      `⚠️ [debtUtils] CORRECCIÓN: Deuda "${deuda.descripcion}" tiene estado "Pagado" pero saldo pendiente S/${saldoPendiente.toFixed(2)}. Corrigiendo a "Pendiente".`
    );
    estadoNormalizado = 'Pendiente';
  } else if (saldoPendiente <= 0.01 && estadoNormalizado === 'Pendiente') {
    // Si está pagado pero el estado dice Pendiente, corregir
    estadoNormalizado = 'Pagado';
  }

  // Si no hay estado, determinar por saldo
  if (!estadoNormalizado) {
    estadoNormalizado = saldoPendiente > 0.01 ? 'Pendiente' : 'Pagado';
  }

  return {
    ...deuda,
    id: deuda.id || '',
    monto: monto,
    monto_pagado_total: montoPagadoTotal,
    num_cuotas: Number(deuda.num_cuotas) || 1,
    cuotas_pagadas: Number(deuda.cuotas_pagadas) || 0,
    tipo: deuda.tipo || 'deuda',
    estado: estadoNormalizado,
    tarjeta: deuda.tarjeta || '',
    categoria: deuda.categoria || '',
    descripcion: deuda.descripcion || '',
    fecha_gasto: deuda.fecha_gasto || '',
    fecha_cierre: deuda.fecha_cierre || '',
    fecha_pago: deuda.fecha_pago || '',
    notas: deuda.notas || '',
    timestamp: deuda.timestamp || ''
  } as PendingExpense;
}

/**
 * Filtra y retorna solo las deudas activas (con saldo pendiente > 0).
 *
 * INCLUYE VALIDACIÓN: Loguea warning si alguna deuda con saldo > 0
 * no pasa el filtro (lo cual indicaría un bug).
 *
 * @param deudas - Array de deudas a filtrar
 * @returns Array de deudas activas
 */
export function filtrarDeudasActivas(deudas: PendingExpense[]): PendingExpense[] {
  const activas: PendingExpense[] = [];

  for (const deuda of deudas) {
    if (deuda.tipo === 'suscripcion') continue; // Ignorar suscripciones

    const saldoPendiente = calcularSaldoPendiente(deuda);
    const esActiva = isDeudaActiva(deuda);

    if (esActiva) {
      activas.push(deuda);
    } else if (saldoPendiente > 0.01) {
      // ALERTA: Deuda con saldo pero no activa - BUG POTENCIAL
      console.error(
        `🚨 [debtUtils] BUG DETECTADO: Deuda "${deuda.descripcion}" tiene saldo S/${saldoPendiente.toFixed(2)} pero isDeudaActiva() retornó false. ID: ${deuda.id}`
      );
    }
  }

  return activas;
}

/**
 * Filtra y retorna solo las suscripciones activas.
 *
 * @param items - Array de gastos pendientes
 * @returns Array de suscripciones activas
 */
export function filtrarSuscripcionesActivas(items: PendingExpense[]): PendingExpense[] {
  return items.filter(isSuscripcionActiva);
}

/**
 * Calcula el total de deuda pendiente de un array de deudas.
 *
 * @param deudas - Array de deudas
 * @returns Total de saldo pendiente
 */
export function calcularTotalDeudaPendiente(deudas: PendingExpense[]): number {
  return deudas.reduce((total, deuda) => {
    if (deuda.tipo === 'suscripcion') return total;
    return total + calcularSaldoPendiente(deuda);
  }, 0);
}

/**
 * Calcula el porcentaje de progreso de pago de una deuda.
 *
 * @param deuda - El objeto de deuda
 * @returns Porcentaje de 0 a 100
 */
export function calcularProgresoPago(deuda: PendingExpense): number {
  const monto = Number(deuda.monto) || 0;
  if (monto === 0) return 100;

  const montoPagadoTotal = Number(deuda.monto_pagado_total) || 0;
  return Math.min(100, (montoPagadoTotal / monto) * 100);
}

/**
 * Valida que no haya inconsistencias en los datos de deudas.
 * Útil para debugging y detección temprana de problemas.
 *
 * @param deudas - Array de deudas a validar
 * @returns Array de mensajes de warning/error
 */
export function validarConsistenciaDeudas(deudas: PendingExpense[]): string[] {
  const warnings: string[] = [];

  for (const deuda of deudas) {
    if (deuda.tipo === 'suscripcion') continue;

    const saldo = calcularSaldoPendiente(deuda);
    const monto = Number(deuda.monto) || 0;
    const pagado = Number(deuda.monto_pagado_total) || 0;

    // Validación 1: Estado inconsistente con saldo
    if (saldo > 0.01 && deuda.estado === 'Pagado') {
      warnings.push(
        `Deuda "${deuda.descripcion}": estado="Pagado" pero saldo=S/${saldo.toFixed(2)}`
      );
    }

    // Validación 2: Monto pagado mayor que monto total
    if (pagado > monto + 0.01) {
      warnings.push(
        `Deuda "${deuda.descripcion}": pagado (S/${pagado.toFixed(2)}) > total (S/${monto.toFixed(2)})`
      );
    }

    // Validación 3: Campos críticos faltantes
    if (!deuda.id) {
      warnings.push(`Deuda "${deuda.descripcion}": falta ID`);
    }
    if (deuda.monto_pagado_total === undefined) {
      warnings.push(`Deuda "${deuda.descripcion}": falta monto_pagado_total`);
    }
  }

  return warnings;
}
