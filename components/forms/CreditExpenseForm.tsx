import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, CATEGORIAS_GASTOS, PendingExpense, simularCompraEnCuotas } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { generateId, formatCurrency, getLocalISOString } from '../../utils/format';
import { CreditCard as CreditCardIcon, Info } from 'lucide-react';

interface CreditExpenseFormProps {
  scriptUrl: string;
  pin: string;
  cards: CreditCard[];
  onAddExpense: (expense: PendingExpense) => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

// ═══════════════════════════════════════════════════════════════
// MODELO DE ESTADO PARA CUOTAS
// ═══════════════════════════════════════════════════════════════
// pagaEnCuotas: boolean         → ¿El usuario quiere pagar en cuotas?
// tipoCuotas: 'SIN_INTERES' | 'CON_INTERES' → Solo controla la simulación visual
// numeroCuotas: string          → Número real de cuotas (2, 3, 6, 9, ...)
//
// REGLAS:
// - pagaEnCuotas=false → numeroCuotas=1, tipoCuotas irrelevante
// - tipoCuotas='SIN_INTERES' → mensual = monto / numeroCuotas (solo UI)
// - tipoCuotas='CON_INTERES' → simulación con TEA (solo UI)
// - El backend SOLO recibe: monto, num_cuotas, tarjeta. NUNCA recibe tipoCuotas ni TEA.
// ═══════════════════════════════════════════════════════════════
type TipoCuotas = 'SIN_INTERES' | 'CON_INTERES';

const OPCIONES_CUOTAS = [2, 3, 6, 9, 12, 18, 24, 36, 48];

export const CreditExpenseForm: React.FC<CreditExpenseFormProps> = ({ scriptUrl, pin, cards, onAddExpense, notify }) => {
  const [loading, setLoading] = useState(false);
  const [pagaEnCuotas, setPagaEnCuotas] = useState(false);
  const [tipoCuotas, setTipoCuotas] = useState<TipoCuotas>('SIN_INTERES');
  const [numeroCuotas, setNumeroCuotas] = useState('2');
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha_gasto: today,
    monto: '',
    tarjetaAlias: '',
    categoria: '',
    descripcion: '',
    fecha_cierre: '',
    fecha_pago: '',
    notas: ''
  });

  // ... (omitted code - useEffect for fecha_cierre/fecha_pago calculation stays as-is)

  // ═══════════════════════════════════════════════════════════════
  // SUBMIT: Solo envía monto, num_cuotas, tarjeta al backend.
  // NUNCA envía tipoCuotas ni TEA.
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      notify?.("Falta URL del script", 'error');
      return;
    }
    setLoading(true);

    try {
      // Si paga en cuotas, usar numeroCuotas. Si no, siempre 1.
      const numCuotasBackend = pagaEnCuotas ? parseInt(numeroCuotas) : 1;

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
        num_cuotas: numCuotasBackend,
        cuotas_pagadas: 0,
        monto_pagado_total: 0,
        notas: formData.notas,
        timestamp: getLocalISOString()
      };

      onAddExpense(newExpense);
      await sendToSheet(scriptUrl, pin, newExpense, 'Gastos_Pendientes');

      // Reset formulario
      setFormData(prev => ({
        ...prev, monto: '', descripcion: '', notas: '',
        tarjetaAlias: '', categoria: ''
      }));
      setPagaEnCuotas(false);
      setTipoCuotas('SIN_INTERES');
      setNumeroCuotas('2');
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

  // ═══════════════════════════════════════════════════════════════
  // CÁLCULOS DE UI (solo visualización, no se persisten)
  // ═══════════════════════════════════════════════════════════════

  // Cuota sin interés: monto / numeroCuotas (simple división)
  const montoCuotaSinInteres = useMemo(() => {
    const monto = parseFloat(formData.monto);
    const cuotas = parseInt(numeroCuotas);
    if (!monto || monto <= 0 || !cuotas || cuotas < 1) return 0;
    return Math.round((monto / cuotas) * 100) / 100;
  }, [formData.monto, numeroCuotas]);

  // TEA de la tarjeta seleccionada (para simulación)
  const selectedCardTea = useMemo(() => {
    if (!formData.tarjetaAlias) return null;
    const card = cards.find(c => c.alias === formData.tarjetaAlias);
    return card?.tea ?? null;
  }, [formData.tarjetaAlias, cards]);

  // Simulación con interés: solo cuando tipoCuotas='CON_INTERES' y la tarjeta tiene TEA
  const simulacion = useMemo(() => {
    if (!pagaEnCuotas || tipoCuotas !== 'CON_INTERES') return null;
    const monto = parseFloat(formData.monto);
    const cuotas = parseInt(numeroCuotas);
    return simularCompraEnCuotas(monto, cuotas, selectedCardTea);
  }, [formData.monto, numeroCuotas, selectedCardTea, pagaEnCuotas, tipoCuotas]);

  const inputClass = "w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block";

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
        <CreditCardIcon size={28} />
        Gasto con Tarjeta
      </h2>
      <p className="text-slate-400 mb-6 text-sm">El sistema calcula tu fecha de pago automáticamente.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Fecha Compra</label>
            <input type="date" name="fecha_gasto" value={formData.fecha_gasto} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Monto Total</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">S/</span>
              <input type="number" name="monto" step="0.01" value={formData.monto} onChange={handleChange} required className={`${inputClass} pl-10 font-mono text-lg`} />
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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN DE CUOTAS                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/30">
          {/* Toggle: ¿Pagar en cuotas? */}
          <div className="flex items-center gap-3 mb-2">
            <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
              <input
                type="checkbox"
                id="cuotasCheck"
                checked={pagaEnCuotas}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPagaEnCuotas(checked);
                  if (!checked) {
                    setTipoCuotas('SIN_INTERES');
                    setNumeroCuotas('2');
                  }
                }}
                className="peer sr-only"
              />
              <label htmlFor="cuotasCheck" className="block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer peer-checked:bg-indigo-600 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></label>
            </div>
            <label htmlFor="cuotasCheck" className="text-white font-medium cursor-pointer select-none">Pagar en Cuotas</label>
          </div>

          {pagaEnCuotas && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">

              {/* Tipo de cuotas: SIN_INTERES / CON_INTERES */}
              <div>
                <label className={labelClass}>Tipo de cuotas</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoCuotas('SIN_INTERES')}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                      tipoCuotas === 'SIN_INTERES'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-600 bg-slate-800/30 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    Sin interés
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCuotas('CON_INTERES')}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                      tipoCuotas === 'CON_INTERES'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-600 bg-slate-800/30 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    Con interés
                  </button>
                </div>
              </div>

              {/* Número de cuotas + Monto mensual aprox. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>N° Cuotas</label>
                  <select
                    value={numeroCuotas}
                    onChange={(e) => setNumeroCuotas(e.target.value)}
                    className={inputClass}
                  >
                    {OPCIONES_CUOTAS.map(n => <option key={n} value={n}>{n} cuotas</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Monto / Mes (aprox.)</label>
                  <div className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-emerald-400 font-mono text-right">
                    {formatCurrency(montoCuotaSinInteres)}
                  </div>
                </div>
              </div>

              {/* Simulación con interés: solo si tipoCuotas='CON_INTERES' */}
              {tipoCuotas === 'CON_INTERES' && (
                <>
                  {selectedCardTea && simulacion ? (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-900/10 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Info size={14} className="text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                          Simulación con interés (TEA {selectedCardTea}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Cuota/Mes</p>
                          <p className="text-sm font-mono font-bold text-amber-300">{formatCurrency(simulacion.cuotaMensual)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Total a pagar</p>
                          <p className="text-sm font-mono font-bold text-white">{formatCurrency(simulacion.totalAPagar)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Intereses</p>
                          <p className="text-sm font-mono font-bold text-rose-400">{formatCurrency(simulacion.interesesTotales)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">% Extra</p>
                          <p className="text-sm font-mono font-bold text-rose-400">+{simulacion.porcentajeExtraPagado.toFixed(2)}%</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Los valores mostrados son referenciales y dependen de la tasa aplicada por el banco.
                      </p>
                    </div>
                  ) : formData.tarjetaAlias && !selectedCardTea ? (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-900/10">
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <Info size={12} />
                        Esta tarjeta no tiene TEA configurada. Edítala para ver la simulación con interés.
                      </p>
                    </div>
                  ) : !formData.tarjetaAlias ? (
                    <div className="p-3 rounded-xl border border-slate-600/50 bg-slate-800/30">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Info size={12} />
                        Selecciona una tarjeta para ver la simulación.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
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
          <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} required className={inputClass} />
        </div>

        {formData.tarjetaAlias && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
