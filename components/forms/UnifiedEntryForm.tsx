import React, { useState, useEffect } from 'react';
import { CreditCard, CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS, PendingExpense } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { generateId, formatCurrency } from '../../utils/format';
import { Wallet, TrendingUp, CreditCard as CreditIcon } from 'lucide-react';

interface UnifiedEntryFormProps {
  scriptUrl: string;
  cards: CreditCard[];
  onAddPending: (expense: PendingExpense) => void;
  onSuccess: () => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

type EntryType = 'gasto' | 'ingreso' | 'tarjeta';

export const UnifiedEntryForm: React.FC<UnifiedEntryFormProps> = ({ scriptUrl, cards, onAddPending, onSuccess, notify }) => {
  const [entryType, setEntryType] = useState<EntryType>('gasto');
  const [loading, setLoading] = useState(false);
  
  // Specific states for credit calculation
  const [useInstallments, setUseInstallments] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha: today,
    monto: '',
    categoria: '',
    descripcion: '',
    notas: '',
    // Credit specific
    tarjetaAlias: '',
    num_cuotas: '1',
    fecha_cierre: '',
    fecha_pago: ''
  });

  // Effect for Credit Card Dates calculation
  useEffect(() => {
    if (entryType === 'tarjeta' && formData.tarjetaAlias && cards.length > 0) {
      const card = cards.find(c => c.alias === formData.tarjetaAlias);
      if (card) {
        const hoy = new Date(formData.fecha);
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth();
        const dia = hoy.getDate();
        
        // Simple calculation logic
        const cierreDate = new Date(anio, dia <= card.dia_cierre ? mes : mes + 1, card.dia_cierre);
        
        let pagoDate;
        if (card.dia_pago > card.dia_cierre) {
             pagoDate = new Date(cierreDate.getFullYear(), cierreDate.getMonth(), card.dia_pago);
        } else {
             pagoDate = new Date(cierreDate.getFullYear(), cierreDate.getMonth() + 1, card.dia_pago);
        }

        setFormData(prev => ({
          ...prev,
          fecha_cierre: cierreDate.toISOString().split('T')[0],
          fecha_pago: pagoDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [entryType, formData.tarjetaAlias, cards, formData.fecha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) { notify?.("Configura la URL", 'error'); return; }
    setLoading(true);

    try {
      if (entryType === 'tarjeta') {
        const newExpense: PendingExpense = {
            id: generateId(),
            fecha_gasto: formData.fecha,
            tarjeta: formData.tarjetaAlias,
            categoria: formData.categoria,
            descripcion: formData.descripcion,
            monto: parseFloat(formData.monto),
            fecha_cierre: formData.fecha_cierre,
            fecha_pago: formData.fecha_pago,
            estado: 'Pendiente',
            num_cuotas: useInstallments ? parseInt(formData.num_cuotas) : 1,
            cuotas_pagadas: 0,
            notas: formData.notas,
            timestamp: new Date().toISOString()
        };
        onAddPending(newExpense);
        await sendToSheet(scriptUrl, newExpense, 'Gastos_Pendientes');
      } else {
        // Gasto (Cash) or Ingreso
        const payload = {
            fecha: formData.fecha,
            categoria: formData.categoria,
            descripcion: formData.descripcion,
            monto: formData.monto,
            notas: formData.notas,
            timestamp: new Date().toISOString()
        };
        await sendToSheet(scriptUrl, payload, entryType === 'gasto' ? 'Gastos' : 'Ingresos');
      }

      notify?.('Registrado exitosamente', 'success');
      // Reset critical fields
      setFormData(prev => ({ ...prev, monto: '', descripcion: '', notas: '' }));
      onSuccess();

    } catch (error) {
      notify?.("Error al guardar", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const categories = entryType === 'ingreso' ? CATEGORIAS_INGRESOS : CATEGORIAS_GASTOS;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Type Selector Tabs */}
      <div className="bg-slate-800/60 p-1 rounded-2xl flex relative overflow-hidden">
        <div 
            className="absolute top-1 bottom-1 bg-indigo-600 rounded-xl transition-all duration-300 ease-out shadow-lg"
            style={{ 
                left: entryType === 'gasto' ? '0.5%' : entryType === 'ingreso' ? '33.3%' : '66.6%',
                width: '32.8%' 
            }}
        />
        <button onClick={() => setEntryType('gasto')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${entryType === 'gasto' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            <Wallet size={16}/> Gasto
        </button>
        <button onClick={() => setEntryType('ingreso')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${entryType === 'ingreso' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            <TrendingUp size={16}/> Ingreso
        </button>
        <button onClick={() => setEntryType('tarjeta')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${entryType === 'tarjeta' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            <CreditIcon size={16}/> Tarjeta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Dynamic */}
        <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-white">
                {entryType === 'gasto' && "💸 Gasto en Efectivo"}
                {entryType === 'ingreso' && "💰 Registrar Ingreso"}
                {entryType === 'tarjeta' && "💳 Gasto con Tarjeta"}
            </h2>
        </div>

        {/* Date & Amount */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Fecha</label>
                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Monto</label>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">S/</span>
                    <input type="number" name="monto" step="0.01" value={formData.monto} onChange={handleChange} placeholder="0.00" required className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg focus:ring-2 focus:ring-indigo-500"/>
                </div>
            </div>
        </div>

        {/* Credit Card Specific Fields */}
        {entryType === 'tarjeta' && (
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 space-y-4">
                <div>
                    <label className="text-xs font-bold text-indigo-300 uppercase ml-1 mb-1 block">Seleccionar Tarjeta</label>
                    <select name="tarjetaAlias" value={formData.tarjetaAlias} onChange={handleChange} required className="w-full bg-slate-900/80 border border-indigo-500/30 rounded-xl px-4 py-3 text-white">
                        <option value="">-- Elige tarjeta --</option>
                        {cards.map(c => <option key={c.alias} value={c.alias}>{c.alias} ({c.banco})</option>)}
                    </select>
                </div>
                
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="installments" checked={useInstallments} onChange={e => setUseInstallments(e.target.checked)} className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"/>
                    <label htmlFor="installments" className="text-sm text-indigo-200 font-medium">Pagar en cuotas</label>
                </div>

                {useInstallments && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs text-indigo-300">Cuotas</label>
                             <select name="num_cuotas" value={formData.num_cuotas} onChange={handleChange} className="w-full bg-slate-900/80 border border-indigo-500/30 rounded-lg p-2 text-white">
                                {[2,3,6,12,18,24,36].map(n => <option key={n} value={n}>{n}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="text-xs text-indigo-300">Mensual aprox.</label>
                             <div className="w-full p-2 text-right font-mono text-white text-sm">
                                {formData.monto ? formatCurrency(parseFloat(formData.monto)/parseInt(formData.num_cuotas)) : '-'}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Category & Desc */}
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Categoría</label>
                <select name="categoria" value={formData.categoria} onChange={handleChange} required className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecciona...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Descripción</label>
                <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Ej: Compra supermercado" required className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"/>
            </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-95
            ${entryType === 'ingreso' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}
            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'}`}
        >
          {loading ? 'Guardando...' : 'Registrar Movimiento'}
        </button>

      </form>
    </div>
  );
};