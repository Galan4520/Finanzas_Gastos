import React, { useState, useEffect } from 'react';
import { PendingExpense } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { formatCurrency } from '../../utils/format';

interface PaymentFormProps {
  scriptUrl: string;
  pin: string;
  pendingExpenses: PendingExpense[];
  onUpdateExpense: (expense: PendingExpense) => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ scriptUrl, pin, pendingExpenses, onUpdateExpense, notify }) => {
  const [loading, setLoading] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [paymentType, setPaymentType] = useState('Cuota');
  const [customAmount, setCustomAmount] = useState('');
  
  const selectedExpense = pendingExpenses.find(e => e.id === selectedExpenseId);
  
  // Auto-fill amount based on type
  useEffect(() => {
    if (selectedExpense) {
      const total = Number(selectedExpense.monto);
      const cuotas = Number(selectedExpense.num_cuotas);
      const cuotaAmount = total / cuotas;
      
      if (paymentType === 'Cuota') setCustomAmount(cuotaAmount.toFixed(2));
      if (paymentType === 'Total') {
          const paid = (cuotaAmount * selectedExpense.cuotas_pagadas);
          setCustomAmount((total - paid).toFixed(2));
      }
      if (paymentType === 'Parcial') setCustomAmount('');
    }
  }, [paymentType, selectedExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl || !selectedExpense) return;
    setLoading(true);

    try {
      const montoPagado = parseFloat(customAmount);
      const montoTotal = Number(selectedExpense.monto);
      const numCuotas = Number(selectedExpense.num_cuotas);
      const montoCuota = montoTotal / numCuotas;
      
      let newCuotasPagadas = selectedExpense.cuotas_pagadas;
      let newEstado: 'Pendiente' | 'Pagado' = 'Pendiente';

      if (paymentType === 'Cuota') newCuotasPagadas += 1;
      else if (paymentType === 'Total') {
        newCuotasPagadas = numCuotas;
        newEstado = 'Pagado';
      }
      else if (paymentType === 'Parcial') {
         newCuotasPagadas += Math.floor(montoPagado / montoCuota);
      }

      if (newCuotasPagadas >= numCuotas) newEstado = 'Pagado';

      const updatedExpense: PendingExpense = {
        ...selectedExpense,
        cuotas_pagadas: newCuotasPagadas,
        estado: newEstado
      };

      const paymentPayload = {
        fecha_pago: new Date().toISOString().split('T')[0],
        id_gasto: selectedExpense.id,
        tarjeta: selectedExpense.tarjeta,
        descripcion_gasto: selectedExpense.descripcion,
        monto_pagado: montoPagado,
        tipo_pago: paymentType,
        num_cuota: paymentType === 'Cuota' ? (selectedExpense.cuotas_pagadas + 1) : '',
        timestamp: new Date().toISOString()
      };

      onUpdateExpense(updatedExpense);
      await sendToSheet(scriptUrl, pin, paymentPayload, 'Pagos');
      
      setSelectedExpenseId('');
      setCustomAmount('');
      notify?.('Pago registrado correctamente', 'success');

    } catch (error) {
      notify?.("Error al procesar pago", 'error');
    } finally {
      setLoading(false);
    }
  };

  const activePending = pendingExpenses.filter(e => e.estado === 'Pendiente');

  const inputClass = "w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block";

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">💸 Pagar Tarjeta</h2>
      <p className="text-slate-400 mb-6 text-sm">Registra pagos para disminuir tu deuda en el sistema.</p>

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
                const cuotaVal = total / Number(e.num_cuotas);
                const paid = cuotaVal * e.cuotas_pagadas;
                const debt = total - paid;
                return (
                    <option key={e.id} value={e.id}>
                        {e.tarjeta} - {e.descripcion} (Debe: {formatCurrency(debt)})
                    </option>
                );
            })}
          </select>
        </div>

        {selectedExpense && (
            <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-500/30 text-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2">
                    <span className="text-slate-400">Total Compra:</span>
                    <span className="font-bold text-slate-200 text-lg">{formatCurrency(selectedExpense.monto)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cuotas Pagadas:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(selectedExpense.cuotas_pagadas / selectedExpense.num_cuotas) * 100}%`}}></div>
                        </div>
                        <span className="font-bold text-slate-200">{selectedExpense.cuotas_pagadas} / {selectedExpense.num_cuotas}</span>
                    </div>
                </div>
            </div>
        )}

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
                    <span className="absolute left-4 top-3.5 text-slate-400">S/</span>
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

        <button 
          type="submit" 
          disabled={loading || !selectedExpense}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95
            ${loading || !selectedExpense ? 'bg-slate-700 cursor-not-allowed text-slate-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'}`}
        >
          {loading ? 'Procesando...' : '✅ Confirmar Pago'}
        </button>
      </form>
    </div>
  );
};