import React, { useMemo, useState } from 'react';
import { Transaction, CreditCard, PendingExpense } from '../types';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Calendar, CreditCard as CardIcon, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

interface ReportsViewProps {
  history: Transaction[];
  cards: CreditCard[];
  pendingExpenses: PendingExpense[];
}

type DateRange = 'week' | 'month' | 'quarter' | 'year';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const ReportsView: React.FC<ReportsViewProps> = ({ history, cards, pendingExpenses }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedCard, setSelectedCard] = useState<string>('all');

  // Filter data by date range
  const filteredData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return history.filter(t => new Date(t.timestamp || t.fecha) >= startDate);
  }, [history, dateRange]);

  // 1. Category Analysis (Pie Chart)
  const categoryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};

    filteredData.forEach(t => {
      if (t.tipo === 'Gastos') {
        const category = t.categoria || 'Sin categoría';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(t.monto);
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 2. Monthly Evolution (Line Chart)
  const monthlyEvolution = useMemo(() => {
    const monthlyData: { [key: string]: { ingresos: number; gastos: number; ahorro: number } } = {};

    filteredData.forEach(t => {
      const date = new Date(t.timestamp || t.fecha);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { ingresos: 0, gastos: 0, ahorro: 0 };
      }

      if (t.tipo === 'Ingresos') {
        monthlyData[monthKey].ingresos += Number(t.monto);
      } else if (t.tipo === 'Gastos') {
        monthlyData[monthKey].gastos += Number(t.monto);
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
        ingresos: data.ingresos,
        gastos: data.gastos,
        ahorro: data.ingresos - data.gastos
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData]);

  // 3. Financial Health Indicators
  const healthMetrics = useMemo(() => {
    const totalIngresos = filteredData.filter(t => t.tipo === 'Ingresos').reduce((sum, t) => sum + Number(t.monto), 0);
    const totalGastos = filteredData.filter(t => t.tipo === 'Gastos').reduce((sum, t) => sum + Number(t.monto), 0);
    const ahorro = totalIngresos - totalGastos;
    const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

    // Credit card usage
    const totalLimite = cards.reduce((sum, c) => sum + Number(c.limite), 0);
    const deudaTotal = pendingExpenses.reduce((sum, p) => {
      const total = Number(p.monto);
      const cuotaVal = total / Number(p.num_cuotas);
      const pagado = cuotaVal * Number(p.cuotas_pagadas);
      return sum + (total - pagado);
    }, 0);
    const usoCredito = totalLimite > 0 ? (deudaTotal / totalLimite) * 100 : 0;

    return {
      totalIngresos,
      totalGastos,
      ahorro,
      tasaAhorro,
      usoCredito,
      deudaTotal
    };
  }, [filteredData, cards, pendingExpenses]);

  // 4. Card-specific transactions
  const cardTransactions = useMemo(() => {
    if (selectedCard === 'all') return [];

    return pendingExpenses
      .filter(p => p.tarjeta === selectedCard)
      .sort((a, b) => new Date(b.timestamp || b.fecha_gasto).getTime() - new Date(a.timestamp || a.fecha_gasto).getTime());
  }, [pendingExpenses, selectedCard]);

  // 5. Category comparison (this month vs last month)
  const categoryComparison = useMemo(() => {
    const now = new Date();
    const thisMonth = filteredData.filter(t => {
      const d = new Date(t.timestamp || t.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.tipo === 'Gastos';
    });

    const lastMonth = history.filter(t => {
      const d = new Date(t.timestamp || t.fecha);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear() && t.tipo === 'Gastos';
    });

    const thisMonthByCategory: { [key: string]: number } = {};
    const lastMonthByCategory: { [key: string]: number } = {};

    thisMonth.forEach(t => {
      const cat = t.categoria || 'Sin categoría';
      thisMonthByCategory[cat] = (thisMonthByCategory[cat] || 0) + Number(t.monto);
    });

    lastMonth.forEach(t => {
      const cat = t.categoria || 'Sin categoría';
      lastMonthByCategory[cat] = (lastMonthByCategory[cat] || 0) + Number(t.monto);
    });

    const allCategories = [...new Set([...Object.keys(thisMonthByCategory), ...Object.keys(lastMonthByCategory)])];

    return allCategories.map(cat => ({
      category: cat,
      thisMonth: thisMonthByCategory[cat] || 0,
      lastMonth: lastMonthByCategory[cat] || 0,
      change: ((thisMonthByCategory[cat] || 0) - (lastMonthByCategory[cat] || 0)) / (lastMonthByCategory[cat] || 1) * 100
    })).sort((a, b) => b.thisMonth - a.thisMonth);
  }, [filteredData, history]);

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className={`${theme.colors.bgCard} p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-1`}>📊 Reportes y Análisis</h2>
            <p className={`text-sm ${theme.colors.textMuted}`}>Análisis detallado de tus finanzas</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {[
              { value: 'week' as DateRange, label: '7 días' },
              { value: 'month' as DateRange, label: '1 mes' },
              { value: 'quarter' as DateRange, label: '3 meses' },
              { value: 'year' as DateRange, label: '1 año' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === range.value
                  ? `${theme.colors.primary} text-white shadow-lg`
                  : `${theme.colors.bgSecondary} ${theme.colors.textSecondary} hover:${theme.colors.bgCardHover}`
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${theme.colors.textMuted}`}>Tasa de Ahorro</p>
            <TrendingUp className={healthMetrics.tasaAhorro >= 20 ? 'text-emerald-500' : 'text-amber-500'} size={20} />
          </div>
          <p className={`text-3xl font-bold ${theme.colors.textPrimary}`}>
            {healthMetrics.tasaAhorro.toFixed(1)}%
          </p>
          <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
            {healthMetrics.tasaAhorro >= 20 ? '¡Excelente!' : 'Puedes mejorar'}
          </p>
        </div>

        <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${theme.colors.textMuted}`}>Ahorro Total</p>
            {healthMetrics.ahorro >= 0 ? <ArrowUpRight className="text-emerald-500" size={20} /> : <ArrowDownRight className="text-rose-500" size={20} />}
          </div>
          <p className={`text-3xl font-bold ${healthMetrics.ahorro >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(healthMetrics.ahorro)}
          </p>
          <p className={`text-xs ${theme.colors.textMuted} mt-1`}>Período seleccionado</p>
        </div>

        <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${theme.colors.textMuted}`}>Uso de Crédito</p>
            <CardIcon className={healthMetrics.usoCredito > 70 ? 'text-rose-500' : 'text-emerald-500'} size={20} />
          </div>
          <p className={`text-3xl font-bold ${theme.colors.textPrimary}`}>
            {healthMetrics.usoCredito.toFixed(1)}%
          </p>
          <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
            {formatCurrency(healthMetrics.deudaTotal)} deuda
          </p>
        </div>

        <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${theme.colors.textMuted}`}>Total Ingresos</p>
            <ArrowUpRight className="text-emerald-500" size={20} />
          </div>
          <p className={`text-3xl font-bold text-emerald-600`}>
            {formatCurrency(healthMetrics.totalIngresos)}
          </p>
          <p className={`text-xs ${theme.colors.textMuted} mt-1`}>Período seleccionado</p>
        </div>
      </div>

      {/* Category Analysis - Pie Chart */}
      <div className={`${theme.colors.bgCard} p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
        <div className="flex items-center gap-2 mb-6">
          <PieIcon className={textColors.primary} size={24} />
          <h3 className={`text-xl font-bold ${theme.colors.textPrimary}`}>Gastos por Categoría</h3>
        </div>

        {categoryData.length === 0 ? (
          <p className={`text-center py-12 ${theme.colors.textMuted}`}>No hay datos de gastos en este período</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {categoryData.map((cat, index) => {
                const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                const percentage = (cat.value / total) * 100;

                return (
                  <div key={cat.name} className={`p-4 rounded-xl ${theme.colors.bgSecondary}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className={`font-medium ${theme.colors.textPrimary}`}>{cat.name}</span>
                      </div>
                      <span className={`font-bold ${theme.colors.textPrimary}`}>{formatCurrency(cat.value)}</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${theme.colors.border}`}>
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                    </div>
                    <p className={`text-xs ${theme.colors.textMuted} mt-1`}>{percentage.toFixed(1)}% del total</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Evolution */}
      <div className={`${theme.colors.bgCard} p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className={textColors.primary} size={24} />
          <h3 className={`text-xl font-bold ${theme.colors.textPrimary}`}>Evolución Mensual</h3>
        </div>

        {monthlyEvolution.length === 0 ? (
          <p className={`text-center py-12 ${theme.colors.textMuted}`}>No hay datos suficientes para mostrar</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis dataKey="month" stroke={theme.colors.textMuted} />
                <YAxis stroke={theme.colors.textMuted} tickFormatter={(value) => `S/ ${value}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
                <Line type="monotone" dataKey="ahorro" stroke="#3b82f6" strokeWidth={2} name="Ahorro" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Comparison (This Month vs Last Month) */}
      <div className={`${theme.colors.bgCard} p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
        <div className="flex items-center gap-2 mb-6">
          <Calendar className={textColors.primary} size={24} />
          <h3 className={`text-xl font-bold ${theme.colors.textPrimary}`}>Comparación Mensual por Categoría</h3>
        </div>

        {categoryComparison.length === 0 ? (
          <p className={`text-center py-12 ${theme.colors.textMuted}`}>No hay datos para comparar</p>
        ) : (
          <div className="space-y-3">
            {categoryComparison.map(cat => (
              <div key={cat.category} className={`p-4 rounded-xl ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} transition-colors`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold ${theme.colors.textPrimary}`}>{cat.category}</h4>
                  <div className={`flex items-center gap-1 text-sm font-medium ${cat.change > 0 ? 'text-rose-500' : cat.change < 0 ? 'text-emerald-500' : theme.colors.textMuted
                    }`}>
                    {cat.change > 0 ? '↑' : cat.change < 0 ? '↓' : '→'} {Math.abs(cat.change).toFixed(1)}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={`${theme.colors.textMuted}`}>Mes anterior</p>
                    <p className={`font-bold ${theme.colors.textPrimary}`}>{formatCurrency(cat.lastMonth)}</p>
                  </div>
                  <div>
                    <p className={`${theme.colors.textMuted}`}>Este mes</p>
                    <p className={`font-bold ${theme.colors.textPrimary}`}>{formatCurrency(cat.thisMonth)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card History */}
      <div className={`${theme.colors.bgCard} p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
        <div className="flex items-center gap-2 mb-6">
          <CardIcon className={textColors.primary} size={24} />
          <h3 className={`text-xl font-bold ${theme.colors.textPrimary}`}>Historial por Tarjeta</h3>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCard('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCard === 'all'
              ? `${theme.colors.primary} text-white`
              : `${theme.colors.bgSecondary} ${theme.colors.textSecondary}`
              }`}
          >
            Todas
          </button>
          {cards.map(card => (
            <button
              key={card.alias}
              onClick={() => setSelectedCard(card.alias)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCard === card.alias
                ? `${theme.colors.primary} text-white`
                : `${theme.colors.bgSecondary} ${theme.colors.textSecondary}`
                }`}
            >
              {card.alias}
            </button>
          ))}
        </div>

        {selectedCard === 'all' ? (
          <div className="grid md:grid-cols-2 gap-4">
            {cards.map(card => {
              const cardExpenses = pendingExpenses.filter(p => p.tarjeta === card.alias);
              const deuda = cardExpenses.reduce((sum, p) => {
                const total = Number(p.monto);
                const cuotaVal = total / Number(p.num_cuotas);
                const pagado = cuotaVal * Number(p.cuotas_pagadas);
                return sum + (total - pagado);
              }, 0);
              const uso = (deuda / Number(card.limite)) * 100;

              return (
                <div key={card.alias} className={`p-4 rounded-xl ${theme.colors.bgSecondary}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold ${theme.colors.textPrimary}`}>{card.alias}</h4>
                    <span className={`text-xs ${theme.colors.textMuted}`}>{card.banco}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={theme.colors.textMuted}>Deuda actual</span>
                      <span className={`font-bold ${theme.colors.textPrimary}`}>{formatCurrency(deuda)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={theme.colors.textMuted}>Límite</span>
                      <span className={theme.colors.textSecondary}>{formatCurrency(Number(card.limite))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={theme.colors.textMuted}>Uso</span>
                      <span className={`font-bold ${uso > 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{uso.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2`}>
                      <div
                        className={`h-2 rounded-full ${uso > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(uso, 100)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${theme.colors.textMuted} mt-2`}>{cardExpenses.length} compra(s) pendiente(s)</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {cardTransactions.length === 0 ? (
              <p className={`text-center py-8 ${theme.colors.textMuted}`}>No hay compras con esta tarjeta</p>
            ) : (
              cardTransactions.map(expense => {
                const total = Number(expense.monto);
                const cuotaVal = total / Number(expense.num_cuotas);
                const pagado = cuotaVal * Number(expense.cuotas_pagadas);
                const restante = total - pagado;

                return (
                  <div key={expense.id} className={`p-4 rounded-xl ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} transition-colors`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-bold ${theme.colors.textPrimary} mb-1`}>{expense.descripcion}</h4>
                        <p className={`text-xs ${theme.colors.textMuted}`}>
                          {new Date(expense.timestamp || expense.fecha_gasto).toLocaleDateString('es-PE')} • {expense.categoria}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <div>
                            <p className={theme.colors.textMuted}>Total</p>
                            <p className={`font-bold ${theme.colors.textPrimary}`}>{formatCurrency(total)}</p>
                          </div>
                          <div>
                            <p className={theme.colors.textMuted}>Cuotas</p>
                            <p className={theme.colors.textSecondary}>{expense.cuotas_pagadas}/{expense.num_cuotas}</p>
                          </div>
                          <div>
                            <p className={theme.colors.textMuted}>Por pagar</p>
                            <p className="font-bold text-rose-600">{formatCurrency(restante)}</p>
                          </div>
                        </div>
                      </div>
                      {expense.estado === 'Pagado' && (
                        <span className="bg-emerald-500/20 text-emerald-600 text-xs px-2 py-1 rounded font-bold">PAGADO</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
