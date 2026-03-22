import React, { useMemo, useState, useEffect } from 'react';
import { CreditCard, PendingExpense, Transaction, Goal, RealEstateInvestment, UserProfile, getCardType } from '../types';
import { formatCurrency, formatCompact } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditIcon, Target, PieChart as PieIcon, TrendingUp, Home, Pencil, Trash2, Calendar } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faCreditCard, faMoneyBillWave, faLandmark } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';
import { CHART_COLORS, CHART_INCOME, CHART_EXPENSE, CHART_SAVINGS } from '../utils/yunaiColors';
import YunaiAdvice from './ui/YunaiAdvice';
import { YunaiContext, getYunaiAdvice } from '../services/googleSheetService';

type DateFilterType = 'thisMonth' | 'quarter' | 'year' | 'custom';


interface DashboardProps {
  cards: CreditCard[];
  pendingExpenses: PendingExpense[];
  history: Transaction[];
  goals?: Goal[];
  realEstateInvestments?: RealEstateInvestment[];
  profile?: UserProfile;
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

// Map goal name/icon to Material Symbols icon names
const getGoalIcon = (nombre: string, icono?: string): { icon: string; color: string; bg: string } => {
  // First check explicit icon key (set by user in GoalsView)
  const iconMap: Record<string, { icon: string; color: string; bg: string }> = {
    car:    { icon: 'directions_car',   color: 'text-yn-sec1-500',    bg: 'bg-yn-sec1-500/15' },
    moto:   { icon: 'two_wheeler',      color: 'text-yn-warning-400', bg: 'bg-yn-warning-400/15' },
    plane:  { icon: 'flight',           color: 'text-yn-sec1-400',    bg: 'bg-yn-sec1-400/15' },
    beach:  { icon: 'beach_access',     color: 'text-yn-sec2-500',    bg: 'bg-yn-sec2-500/15' },
    house:  { icon: 'apartment',        color: 'text-yn-primary-500', bg: 'bg-yn-primary-500/15' },
    edu:    { icon: 'school',           color: 'text-yn-sec1-800',    bg: 'bg-yn-sec1-800/15' },
    shield: { icon: 'shield',           color: 'text-yn-error-500',   bg: 'bg-yn-error-500/15' },
    work:   { icon: 'work',             color: 'text-yn-warning-600', bg: 'bg-yn-warning-500/15' },
    laptop: { icon: 'laptop_mac',       color: 'text-yn-neutral-500', bg: 'bg-yn-neutral-500/15' },
    ring:   { icon: 'diamond',          color: 'text-yn-error-400',   bg: 'bg-yn-error-400/15' },
    baby:   { icon: 'child_care',       color: 'text-yn-sec1-700',    bg: 'bg-yn-sec1-700/15' },
    health: { icon: 'favorite',         color: 'text-yn-error-500',   bg: 'bg-yn-error-500/15' },
    pet:    { icon: 'pets',             color: 'text-yn-warning-600', bg: 'bg-yn-warning-400/15' },
    game:   { icon: 'sports_esports',   color: 'text-yn-sec1-600',    bg: 'bg-yn-sec1-600/15' },
    food:   { icon: 'restaurant',       color: 'text-yn-warning-300', bg: 'bg-yn-warning-300/15' },
  };
  if (icono && iconMap[icono]) return iconMap[icono];

  // Auto-detect from name
  const n = (nombre || '').toLowerCase();
  if (n.includes('carro') || n.includes('auto') || n.includes('coche') || n.includes('vehiculo'))
    return iconMap.car;
  if (n.includes('moto') || n.includes('scooter')) return iconMap.moto;
  if (n.includes('viaje') || n.includes('vacacion') || n.includes('vuelo')) return iconMap.plane;
  if (n.includes('playa') || n.includes('verano')) return iconMap.beach;
  if (n.includes('casa') || n.includes('depto') || n.includes('hogar') || n.includes('departamento') || n.includes('piso'))
    return iconMap.house;
  if (n.includes('educacion') || n.includes('estudio') || n.includes('maestria') || n.includes('universidad') || n.includes('curso') || n.includes('carrera') || n.includes('pade'))
    return iconMap.edu;
  if (n.includes('emergencia') || n.includes('fondo') || n.includes('reserva') || n.includes('seguro'))
    return iconMap.shield;
  if (n.includes('negocio') || n.includes('empresa') || n.includes('emprendimiento'))
    return iconMap.work;
  if (n.includes('laptop') || n.includes('comput') || n.includes('celular') || n.includes('tech'))
    return iconMap.laptop;
  if (n.includes('boda') || n.includes('matri') || n.includes('anillo')) return iconMap.ring;
  if (n.includes('beb') || n.includes('hijo') || n.includes('niñ')) return iconMap.baby;
  if (n.includes('salud') || n.includes('médic') || n.includes('cirugía')) return iconMap.health;
  if (n.includes('mascota') || n.includes('perro') || n.includes('gato')) return iconMap.pet;
  if (n.includes('gaming') || n.includes('consola') || n.includes('play')) return iconMap.game;
  return { icon: 'savings', color: 'text-yn-primary-500', bg: 'bg-yn-primary-500/15' };
};

// Map categories to Material Symbols icon names
const getCategoryIcon = (categoria: string, tipo: string): string => {
  if (tipo === 'Ingresos') {
    if (categoria?.includes('Salario')) return 'work';
    if (categoria?.includes('Freelance')) return 'laptop_mac';
    if (categoria?.includes('Inversiones')) return 'trending_up';
    if (categoria?.includes('Intereses')) return 'account_balance';
    if (categoria?.includes('Bonos')) return 'card_giftcard';
    if (categoria?.includes('Rentas')) return 'home';
    return 'payments';
  }
  if (categoria?.includes('Alimentación')) return 'restaurant';
  if (categoria?.includes('Transporte')) return 'directions_car';
  if (categoria?.includes('Salud')) return 'local_pharmacy';
  if (categoria?.includes('Entretenimiento')) return 'sports_esports';
  if (categoria?.includes('Servicios')) return 'electric_bolt';
  if (categoria?.includes('Ropa')) return 'checkroom';
  if (categoria?.includes('Vivienda')) return 'home';
  if (categoria?.includes('Educación')) return 'school';
  if (categoria?.includes('Cuidado Personal')) return 'spa';
  if (categoria?.includes('Tecnología')) return 'devices';
  if (categoria?.includes('Regalos')) return 'redeem';
  if (categoria?.includes('Viajes')) return 'flight';
  if (categoria?.includes('Mascotas')) return 'pets';
  return 'receipt_long';
};

export const Dashboard: React.FC<DashboardProps> = ({ cards, pendingExpenses, history, goals = [], realEstateInvestments = [], profile, onEditTransaction, onDeleteTransaction }) => {
  const { theme, themeName } = useTheme();
  const textColors = getTextColor(themeName);
  const [distributionFilter, setDistributionFilter] = React.useState<'thisMonth' | 'total'>('total');
  const [categoryPeriod, setCategoryPeriod] = React.useState<'week' | 'month' | 'year'>('month');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisMonth');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [visibleTransactions, setVisibleTransactions] = useState(10);
  const [mobileTab, setMobileTab] = useState<'resumen' | 'cuentas' | 'analisis'>('resumen');
  // Yunai Advice State
  const [yunaiAdvice, setYunaiAdvice] = useState<any>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);

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

