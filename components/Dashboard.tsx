import React, { useMemo } from 'react';
import { CreditCard, PendingExpense, Transaction, SavingsGoalConfig, RealEstateInvestment } from '../types';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditIcon, Target, PieChart as PieIcon, TrendingUp, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface DashboardProps {
  cards: CreditCard[];
  pendingExpenses: PendingExpense[];
  history: Transaction[];
  savingsGoal?: SavingsGoalConfig | null;
  realEstateInvestments?: RealEstateInvestment[];
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

export const Dashboard: React.FC<DashboardProps> = ({ cards, pendingExpenses, history, savingsGoal, realEstateInvestments = [] }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [distributionFilter, setDistributionFilter] = React.useState<'thisMonth' | 'total'>('total');

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
        distribution[expense.tarjeta] += Number(expense.monto);
      } else {
        // For debts, calculate remaining amount
        const total = Number(expense.monto);
        const cuotaVal = total / Number(expense.num_cuotas);
        const pagado = cuotaVal * Number(expense.cuotas_pagadas);

        if (distributionFilter === 'thisMonth') {
          // For this month filter, only add the monthly payment (one cuota)
          distribution[expense.tarjeta] += cuotaVal;
        } else {
          // For total filter, add all remaining debt
          distribution[expense.tarjeta] += (total - pagado);
        }
      }
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pendingExpenses, distributionFilter]);

  const currentStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Monthly Cash Flow (From History)
    let ingresosMes = 0;
    let gastosMes = 0; // Cash expenses only
    let ingresosTotal = 0;
    let gastosTotal = 0;

    if (history) {
        history.forEach(t => {
            const d = new Date(t.fecha);
            const monto = Number(t.monto);

            // Monthly totals
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                if (t.tipo === 'Ingresos') ingresosMes += monto;
                if (t.tipo === 'Gastos') gastosMes += monto;
            }

            // All-time totals
            if (t.tipo === 'Ingresos') ingresosTotal += monto;
            if (t.tipo === 'Gastos') gastosTotal += monto;
        });
    }

    const balanceTotal = ingresosTotal - gastosTotal;

    // 2. Credit Card Usage
    let deudaTotal = 0;
    let limiteTotal = 0;

    cards.forEach(c => limiteTotal += Number(c.limite));

    pendingExpenses.forEach(p => {
        const total = Number(p.monto);
        const cuotaVal = total / Number(p.num_cuotas);
        const pagado = cuotaVal * Number(p.cuotas_pagadas);
        deudaTotal += (total - pagado);
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
  }, [cards, pendingExpenses, history]);

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
        timestamp: p.timestamp
    }))
  ].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.fecha).getTime();
    const dateB = new Date(b.timestamp || b.fecha).getTime();
    return dateB - dateA;
  })
   .slice(0, 10);

  // Group transactions by day
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    recentTransactions.forEach(t => {
      const dayLabel = formatDateLabel(t.timestamp || t.fecha);
      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(t);
    });
    return groups;
  }, [recentTransactions]);

  return (
    <div className="space-y-6">

      {/* Welcome & Month Context */}
      <div className="flex justify-between items-end mb-2">
        <div>
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>Resumen Mensual</h2>
            <p className={`${theme.colors.textMuted} text-sm`}>Panorama financiero de {new Date().toLocaleString('es-ES', { month: 'long' })}</p>
        </div>
      </div>

      {/* Hero Stats: Cash Flow vs Credit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Cash Flow Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl relative overflow-hidden`}>
            <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>Flujo de Efectivo (Mes)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <div className="flex items-center gap-1 text-emerald-500 mb-1">
                        <ArrowUpRight size={16} /> <span className="text-xs font-bold">Ingresos</span>
                    </div>
                    <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>{formatCurrency(currentStats.ingresosMes)}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-rose-500 mb-1">
                        <ArrowDownRight size={16} /> <span className="text-xs font-bold">Gastos</span>
                    </div>
                    <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>{formatCurrency(currentStats.gastosMes)}</p>
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
                <p className={`text-3xl font-mono font-bold ${theme.colors.textPrimary}`}>{formatCurrency(currentStats.deudaTotal)}</p>
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
              <p className={`text-xl font-mono font-bold ${theme.colors.textPrimary}`}>
                {formatCurrency(assetsMetrics.totalInversion)}
              </p>
            </div>

            {/* Valor Actual */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Valor Actual</p>
              <p className={`text-xl font-mono font-bold ${theme.colors.textPrimary}`}>
                {formatCurrency(assetsMetrics.totalValorActual)}
              </p>
            </div>

            {/* Plusvalía */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Plusvalía</p>
              <div className="flex items-center gap-2">
                <p className={`text-xl font-mono font-bold ${assetsMetrics.plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {assetsMetrics.plusvalia >= 0 ? '+' : ''}{formatCurrency(assetsMetrics.plusvalia)}
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
              <p className={`text-xl font-mono font-bold ${assetsMetrics.totalRentaMensual > 0 ? 'text-emerald-500' : theme.colors.textPrimary}`}>
                {formatCurrency(assetsMetrics.totalRentaMensual)}
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
            Comparación Semanal
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Esta semana</p>
              <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>
                {formatCurrency(weeklyComparison.thisWeek)}
              </p>
            </div>

            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Semana pasada</p>
              <p className={`text-lg font-mono font-bold ${theme.colors.textSecondary}`}>
                {formatCurrency(weeklyComparison.lastWeek)}
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
              <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>
                {formatCurrency(cardPayments.thisMonth.total)}
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
              <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>
                {formatCurrency(cardPayments.nextMonth.total)}
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

      {/* Card Distribution Chart */}
      {cardDistribution.length > 0 && (
        <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden`}>
          <div className={`p-6 border-b ${theme.colors.border}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <CreditIcon className={textColors.primary} size={20} />
                <h3 className={`font-bold ${theme.colors.textPrimary}`}>Distribución por Tarjetas</h3>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDistributionFilter('thisMonth')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    distributionFilter === 'thisMonth'
                      ? `${theme.colors.primary} text-white shadow-md`
                      : `${theme.colors.bgSecondary} ${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                  }`}
                >
                  Este Mes
                </button>
                <button
                  onClick={() => setDistributionFilter('total')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    distributionFilter === 'total'
                      ? `${theme.colors.primary} text-white shadow-md`
                      : `${theme.colors.bgSecondary} ${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                  }`}
                >
                  Total
                </button>
              </div>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cardDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) => {
                      const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          style={{ fontSize: '10px', fontWeight: '600' }}
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cardDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="space-y-2">
              {cardDistribution.map((card, index) => {
                const total = cardDistribution.reduce((sum, c) => sum + c.value, 0);
                const percentage = (card.value / total) * 100;
                return (
                  <div key={card.name} className={`p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className={`font-medium text-sm ${theme.colors.textPrimary}`}>{card.name}</span>
                      </div>
                      <span className={`font-bold text-sm ${theme.colors.textPrimary}`}>{formatCurrency(card.value)}</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-1.5`}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
          <p className={`text-4xl font-mono font-bold ${
            currentStats.balanceTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {formatCurrency(currentStats.balanceTotal)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t ${theme.colors.borderLight}">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight className="text-emerald-500" size={14} />
              <p className={`text-xs ${theme.colors.textMuted}`}>Total Ingresos</p>
            </div>
            <p className={`text-lg font-mono font-bold ${theme.colors.textPrimary}`}>
              {formatCurrency(currentStats.ingresosTotal)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownRight className="text-rose-500" size={14} />
              <p className={`text-xs ${theme.colors.textMuted}`}>Total Gastos</p>
            </div>
            <p className={`text-lg font-mono font-bold ${theme.colors.textPrimary}`}>
              {formatCurrency(currentStats.gastosTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goal Card */}
      {savingsGoal && (
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className={textColors.primary} size={20} />
              <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider`}>
                Meta de Ahorro {savingsGoal.anio}
              </h3>
            </div>
            <span className={`text-xs ${theme.colors.textMuted}`}>{savingsGoal.proposito}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Total Ahorrado */}
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Total ahorrado hasta ahora</p>
              <p className={`text-2xl font-mono font-bold ${textColors.primary}`}>
                {formatCurrency(currentStats.ingresosMes - currentStats.gastosMes)}
              </p>
            </div>

            {/* Meta Anual */}
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Meta anual</p>
              <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>
                {formatCurrency(savingsGoal.meta_anual)}
              </p>
            </div>

            {/* Te falta */}
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Te falta</p>
              <p className={`text-2xl font-mono font-bold text-rose-500`}>
                {formatCurrency(Math.max(0, savingsGoal.meta_anual - (currentStats.ingresosMes - currentStats.gastosMes)))}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className={theme.colors.textMuted}>Progreso</span>
              <span className={`${textColors.primary} font-bold`}>
                {((((currentStats.ingresosMes - currentStats.gastosMes) / savingsGoal.meta_anual) * 100) || 0).toFixed(1)}%
              </span>
            </div>
            <div className={`w-full h-3 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ${textColors.primary === 'text-emerald-600' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{width: `${Math.min(100, ((currentStats.ingresosMes - currentStats.gastosMes) / savingsGoal.meta_anual) * 100)}%`}}
              />
            </div>
          </div>
        </div>
      )}

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
                            {transactions.map((t: any, idx) => (
                                <div key={idx} className={`p-4 flex items-center justify-between hover:${theme.colors.bgCardHover} transition-colors`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                            ${t.tipo === 'Ingresos' ? 'bg-emerald-100 text-emerald-600' :
                                              t.isCredit ? `${theme.colors.primaryLight} ${textColors.primary}` : 'bg-rose-100 text-rose-600'}`}>
                                            {t.tipo === 'Ingresos' ? '💰' : t.isCredit ? '💳' : '💸'}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${theme.colors.textPrimary} text-sm`}>{t.descripcion}</p>
                                            <p className={`text-xs ${theme.colors.textMuted}`}>{formatTimeLabel(t.timestamp || t.fecha)} • {t.categoria}</p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold text-sm ${t.tipo === 'Ingresos' ? 'text-emerald-600' : theme.colors.textPrimary}`}>
                                        {t.tipo === 'Ingresos' ? '+' : '-'}{formatCurrency(Number(t.monto))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>

      {/* Category Analysis - Pie Chart */}
      {(() => {
        const categoryData = history
          .filter(t => t.tipo === 'Gastos')
          .reduce((acc: { [key: string]: number }, t) => {
            const cat = t.categoria || 'Sin categoría';
            acc[cat] = (acc[cat] || 0) + Number(t.monto);
            return acc;
          }, {});

        const chartData = Object.entries(categoryData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6); // Top 6 categories

        if (chartData.length === 0) return null;

        return (
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden`}>
            <div className={`p-6 border-b ${theme.colors.border}`}>
              <div className="flex items-center gap-2">
                <PieIcon className={textColors.primary} size={20} />
                <h3 className={`font-bold ${theme.colors.textPrimary}`}>Gastos por Categoría</h3>
              </div>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {chartData.map((cat, index) => {
                  const total = chartData.reduce((sum, c) => sum + c.value, 0);
                  const percentage = (cat.value / total) * 100;
                  return (
                    <div key={cat.name} className={`p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className={`font-medium text-sm ${theme.colors.textPrimary}`}>{cat.name}</span>
                        </div>
                        <span className={`font-bold text-sm ${theme.colors.textPrimary}`}>{formatCurrency(cat.value)}</span>
                      </div>
                      <div className={`w-full bg-gray-200 rounded-full h-1.5`}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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