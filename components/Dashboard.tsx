import React, { useMemo } from 'react';
import { CreditCard, PendingExpense, Transaction, SavingsGoalConfig } from '../types';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditIcon, Target } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

interface DashboardProps {
  cards: CreditCard[];
  pendingExpenses: PendingExpense[];
  history: Transaction[];
  savingsGoal?: SavingsGoalConfig | null;
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

export const Dashboard: React.FC<DashboardProps> = ({ cards, pendingExpenses, history, savingsGoal }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);

  const currentStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Monthly Cash Flow (From History)
    let ingresosMes = 0;
    let gastosMes = 0; // Cash expenses only

    if (history) {
        history.forEach(t => {
            const d = new Date(t.fecha);
            // Fix timezone issue by checking raw string if needed, but simplified here
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                if (t.tipo === 'Ingresos') ingresosMes += Number(t.monto);
                if (t.tipo === 'Gastos') gastosMes += Number(t.monto);
            }
        });
    }

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

    return { ingresosMes, gastosMes, deudaTotal, disponible, usoCredito, limiteTotal };
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

    </div>
  );
};