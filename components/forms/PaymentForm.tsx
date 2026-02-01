import React, { useState, useEffect } from 'react';
import { PendingExpense, Transaction } from '../../types';
import { sendToSheet, updateInSheet } from '../../services/googleSheetService';
import { formatCurrency, getLocalISOString } from '../../utils/format';
import { Banknote, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
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

      let updatedExpense: PendingExpense;

      if (esSuscripcion) {
        // LÓGICA PARA SUSCRIPCIONES: Renovar al próximo mes
        const fechaActual = new Date(selectedExpense.fecha_pago);
        const proximaFecha = new Date(fechaActual);
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);

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

      const paymentPayload = {
        fecha_pago: new Date().toISOString().split('T')[0],
        id_gasto: selectedExpense.id,
        tarjeta: selectedExpense.tarjeta,
        descripcion_gasto: selectedExpense.descripcion,
        monto_pagado: montoPagado,
        tipo_pago: paymentType,
        num_cuota: paymentType === 'Cuota' ? (selectedExpense.cuotas_pagadas + 1) : '',
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
      console.log('💾 [PaymentForm] Guardando pago en base de datos...');

      // Actualizar el gasto pendiente en Google Sheets
      await updateInSheet(scriptUrl, pin, updatedExpense, 'Gastos_Pendientes');

      // Registrar el pago en la hoja de Pagos
      await sendToSheet(scriptUrl, pin, paymentPayload, 'Pagos');

      // Registrar el gasto en el historial
      await sendToSheet(scriptUrl, pin, gastoEntry, 'Gastos');

      // ═══════════════════════════════════════════════════════════════
      // PASO 2: SOLO SI BD CONFIRMÓ ÉXITO → Actualizar estado local
      // ═══════════════════════════════════════════════════════════════
      console.log('✅ [PaymentForm] BD confirmó éxito, actualizando estado local...');

      // Ahora sí actualizamos el estado local (React + localStorage)
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

  const activePending = pendingExpenses.filter(e => e.estado === 'Pendiente');

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
          <label className={labelClass}>Selecciona la Deuda</label>
          <select 
            value={selectedExpenseId} 
            onChange={(e) => setSelectedExpenseId(e.target.value)} 
            className={inputClass}
          >
            <option value="">-- Selecciona --</option>
            {activePending.map(e => {
                const total = Number(e.monto);
                const montoPagadoTotal = e.monto_pagado_total || 0;
                const debt = total - montoPagadoTotal;
                return (
                    <option key={e.id} value={e.id}>
                        {e.tarjeta} - {e.descripcion} (Debe: {formatCurrency(debt)})
                    </option>
                );
            })}
          </select>
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
                        <span className={`font-bold ${theme.colors.textPrimary}`}>{selectedExpense.fecha_pago}</span>
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
                            <div className={`w-24 h-2 ${theme.colors.bgTertiary} rounded-full overflow-hidden`}>
                                <div className="h-full bg-indigo-500" style={{ width: `${(selectedExpense.cuotas_pagadas / selectedExpense.num_cuotas) * 100}%`}}></div>
                            </div>
                            <span className={`font-bold ${theme.colors.textPrimary}`}>
                              {Number(selectedExpense.cuotas_pagadas) % 1 === 0 ? selectedExpense.cuotas_pagadas : selectedExpense.cuotas_pagadas.toFixed(2)} / {selectedExpense.num_cuotas}
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