    // Get start of this week (Monday) — Peru uses Monday as first day
    const thisWeekStart = new Date(todayStart);
    const dayOfWeek = todayStart.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    thisWeekStart.setDate(todayStart.getDate() - ((dayOfWeek + 6) % 7));

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
        return { alias: c.alias, banco: c.banco, tipo_tarjeta: c.tipo_tarjeta, balance: Number(c.limite || 0) + ingresos - gastos, url_imagen: c.url_imagen };
      });

    // Credit cards: limite - deuda pendiente
    const creditAccounts = cards
      .filter(c => getCardType(c) === 'credito')
      .map(c => {
        const deuda = pendingExpenses
          .filter(p => p.tarjeta === c.alias)
          .reduce((sum, p) => sum + Math.max(0, Number(p.monto) - Number(p.monto_pagado_total || 0)), 0);
        return { alias: c.alias, banco: c.banco, tipo_tarjeta: c.tipo_tarjeta, limite: Number(c.limite || 0), disponible: Math.max(0, Number(c.limite || 0) - deuda), deuda, url_imagen: c.url_imagen };
      });

    return { billeteraBalance, debitAccounts, creditAccounts };
  }, [history, cards, pendingExpenses]);

  // Yunai Context — all financial data for AI analysis
  const yunaiContext: YunaiContext = useMemo(() => {
    // Top categories (gastos del mes actual)
    const now = new Date();
    const monthGastos = history.filter(t => {
      if (t.tipo !== 'Gastos') return false;
      const d = new Date(t.timestamp || t.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const catMap = monthGastos.reduce((acc, t) => {
      const cat = t.categoria || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + Number(t.monto);
      return acc;
    }, {} as Record<string, number>);
    const categoriasTop = Object.entries(catMap)
      .map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    return {
      semana: {
        gastoEstaSemana: weeklyComparison.thisWeek,
        gastoSemanaAnterior: weeklyComparison.lastWeek,
        diferencia: weeklyComparison.difference,
        porcentajeCambio: weeklyComparison.percentChange,
      },
      mes: {
        ingresosMes: currentStats.ingresosMes,
        gastosMes: currentStats.gastosMes,
        balanceTotal: currentStats.balanceTotal,
        deudaTotal: currentStats.deudaTotal,
        usoCredito: currentStats.usoCredito,
        limiteTotal: currentStats.limiteTotal,
      },
      categoriasTop,
      cuentas: {
        billetera: accountBreakdown.billeteraBalance,
        tarjetasDebito: accountBreakdown.debitAccounts.map(a => ({ alias: a.alias, balance: a.balance })),
        tarjetasCredito: accountBreakdown.creditAccounts.map(a => ({ alias: a.alias, deuda: a.deuda, disponible: a.disponible })),
      },
      pagos: {
        esteMes: cardPayments.thisMonth.total,
        proximoMes: cardPayments.nextMonth.total,
      },
      nombreUsuario: profile?.nombre || 'amigo',
    };
  }, [weeklyComparison, currentStats, accountBreakdown, cardPayments, history, profile]);

  const fetchYunaiAdvice = React.useCallback(async () => {
    if (isAdviceLoading) return;
    setIsAdviceLoading(true);
    try {
      const result = await getYunaiAdvice(yunaiContext);
      setYunaiAdvice(result);
    } catch (error) {
      console.error('❌ [YunaiAdvice] Error:', error);
      // Fallback: show a generic tip so the component is still visible
      const fallbackTips = [
        'Revisa tus suscripciones mensuales — a veces pagamos por apps que ya no usamos. ¡Cada sol cuenta, causa!',
        'Llevar almuerzo al trabajo puede ahorrarte hasta S/300 al mes. ¡Chévere dato!',
        'La regla 50/30/20: 50% necesidades, 30% gustos, 20% ahorro. ¡Vamos con todo!',
        'Antes de comprar algo, espera 24 horas. Si mañana aún lo quieres, dale nomás.',
        'Los gastos hormiga (café, snacks) pueden sumar más de S/200 al mes. ¡Ponte pilas!',
      ];
      const tip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
      setYunaiAdvice({ consejo: tip, estado: 'bien' as const, categoriaDestacada: '', tipAhorro: '' });
    } finally {
      setIsAdviceLoading(false);
    }
  }, [yunaiContext]);

  // Fetch advice on mount or when context changes significantly
  useEffect(() => {
    if (history.length > 0 && !yunaiAdvice) {
      fetchYunaiAdvice();
    }
  }, [history.length, yunaiAdvice, fetchYunaiAdvice]);

  // Chart Data
  const barData = [
    { name: 'Ingresos', amount: currentStats.ingresosMes, color: CHART_INCOME },
    { name: 'Gastos (Efec)', amount: currentStats.gastosMes, color: CHART_EXPENSE },
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

      {/* Mobile Segmented Control Tabs */}
      <div className="md:hidden -mt-2">
        <div className={`flex ${theme.colors.bgSecondary} p-1.5 rounded-2xl`}>
          {([['resumen', 'Resumen'], ['cuentas', 'Cuentas'], ['analisis', 'Análisis']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                mobileTab === key
                  ? `${theme.colors.bgCard} ${textColors.primary} shadow-sm`
                  : `${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== MOBILE: Tab Resumen ==================== */}
      {/* Balance Total Card - Mobile Version */}
      <div className={`md:hidden ${mobileTab !== 'resumen' ? 'hidden' : ''}`}>
        <section className="relative overflow-hidden rounded-[2rem] p-8 text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #006b3d, #00874e)' }}>
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-widest">Balance Total</p>
            <h2 className="text-4xl font-extrabold mb-8 tracking-tight">
              {formatCurrency(currentStats.balanceTotal)}
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowDownRight size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-bold">Ingresos</p>
                  <p className="text-sm font-bold">{formatCompact(currentStats.ingresosMes)}</p>
                </div>
              </div>
              <div className="flex-1 bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
                  <ArrowUpRight size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-bold">Gastos</p>
                  <p className="text-sm font-bold">{formatCompact(currentStats.gastosMes)}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative circle */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </section>
      </div>

      {/* Metas de Ahorro - Mobile Carousel */}
      {goals.length > 0 && (
        <div className={`md:hidden ${mobileTab !== 'resumen' ? 'hidden' : ''}`}>
          <section>
            <div className="flex justify-between items-end mb-4">
              <h3 className={`text-lg font-bold ${theme.colors.textPrimary}`}>Metas de Ahorro</h3>
              <button className={`${textColors.primary} text-xs font-bold uppercase tracking-wider`}>Ver todas</button>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-2">
              {goals.filter(g => g.estado === 'activa').slice(0, 6).map(goal => {
                const pct = goal.monto_objetivo > 0 ? (goal.monto_ahorrado / goal.monto_objetivo) * 100 : 0;
                const goalMeta = getGoalIcon(goal.nombre, goal.icono);
                return (
                  <div key={goal.id} className={`min-w-[160px] ${theme.colors.bgCard} p-5 rounded-2xl shadow-sm flex flex-col items-center text-center border ${theme.colors.border}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${goalMeta.bg}`}>
                      <span className={`material-symbols-outlined ${goalMeta.color}`} style={{ fontSize: '24px' }}>{goalMeta.icon}</span>
                    </div>
                    <p className={`text-sm font-bold mb-1 ${theme.colors.textPrimary}`}>{goal.nombre}</p>
                    <div className={`w-full h-1.5 ${theme.colors.bgSecondary} rounded-full overflow-hidden mb-2`}>
                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-yn-primary-500' : 'bg-yn-sec1-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <p className={`text-[10px] ${theme.colors.textMuted} font-medium`}>{pct.toFixed(0)}% • {formatCurrency(goal.monto_objetivo)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Movimientos Recientes - Mobile Version */}
      <div className={`md:hidden ${mobileTab !== 'resumen' ? 'hidden' : ''}`}>
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className={`text-lg font-bold ${theme.colors.textPrimary}`}>Movimientos</h3>
            <button className={`${textColors.primary} text-xs font-bold uppercase tracking-wider`}>Historial</button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className={`p-8 text-center ${theme.colors.textMuted} text-sm`}>No hay actividad reciente.</div>
            ) : (
              paginatedTransactions.map((t: any, idx) => (
                <div key={idx} className={`${theme.colors.bgCard} p-4 rounded-2xl flex items-center justify-between border ${theme.colors.border}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                      ${t.tipo === 'Ingresos' ? 'bg-yn-primary-500/10 text-yn-primary-500' :
                        t.isCredit ? `${theme.colors.primaryLight} ${textColors.primary}` : 'bg-yn-error-500/10 text-yn-error-500'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{getCategoryIcon(t.categoria, t.tipo)}</span>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${theme.colors.textPrimary}`}>{t.descripcion}</p>
                      <p className={`text-[10px] ${theme.colors.textMuted} font-medium`}>
                        {formatDateLabel(t.timestamp || t.fecha)}, {formatTimeLabel(t.timestamp || t.fecha)} • {t.categoria}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold font-sans ${t.tipo === 'Ingresos' ? 'text-yn-primary-500' : 'text-yn-error-500'}`}>
                    {t.tipo === 'Ingresos' ? '+' : '-'}{formatCurrency(Number(t.monto))}
                  </p>
                </div>
              ))
            )}
            {hasMoreTransactions && (
              <button
                onClick={() => setVisibleTransactions(prev => prev + 10)}
                className={`w-full py-3 text-sm font-medium ${textColors.primary} ${theme.colors.bgCard} rounded-2xl border ${theme.colors.border}`}
              >
                Ver más ({recentTransactions.length - visibleTransactions} restantes)
              </button>
            )}
          </div>
        </section>
      </div>

      {/* ==================== DESKTOP + MOBILE TABS ==================== */}

      {/* ==================== MOBILE CUENTAS TAB ==================== */}
      <div className={`md:hidden space-y-6 ${mobileTab !== 'cuentas' ? 'hidden' : ''}`}>
        {/* Patrimonio Total Header */}
        <section className="space-y-1">
          <p className={`text-xs font-medium ${theme.colors.textMuted}`}>Patrimonio Total</p>
          <h2 className="font-sans font-extrabold text-2xl text-yn-primary-500">
            {formatCurrency(currentStats.balanceTotal)}
          </h2>
        </section>

        {/* Efectivo y Débito */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm ${theme.colors.textPrimary}`}>Efectivo y Débito</h3>
            <span className="text-[10px] font-bold text-yn-primary-700 bg-yn-primary-300/20 px-2.5 py-0.5 rounded-full">Liquidez</span>
          </div>
          <div className="space-y-2.5">
            {/* Billetera Física */}
            <div className={`${theme.colors.bgCard} p-4 rounded-xl flex items-center justify-between border ${theme.colors.border} shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yn-primary-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-yn-primary-500" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>account_balance_wallet</span>
                </div>
                <div>
                  <p className={`text-sm font-bold ${theme.colors.textPrimary}`}>Billetera Física</p>
                  <p className={`text-[10px] ${theme.colors.textMuted}`}>Efectivo</p>
                </div>
              </div>
              <p className={`text-sm font-bold ${theme.colors.textPrimary}`}>{formatCurrency(accountBreakdown.billeteraBalance)}</p>
            </div>
            {/* Debit Cards */}
            {accountBreakdown.debitAccounts.map(acc => (
              <div key={acc.alias} className={`${theme.colors.bgCard} p-4 rounded-xl flex items-center justify-between border ${theme.colors.border} shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${theme.colors.bgSecondary} flex items-center justify-center overflow-hidden`}>
                    {acc.url_imagen ? (
                      <img src={acc.url_imagen} alt={acc.banco} className="w-7 h-7 rounded-md object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-yn-sec1-500" style={{ fontSize: '20px' }}>account_balance</span>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${theme.colors.textPrimary}`}>{acc.alias}</p>
                    <p className={`text-[10px] ${theme.colors.textMuted}`}>{acc.banco}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${theme.colors.textPrimary}`}>{formatCurrency(acc.balance)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Crédito Disponible */}
        {accountBreakdown.creditAccounts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-sm ${theme.colors.textPrimary}`}>Crédito Disponible</h3>
              <span className="text-[10px] font-bold text-yn-error-500 bg-yn-error-500/10 px-2.5 py-0.5 rounded-full">Líneas de crédito</span>
            </div>
            <div className="space-y-2.5">
              {accountBreakdown.creditAccounts.map((acc, index) => {
                const usoPct = acc.limite > 0 ? ((acc.deuda / acc.limite) * 100) : 0;
                // First card gets the green gradient style
                if (index === 0) {
                  return (
                    <div key={acc.alias} className="p-4 rounded-xl space-y-3 shadow-lg text-white"
                      style={{ background: 'linear-gradient(135deg, #006b3d, #00874e)' }}>
                      <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-white/70" style={{ fontSize: '20px' }}>credit_card</span>
                        <p className="text-[10px] font-bold text-white/50">{acc.banco.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{acc.alias}</p>
                        <p className="text-xl font-extrabold mt-1">{formatCurrency(acc.disponible)}</p>
                      </div>
                      {acc.deuda > 0 && (
                        <>
                          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full rounded-full" style={{ width: `${usoPct}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold text-white/70">
                            <span>Deuda: {formatCurrency(acc.deuda)}</span>
                            <span>Límite: {formatCurrency(acc.limite)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                // Other cards get neutral card style
                return (
                  <div key={acc.alias} className={`${theme.colors.bgCard} p-4 rounded-xl space-y-3 border ${theme.colors.border}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${theme.colors.bgSecondary} flex items-center justify-center overflow-hidden`}>
                          {acc.url_imagen ? (
                            <img src={acc.url_imagen} alt={acc.banco} className="w-7 h-7 rounded-md object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-yn-sec1-700" style={{ fontSize: '20px' }}>credit_card</span>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${theme.colors.textPrimary}`}>{acc.alias}</p>
                          <p className={`text-[10px] ${theme.colors.textMuted}`}>{acc.banco}</p>
                        </div>
                      </div>
                      <p className={`text-base font-extrabold ${theme.colors.textPrimary}`}>{formatCurrency(acc.disponible)}</p>
                    </div>
                    {acc.deuda > 0 && (
                      <>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme.colors.bgSecondary}`}>
                          <div className="bg-yn-primary-500 h-full rounded-full" style={{ width: `${usoPct}%` }} />
                        </div>
                        <div className={`flex justify-between text-[9px] uppercase tracking-wider font-bold ${theme.colors.textMuted}`}>
                          <span>Deuda: {formatCurrency(acc.deuda)}</span>
                          <span>Disponible: {formatCurrency(acc.disponible)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Card Distribution - Mobile Cuentas */}
        {pendingExpenses.length > 0 && (() => {
          const totalDist = cardDistribution.reduce((sum, c) => sum + c.value, 0);
          if (totalDist === 0) return null;
          return (
            <section className="space-y-3">
              <h3 className={`font-bold text-sm ${theme.colors.textPrimary}`}>Distribución por Tarjetas</h3>
              <div className="space-y-2.5">
                {cardDistribution.map((card, idx) => {
                  const pct = (card.value / totalDist) * 100;
                  return (
                    <div key={card.name} className={`${theme.colors.bgCard} p-3 rounded-xl border ${theme.colors.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}20` }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: CHART_COLORS[idx % CHART_COLORS.length] }}>credit_card</span>
                          </div>
                          <div>
                            <p className={`font-semibold text-xs ${theme.colors.textPrimary}`}>{card.name}</p>
                            <p className={`text-[10px] ${theme.colors.textMuted}`}>{pct.toFixed(1)}%</p>
                          </div>
                        </div>
                        <p className={`font-bold text-xs ${theme.colors.textPrimary}`}>{formatCurrency(card.value)}</p>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}15` }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}
      </div>

      {/* Hero Stats: Cash Flow vs Credit (Desktop only) */}
      <div className={`hidden md:grid grid-cols-1 md:grid-cols-2 gap-6`}>

        {/* Cash Flow Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl relative overflow-hidden`}>
            <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>Flujo de Efectivo</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <div className="flex items-center gap-1 text-yn-primary-500 mb-1">
                        <ArrowUpRight size={16} /> <span className="text-xs font-bold">Ingresos</span>
                    </div>
                    <p className={`text-xl md:text-2xl font-sans font-bold ${theme.colors.textPrimary} truncate`}>{formatCurrency(currentStats.ingresosMes)}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-yn-error-400 mb-1">
                        <ArrowDownRight size={16} /> <span className="text-xs font-bold">Gastos</span>
                    </div>
                    <p className={`text-xl md:text-2xl font-sans font-bold ${theme.colors.textPrimary} truncate`}>{formatCurrency(currentStats.gastosMes)}</p>
                </div>
            </div>

            <div className="mt-6 h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" barSize={12}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#6F7D75', fontSize: 10}} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#F6F9F7', borderRadius: '8px', border: '1px solid #D7DFDA'}} itemStyle={{color: '#161C19'}} formatter={(val) => formatCurrency(Number(val))}/>
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
                <p className={`text-xl md:text-2xl font-sans font-bold ${theme.colors.textPrimary} truncate`}>{formatCurrency(currentStats.deudaTotal)}</p>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className={theme.colors.textMuted}>Uso de Línea</span>
                        <span className={`${textColors.primary} font-bold`}>{currentStats.usoCredito.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full h-2 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${currentStats.usoCredito > 70 ? 'bg-yn-error-500' : textColors.primary === 'text-yn-primary-500' ? 'bg-yn-primary-500' : 'bg-yn-sec1-500'}`}
                            style={{width: `${currentStats.usoCredito}%`}}
                        />
                    </div>
                </div>

                <div className={`flex justify-between items-center pt-2 border-t ${theme.colors.borderLight}`}>
                    <span className={`text-xs ${theme.colors.textMuted}`}>Disponible para compras</span>
                    <span className="text-sm font-sans font-bold text-yn-primary-500">{formatCurrency(currentStats.disponible)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* ASSETS SECTION */}
      {realEstateInvestments.length > 0 && (
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl hidden md:block`}>
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
              <p className={`text-base sm:text-xl font-sans font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(assetsMetrics.totalInversion)}
              </p>
            </div>

            {/* Valor Actual */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Valor Actual</p>
              <p className={`text-base sm:text-xl font-sans font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(assetsMetrics.totalValorActual)}
              </p>
            </div>

            {/* Plusvalía */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Plusvalía</p>
              <div className="flex items-center gap-2">
                <p className={`text-base sm:text-xl font-sans font-bold truncate ${assetsMetrics.plusvalia >= 0 ? 'text-yn-primary-500' : 'text-yn-error-500'}`}>
                  {assetsMetrics.plusvalia >= 0 ? '+' : ''}{formatCompact(assetsMetrics.plusvalia)}
                </p>
                {assetsMetrics.plusvalia !== 0 && (
                  <span className={`text-xs font-bold ${assetsMetrics.plusvalia >= 0 ? 'text-yn-primary-500' : 'text-yn-error-500'}`}>
                    ({assetsMetrics.porcentajePlusvalia > 0 ? '+' : ''}{assetsMetrics.porcentajePlusvalia.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Ingresos por Renta */}
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Renta Mensual</p>
              <p className={`text-base sm:text-xl font-sans font-bold truncate ${assetsMetrics.totalRentaMensual > 0 ? 'text-yn-primary-500' : theme.colors.textPrimary}`}>
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
                    <p className={`text-sm font-sans font-bold ${theme.colors.textPrimary}`}>
                      {formatCurrency(inv.valor_actual)}
                    </p>
                    <p className={`text-xs font-semibold ${plusvalia >= 0 ? 'text-yn-primary-500' : 'text-yn-error-500'}`}>
                      {plusvalia >= 0 ? '+' : ''}{formatCurrency(plusvalia)} ({porcentaje > 0 ? '+' : ''}{porcentaje.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yunai Advice — visible in Resumen (mobile) and always on desktop */}
      <div className={`${mobileTab !== 'resumen' ? 'hidden md:block' : ''}`}>
        <YunaiAdvice
          advice={yunaiAdvice?.consejo}
          isLoading={isAdviceLoading}
          onRefresh={fetchYunaiAdvice}
          userName={profile?.nombre}
        />
      </div>

      {/* NEW FEATURES ROW */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${mobileTab !== 'analisis' ? 'hidden md:grid' : ''}`}>

        {/* Weekly Comparison Card */}
        <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl`}>
          <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider mb-4`}>
            Gastos Semanales
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Esta semana</p>
              <p className={`text-xl sm:text-2xl font-sans font-bold truncate ${theme.colors.textPrimary}`}>
                {formatCompact(weeklyComparison.thisWeek)}
              </p>
            </div>

            <div>
              <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Semana pasada</p>
              <p className={`text-lg font-sans font-bold truncate ${theme.colors.textSecondary}`}>
                {formatCompact(weeklyComparison.lastWeek)}
              </p>
            </div>

            <div className={`p-3 rounded-xl ${
              weeklyComparison.difference > 0 ? 'bg-yn-error-500/10' : 'bg-yn-success-500/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme.colors.textMuted}`}>Variación</span>
                <div className="flex items-center gap-1">
                  {weeklyComparison.difference > 0 ? (
                    <ArrowUpRight className="text-yn-error-500" size={16} />
                  ) : weeklyComparison.difference < 0 ? (
                    <ArrowDownRight className="text-yn-success-500" size={16} />
                  ) : null}
                  <span className={`font-bold text-sm ${
                    weeklyComparison.difference > 0 ? 'text-yn-error-500' :
                    weeklyComparison.difference < 0 ? 'text-yn-success-500' :
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
              <p className={`text-xl sm:text-2xl font-sans font-bold truncate ${theme.colors.textPrimary}`}>
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
                  <span className={`text-xs font-bold ${theme.colors.textPrimary} bg-yn-primary-500/10 px-2 py-1 rounded`}>
                    {cardPayments.thisMonth.details.length} {cardPayments.thisMonth.details.length === 1 ? 'tarjeta' : 'tarjetas'}
                  </span>
                </div>

                {cardPayments.thisMonth.details.length > 0 && (
                  <div className="space-y-1.5">
                    {cardPayments.thisMonth.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.textMuted}`}>{detail.card}</span>
                        <span className={`text-xs font-sans font-semibold ${theme.colors.textPrimary}`}>
                          {formatCurrency(detail.amount)}
                        </span>
                      </div>
                    ))}
                    {cardPayments.thisMonth.details.length > 1 && (
                      <div className={`flex justify-between items-center pt-2 mt-2 border-t ${theme.colors.border}`}>
                        <span className={`text-xs font-bold ${theme.colors.textSecondary}`}>Total</span>
                        <span className={`text-sm font-sans font-bold ${theme.colors.textPrimary}`}>
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
              <p className={`text-xl sm:text-2xl font-sans font-bold truncate ${theme.colors.textPrimary}`}>
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
                  <span className={`text-xs font-bold ${theme.colors.textPrimary} bg-yn-sec1-500/10 px-2 py-1 rounded`}>
                    {cardPayments.nextMonth.details.length} {cardPayments.nextMonth.details.length === 1 ? 'tarjeta' : 'tarjetas'}
                  </span>
                </div>

                {cardPayments.nextMonth.details.length > 0 && (
                  <div className="space-y-1.5">
                    {cardPayments.nextMonth.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`text-xs ${theme.colors.textMuted}`}>{detail.card}</span>
                        <span className={`text-xs font-sans font-semibold ${theme.colors.textPrimary}`}>
                          {formatCurrency(detail.amount)}
                        </span>
                      </div>
                    ))}
                    {cardPayments.nextMonth.details.length > 1 && (
                      <div className={`flex justify-between items-center pt-2 mt-2 border-t ${theme.colors.border}`}>
                        <span className={`text-xs font-bold ${theme.colors.textSecondary}`}>Total</span>
                        <span className={`text-sm font-sans font-bold ${theme.colors.textPrimary}`}>
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
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden hidden md:block`}>
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
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}>
                            <CreditIcon size={18} style={{ color: CHART_COLORS[index % CHART_COLORS.length] }} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${theme.colors.textPrimary}`}>{card.name}</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>{percentage.toFixed(1)}% del total</p>
                          </div>
                        </div>
                        <p className={`font-bold font-sans text-base sm:text-lg truncate ${theme.colors.textPrimary}`}>{formatCompact(card.value)}</p>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden`} style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}15` }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
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

      {/* Balance Total Card - Destacado (Desktop only when resumen tab not active on mobile) */}
      <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border-2 ${
        currentStats.balanceTotal >= 0 ? 'border-yn-primary-500' : 'border-yn-error-500'
      } shadow-2xl relative overflow-hidden hidden md:block`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${
            currentStats.balanceTotal >= 0 ? 'bg-yn-primary-500/10' : 'bg-yn-error-500/10'
          }`}>
            <Wallet className={currentStats.balanceTotal >= 0 ? 'text-yn-primary-500' : 'text-yn-error-400'} size={28} />
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
          <p className={`text-2xl sm:text-3xl md:text-4xl font-sans font-bold truncate ${
            currentStats.balanceTotal >= 0 ? 'text-yn-primary-500' : 'text-yn-error-400'
          }`}>
            {formatCompact(currentStats.balanceTotal)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t ${theme.colors.borderLight}">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight className="text-yn-primary-500" size={14} />
              <p className={`text-xs ${theme.colors.textMuted}`}>Total Ingresos</p>
            </div>
            <p className={`text-base sm:text-lg font-sans font-bold truncate ${theme.colors.textPrimary}`}>
              {formatCompact(currentStats.ingresosTotal)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownRight className="text-yn-error-400" size={14} />
              <p className={`text-xs ${theme.colors.textMuted}`}>Total Gastos</p>
            </div>
            <p className={`text-base sm:text-lg font-sans font-bold truncate ${theme.colors.textPrimary}`}>
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
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-yn-primary-500/10`}>
                <FontAwesomeIcon icon={faWallet} className="text-yn-primary-500" style={{ fontSize: '13px' }} />
              </div>
              <span className={`text-sm font-medium ${theme.colors.textPrimary}`}>Billetera Física</span>
            </div>
            <span className={`text-sm font-sans font-bold truncate ${accountBreakdown.billeteraBalance >= 0 ? 'text-yn-primary-500' : 'text-yn-error-400'}`}>
              {formatCurrency(accountBreakdown.billeteraBalance)}
            </span>
          </div>
          {/* Debit cards */}
          {accountBreakdown.debitAccounts.map(acc => (
            <div key={acc.alias} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-yn-sec1-500/10`}>
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-yn-sec1-400" style={{ fontSize: '12px' }} />
                </div>
                <div>
                  <span className={`text-sm font-medium ${theme.colors.textPrimary}`}>{acc.alias}</span>
                  <span className={`text-[10px] ${theme.colors.textMuted} ml-1`}>{acc.banco}</span>
                </div>
              </div>
              <span className={`text-sm font-sans font-bold truncate ${acc.balance >= 0 ? 'text-yn-primary-500' : 'text-yn-error-400'}`}>
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
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-yn-sec1-700/10`}>
                      <FontAwesomeIcon icon={faCreditCard} className="text-yn-sec1-700" style={{ fontSize: '12px' }} />
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${theme.colors.textPrimary}`}>{acc.alias}</span>
                      <span className={`text-[10px] ${theme.colors.textMuted} ml-1`}>{acc.banco}</span>
                      {acc.deuda > 0 && (
                        <span className="text-[10px] text-yn-error-400 ml-1">· deuda {formatCurrency(acc.deuda)}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-sans font-bold truncate text-yn-sec1-700">
                    {formatCurrency(acc.disponible)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Goals Summary - Savings Goals (Desktop version - hidden on mobile, mobile has carousel) */}
      {goals.length > 0 && (() => {
        const activeGoals = goals.filter(g => g.estado === 'activa');
        const totalApartado = goals.reduce((s, g) => s + g.monto_ahorrado, 0);
        // balanceTotal ya descuenta Aporte_Meta — no restar totalApartado de nuevo
        const saldoDisponible = currentStats.balanceTotal;

        return (
          <div className={`${theme.colors.bgCard} backdrop-blur-md p-6 rounded-3xl border ${theme.colors.border} shadow-xl hidden md:block`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className={textColors.primary} size={20} />
                <h3 className={`${theme.colors.textMuted} font-bold uppercase text-xs tracking-wider`}>
                  Metas de Ahorro
                </h3>
              </div>
              <div className="text-right">
                <p className={`text-[10px] ${theme.colors.textMuted}`}>Saldo Disponible</p>
                <p className={`text-sm font-sans font-bold truncate ${saldoDisponible >= 0 ? 'text-yn-primary-500' : 'text-yn-error-400'}`}>
                  {formatCurrency(saldoDisponible)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map(goal => {
                const pct = goal.monto_objetivo > 0 ? (goal.monto_ahorrado / goal.monto_objetivo) * 100 : 0;
                const barColor = pct >= 100 ? 'bg-yn-primary-500' : 'bg-gradient-to-r from-yn-sec1-500 to-yn-primary-500';
                const pctColor = pct >= 100 ? 'text-yn-primary-500' : textColors.primary;

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

      {/* Recent Activity (Desktop version - hidden on mobile, mobile has its own) */}
      <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden hidden md:block`}>
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                            ${t.tipo === 'Ingresos' ? 'bg-yn-primary-500/10 text-yn-primary-500' :
                                              t.isCredit ? `${theme.colors.primaryLight} ${textColors.primary}` : 'bg-yn-error-500/10 text-yn-error-500'}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{getCategoryIcon(t.categoria, t.tipo)}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                              <p className={`font-medium ${theme.colors.textPrimary} text-sm`}>{t.descripcion}</p>
                                              {t.isSuscripcion && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-yn-sec1-700/10 text-yn-sec1-700">
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
                                                    className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-yn-sec1-500/20 transition-colors`}
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} className="text-yn-sec1-400" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTransaction?.(t as Transaction)}
                                                    className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-yn-error-500/20 transition-colors`}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} className="text-yn-error-400" />
                                                </button>
                                            </div>
                                        )}
                                        <span className={`font-sans font-bold text-sm ${t.tipo === 'Ingresos' ? 'text-yn-primary-500' : 'text-yn-error-500'}`}>
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

      {/* Category Analysis - Bar Chart with Period Filter (Tab Análisis) */}
      {(() => {
        const now = new Date();
        const filteredHistory = history.filter(t => {
          if (t.tipo !== 'Gastos') return false;
          const d = new Date(t.timestamp || t.fecha);
          if (categoryPeriod === 'week') {
            const dow = now.getDay(); // 0=Sun..6=Sat
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((dow + 6) % 7));
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
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden ${mobileTab !== 'analisis' ? 'hidden md:block' : ''}`}>
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
                        tick={{ fill: '#56635C', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #D7DFDA',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        itemStyle={{ color: '#161C19' }}
                        formatter={(val: number) => formatCurrency(val)}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className={`font-medium text-sm ${theme.colors.textPrimary} truncate`}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-xs ${theme.colors.textMuted}`}>{percentage.toFixed(0)}%</span>
                          <span className={`font-bold text-sm font-sans truncate ${theme.colors.textPrimary}`}>{formatCurrency(cat.value)}</span>
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
          <div className={`${theme.colors.bgCard} backdrop-blur-md rounded-3xl border ${theme.colors.border} shadow-xl overflow-hidden ${mobileTab !== 'analisis' ? 'hidden md:block' : ''}`}>
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
                    <Line type="monotone" dataKey="ingresos" stroke={CHART_INCOME} strokeWidth={2} name="Ingresos" />
                    <Line type="monotone" dataKey="gastos" stroke={CHART_EXPENSE} strokeWidth={2} name="Gastos" />
                    <Line type="monotone" dataKey="ahorro" stroke={CHART_SAVINGS} strokeWidth={2} name="Ahorro" />
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
