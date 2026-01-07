import React, { useState, useEffect } from 'react';
import { CreditCard, CATEGORIAS_GASTOS, PendingExpense } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { generateId, formatCurrency } from '../../utils/format';

interface CreditExpenseFormProps {
  scriptUrl: string;
  cards: CreditCard[];
  onAddExpense: (expense: PendingExpense) => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

export const CreditExpenseForm: React.FC<CreditExpenseFormProps> = ({ scriptUrl, cards, onAddExpense, notify }) => {
  const [loading, setLoading] = useState(false);
  const [useInstallments, setUseInstallments] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha_gasto: today,
    monto: '',
    tarjetaAlias: '',
    categoria: '',
    descripcion: '',
    num_cuotas: '1',
    fecha_cierre: '',
    fecha_pago: '',
    notas: ''
  });

  useEffect(() => {
    if (formData.tarjetaAlias && cards.length > 0) {
      const card = cards.find(c => c.alias === formData.tarjetaAlias);
      if (card) {
        const hoy = new Date(formData.fecha_gasto); // Use selected date, not today
        const diaActual = hoy.getDate();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        
        const diaCierre = card.dia_cierre;
        const diaPago = card.dia_pago;
        
        let fechaCierreDate;
        // Basic Logic: If expense is before cutoff, it closes this month. Else next month.
        if (diaActual <= diaCierre) {
            fechaCierreDate = new Date(anioActual, mesActual, diaCierre);
        } else {
            fechaCierreDate = new Date(anioActual, mesActual + 1, diaCierre);
        }
        
        let fechaPagoDate;
        // Basic Logic: Payment is usually ~20 days after cutoff or fixed day next month
        if (diaPago > diaCierre) {
            fechaPagoDate = new Date(fechaCierreDate.getFullYear(), fechaCierreDate.getMonth(), diaPago);
        } else {
            fechaPagoDate = new Date(fechaCierreDate.getFullYear(), fechaCierreDate.getMonth() + 1, diaPago);
        }

        setFormData(prev => ({
          ...prev,
          fecha_cierre: fechaCierreDate.toISOString().split('T')[0],
          fecha_pago: fechaPagoDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.tarjetaAlias, cards, formData.fecha_gasto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      notify?.("Falta URL del script", 'error');
      return;
    }
    setLoading(true);

    try {
      const numCuotas = useInstallments ? parseInt(formData.num_cuotas) : 1;
      
      const newExpense: PendingExpense = {
        id: generateId(),
        fecha_gasto: formData.fecha_gasto,
        tarjeta: formData.tarjetaAlias,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        fecha_cierre: formData.fecha_cierre,
        fecha_pago: formData.fecha_pago,
        estado: 'Pendiente',
        num_cuotas: numCuotas,
        cuotas_pagadas: 0,
        notas: formData.notas,
        timestamp: new Date().toISOString()
      };
      
      onAddExpense(newExpense);
      await sendToSheet(scriptUrl, newExpense, 'Gastos_Pendientes');
      
      setFormData(prev => ({ 
        ...prev, monto: '', descripcion: '', notas: '', 
        tarjetaAlias: '', categoria: '' 
      }));
      setUseInstallments(false);
      notify?.('Gasto con tarjeta registrado', 'success');
    } catch (error) {
      notify?.("Error al guardar", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const montoCuota = formData.monto && formData.num_cuotas 
    ? (parseFloat(formData.monto) / parseInt(formData.num_cuotas)).toFixed(2) 
    : '0.00';

  const inputClass = "w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block";

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white">💳 Gasto con Tarjeta</h2>
      <p className="text-slate-400 mb-6 text-sm">El sistema calcula tu fecha de pago automáticamente.</p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Fecha Compra</label>
            <input type="date" name="fecha_gasto" value={formData.fecha_gasto} onChange={handleChange} required className={inputClass}/>
          </div>
          <div>
            <label className={labelClass}>Monto Total</label>
            <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">S/</span>
                <input type="number" name="monto" step="0.01" value={formData.monto} onChange={handleChange} required className={`${inputClass} pl-10 font-mono text-lg`}/>
            </div>
          </div>
        </div>

        <div>
            <label className={labelClass}>Seleccionar Tarjeta</label>
            <select name="tarjetaAlias" value={formData.tarjetaAlias} onChange={handleChange} required className={inputClass}>
                <option value="">-- Elige tarjeta --</option>
                {cards.map(c => <option key={c.alias} value={c.alias}>{c.alias} ({c.banco})</option>)}
            </select>
        </div>

        <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/30">
            <div className="flex items-center gap-3 mb-2">
                <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                    <input type="checkbox" id="cuotasCheck" checked={useInstallments} onChange={(e) => setUseInstallments(e.target.checked)} className="peer sr-only" />
                    <label htmlFor="cuotasCheck" className="block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer peer-checked:bg-indigo-600 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></label>
                </div>
                <label htmlFor="cuotasCheck" className="text-white font-medium cursor-pointer select-none">Pagar en Cuotas</label>
            </div>

            {useInstallments && (
                <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className={labelClass}>N° Cuotas</label>
                        <select name="num_cuotas" value={formData.num_cuotas} onChange={handleChange} className={inputClass}>
                            {[2,3,6,9,12,18,24,36,48].map(n => <option key={n} value={n}>{n} cuotas</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Monto / Mes</label>
                        <div className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-emerald-400 font-mono text-right">
                            {formatCurrency(parseFloat(montoCuota))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Categoría</label>
          <select name="categoria" value={formData.categoria} onChange={handleChange} required className={inputClass}>
            <option value="">Selecciona...</option>
            {CATEGORIAS_GASTOS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Descripción del gasto</label>
          <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required className={inputClass}/>
        </div>

        {formData.tarjetaAlias && (
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-lg text-center">
                    <p className="text-[10px] uppercase text-emerald-500 font-bold mb-1">Cierre Tarjeta</p>
                    <p className="text-emerald-300 font-mono font-bold">{formData.fecha_cierre || '-'}</p>
                </div>
                <div className="bg-amber-900/10 border border-amber-500/20 p-3 rounded-lg text-center">
                    <p className="text-[10px] uppercase text-amber-500 font-bold mb-1">Fecha Límite Pago</p>
                    <p className="text-amber-300 font-mono font-bold">{formData.fecha_pago || '-'}</p>
                </div>
            </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95
            ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'}`}
        >
          {loading ? 'Guardando...' : 'Registrar Gasto'}
        </button>
      </form>
    </div>
  );
};