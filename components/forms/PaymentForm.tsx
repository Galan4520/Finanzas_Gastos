import React, { useState, useEffect } from 'react';
import { PendingExpense, Transaction } from '../../types';
import { sendToSheet, fetchData } from '../../services/googleSheetService';
import { formatCurrency, formatDate, getLocalISOString } from '../../utils/format';
import { calcularSaldoPendiente } from '../../utils/debtUtils';
import { Banknote, Lightbulb, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface PaymentFormProps {
  scriptUrl: string;
  pin: string;
  pendingExpenses: PendingExpense[];
  onUpdateExpense: (expense: PendingExpense) => void;
  onAddToHistory?: (transaction: Transaction) => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ scriptUrl, pin, pendingExpenses, onUpdateExpense, onAddToHistory, notify }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [paymentType, setPaymentType] = useState('Cuota');
  const [customAmount, setCustomAmount] = useState('');
  const [payMode, setPayMode] = useState<'deudas' | 'suscripciones'>('deudas');

  const selectedExpense = pendingExpenses.find(e => e.id === selectedExpenseId);

  // Auto-fill amount based on type
  useEffect(() => {
    if (selectedExpense) {
      // Para suscripciones, siempre es el monto completo
      if (selectedExpense.tipo === 'suscripcion') {
        setCustomAmount(Number(selectedExpense.monto).toFixed(2));
        return;
      }

      // Para deudas, calcular según tipo de pago
      const total = Number(selectedExpense.monto);
      const cuotas = Number(selectedExpense.num_cuotas);
      const cuotaAmount = total / cuotas;

      if (paymentType === 'Cuota') setCustomAmount(cuotaAmount.toFixed(2));
      if (paymentType === 'Total') {
        const montoPagadoTotal = selectedExpense.monto_pagado_total || 0;
        setCustomAmount((total - montoPagadoTotal).toFixed(2));
      }
      if (paymentType === 'Parcial') setCustomAmount('');
    }
  }, [paymentType, selectedExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl || !selectedExpense) return;
    setLoading(true);

    // ═══════════════════════════════════════════════════════════════
    // ARQUITECTURA CORREGIDA: Backend es la única fuente de verdad
    // ═══════════════════════════════════════════════════════════════
    // FLUJO CORRECTO:
    // 1. Calcular el nuevo estado
    // 2. PRIMERO guardar en BD (updateInSheet, sendToSheet)
    // 3. SOLO SI BD confirma éxito → actualizar estado local
    // 4. Si BD falla → NO actualizar nada, mostrar error
    // ═══════════════════════════════════════════════════════════════

    try {
      const montoPagado = parseFloat(customAmount);
      const esSuscripcion = selectedExpense.tipo === 'suscripcion';

      // VALIDACIÓN QA: No permitir pagar más de la deuda
      if (!esSuscripcion) {
        const deudaTotal = Number(selectedExpense.monto);
        const pagadoPrevio = selectedExpense.monto_pagado_total || 0;
        const deudaPendiente = deudaTotal - pagadoPrevio;

        // Permitir un margen de error de 0.1 para redondeos
        if (montoPagado > deudaPendiente + 0.1) {
          notify?.(`El monto (${formatCurrency(montoPagado)}) excede la deuda pendiente (${formatCurrency(deudaPendiente)})`, 'error');
          setLoading(false);
          return;
        }
      }

      let updatedExpense: PendingExpense;

      if (esSuscripcion) {
        // LÓGICA PARA SUSCRIPCIONES: Renovar al próximo mes
        const fechaActual = new Date(selectedExpense.fecha_pago);
        const diaOriginal = fechaActual.getDate();
        const proximaFecha = new Date(fechaActual);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
        // Fix month overflow (e.g., Jan 31 → setMonth(1) = Mar 3 → clamp to Feb 28)
        if (proximaFecha.getDate() !== diaOriginal) {
          proximaFecha.setDate(0); // Last day of previous month
        }

        updatedExpense = {
          ...selectedExpense,
          fecha_pago: proximaFecha.toISOString().split('T')[0],
          fecha_cierre: proximaFecha.toISOString().split('T')[0],
          estado: 'Pendiente'
        };
      } else {
        // LÓGICA PARA DEUDAS: Incrementar cuotas y monto pagado total
        const montoTotal = Number(selectedExpense.monto);
        const numCuotas = Number(selectedExpense.num_cuotas);
        const montoCuota = montoTotal / numCuotas;

        const montoPagadoAnterior = selectedExpense.monto_pagado_total || 0;
        const nuevoMontoPagadoTotal = montoPagadoAnterior + montoPagado;
        const nuevasCuotasPagadas = nuevoMontoPagadoTotal / montoCuota;

        const cuotasPagadasFinal = Math.min(nuevasCuotasPagadas, numCuotas);
        const montoPagadoFinal = Math.min(nuevoMontoPagadoTotal, montoTotal);

        let newEstado: 'Pendiente' | 'Pagado' = 'Pendiente';
        if (cuotasPagadasFinal >= numCuotas) {
          newEstado = 'Pagado';
        }

        updatedExpense = {
          ...selectedExpense,
          cuotas_pagadas: cuotasPagadasFinal,
          monto_pagado_total: montoPagadoFinal,
          estado: newEstado
        };
      }

      const cuotasPagadasActual = Number(selectedExpense.cuotas_pagadas) || 0;

      const tipoPagoFinal = esSuscripcion ? 'Suscripcion' : paymentType;

      const paymentPayload = {
        fecha_pago: new Date().toISOString().split('T')[0],
        id_gasto: selectedExpense.id,
        tarjeta: selectedExpense.tarjeta,
        descripcion_gasto: selectedExpense.descripcion,
        monto_pagado: montoPagado,
        tipo_pago: tipoPagoFinal,
        num_cuota: paymentType === 'Cuota' && !esSuscripcion ? (Math.floor(cuotasPagadasActual) + 1) : 0,
        timestamp: getLocalISOString()
      };

      const gastoEntry = {
        fecha: new Date().toISOString().split('T')[0],
        categoria: selectedExpense.categoria,
        descripcion: esSuscripcion
          ? `${selectedExpense.descripcion} (Suscripción)`
          : `Pago ${paymentType} - ${selectedExpense.descripcion}`,
        monto: montoPagado,
        notas: `Pago de ${esSuscripcion ? 'suscripción' : 'deuda'} - ${selectedExpense.tarjeta}`,
        timestamp: getLocalISOString()
      };

      // ═══════════════════════════════════════════════════════════════
      // PASO 1: GUARDAR EN BASE DE DATOS (Backend primero)
      // ═══════════════════════════════════════════════════════════════
      // FLUJO CORREGIDO: Solo enviar a 'Pagos'. El backend (GAS) se
      // encarga de actualizar Gastos_Pendientes internamente via
      // actualizarGastoPendiente(). Esto evita el doble update que
      // causaba el error MISMATCH.
      // ═══════════════════════════════════════════════════════════════
      console.log('💾 [PaymentForm] Registrando pago en base de datos...');

      // Registrar el pago en la hoja de Pagos
      // (GAS automáticamente actualiza monto_pagado_total en Gastos_Pendientes)
      await sendToSheet(scriptUrl, pin, paymentPayload, 'Pagos');

      // Registrar el gasto en el historial
      await sendToSheet(scriptUrl, pin, gastoEntry, 'Gastos');

      // PASO 2: Esperar y verificar que el pago se guardó
      console.log('🔍 [PaymentForm] Verificando persistencia del pago...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const freshData = await fetchData(scriptUrl, pin);
      const savedRecord = freshData.pending?.find((p: any) => p.id === selectedExpense.id);

      if (savedRecord && !esSuscripcion) {
        const savedMontoPagado = Number(savedRecord.monto_pagado_total) || 0;
        const expectedMontoPagado = (selectedExpense.monto_pagado_total || 0) + montoPagado;
        const expectedClamped = Math.min(expectedMontoPagado, Number(selectedExpense.monto));

        if (Math.abs(savedMontoPagado - expectedClamped) > 0.5) {
          console.warn(`⚠️ [PaymentForm] Verificación: esperado=${expectedClamped.toFixed(2)}, guardado=${savedMontoPagado.toFixed(2)}`);
          // Reintentar verificación una vez más
          await new Promise(resolve => setTimeout(resolve, 2000));
          const retryData = await fetchData(scriptUrl, pin);
          const retryRecord = retryData.pending?.find((p: any) => p.id === selectedExpense.id);
          const retryMonto = Number(retryRecord?.monto_pagado_total) || 0;

          if (Math.abs(retryMonto - expectedClamped) > 0.5) {
            throw new Error(`El pago no se verificó correctamente. Esperado: ${expectedClamped.toFixed(2)}, Guardado: ${retryMonto.toFixed(2)}. Intenta sincronizar manualmente.`);
          }
          // Usar valores del retry para el estado local
          updatedExpense.monto_pagado_total = retryMonto;
          updatedExpense.cuotas_pagadas = Number(retryRecord?.cuotas_pagadas) || updatedExpense.cuotas_pagadas;
          updatedExpense.estado = (retryRecord?.estado as 'Pendiente' | 'Pagado') || updatedExpense.estado;
        } else {
          // Usar valores verificados del backend para el estado local
          updatedExpense.monto_pagado_total = savedMontoPagado;
          updatedExpense.cuotas_pagadas = Number(savedRecord.cuotas_pagadas) || updatedExpense.cuotas_pagadas;
          updatedExpense.estado = (savedRecord.estado as 'Pendiente' | 'Pagado') || updatedExpense.estado;
        }
        console.log(`✅ [PaymentForm] Pago verificado: monto_pagado_total = ${updatedExpense.monto_pagado_total}`);
      }

      // ═══════════════════════════════════════════════════════════════
      // PASO 3: BD confirmó éxito → Actualizar estado local
      // ═══════════════════════════════════════════════════════════════
      console.log('✅ [PaymentForm] Actualizando estado local...');

      // Ahora sí actualizamos el estado local con valores del backend
      onUpdateExpense(updatedExpense);

      // Agregar al historial local si la función está disponible
      if (onAddToHistory) {
        onAddToHistory({ ...gastoEntry, tipo: 'Gastos' } as Transaction);
      }

      // Limpiar formulario
      setSelectedExpenseId('');
      setCustomAmount('');

      // Notificar éxito
      if (esSuscripcion) {
        notify?.('Pago de suscripción registrado correctamente', 'success');
      } else {
        notify?.('Pago registrado y sincronizado correctamente', 'success');
      }

    } catch (error) {
      // ═══════════════════════════════════════════════════════════════
      // SI BD FALLA → NO actualizar nada local, mostrar error claro
      // ═══════════════════════════════════════════════════════════════
      console.error('❌ [PaymentForm] Error guardando pago:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      notify?.(`Error al guardar pago: ${errorMessage}. Por favor intenta de nuevo.`, 'error');

      // IMPORTANTE: No actualizamos estado local, el pago NO se registró
    } finally {
      setLoading(false);
    }
  };

  // Separar deudas y suscripciones activas
  const activeDebts = pendingExpenses.filter(e => {
    const saldo = calcularSaldoPendiente(e);
    return e.estado === 'Pendiente' && saldo > 0.01 && e.tipo !== 'suscripcion';
  });
  const activeSubs = pendingExpenses.filter(e => e.tipo === 'suscripcion' && e.estado === 'Pendiente');

  const inputClass = `w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-current transition-all`;
  const labelClass = `text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wide ml-1 mb-1 block`;

  return (
    <div className={`${theme.colors.bgCard} backdrop-blur-sm p-6 md:p-8 rounded-2xl border ${theme.colors.border} shadow-xl max-w-2xl mx-auto`}>
      <h2 className={`text-2xl font-bold mb-4 ${theme.colors.textPrimary} flex items-center gap-2`}>
        <Banknote size={28} />
        Pagar Tarjeta
      </h2>
      <p className={`${theme.colors.textMuted} mb-6 text-sm`}>Registra pagos para disminuir tu deuda en el sistema.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          {/* Toggle tabs */}
          <div className={`flex rounded-xl p-1 mb-4 ${theme.colors.bgSecondary}`}>
            <button
              type="button"
              onClick={() => { setPayMode('deudas'); setSelectedExpenseId(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                payMode === 'deudas'
                  ? `${theme.colors.bgCard} ${theme.colors.textPrimary} shadow-sm`
                  : `${theme.colors.textMuted} hover:${theme.colors.textPrimary}`
              }`}
            >
              Deudas ({activeDebts.length})
            </button>
            <button
              type="button"
              onClick={() => { setPayMode('suscripciones'); setSelectedExpenseId(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                payMode === 'suscripciones'
                  ? `${theme.colors.bgCard} text-purple-400 shadow-sm`
                  : `${theme.colors.textMuted} hover:${theme.colors.textPrimary}`
              }`}
            >
              Suscripciones ({activeSubs.length})
            </button>
          </div>

          {/* List based on selected mode */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {payMode === 'deudas' ? (
              activeDebts.length === 0 ? (
                <p className={`text-sm ${theme.colors.textMuted} text-center py-4`}>No hay deudas pendientes</p>
              ) : (
                activeDebts.map(e => {
                  const total = Number(e.monto);
                  const montoPagadoTotal = e.monto_pagado_total || 0;
                  const debt = total - montoPagadoTotal;
                  const progreso = ((total - debt) / total) * 100;
                  const isSelected = selectedExpenseId === e.id;
                  const cuotasPagadas = Math.floor(Number(e.cuotas_pagadas));

                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => setSelectedExpenseId(isSelected ? '' : e.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? `${theme.colors.primary} text-white border-transparent shadow-lg scale-[1.01]`
                          : `${theme.colors.bgSecondary} ${theme.colors.border} hover:border-indigo-500/50`
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className={isSelected ? 'text-white/80' : theme.colors.textMuted} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : theme.colors.textMuted}`}>{e.tarjeta}</span>
                        </div>
                        <span className={`font-mono font-bold text-sm ${isSelected ? 'text-white' : 'text-red-400'}`}>
                          {formatCurrency(debt)}
                        </span>
                      </div>
                      <p className={`font-semibold text-sm ${isSelected ? 'text-white' : theme.colors.textPrimary}`}>{e.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-gray-700'}`}>
                          <div className={`h-full rounded-full ${isSelected ? 'bg-white/70' : 'bg-indigo-500'}`} style={{ width: `${progreso}%` }} />
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-white/70' : theme.colors.textMuted}`}>
                          {cuotasPagadas}/{e.num_cuotas} cuotas
                        </span>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              activeSubs.length === 0 ? (
                <p className={`text-sm ${theme.colors.textMuted} text-center py-4`}>No hay suscripciones activas</p>
              ) : (
                activeSubs.map(e => {
                  const isSelected = selectedExpenseId === e.id;
                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => setSelectedExpenseId(isSelected ? '' : e.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? `bg-purple-600 text-white border-transparent shadow-lg scale-[1.01]`
                          : `${theme.colors.bgSecondary} ${theme.colors.border} hover:border-purple-500/50`
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/70' : 'bg-purple-500'}`} />
                          <p className={`font-semibold text-sm ${isSelected ? 'text-white' : theme.colors.textPrimary}`}>{e.descripcion}</p>
                        </div>
                        <span className={`font-mono font-bold text-sm ${isSelected ? 'text-white' : 'text-purple-400'}`}>
                          {formatCurrency(Number(e.monto))}/mes
                        </span>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>
        </div>

        {selectedExpense && (
          <div className={`p-5 rounded-xl border text-sm space-y-3 animate-in fade-in slide-in-from-top-2 ${theme.colors.bgSecondary} ${theme.colors.border}`}>
            {selectedExpense.tipo === 'suscripcion' ? (
              // Vista para SUSCRIPCIONES
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded font-bold">SUSCRIPCIÓN RECURRENTE</span>
                </div>
                <div className={`flex justify-between items-center border-b ${theme.colors.border} pb-2`}>
                  <span className={theme.colors.textMuted}>Costo Mensual:</span>
                  <span className={`font-bold ${theme.colors.textPrimary} text-lg`}>{formatCurrency(selectedExpense.monto)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={theme.colors.textMuted}>Próxima Fecha de Cargo:</span>
                  <span className={`font-bold ${theme.colors.textPrimary}`}>{formatDate(selectedExpense.fecha_pago)}</span>
                </div>
                <div className="mt-3 p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-purple-200 flex items-center gap-1">
                    <Lightbulb size={14} />
                    Al pagar, la fecha se actualizará automáticamente al próximo mes
                  </p>
                </div>
              </>
            ) : (
              // Vista para DEUDAS
              <>
                <div className={`flex justify-between items-center border-b ${theme.colors.border} pb-2`}>
                  <span className={theme.colors.textMuted}>Total Compra:</span>
                  <span className={`font-bold ${theme.colors.textPrimary} text-lg`}>{formatCurrency(selectedExpense.monto)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={theme.colors.textMuted}>Cuotas Pagadas:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-24 h-2 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
                      <div className="h-full bg-indigo-500" style={{ width: `${(selectedExpense.cuotas_pagadas / selectedExpense.num_cuotas) * 100}%` }}></div>
                    </div>
                    <span className={`font-bold ${theme.colors.textPrimary}`}>
                      {Math.floor(Number(selectedExpense.cuotas_pagadas))} / {selectedExpense.num_cuotas}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {selectedExpense?.tipo === 'suscripcion' ? (
          // Para SUSCRIPCIONES: solo monto fijo
          <div>
            <label className={labelClass}>Monto a Pagar (Fijo)</label>
            <div className="relative">
              <span className={`absolute left-4 top-3.5 ${theme.colors.textMuted}`}>S/</span>
              <input
                type="number"
                step="0.01"
                value={customAmount}
                readOnly
                className={`${inputClass} pl-10 font-mono text-lg font-bold text-purple-400`}
              />
            </div>
            <p className={`text-xs ${theme.colors.textMuted} mt-2`}>Las suscripciones se pagan siempre por el monto completo</p>
          </div>
        ) : (
          // Para DEUDAS: opciones flexibles
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Tipo de Pago</label>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputClass}>
                <option value="Cuota">Pago de 1 Cuota</option>
                <option value="Total">Liquidar Todo</option>
                <option value="Parcial">Pago Parcial (Manual)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Monto a Pagar</label>
              <div className="relative">
                <span className={`absolute left-4 top-3.5 ${theme.colors.textMuted}`}>S/</span>
                <input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className={`${inputClass} pl-10 font-mono text-lg font-bold text-emerald-400`}
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedExpense}
          className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
            ${loading || !selectedExpense ? `${theme.colors.bgSecondary} cursor-not-allowed ${theme.colors.textMuted}` : `${theme.colors.primary} hover:${theme.colors.primaryHover} text-white`}`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Procesando pago...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Confirmar Pago
            </>
          )}
        </button>
      </form>
    </div>
  );
};