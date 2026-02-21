import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS, PendingExpense, Goal, Transaction, simularCompraEnCuotas, getCardType } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { generateId, formatCurrency, getLocalISOString } from '../../utils/format';
import { Wallet, TrendingUp, CreditCard as CreditIcon, Banknote, DollarSign, RefreshCw, Lightbulb, Info } from 'lucide-react';
import { CategoryPicker } from '../ui/CategoryPicker';
import { useTheme } from '../../contexts/ThemeContext';
import { getTextColor } from '../../themes';
import { SubscriptionSelector } from './SubscriptionSelector';
import { SUBSCRIPTION_APPS, SubscriptionApp } from '../../subscriptionApps';
import { LoadingOverlay } from '../ui/LoadingOverlay';

interface UnifiedEntryFormProps {
  scriptUrl: string;
  pin: string;
  cards: CreditCard[];
  goals?: Goal[];
  history?: Transaction[];
  pendingExpenses?: PendingExpense[];
  onAddPending: (expense: PendingExpense) => void;
  onSuccess: () => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
  onRomperMeta?: (metaId: string, monto: number, cuenta?: string) => void;
  customGastosCategories?: string[];
  customIngresosCategories?: string[];
  onAddCustomCategory?: (cat: string, tipo: 'gasto' | 'ingreso') => void;
  onRemoveCustomCategory?: (cat: string, tipo: 'gasto' | 'ingreso') => void;
}

type EntryType = 'gasto' | 'ingreso' | 'tarjeta';

