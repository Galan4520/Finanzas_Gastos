import React, { useMemo, useState } from 'react';
import { CreditCard, PendingExpense, Transaction, Goal, RealEstateInvestment, getCardType } from '../types';
import { formatCurrency, formatCompact } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditIcon, Target, PieChart as PieIcon, TrendingUp, Home, Pencil, Trash2, Calendar } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faCreditCard, faMoneyBillWave, faLandmark } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

type DateFilterType = 'thisMonth' | 'quarter' | 'year' | 'custom';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface DashboardProps {
  cards: CreditCard[];
  pendingExpenses: PendingExpense[];
  history: Transaction[];
  goals?: Goal[];
  realEstateInvestments?: RealEstateInvestment[];
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
}

// Helper function to parse date string as local date (avoids timezone issues)
const parseLocalDate = (dateStr: string): Date => {
  // If it's an ISO string with time, extract just the date part and parse as local
  if (dateStr.includes('T')) {
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  // Otherwise parse normally
  return new Date(dateStr);
};

// Helper function to format dates
const formatDateLabel = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time part for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) return 'Hoy';
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return 'Ayer';

  // Format as "7 de enero"
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${date.getDate()} de ${months[date.getMonth()]}`;
};

const formatTimeLabel = (dateStr: string): string => {
  // Extract time from ISO string if present (avoids timezone conversion)
  if (dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1];
    const [hours, minutes] = timePart.split(':');
    return `${hours}:${minutes}`;
  }
  // Fallback to date parsing for non-ISO formats
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const Dashboard: React.FC<DashboardProps> = ({ cards, pendingExpenses, history, goals = [], realEstateInvestments = [], onEditTransaction, onDeleteTransaction }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [distributionFilter, setDistributionFilter] = React.useState<'thisMonth' | 'total'>('total');
  const [categoryPeriod, setCategoryPeriod] = React.useState<'week' | 'month' | 'year'>('month');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisMonth');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [visibleTransactions, setVisibleTransactions] = useState(10);

  // Compute date range boundaries
  const dateRange = useMemo(() => {
    const now = new Date();
    let from: Date;
    let to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (dateFilter) {
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        from = customRange.from ? new Date(customRange.from + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
        to = customRange.to ? new Date(customRange.to + 'T23:59:59') : to;
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { from, to };
  }, [dateFilter, customRange]);

  // Date range label for subtitle
  const dateRangeLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const optsYear: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    switch (dateFilter) {
      case 'thisMonth':
        return new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      case 'quarter':
        return `${dateRange.from.toLocaleDateString('es-ES', opts)} - ${dateRange.to.toLocaleDateString('es-ES', optsYear)}`;
      case 'year':
        return `Año ${new Date().getFullYear()}`;
      case 'custom':
        if (customRange.from && customRange.to) {
          return `${new Date(customRange.from).toLocaleDateString('es-ES', opts)} - ${new Date(customRange.to).toLocaleDateString('es-ES', optsYear)}`;
        }
        return 'Selecciona un rango';
      default:
        return '';
    }
  }, [dateFilter, dateRange, customRange]);

  // Calculate weekly expenses comparison
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get start of this week (Sunday)
    const thisWeekStart = new Date(todayStart);
    thisWeekStart.setDate(todayStart.getDate() - todayStart.getDay());

    // Get start of last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    let thisWeekExpenses = 0;
    let lastWeekExpenses = 0;

    history.forEach(t => {
      if (t.tipo !== 'Gastos') return;
      const date = new Date(t.timestamp || t.fecha);
      const monto = Number(t.monto);

      if (date >= thisWeekStart) {
        thisWeekExpenses += monto;
      } else if (date >= lastWeekStart && date < thisWeekStart) {
        lastWeekExpenses += monto;
      }
    });

    const difference = thisWeekExpenses - lastWeekExpenses;
    const percentChange = lastWeekExpenses > 0
      ? ((difference / lastWeekExpenses) * 100)
      : (thisWeekExpenses > 0 ? 100 : 0);

    return {
      thisWeek: thisWeekExpenses,
      lastWeek: lastWeekExpenses,
      difference,
      percentChange
    };
  }, [history]);

  // Calculate card payments for this month and next month
  const cardPayments = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Next month calculation
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    let thisMonthTotal = 0;
    let nextMonthTotal = 0;

    const thisMonthDetails: { card: string; amount: number; date: string; paymentDay: number }[] = [];
    const nextMonthDetails: { card: string; amount: number; date: string; paymentDay: number }[] = [];

    // Process all pending expenses based on their fecha_pago
    pendingExpenses.forEach(expense => {
      const paymentDate = new Date(expense.fecha_pago);
      const expenseMonth = paymentDate.getMonth();
      const expenseYear = paymentDate.getFullYear();
      const paymentDay = paymentDate.getDate();

      let amount = 0;
      if (expense.tipo === 'suscripcion') {
        // For subscriptions, use full monthly amount
        amount = Number(expense.monto);
      } else {
        // For debts, calculate one monthly installment
        const total = Number(expense.monto);
        const cuotaVal = total / Number(expense.num_cuotas);
        const cuotasPagadas = Number(expense.cuotas_pagadas);
        const numCuotas = Number(expense.num_cuotas);

        // Only include if there are unpaid installments
        if (cuotasPagadas < numCuotas) {
          amount = cuotaVal;
        }
      }

      if (amount === 0) return;

      // Check if it's due this month
      if (expenseMonth === currentMonth && expenseYear === currentYear) {
        thisMonthTotal += amount;
        const existingDetail = thisMonthDetails.find(d => d.card === expense.tarjeta);
        if (existingDetail) {
          existingDetail.amount += amount;
        } else {
          thisMonthDetails.push({
            card: expense.tarjeta,
            amount: amount,
            date: expense.fecha_pago,
            paymentDay: paymentDay
          });
        }
      }

      // Check if it's due next month
      if (expenseMonth === nextMonth && expenseYear === nextMonthYear) {
        nextMonthTotal += amount;
        const existingDetail = nextMonthDetails.find(d => d.card === expense.tarjeta);
        if (existingDetail) {
          existingDetail.amount += amount;
        } else {
          nextMonthDetails.push({
            card: expense.tarjeta,
            amount: amount,
            date: expense.fecha_pago,
            paymentDay: paymentDay
          });
        }
      }
    });

    // Sort by payment day
    thisMonthDetails.sort((a, b) => a.paymentDay - b.paymentDay);
    nextMonthDetails.sort((a, b) => a.paymentDay - b.paymentDay);

    // Get unique payment days for display
    const thisMonthPaymentDays = [...new Set(thisMonthDetails.map(d => d.paymentDay))].sort((a, b) => a - b);
    const nextMonthPaymentDays = [...new Set(nextMonthDetails.map(d => d.paymentDay))].sort((a, b) => a - b);

    return {
      thisMonth: {
        total: thisMonthTotal,
        paymentDays: thisMonthPaymentDays,
        details: thisMonthDetails
      },
      nextMonth: {
        total: nextMonthTotal,
        paymentDays: nextMonthPaymentDays,
        details: nextMonthDetails
      }
    };
  }, [cards, pendingExpenses]);

  // Calculate real estate assets metrics
  const assetsMetrics = useMemo(() => {
    const totalInversion = realEstateInvestments.reduce((sum, inv) => sum + Number(inv.valor_compra), 0);
    const totalValorActual = realEstateInvestments.reduce((sum, inv) => sum + Number(inv.valor_actual), 0);
    const totalRentaMensual = realEstateInvestments
      .filter(inv => inv.genera_renta)
      .reduce((sum, inv) => sum + Number(inv.renta_mensual || 0), 0);
    const plusvalia = totalValorActual - totalInversion;
    const porcentajePlusvalia = totalInversion > 0 ? ((plusvalia / totalInversion) * 100) : 0;

    return {
      totalInversion,
      totalValorActual,
      totalRentaMensual,
      plusvalia,
      porcentajePlusvalia,
      cantidadPropiedades: realEstateInvestments.length,
      propiedadesConRenta: realEstateInvestments.filter(inv => inv.genera_renta).length
    };
  }, [realEstateInvestments]);

  // Calculate expense distribution by card
  const cardDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    pendingExpenses.forEach(expense => {
      // If filtering by this month, only include expenses due this month
      if (distributionFilter === 'thisMonth') {
        const paymentDate = new Date(expense.fecha_pago);
        const expenseMonth = paymentDate.getMonth();
        const expenseYear = paymentDate.getFullYear();

        if (expenseMonth !== currentMonth || expenseYear !== currentYear) {
          return; // Skip expenses not due this month
        }
      }

      if (!distribution[expense.tarjeta]) {
        distribution[expense.tarjeta] = 0;
      }

      if (expense.tipo === 'suscripcion') {
        // For subscriptions, add the full monthly amount
        distribution[expense.tarjeta] += Number(expense.monto) || 0;
      } else {
        // For debts, calculate remaining amount using monto_pagado_total
        const total = Number(expense.monto) || 0;
        const montoPagadoTotal = Number(expense.monto_pagado_total) || 0;
        const deudaRestante = total - montoPagadoTotal;

        if (distributionFilter === 'thisMonth') {
          // For this month filter, only add the monthly payment (one cuota)
          const numCuotas = Number(expense.num_cuotas) || 1;
          const cuotaVal = total / numCuotas;
          distribution[expense.tarjeta] += cuotaVal;
        } else {
          // For total filter, add all remaining debt
          distribution[expense.tarjeta] += deudaRestante;
        }
      }
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pendingExpenses, distributionFilter]);

  const currentStats = useMemo(() => {
    // 1. Cash Flow filtered by date range
    let ingresosMes = 0;
    let gastosMes = 0;
    let ingresosTotal = 0;
    let gastosTotal = 0;

    const INGRESO_TYPES = ['Ingresos', 'Ruptura_Meta'];
    const GASTO_TYPES = ['Gastos', 'Aporte_Meta'];

    if (history) {
        history.forEach(t => {
            const d = new Date(t.fecha);
            const monto = Number(t.monto);

            // Filtered period totals (solo transacciones reales para gráfico)
            if (d >= dateRange.from && d <= dateRange.to) {
                if (t.tipo === 'Ingresos') ingresosMes += monto;
                if (t.tipo === 'Gastos') gastosMes += monto;
            }

            // All-time totals (incluye aportes/rupturas para saldo real)
            if (INGRESO_TYPES.includes(t.tipo)) ingresosTotal += monto;
            if (GASTO_TYPES.includes(t.tipo)) gastosTotal += monto;
        });
    }

    // Debit card saldo inicial (card.limite) — not tracked in history, must be added separately
    const debitCardsForBalance = cards.filter(c => getCardType(c) === 'debito');
    const debitSaldoInicial = debitCardsForBalance.reduce((sum, c) => sum + Number(c.limite || 0), 0);

    const balanceTotal = ingresosTotal - gastosTotal + debitSaldoInicial;

    // 2. Credit Card Usage — only credit cards, NOT debit
    let deudaTotal = 0;
    let limiteTotal = 0;

    cards.filter(c => getCardType(c) === 'credito').forEach(c => limiteTotal += Number(c.limite));

    pendingExpenses.forEach(p => {
        const total = Number(p.monto) || 0;
        const montoPagadoTotal = Number(p.monto_pagado_total) || 0;
        const deudaRestante = total - montoPagadoTotal;
        deudaTotal += deudaRestante;
    });

    const disponible = Math.max(0, limiteTotal - deudaTotal);
    const usoCredito = limiteTotal > 0 ? (deudaTotal / limiteTotal) * 100 : 0;

    return {
      ingresosMes,
      gastosMes,
      ingresosTotal,
      gastosTotal,
      balanceTotal,
      deudaTotal,
      disponible,
      usoCredito,
      limiteTotal
    };
  }, [cards, pendingExpenses, history, dateRange]);

  // Per-account balance breakdown for Balance Total section
  const accountBreakdown = useMemo(() => {
    const INGRESO_TYPES = ['Ingresos', 'Ruptura_Meta'];
    const GASTO_TYPES = ['Gastos', 'Aporte_Meta'];

    // Billetera
    const billeteraIngresos = history
      .filter(t => INGRESO_TYPES.includes(t.tipo) && t.cuenta === 'Billetera')
      .reduce((sum, t) => sum + Number(t.monto), 0);
    const billeteraGastos = history
      .filter(t => GASTO_TYPES.includes(t.tipo) && t.cuenta === 'Billetera')
      .reduce((sum, t) => sum + Number(t.monto), 0);
    const billeteraBalance = billeteraIngresos - billeteraGastos;

    // Debit cards: saldo_inicial + ingresos - gastos (incluye aportes/rupturas)
    const debitAccounts = cards
      .filter(c => getCardType(c) === 'debito')
      .map(c => {
        const ingresos = history
          .filter(t => INGRESO_TYPES.includes(t.tipo) && t.cuenta === c.alias)
          .reduce((sum, t) => sum + Number(t.monto), 0);
        const gastos = history
          .filter(t => GASTO_TYPES.includes(t.tipo) && t.cuenta === c.alias)
          .reduce((sum, t) => sum + Number(t.monto), 0);
        return { alias: c.alias, banco: c.banco, balance: Number(c.limite || 0) + ingresos - gastos };
      });

    // Credit cards: limite - deuda pendiente
    const creditAccounts = cards
      .filter(c => getCardType(c) === 'credito')
      .map(c => {
        const deuda = pendingExpenses
          .filter(p => p.tarjeta === c.alias)
          .reduce((sum, p) => sum + Math.max(0, Number(p.monto) - Number(p.monto_pagado_total || 0)), 0);
        return { alias: c.alias, banco: c.banco, disponible: Math.max(0, Number(c.limite || 0) - deuda), deuda };
      });

    return { billeteraBalance, debitAccounts, creditAccounts };
  }, [history, cards, pendingExpenses]);

  // Chart Data
  const barData = [
    { name: 'Ingresos', amount: currentStats.ingresosMes, color: '#10b981' },
    { name: 'Gastos (Efec)', amount: currentStats.gastosMes, color: '#f43f5e' },
  ];

  const recentTransactions = [
    ...(history || []).map(h => ({ ...h, isCredit: false })),
    ...pendingExpenses.map(p => ({
        fecha: p.fecha_gasto,
        categoria: p.categoria,
        descripcion: p.descripcion,
        monto: p.monto,
        tipo: 'Gasto Tarjeta',
        isCredit: true,
        isSuscripcion: p.tipo === 'suscripcion',
        timestamp: p.timestamp
    }))
  ].filter(t => {
    const d = new Date(t.timestamp || t.fecha);
    return d >= dateRange.from && d <= dateRange.to;
  }).sort((a, b) => {
    const dateA = new Date(a.timestamp || a.fecha).getTime();
    const dateB = new Date(b.timestamp || b.fecha).getTime();
    return dateB - dateA;
  });

  const paginatedTransactions = recentTransactions.slice(0, visibleTransactions);
  const hasMoreTransactions = recentTransactions.length > visibleTransactions;

  // Group transactions by day
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    paginatedTransactions.forEach(t => {
      const dayLabel = formatDateLabel(t.timestamp || t.fecha);
      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(t);
    });
    return groups;
  }, [paginatedTransactions]);

  return (
    <div className="space-y-6">

      {/* Welcome & Date Filter */}
      <div className="space-y-4 mb-2">
        <div>
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>Panel Financiero</h2>
            <p className={`${theme.colors.textMuted} text-sm`}>Panorama financiero — {dateRangeLabel}</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            ['thisMonth', 'Este mes'],
            ['quarter', 'Último trimestre'],
            ['year', 'Este año'],
            ['custom', 'Personalizado'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setDateFilter(key); setVisibleTransactions(10); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === key
                  ? `${theme.colors.primary} text-white shadow-md`
                  : `${theme.colors.bgSecondary} ${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
              }`}
            >
              {key === 'custom' && <Calendar size={12} className="inline mr-1 -mt-0.5" />}
              {label}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customRange.from}
                onChange={e => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                className={`px-2 py-1.5 rounded-lg text-xs border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary}`}
              />
              <span className={`text-xs ${theme.colors.textMuted}`}>—</span>
              <input
                type="date"
                value={customRange.to}
                onChange={e => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                className={`px-2 py-1.5 rounded-lg text-xs border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hero Stats: Cash Flow vs Credit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Cash Flow Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl relative overflow-hidden`}>
            <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>Flujo de Efectivo</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <div className="flex items-center gap-1 text-emerald-500 mb-1">
                        <ArrowUpRight size={16} /> <span className="text-xs font-bold">Ingresos</span>
                    </div>
                    <p className={`text-xl md:text-2xl font-mono font-bold ${theme.colors.textPrimary} truncate`}>{formatCurrency(currentStats.ingresosMes)}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-rose-500 mb-1">
                        <ArrowDownRight size={16} /> <span className="text-xs font-bold">Gastos</span>
                    </div>
                    <p className={`text-xl md:text-2xl font-mono font-bold ${theme.colors.textPrimary} truncate`}>{formatCurrency(currentStats.gastosMes)}</p>
                </div>
            </div>

            <div className="mt-6 h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" barSize={12}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: currentTheme === 'light-premium' ? '#64748b' : '#64748b', fontSize: 10}} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: currentTheme === 'light-premium' ? '#f8fafc' : '#f1f5f9', borderRadius: '8px', border: `1px solid ${currentTheme === 'light-premium' ? '#e2e8f0' : '#cbd5e1'}`}} itemStyle={{color: currentTheme === 'light-premium' ? '#0f172a' : '#1e293b'}} formatter={(val) => formatCurrency(Number(val))}/>
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Credit Card Health */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl relative overflow-hidden`}>
            <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>Salud Crediticia</h3>

            <div className="mb-4">
                <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Deuda Total Tarjetas</p>
                <p className={`text-xl md:text-2xl font-mono font-bold ${theme.colors.textPrimary} truncate`}>{formatCurrency(currentStats.deudaTotal)}</p>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className={theme.colors.textMuted}>Uso de Línea</span>
                        <span className={`${textColors.primary} font-bold`}>{currentStats.usoCredito.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full h-2 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${currentStats.usoCredito > 70 ? 'bg-rose-500' : textColors.primary === 'text-emerald-600' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{width: `${currentStats.usoCredito}%`}}
                        />
                    </div>
                </div>

                <div className={`flex justify-between items-center pt-2 border-t ${theme.colors.borderLight}`}>
                    <span className={`text-xs ${theme.colors.textMuted}`}>Disponible para compras</span>
                    <span className="text-sm font-mono font-bold text-emerald-500">{formatCurrency(currentStats.disponible)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* ASSETS SECTION */}
      {realEstateInvestments.length > 0 && (
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${theme.colors.gradientPrimary}`}>
                <Home size={24} className="text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme.colors.textPrimary}`}>Activos Inmobiliarios</h3>
                <p className={`text-xs ${theme.colors.textMuted}`}>
                  {assetsMetrics.cantidadPropiedades} {assetsMetrics.cantidadPropiedades === 1 ? 'propiedad' : 'propiedades'}
                  {assetsMetrics.propiedadesConRenta > 0 && ` • ${assetsMetrics.propiedadesConRenta} generando renta`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Inversión Total */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Inversión Total</p>
              <p className={`text-base sm:text-xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(assetsMetrics.totalInversion)}
              </p>
            </div>

            {/* Valor Actual */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Valor Actual</p>
              <p className={`text-base sm:text-xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(assetsMetrics.totalValorActual)}
              </p>
            </div>

            {/* Plusvalía */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Plusvalía</p>
              <div className="flex items-center gap-2">
                <p className={`text-base sm:text-xl font-mono font-bold truncate ${assetsMetrics.plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {assetsMetrics.plusvalia >= 0 ? '+' : ''}{formatCompact(assetsMetrics.plusvalia)}
                </p>
                {assetsMetrics.plusvalia !== 0 && (
                  <span className={`text-xs font-bold ${assetsMetrics.plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ({assetsMetrics.porcentajePlusvalia > 0 ? '+' : ''}{assetsMetrics.porcentajePlusvalia.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Ingresos por Renta */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Renta Mensual</p>
              <p className={`text-base sm:text-xl font-mono font-bold truncate ${assetsMetrics.totalRentaMensual > 0 ? 'text-emerald-500' : theme.colors.textPrimary}`}>
                {formatCompact(assetsMetrics.totalRentaMensual)}
              </p>
            </div>
          </div>

          {/* List of Properties */}
          <div className="mt-4 space-y-2">
            {realEstateInvestments.map(inv => {
              const plusvalia = Number(inv.valor_actual) - Number(inv.valor_compra);
              const porcentaje = ((plusvalia / Number(inv.valor_compra)) * 100);

              return (
                <div key={inv.id} className={`p-3 rounded-lg ${theme.colors.bgSecondary} border ${theme.colors.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg ${theme.colors.gradientPrimary} flex items-center justify-center`}>
                      <Home size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${theme.colors.textPrimary}`}>{inv.nombre}</p>
                      <p className={`text-xs ${theme.colors.textMuted}`}>
                        {inv.tipo} • Compra: {formatCurrency(inv.valor_compra)}
                        {inv.genera_renta && inv.renta_mensual && ` • Renta: ${formatCurrency(inv.renta_mensual)}/mes`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${theme.colors.textPrimary}`}>
                      {formatCurrency(inv.valor_actual)}
                    </p>
                    <p className={`text-xs font-semibold ${plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {plusvalia >= 0 ? '+' : ''}{formatCurrency(plusvalia)} ({porcentaje > 0 ? '+' : ''}{porcentaje.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW FEATURES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Comparison Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
          <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>
            Gastos Semanales
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Esta semana</p>
              <p className={`text-xl sm:text-2xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(weeklyComparison.thisWeek)}
              </p>
            </div>

            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Semana pasada</p>
              <p className={`text-lg font-mono font-bold truncate ${theme.colors.textSecondary}`}>
                {formatCompact(weeklyComparison.lastWeek)}
              </p>
            </div>

            <div className={`p-3 rounded-xl ${
              weeklyComparison.difference > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme.colors.textMuted}`}>Variación</span>
                <div className="flex items-center gap-1">
                  {weeklyComparison.difference > 0 ? (
                    <ArrowUpRight className="text-red-500" size={16} />
                  ) : weeklyComparison.difference < 0 ? (
                    <ArrowDownRight className="text-green-500" size={16} />
                  ) : null}
                  <span className={`font-bold text-sm ${
                    weeklyComparison.difference > 0 ? 'text-red-500' :
                    weeklyComparison.difference < 0 ? 'text-green-500' :
                    theme.colors.textMuted
                  }`}>
                    {weeklyComparison.percentChange > 0 ? '+' : ''}
                    {weeklyComparison.percentChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              {weeklyComparison.difference !== 0 && (
                <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                  {weeklyComparison.difference > 0 ? '+' : ''}
                  {formatCurrency(weeklyComparison.difference)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* This Month Payment Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
          <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>
            Pago Este Mes
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Total a pagar</p>
              <p className={`text-xl sm:text-2xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(cardPayments.thisMonth.total)}
              </p>
            </div>

            {cardPayments.thisMonth.paymentDays.length > 0 && (
              <div className={`p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${theme.colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-xs font-semibold ${theme.colors.textSecondary}`}>
                      {cardPayments.thisMonth.paymentDays.length === 1
                        ? `Día ${cardPayments.thisMonth.paymentDays[0]}`
                        : `Días ${cardPayments.thisMonth.paymentDays.join(', ')}`
                      }
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${theme.colors.textPrimary} bg-emerald-500/10 px-2 py-1 rounded`}>
                    {cardPayments.thisMonth.details.length} {cardPayments.thisMonth.details.length === 1 ? 'tarjeta' : 'tarjetas'}
                  </span>
                </div>

                {cardPayments.thisMonth.details.length > 0 && (
                  <div className="space-y-1.5">
                    {cardPayments.thisMonth.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.textMuted}`}>{detail.card}</span>
                        <span className={`text-xs font-mono font-semibold ${theme.colors.textPrimary}`}>
                          {formatCurrency(detail.amount)}
                        </span>
                      </div>
                    ))}
                    {cardPayments.thisMonth.details.length > 1 && (
                      <div className={`flex justify-between items-center pt-2 mt-2 border-t ${theme.colors.border}`}>
                        <span className={`text-xs font-bold ${theme.colors.textSecondary}`}>Total</span>
                        <span className={`text-sm font-mono font-bold ${theme.colors.textPrimary}`}>
                          {formatCurrency(cardPayments.thisMonth.total)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Next Month Payment Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
          <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>
            Pago Próximo Mes
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Total estimado</p>
              <p className={`text-xl sm:text-2xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(cardPayments.nextMonth.total)}
              </p>
            </div>

            {cardPayments.nextMonth.paymentDays.length > 0 && (
              <div className={`p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${theme.colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-xs font-semibold ${theme.colors.textSecondary}`}>
                      {cardPayments.nextMonth.paymentDays.length === 1
                        ? `Día ${cardPayments.nextMonth.paymentDays[0]}`
                        : `Días ${cardPayments.nextMonth.paymentDays.join(', ')}`
                      }
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${theme.colors.textPrimary} bg-blue-500/10 px-2 py-1 rounded`}>
                    {cardPayments.nextMonth.details.length} {cardPayments.nextMonth.details.length === 1 ? 'tarjeta' : 'tarjetas'}
                  </span>
                </div>

                {cardPayments.nextMonth.details.length > 0 && (
                  <div className="space-y-1.5">
                    {cardPayments.nextMonth.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.textMuted}`}>{detail.card}</span>
                        <span className={`text-xs font-mono font-semibold ${theme.colors.textPrimary}`}>
                          {formatCurrency(detail.amount)}
                        </span>
                      </div>
                    ))}
                    {cardPayments.nextMonth.details.length > 1 && (
                      <div className={`flex justify-between items-center pt-2 mt-2 border-t ${theme.colors.border}`}>
                        <span className={`text-xs font-bold ${theme.colors.textSecondary}`}>Total</span>
                        <span className={`text-sm font-mono font-bold ${theme.colors.textPrimary}`}>
                          {formatCurrency(cardPayments.nextMonth.total)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Distribution */}
      {pendingExpenses.length > 0 && (() => {
        const totalDistribution = cardDistribution.reduce((sum, c) => sum + c.value, 0);
        return (
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden`}>
            <div className={`p-6 border-b ${theme.colors.border}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditIcon className={textColors.primary} size={20} />
                    <h3 className={`font-bold ${theme.colors.textPrimary}`}>Distribución por Tarjetas</h3>
                  </div>
                  <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                    {totalDistribution > 0
                      ? `${formatCurrency(totalDistribution)} ${distributionFilter === 'thisMonth' ? 'este mes' : 'en total'}`
                      : `Sin deudas ${distributionFilter === 'thisMonth' ? 'este mes' : ''}`
                    }
                  </p>
                </div>

                <div className={`flex rounded-xl ${theme.colors.bgSecondary} p-1`}>
                  {([['thisMonth', 'Este Mes'], ['total', 'Total']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setDistributionFilter(key)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        distributionFilter === key
                          ? `${theme.colors.primary} text-white shadow-md`
                          : `${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {cardDistribution.length === 0 ? (
              <div className={`p-12 text-center ${theme.colors.textMuted} text-sm`}>
                No hay pagos programados para este mes.
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {cardDistribution.map((card, index) => {
                  const percentage = (card.value / totalDistribution) * 100;
                  return (
                    <div key={card.name} className={`p-4 rounded-2xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                            <CreditIcon size={18} style={{ color: COLORS[index % COLORS.length] }} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${theme.colors.textPrimary}`}>{card.name}</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>{percentage.toFixed(1)}% del total</p>
                          </div>
                        </div>
                        <p className={`font-bold font-mono text-base sm:text-lg truncate ${theme.colors.textPrimary}`}>{formatCompact(card.value)}</p>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden`} style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Balance Total Card - Destacado */}
      <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border-2 ${
        currentStats.balanceTotal >= 0 ? 'border-emerald-500' : 'border-rose-500'
      } shadow-2xl relative overflow-hidden`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${
            currentStats.balanceTotal >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}>
            <Wallet className={currentStats.balanceTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'} size={28} />
          </div>
          <div>
            <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider`}>
              Balance Total
            </h3>
            <p className={`text-xs ${theme.colors.textMuted} mt-0.5`}>
              Dinero disponible actual
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className={`text-2xl sm:text-3xl md:text-4xl font-mono font-bold truncate ${
            currentStats.balanceTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {formatCompact(currentStats.balanceTotal)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t ${theme.colors.borderLight}">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight className="text-emerald-500" size={14} />
              <p className={`text-xs ${theme.colors.textMuted}`}>Total Ingresos</p>
            </div>
            <p className={`text-base sm:text-lg font-mono font-bold truncate ${theme.colors.textPrimary}`}>
              {formatCompact(currentStats.ingresosTotal)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownRight className="text-rose-500" size={14} />
              <p className={`text-xs ${theme.colors.textMuted}`}>Total Gastos</p>
            </div>
            <p className={`text-base sm:text-lg font-mono font-bold truncate ${theme.colors.textPrimary}`}>
              {formatCompact(currentStats.gastosTotal)}
            </p>
          </div>
        </div>

        {/* Per-account breakdown */}
        <div className={`mt-4 pt-4 border-t ${theme.colors.border} space-y-3`}>
          {/* Efectivo y Débito */}
          <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wider`}>Efectivo y Débito</p>
          {/* Billetera */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10`}>
                <FontAwesomeIcon icon={faWallet} className="text-emerald-500" style={{ fontSize: '13px' }} />
              </div>
              <span className={`text-sm font-medium ${theme.colors.textPrimary}`}>Billetera Física</span>
            </div>
            <span className={`text-sm font-mono font-bold truncate ${accountBreakdown.billeteraBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(accountBreakdown.billeteraBalance)}
            </span>
          </div>
          {/* Debit cards */}
          {accountBreakdown.debitAccounts.map(acc => (
            <div key={acc.alias} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10`}>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-blue-400" style={{ fontSize: '12px' }} />
                </div>
                <div>
                  <span className={`text-sm font-medium ${theme.colors.textPrimary}`}>{acc.alias}</span>
                  <span className={`text-[10px] ${theme.colors.textMuted} ml-1`}>{acc.banco}</span>
                </div>
              </div>
              <span className={`text-sm font-mono font-bold truncate ${acc.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(acc.balance)}
              </span>
            </div>
          ))}
          {/* Credit cards — only if any */}
          {accountBreakdown.creditAccounts.length > 0 && (
            <>
              <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wider pt-2 border-t ${theme.colors.border}`}>Crédito disponible</p>
              {accountBreakdown.creditAccounts.map(acc => (
                <div key={acc.alias} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10`}>
                      <FontAwesomeIcon icon={faCreditCard} className="text-purple-400" style={{ fontSize: '12px' }} />
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${theme.colors.textPrimary}`}>{acc.alias}</span>
                      <span className={`text-[10px] ${theme.colors.textMuted} ml-1`}>{acc.banco}</span>
                      {acc.deuda > 0 && (
                        <span className="text-[10px] text-rose-400 ml-1">· deuda {formatCurrency(acc.deuda)}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold truncate text-purple-400">
                    {formatCurrency(acc.disponible)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Goals Summary - Savings Goals (Sobres Virtuales) */}
      {goals.length > 0 && (() => {
        const activeGoals = goals.filter(g => g.estado === 'activa');
        const totalApartado = goals.reduce((s, g) => s + g.monto_ahorrado, 0);
        // balanceTotal ya descuenta Aporte_Meta — no restar totalApartado de nuevo
        const saldoDisponible = currentStats.balanceTotal;

        return (
          <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className={textColors.primary} size={20} />
                <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider`}>
                  Metas de Ahorro
                </h3>
              </div>
              <div className="text-right">
                <p className={`text-[10px] ${theme.colors.textMuted}`}>Saldo Disponible</p>
                <p className={`text-sm font-mono font-bold truncate ${saldoDisponible >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {formatCurrency(saldoDisponible)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map(goal => {
                const pct = goal.monto_objetivo > 0 ? (goal.monto_ahorrado / goal.monto_objetivo) * 100 : 0;
                const barColor = pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500';
                const pctColor = pct >= 100 ? 'text-emerald-600' : textColors.primary;

                return (
                  <div key={goal.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-medium ${theme.colors.textPrimary}`}>{goal.nombre}</span>
                      <span className={`text-xs font-bold ${pctColor}`}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className={`w-full h-2 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
                      <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className={`text-[10px] ${theme.colors.textMuted}`}>{formatCurrency(goal.monto_ahorrado)}</span>
                      <span className={`text-[10px] ${theme.colors.textMuted}`}>{formatCurrency(goal.monto_objetivo)}</span>
                    </div>
                  </div>
                );
              })}
              {activeGoals.length > 4 && (
                <p className={`text-[10px] ${theme.colors.textMuted} text-center`}>
                  +{activeGoals.length - 4} meta{activeGoals.length - 4 > 1 ? 's' : ''} más
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Recent Activity */}
      <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden`}>
         <div className={`p-6 border-b ${theme.colors.border}`}>
            <h3 className={`font-bold ${theme.colors.textPrimary}`}>Últimos Movimientos</h3>
         </div>
         <div>
            {recentTransactions.length === 0 ? (
                <div className={`p-8 text-center ${theme.colors.textMuted} text-sm`}>No hay actividad reciente.</div>
            ) : (
                Object.entries(groupedTransactions).map(([dayLabel, transactions], groupIdx) => (
                    <div key={groupIdx}>
                        {/* Day Separator */}
                        <div className={`px-6 py-3 ${theme.colors.bgSecondary} border-b ${theme.colors.border}`}>
                            <p className={`text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wider`}>
                                {dayLabel}
                            </p>
                        </div>
                        {/* Transactions for this day */}
                        <div className={`divide-y ${theme.colors.border}`}>
                            {transactions.map((t: any, idx) => {
                                const isEditable = !t.isCredit && (t.tipo === 'Gastos' || t.tipo === 'Ingresos');
                                return (
                                <div key={idx} className={`group p-4 flex items-center justify-between hover:${theme.colors.bgCardHover} transition-colors`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                            ${t.tipo === 'Ingresos' ? 'bg-emerald-100 text-emerald-600' :
                                              t.isCredit ? `${theme.colors.primaryLight} ${textColors.primary}` : 'bg-rose-100 text-rose-600'}`}>
                                            {t.tipo === 'Ingresos' ? '💰' : t.isCredit ? '💳' : '💸'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                              <p className={`font-medium ${theme.colors.textPrimary} text-sm`}>{t.descripcion}</p>
                                              {t.isSuscripcion && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-600">
                                                  Suscripción
                                                </span>
                                              )}
                                            </div>
                                            <p className={`text-xs ${theme.colors.textMuted}`}>{formatTimeLabel(t.timestamp || t.fecha)} • {t.categoria}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isEditable && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEditTransaction?.(t as Transaction)}
                                                    className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-blue-500/20 transition-colors`}
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} className="text-blue-400" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTransaction?.(t as Transaction)}
                                                    className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-red-500/20 transition-colors`}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} className="text-red-400" />
                                                </button>
                                            </div>
                                        )}
                                        <span className={`font-mono font-bold text-sm ${t.tipo === 'Ingresos' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.tipo === 'Ingresos' ? '+' : '-'}{formatCurrency(Number(t.monto))}
                                        </span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
         </div>
         {hasMoreTransactions && (
           <button
             onClick={() => setVisibleTransactions(prev => prev + 10)}
             className={`w-full py-3 text-sm font-medium ${textColors.primary} hover:${theme.colors.bgSecondary} transition-colors border-t ${theme.colors.border}`}
           >
             Ver más ({recentTransactions.length - visibleTransactions} restantes)
           </button>
         )}
      </div>

      {/* Category Analysis - Bar Chart with Period Filter */}
      {(() => {
        const now = new Date();
        const filteredHistory = history.filter(t => {
          if (t.tipo !== 'Gastos') return false;
          const d = new Date(t.timestamp || t.fecha);
          if (categoryPeriod === 'week') {
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            return d >= weekStart;
          } else if (categoryPeriod === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          } else {
            return d.getFullYear() === now.getFullYear();
          }
        });

        const categoryData = filteredHistory.reduce((acc: { [key: string]: number }, t) => {
          const cat = t.categoria || 'Sin categoría';
          acc[cat] = (acc[cat] || 0) + Number(t.monto);
          return acc;
        }, {});

        const chartData = Object.entries(categoryData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        const totalGastos = chartData.reduce((sum, c) => sum + c.value, 0);

        const periodLabels = { week: 'esta semana', month: 'este mes', year: 'este año' };

        return (
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden`}>
            <div className={`p-6 border-b ${theme.colors.border}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PieIcon className={textColors.primary} size={20} />
                    <h3 className={`font-bold ${theme.colors.textPrimary}`}>Gastos por Categoría</h3>
                  </div>
                  <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                    {totalGastos > 0 ? `${formatCurrency(totalGastos)} ${periodLabels[categoryPeriod]}` : `Sin gastos ${periodLabels[categoryPeriod]}`}
                  </p>
                </div>

                <div className={`flex rounded-xl ${theme.colors.bgSecondary} p-1`}>
                  {([['week', 'Semana'], ['month', 'Mes'], ['year', 'Año']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCategoryPeriod(key)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        categoryPeriod === key
                          ? `${theme.colors.primary} text-white shadow-md`
                          : `${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className={`p-12 text-center ${theme.colors.textMuted} text-sm`}>
                No hay gastos registrados {periodLabels[categoryPeriod]}.
              </div>
            ) : (
              <div className="p-6">
                {/* Bar Chart */}
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" barSize={20} margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fill: currentTheme === 'light-premium' ? '#475569' : '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: currentTheme === 'light-premium' ? '#ffffff' : '#1e293b',
                          borderRadius: '12px',
                          border: `1px solid ${currentTheme === 'light-premium' ? '#e2e8f0' : '#334155'}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ color: currentTheme === 'light-premium' ? '#0f172a' : '#f1f5f9' }}
                        formatter={(val: number) => formatCurrency(val)}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {chartData.map((cat, index) => {
                    const percentage = (cat.value / totalGastos) * 100;
                    return (
                      <div key={cat.name} className={`flex items-center justify-between p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className={`font-medium text-sm ${theme.colors.textPrimary} truncate`}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-xs ${theme.colors.textMuted}`}>{percentage.toFixed(0)}%</span>
                          <span className={`font-bold text-sm font-mono truncate ${theme.colors.textPrimary}`}>{formatCurrency(cat.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Monthly Evolution */}
      {(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
            year: d.getFullYear(),
            month: d.getMonth(),
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          };
        });

        const monthlyData = last6Months.map(({ year, month, key }) => {
          const ingresos = history.filter(t => {
            const d = new Date(t.timestamp || t.fecha);
            return d.getFullYear() === year && d.getMonth() === month && t.tipo === 'Ingresos';
          }).reduce((sum, t) => sum + Number(t.monto), 0);

          const gastos = history.filter(t => {
            const d = new Date(t.timestamp || t.fecha);
            return d.getFullYear() === year && d.getMonth() === month && t.tipo === 'Gastos';
          }).reduce((sum, t) => sum + Number(t.monto), 0);

          return {
            month: key.split('-')[1] + '/' + key.split('-')[0].slice(2),
            ingresos,
            gastos,
            ahorro: ingresos - gastos
          };
        });

        if (monthlyData.every(d => d.ingresos === 0 && d.gastos === 0)) return null;

        return (
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden`}>
            <div className={`p-6 border-b ${theme.colors.border}`}>
              <div className="flex items-center gap-2">
                <TrendingUp className={textColors.primary} size={20} />
                <h3 className={`font-bold ${theme.colors.textPrimary}`}>Evolución de los Últimos 6 Meses</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                    <XAxis dataKey="month" stroke={theme.colors.textMuted} style={{ fontSize: '12px' }} />
                    <YAxis stroke={theme.colors.textMuted} style={{ fontSize: '12px' }} tickFormatter={(value) => `S/ ${value}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                    <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
                    <Line type="monotone" dataKey="ahorro" stroke="#3b82f6" strokeWidth={2} name="Ahorro" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};