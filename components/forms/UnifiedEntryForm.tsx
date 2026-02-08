import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS, PendingExpense, simularCompraEnCuotas } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { generateId, formatCurrency, getLocalISOString } from '../../utils/format';
import { Wallet, TrendingUp, CreditCard as CreditIcon, Banknote, DollarSign, RefreshCw, Lightbulb, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTextColor } from '../../themes';
import { SubscriptionSelector } from './SubscriptionSelector';
import { SUBSCRIPTION_APPS, SubscriptionApp } from '../../subscriptionApps';
import { LoadingOverlay } from '../ui/LoadingOverlay';

interface UnifiedEntryFormProps {
  scriptUrl: string;
  pin: string;
  cards: CreditCard[];
  onAddPending: (expense: PendingExpense) => void;
  onSuccess: () => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

type EntryType = 'gasto' | 'ingreso' | 'tarjeta';

export const UnifiedEntryForm: React.FC<UnifiedEntryFormProps> = ({ scriptUrl, pin, cards, onAddPending, onSuccess, notify }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [entryType, setEntryType] = useState<EntryType>('gasto');
  const [loading, setLoading] = useState(false);

  // Specific states for credit calculation
  const [useInstallments, setUseInstallments] = useState(false);
  const [expenseType, setExpenseType] = useState<'deuda' | 'suscripcion'>('deuda');
  const [selectedSubscriptionApp, setSelectedSubscriptionApp] = useState<string>('');
  const [customSubscriptionName, setCustomSubscriptionName] = useState<string>('');

  // Tipo de cuotas: SIN_INTERES o CON_INTERES (solo visual, no se persiste)
  type TipoCuotas = 'SIN_INTERES' | 'CON_INTERES';
  const [tipoCuotas, setTipoCuotas] = useState<TipoCuotas>('SIN_INTERES');

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha: today,
    monto: '',
    categoria: '',
    descripcion: '',
    notas: '',
    // Credit specific
    tarjetaId: '', // Unique identifier: "alias-banco"
    num_cuotas: '2',
    fecha_cierre: '',
    fecha_pago: ''
  });

  // Effect for Credit Card Dates calculation
  useEffect(() => {
    if (entryType === 'tarjeta' && formData.tarjetaId && cards.length > 0) {
      const card = cards.find(c => `${c.alias}-${c.banco}` === formData.tarjetaId);
      if (card) {
        const hoy = new Date(formData.fecha);
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth();
        const dia_gasto = hoy.getDate();

        // Simple calculation logic
        const cierreDate = new Date(anio, dia_gasto <= card.dia_cierre ? mes : mes + 1, card.dia_cierre);

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
  }, [entryType, formData.tarjetaId, cards, formData.fecha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) { notify?.("Configura la URL", 'error'); return; }

    // Validar monto
    const montoValue = parseFloat(formData.monto);
    if (isNaN(montoValue) || montoValue <= 0) {
      notify?.('El monto debe ser mayor a cero', 'error');
      return;
    }

    setLoading(true);

    try {
      if (entryType === 'tarjeta') {
        // Extract alias from tarjetaId (format: "alias-banco")
        const selectedCard = cards.find(c => `${c.alias}-${c.banco}` === formData.tarjetaId);
        const tarjetaAlias = selectedCard?.alias || '';

        const newExpense: PendingExpense = {
          id: generateId(),
          fecha_gasto: formData.fecha,
          tarjeta: tarjetaAlias,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          fecha_cierre: formData.fecha_cierre,
          fecha_pago: formData.fecha_pago,
          estado: 'Pendiente',
          num_cuotas: expenseType === 'suscripcion' ? 1 : (useInstallments ? parseInt(formData.num_cuotas) : 1),
          cuotas_pagadas: 0,
          monto_pagado_total: 0,
          tipo: expenseType, // For local state
          notas: formData.notas,
          timestamp: getLocalISOString()
        };
        onAddPending(newExpense);
        // Send with tipo_gasto for Google Apps Script compatibility
        const sheetData = { ...newExpense, tipo_gasto: expenseType };
        await sendToSheet(scriptUrl, pin, sheetData, 'Gastos_Pendientes');
      } else {
        // Gasto (Cash) or Ingreso
        const payload = {
          fecha: formData.fecha,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: formData.monto,
          notas: formData.notas,
          timestamp: getLocalISOString()
        };
        await sendToSheet(scriptUrl, pin, payload, entryType === 'gasto' ? 'Gastos' : 'Ingresos');
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

  // Get loading message based on entry type
  const getLoadingMessage = () => {
    if (entryType === 'gasto') return 'Registrando gasto...';
    if (entryType === 'ingreso') return 'Registrando ingreso...';
    return 'Registrando cargo a tarjeta...';
  };

  const getLoadingSubmessage = () => {
    if (entryType === 'tarjeta') {
      if (expenseType === 'suscripcion') {
        return 'Configurando suscripción recurrente';
      }
      return 'Guardando en gastos pendientes';
    }
    return 'Enviando información a Google Sheets';
  };

  return (
    <>
      <LoadingOverlay
        isVisible={loading}
        message={getLoadingMessage()}
        submessage={getLoadingSubmessage()}
      />
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Type Selector Tabs */}
        <div className={`${theme.colors.bgCard} p-1 rounded-2xl flex relative overflow-hidden border ${theme.colors.border}`}>
          <div
            className={`absolute top-1 bottom-1 ${theme.colors.primary} rounded-xl transition-all duration-300 ease-out shadow-lg`}
            style={{
              left: entryType === 'gasto' ? '0.5%' : entryType === 'ingreso' ? '33.3%' : '66.6%',
              width: '32.8%'
            }}
          />
          <button onClick={() => setEntryType('gasto')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${entryType === 'gasto' ? '${theme.colors.textPrimary}' : `${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}`}>
            <Wallet size={16} /> Gasto
          </button>
          <button onClick={() => setEntryType('ingreso')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${entryType === 'ingreso' ? '${theme.colors.textPrimary}' : `${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}`}>
            <TrendingUp size={16} /> Ingreso
          </button>
          <button onClick={() => setEntryType('tarjeta')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${entryType === 'tarjeta' ? '${theme.colors.textPrimary}' : `${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}`}>
            <CreditIcon size={16} /> Tarjeta
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`${theme.colors.bgCard} backdrop-blur-md p-6 md:p-8 rounded-3xl border ${theme.colors.border} shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4`}>

          {/* Header Dynamic */}
          <div className="text-center mb-2">
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center justify-center gap-2`}>
              {entryType === 'gasto' && (
                <>
                  <Banknote size={28} />
                  Gasto en Efectivo
                </>
              )}
              {entryType === 'ingreso' && (
                <>
                  <DollarSign size={28} />
                  Registrar Ingreso
                </>
              )}
              {entryType === 'tarjeta' && (
                <>
                  <CreditIcon size={28} />
                  Gasto con Tarjeta
                </>
              )}
            </h2>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase ml-1`}>Fecha</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-current`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold ${theme.colors.textMuted} uppercase ml-1">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 ${theme.colors.textMuted}">S/</span>
                <input type="number" name="monto" step="0.01" value={formData.monto} onChange={handleChange} placeholder="0.00" required className="w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl pl-10 pr-4 py-3 ${theme.colors.textPrimary} font-mono text-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Credit Card Specific Fields */}
          {entryType === 'tarjeta' && (
            <div className="${theme.colors.primaryLight} border border-indigo-500/20 rounded-xl p-4 space-y-4">
              {/* Tipo de Gasto: Deuda o Suscripción */}
              <div>
                <label className="text-xs font-bold ${textColors.primary} uppercase ml-1 mb-2 block">Tipo de Gasto</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setExpenseType('deuda'); setUseInstallments(false); }}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 ${expenseType === 'deuda'
                      ? 'bg-teal-500 border-teal-500 text-white shadow-lg'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                  >
                    <CreditIcon size={16} className="inline-block mr-1" />
                    Deuda/Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => { setExpenseType('suscripcion'); setUseInstallments(false); }}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 ${expenseType === 'suscripcion'
                      ? 'bg-purple-500 border-purple-500 text-white shadow-lg'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                  >
                    <RefreshCw size={16} className="inline-block mr-1" />
                    Suscripción
                  </button>
                </div>
                {expenseType === 'suscripcion' && (
                  <p className="text-xs text-purple-300 mt-2 ml-1 flex items-center gap-1">
                    <Lightbulb size={14} />
                    Las suscripciones se renuevan automáticamente cada mes
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold ${textColors.primary} uppercase ml-1 mb-1 block">Seleccionar Tarjeta</label>
                <select name="tarjetaId" value={formData.tarjetaId} onChange={handleChange} required className="w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary}">
                  <option value="">-- Elige tarjeta --</option>
                  {cards.map(c => <option key={`${c.alias}-${c.banco}`} value={`${c.alias}-${c.banco}`}>{c.alias} ({c.banco})</option>)}
                </select>
              </div>

              {expenseType === 'deuda' && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="installments" checked={useInstallments} onChange={e => { setUseInstallments(e.target.checked); if (!e.target.checked) setTipoCuotas('SIN_INTERES'); }} className="w-5 h-5 rounded bg-slate-800 ${theme.colors.border} text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="installments" className="text-sm text-indigo-200 font-medium">Pagar en cuotas</label>
                </div>
              )}

              {useInstallments && (
                <div className="space-y-4 mt-3">
                  {/* Tipo de cuotas: SIN_INTERES / CON_INTERES */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1 mb-2 block">Tipo de cuotas</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTipoCuotas('SIN_INTERES')}
                        className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 ${tipoCuotas === 'SIN_INTERES'
                          ? 'bg-teal-500 border-teal-500 text-white shadow-lg'
                          : 'border-slate-300 text-slate-500 hover:border-slate-400'
                          }`}
                      >
                        Sin interés
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoCuotas('CON_INTERES')}
                        className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 ${tipoCuotas === 'CON_INTERES'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg'
                          : 'border-slate-300 text-slate-500 hover:border-slate-400'
                          }`}
                      >
                        Con interés
                      </button>
                    </div>
                  </div>

                  {/* Número de cuotas + Monto mensual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold ml-1">Cuotas</label>
                      <select name="num_cuotas" value={formData.num_cuotas} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                        {[2, 3, 6, 9, 12, 18, 24, 36, 48].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold ml-1">Mensual aprox.</label>
                      <div className="w-full px-4 py-3 text-right font-mono text-teal-600 font-bold text-lg bg-teal-50 border border-teal-200 rounded-xl">
                        {formData.monto ? formatCurrency(parseFloat(formData.monto) / parseInt(formData.num_cuotas)) : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Simulación con interés (solo si tipoCuotas='CON_INTERES') */}
                  {tipoCuotas === 'CON_INTERES' && (() => {
                    const selectedCard = cards.find(c => `${c.alias}-${c.banco}` === formData.tarjetaId);
                    const cardTea = selectedCard?.tea ?? null;
                    const monto = parseFloat(formData.monto) || 0;
                    const cuotas = parseInt(formData.num_cuotas) || 1;
                    const simulacion = simularCompraEnCuotas(monto, cuotas, cardTea);

                    if (cardTea && simulacion) {
                      return (
                        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Info size={14} className="text-amber-600" />
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                              Simulación con interés (TEA {cardTea}%)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Cuota/Mes</p>
                              <p className="text-sm font-mono font-bold text-amber-600">{formatCurrency(simulacion.cuotaMensual)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Total a pagar</p>
                              <p className="text-sm font-mono font-bold text-slate-700">{formatCurrency(simulacion.totalAPagar)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Intereses</p>
                              <p className="text-sm font-mono font-bold text-rose-600">{formatCurrency(simulacion.interesesTotales)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">% Extra</p>
                              <p className="text-sm font-mono font-bold text-rose-600">+{simulacion.porcentajeExtraPagado.toFixed(2)}%</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Los valores son referenciales. Dependen de la tasa aplicada por el banco.
                          </p>
                        </div>
                      );
                    } else if (formData.tarjetaId && !cardTea) {
                      return (
                        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50">
                          <p className="text-xs text-amber-700 flex items-center gap-1">
                            <Info size={12} />
                            Esta tarjeta no tiene TEA configurada. Edítala en Ajustes para ver la simulación.
                          </p>
                        </div>
                      );
                    } else if (!formData.tarjetaId) {
                      return (
                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Info size={12} />
                            Selecciona una tarjeta para ver la simulación.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Category & Desc */}
          <div className="space-y-4">
            {/* Subscription Selector (only for subscription type) */}
            {entryType === 'tarjeta' && expenseType === 'suscripcion' && (
              <div className="space-y-1">
                <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase ml-1`}>Selecciona la Suscripción</label>
                <SubscriptionSelector
                  value={selectedSubscriptionApp}
                  onChange={(app) => {
                    if (app) {
                      setSelectedSubscriptionApp(app.id);
                      if (app.id !== 'other') {
                        setFormData(prev => ({ ...prev, descripcion: app.name, categoria: '📱 Tecnología' }));
                      }
                    } else {
                      setSelectedSubscriptionApp('');
                    }
                  }}
                  onCustomNameChange={(name) => {
                    setCustomSubscriptionName(name);
                    setFormData(prev => ({ ...prev, descripcion: name }));
                  }}
                  customName={customSubscriptionName}
                />
              </div>
            )}

            {/* Category - always visible */}
            <div className="space-y-1">
              <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase ml-1`}>Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} required className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-indigo-500`}>
                <option value="">Selecciona...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Description - hide for subscriptions with selected app */}
            {!(entryType === 'tarjeta' && expenseType === 'suscripcion' && selectedSubscriptionApp && selectedSubscriptionApp !== 'other') && (
              <div className="space-y-1">
                <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase ml-1`}>Descripción</label>
                <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Ej: Compra supermercado" required className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-indigo-500`} />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg ${theme.colors.textPrimary} shadow-lg transition-all transform active:scale-95
            ${entryType === 'ingreso' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : '${theme.colors.gradientPrimary}'}
            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'}`}
          >
            {loading ? 'Guardando...' : 'Registrar Movimiento'}
          </button>

        </form>
      </div>
    </>
  );
};