export const UnifiedEntryForm: React.FC<UnifiedEntryFormProps> = ({
  scriptUrl, pin, cards, goals = [], history = [], pendingExpenses = [],
  onAddPending, onSuccess, notify, onRomperMeta,
  customGastosCategories = [], customIngresosCategories = [],
  onAddCustomCategory, onRemoveCustomCategory,
}) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [entryType, setEntryType] = useState<EntryType>('gasto');
  const [loading, setLoading] = useState(false);
  const [selectedMetaId, setSelectedMetaId] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState('Billetera');

  // Specific states for credit calculation
  const [useInstallments, setUseInstallments] = useState(false);
  const [expenseType, setExpenseType] = useState<'deuda' | 'suscripcion'>('deuda');
  const [selectedSubscriptionApp, setSelectedSubscriptionApp] = useState<string>('');
  const [customSubscriptionName, setCustomSubscriptionName] = useState<string>('');

  // Tipo de cuotas: SIN_INTERES o CON_INTERES (solo visual, no se persiste)
  type TipoCuotas = 'SIN_INTERES' | 'CON_INTERES';
  const [tipoCuotas, setTipoCuotas] = useState<TipoCuotas>('SIN_INTERES');

  // Romper chanchito inline
  const [breakMetaId, setBreakMetaId] = useState('');
  const [breakAmount, setBreakAmount] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Separar tarjetas por tipo
  const creditCards = useMemo(() => cards.filter(c => getCardType(c) === 'credito'), [cards]);
  const debitCards = useMemo(() => cards.filter(c => getCardType(c) === 'debito'), [cards]);

  // Calcular saldo disponible por cuenta (incluye fondos comprometidos en metas)
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    // Tipos que suman al saldo (ingresos reales + ruptura de metas)
    const INGRESO_TYPES: string[] = ['Ingresos', 'Ruptura_Meta'];
    // Tipos que restan del saldo (gastos reales + aportes a metas)
    const GASTO_TYPES: string[] = ['Gastos', 'Aporte_Meta'];

    // Billetera: ingresos - gastos taggeados como "Billetera"
    const billeteraIngresos = history
      .filter(t => INGRESO_TYPES.includes(t.tipo) && t.cuenta === 'Billetera')
      .reduce((sum, t) => sum + Number(t.monto), 0);
    const billeteraGastos = history
      .filter(t => GASTO_TYPES.includes(t.tipo) && t.cuenta === 'Billetera')
      .reduce((sum, t) => sum + Number(t.monto), 0);
    balances['Billetera'] = billeteraIngresos - billeteraGastos;

    // Tarjetas débito: saldo inicial (card.limite) + ingresos - gastos del historial
    debitCards.forEach(card => {
      const ingresos = history
        .filter(t => INGRESO_TYPES.includes(t.tipo) && t.cuenta === card.alias)
        .reduce((sum, t) => sum + Number(t.monto), 0);
      const gastos = history
        .filter(t => GASTO_TYPES.includes(t.tipo) && t.cuenta === card.alias)
        .reduce((sum, t) => sum + Number(t.monto), 0);
      // card.limite actúa como "saldo inicial" para débito — punto de partida
      balances[card.alias] = Number(card.limite || 0) + ingresos - gastos;
    });

    return balances;
  }, [history, debitCards]);

  const goalsWithFunds = useMemo(() =>
    goals.filter(g => g.estado === 'activa' && g.monto_ahorrado > 0),
    [goals]
  );

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
    if (entryType === 'tarjeta' && formData.tarjetaId && creditCards.length > 0) {
      const card = creditCards.find(c => `${c.alias}-${c.banco}` === formData.tarjetaId);
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
  }, [entryType, formData.tarjetaId, creditCards, formData.fecha]);

  // Derived: romper chanchito inline
  const montoTyped = parseFloat(formData.monto || '0');
  const saldoActual = accountBalances[selectedCuenta] ?? 0;
  const deficit = Math.max(0, montoTyped - saldoActual);
  const showBreakOption = entryType === 'gasto' && montoTyped > 0 && montoTyped > saldoActual && goalsWithFunds.length > 0;

  // Auto-select first goal when panel opens
  useEffect(() => {
    if (showBreakOption && goalsWithFunds.length > 0) {
      if (!breakMetaId || !goalsWithFunds.find(g => g.id === breakMetaId)) {
        setBreakMetaId(goalsWithFunds[0].id);
      }
    }
  }, [showBreakOption, goalsWithFunds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-compute suggested amount (deficit capped at goal's available funds)
  useEffect(() => {
    if (!showBreakOption || !breakMetaId) return;
    const goal = goalsWithFunds.find(g => g.id === breakMetaId);
    if (!goal) return;
    const suggested = Math.min(deficit, goal.monto_ahorrado);
    setBreakAmount(suggested > 0 ? String(Math.round(suggested * 100) / 100) : '');
  }, [showBreakOption, deficit, breakMetaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBreakFromForm = () => {
    const amount = parseFloat(breakAmount);
    if (!amount || amount <= 0) return;
    const targetGoal = goalsWithFunds.find(g => g.id === breakMetaId) || goalsWithFunds[0];
    if (!targetGoal) return;
    if (amount > targetGoal.monto_ahorrado) {
      notify?.(`Máximo disponible en "${targetGoal.nombre}": ${formatCurrency(targetGoal.monto_ahorrado)}`, 'error');
      return;
    }
    onRomperMeta?.(targetGoal.id, amount, selectedCuenta);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) { notify?.("Configura la URL", 'error'); return; }

    // Validar monto
    const montoValue = parseFloat(formData.monto);
    if (isNaN(montoValue) || montoValue <= 0) {
      notify?.('El monto debe ser mayor a cero', 'error');
      return;
    }

    // Validar saldo disponible para gastos en efectivo
    if (entryType === 'gasto') {
      const saldoDisponible = accountBalances[selectedCuenta] ?? 0;
      if (montoValue > saldoDisponible) {
        const comprometido = history
          .filter(t => t.tipo === 'Aporte_Meta' && t.cuenta === selectedCuenta)
          .reduce((s, t) => s + Number(t.monto), 0)
          - history
          .filter(t => t.tipo === 'Ruptura_Meta' && t.cuenta === selectedCuenta)
          .reduce((s, t) => s + Number(t.monto), 0);
        const hint = comprometido > 0
          ? ` · ${formatCurrency(comprometido)} en metas`
          : '';
        const nombre = selectedCuenta === 'Billetera' ? 'Billetera Física' : selectedCuenta;
        notify?.(`Saldo insuficiente en ${nombre}. Disponible: ${formatCurrency(saldoDisponible)}${hint}`, 'error');
        return;
      }
    }

    setLoading(true);

    try {
      if (entryType === 'tarjeta') {
        // Extract alias from tarjetaId (format: "alias-banco")
        const selectedCard = creditCards.find(c => `${c.alias}-${c.banco}` === formData.tarjetaId);
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
        const payload: Record<string, any> = {
          fecha: formData.fecha,
          categoria: formData.categoria,
          descripcion: formData.descripcion,
          monto: formData.monto,
          notas: formData.notas,
          timestamp: getLocalISOString()
        };
        // Include cuenta (account/card) if selected
        if (selectedCuenta) {
          payload.cuenta = selectedCuenta;
        }
        // If it's an income assigned to a goal, include meta_id
        if (entryType === 'ingreso' && selectedMetaId) {
          payload.meta_id = selectedMetaId;
        }
        await sendToSheet(scriptUrl, pin, payload, entryType === 'gasto' ? 'Gastos' : 'Ingresos');
      }

      notify?.('Registrado exitosamente', 'success');
      // Reset critical fields
      setFormData(prev => ({ ...prev, monto: '', descripcion: '', notas: '' }));
      setSelectedMetaId('');
      setSelectedCuenta('Billetera');
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
                  {creditCards.map(c => <option key={`${c.alias}-${c.banco}`} value={`${c.alias}-${c.banco}`}>{c.alias} ({c.banco})</option>)}
                  {creditCards.length === 0 && <option disabled value="">Sin tarjetas de crédito registradas</option>}
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
                    const selectedCard = creditCards.find(c => `${c.alias}-${c.banco}` === formData.tarjetaId);
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

          {/* Account/Card selector for Gasto and Ingreso — OBLIGATORIO */}
          {(entryType === 'gasto' || entryType === 'ingreso') && (
            <div className="space-y-1">
              <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase ml-1`}>
                {entryType === 'ingreso' ? 'Cuenta que recibe *' : 'Cuenta de origen *'}
              </label>
              <select
                value={selectedCuenta}
                onChange={e => setSelectedCuenta(e.target.value)}
                required
                className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="Billetera">
                  💵 Billetera Física — {formatCurrency(accountBalances['Billetera'] ?? 0)} disponible
                </option>
                {debitCards.map(c => (
                  <option key={`${c.alias}-${c.banco}`} value={c.alias}>
                    💳 {c.alias} — {c.banco} — {formatCurrency(accountBalances[c.alias] ?? 0)} disponible
                  </option>
                ))}
              </select>
              {selectedCuenta && (
                <p className={`text-xs ${theme.colors.textMuted} ml-1 mt-1 flex items-center gap-2`}>
                  <span>
                    Disponible: <strong>{formatCurrency(accountBalances[selectedCuenta] ?? 0)}</strong>
                  </span>
                  {entryType === 'gasto' && (accountBalances[selectedCuenta] ?? 0) < parseFloat(formData.monto || '0') && parseFloat(formData.monto || '0') > 0 && (
                    <span className="text-red-400">⚠ Saldo insuficiente</span>
                  )}
                </p>
              )}
              {debitCards.length === 0 && (
                <p className={`text-xs text-amber-400 ml-1 mt-1`}>
                  💡 Solo tienes Billetera disponible. Agrega tarjetas de débito en Configuración para más opciones.
                </p>
              )}
            </div>
          )}

          {/* Romper Chanchito — panel inline cuando saldo es insuficiente */}
          {showBreakOption && (
            <div className={`p-4 rounded-xl border border-amber-400/40 bg-amber-500/5 space-y-3`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐷</span>
                <div>
                  <p className="text-sm font-bold text-amber-400">¿Romper chanchito?</p>
                  <p className={`text-xs ${theme.colors.textMuted}`}>
                    Te faltan <strong className="text-amber-400">{formatCurrency(deficit)}</strong> · Libera fondos de una meta
                  </p>
                </div>
              </div>

              {/* Selector de meta */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase`}>¿De qué meta?</label>
                <select
                  value={breakMetaId}
                  onChange={e => setBreakMetaId(e.target.value)}
                  className={`w-full ${theme.colors.bgSecondary} border border-amber-400/30 rounded-xl px-4 py-2.5 ${theme.colors.textPrimary} text-sm`}
                >
                  {goalsWithFunds.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nombre} — {formatCurrency(g.monto_ahorrado)} disponibles
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto + botón */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className={`absolute left-3 top-2.5 text-sm ${theme.colors.textMuted}`}>S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={goalsWithFunds.find(g => g.id === breakMetaId)?.monto_ahorrado}
                    value={breakAmount}
                    onChange={e => setBreakAmount(e.target.value)}
                    className={`w-full ${theme.colors.bgSecondary} border border-amber-400/30 rounded-xl pl-9 pr-4 py-2.5 ${theme.colors.textPrimary} font-mono text-sm focus:ring-2 focus:ring-amber-400`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBreakFromForm}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  🐷 Liberar fondos
                </button>
              </div>

              {/* Preview de resultado */}
              {breakMetaId && (() => {
                const selectedGoal = goalsWithFunds.find(g => g.id === breakMetaId);
                if (!selectedGoal) return null;
                const liberando = Math.min(parseFloat(breakAmount || '0'), selectedGoal.monto_ahorrado);
                const nuevoSaldo = saldoActual + liberando;
                const puedeGastar = nuevoSaldo >= montoTyped;
                return (
                  <p className={`text-xs ${puedeGastar ? 'text-emerald-400' : 'text-amber-300/70'}`}>
                    {puedeGastar
                      ? `✓ Al liberar quedarás con ${formatCurrency(nuevoSaldo - montoTyped)} de saldo`
                      : `Aún te faltarán ${formatCurrency(montoTyped - nuevoSaldo)} después de liberar`}
                  </p>
                );
              })()}
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
              <CategoryPicker
                value={formData.categoria}
                onChange={cat => setFormData(prev => ({ ...prev, categoria: cat }))}
                categories={categories}
                customCategories={entryType === 'ingreso' ? customIngresosCategories : customGastosCategories}
                tipo={entryType === 'ingreso' ? 'ingreso' : 'gasto'}
                required
                onAddCustomCategory={cat => onAddCustomCategory?.(cat, entryType === 'ingreso' ? 'ingreso' : 'gasto')}
                onRemoveCustomCategory={cat => onRemoveCustomCategory?.(cat, entryType === 'ingreso' ? 'ingreso' : 'gasto')}
              />
            </div>

            {/* Goal selector for income */}
            {entryType === 'ingreso' && goals.length > 0 && (
              <div className="space-y-1">
                <label className={`text-xs font-bold ${theme.colors.textMuted} uppercase ml-1`}>Asignar a meta (opcional)</label>
                <select
                  value={selectedMetaId}
                  onChange={e => setSelectedMetaId(e.target.value)}
                  className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">Ninguna - saldo libre</option>
                  {goals.filter(g => g.estado === 'activa').map(g => (
                    <option key={g.id} value={g.id}>{g.nombre} ({formatCurrency(g.monto_ahorrado)} / {formatCurrency(g.monto_objetivo)})</option>
                  ))}
                </select>
                {selectedMetaId && (
                  <p className={`text-xs ${theme.colors.textMuted} ml-1 mt-1`}>
                    Este ingreso se apartará para la meta seleccionada
                  </p>
                )}
              </div>
            )}

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