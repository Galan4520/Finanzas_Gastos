import React, { useState, useMemo } from 'react';
import { Transaction, Goal, CreditCard, getCardType } from '../types';
import { formatCurrency, formatCompact, getLocalISOString } from '../utils/format';
import { Target, Plus, Trash2, Edit2, Save, X, PiggyBank, ArrowUpRight, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCar, faPlane, faHouse, faGraduationCap, faShield, faBriefcase,
  faLaptop, faHeart, faHeartPulse, faPiggyBank, faMotorcycle,
  faUmbrellaBeach, faRing, faBaby, faDog, faGamepad, faUtensils, faWallet, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

const uuidv4 = () => self.crypto.randomUUID();

const ICON_OPTIONS = [
  { key: 'car',     icon: faCar,           label: 'Auto',       color: 'text-blue-500',    bg: 'bg-blue-500/10',    accent: '#3b82f6' },
  { key: 'moto',    icon: faMotorcycle,    label: 'Moto',       color: 'text-orange-500',  bg: 'bg-orange-500/10',  accent: '#f97316' },
  { key: 'plane',   icon: faPlane,         label: 'Viaje',      color: 'text-sky-500',     bg: 'bg-sky-500/10',     accent: '#0ea5e9' },
  { key: 'beach',   icon: faUmbrellaBeach, label: 'Playa',      color: 'text-yellow-500',  bg: 'bg-yellow-500/10',  accent: '#eab308' },
  { key: 'house',   icon: faHouse,         label: 'Casa',       color: 'text-emerald-600', bg: 'bg-emerald-500/10', accent: '#10b981' },
  { key: 'edu',     icon: faGraduationCap, label: 'Educación',  color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  accent: '#6366f1' },
  { key: 'shield',  icon: faShield,        label: 'Emergencia', color: 'text-rose-500',    bg: 'bg-rose-500/10',    accent: '#f43f5e' },
  { key: 'work',    icon: faBriefcase,     label: 'Negocio',    color: 'text-amber-600',   bg: 'bg-amber-500/10',   accent: '#d97706' },
  { key: 'laptop',  icon: faLaptop,        label: 'Tech',       color: 'text-slate-500',   bg: 'bg-slate-500/10',   accent: '#64748b' },
  { key: 'ring',    icon: faRing,          label: 'Boda',       color: 'text-pink-500',    bg: 'bg-pink-500/10',    accent: '#ec4899' },
  { key: 'baby',    icon: faBaby,          label: 'Bebé',       color: 'text-purple-400',  bg: 'bg-purple-500/10',  accent: '#a855f7' },
  { key: 'health',  icon: faHeartPulse,    label: 'Salud',      color: 'text-red-500',     bg: 'bg-red-500/10',     accent: '#ef4444' },
  { key: 'pet',     icon: faDog,           label: 'Mascota',    color: 'text-amber-600',   bg: 'bg-amber-200/40',   accent: '#d97706' },
  { key: 'game',    icon: faGamepad,       label: 'Gaming',     color: 'text-violet-500',  bg: 'bg-violet-500/10',  accent: '#8b5cf6' },
  { key: 'food',    icon: faUtensils,      label: 'Comida',     color: 'text-orange-400',  bg: 'bg-orange-500/10',  accent: '#fb923c' },
  { key: 'heart',   icon: faHeart,         label: 'Amor',       color: 'text-rose-400',    bg: 'bg-rose-500/10',    accent: '#fb7185' },
  { key: 'piggy',   icon: faPiggyBank,     label: 'Ahorro',     color: 'text-emerald-500', bg: 'bg-emerald-500/10', accent: '#10b981' },
];

interface GoalsViewProps {
  history: Transaction[];
  goals: Goal[];
  cards: CreditCard[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onContributeToGoal: (metaId: string, monto: number, cuenta?: string) => void;
  onRomperMeta: (metaId: string, monto: number, cuenta?: string) => void;
}

const EMPTY_FORM = {
  nombre: '',
  monto_objetivo: 0,
  notas: '',
  icono: '',
};

const getGoalMeta = (nombre: string, icono?: string): { icon: any; color: string; bg: string; accent: string } => {
  if (icono) {
    const found = ICON_OPTIONS.find(opt => opt.key === icono);
    if (found) return { icon: found.icon, color: found.color, bg: found.bg, accent: found.accent };
  }
  const n = (nombre || '').toLowerCase();
  if (n.includes('carro') || n.includes('auto') || n.includes('coche') || n.includes('vehiculo') || n.includes('camioneta'))
    return { icon: faCar, color: 'text-blue-500', bg: 'bg-blue-500/10', accent: '#3b82f6' };
  if (n.includes('moto') || n.includes('scooter'))
    return { icon: faMotorcycle, color: 'text-orange-500', bg: 'bg-orange-500/10', accent: '#f97316' };
  if (n.includes('viaje') || n.includes('vacacion') || n.includes('trip') || n.includes('vuelo'))
    return { icon: faPlane, color: 'text-sky-500', bg: 'bg-sky-500/10', accent: '#0ea5e9' };
  if (n.includes('playa') || n.includes('verano'))
    return { icon: faUmbrellaBeach, color: 'text-yellow-500', bg: 'bg-yellow-500/10', accent: '#eab308' };
  if (n.includes('casa') || n.includes('depto') || n.includes('hogar') || n.includes('departamento') || n.includes('piso'))
    return { icon: faHouse, color: 'text-emerald-600', bg: 'bg-emerald-500/10', accent: '#10b981' };
  if (n.includes('educacion') || n.includes('estudio') || n.includes('maestria') || n.includes('universidad') || n.includes('curso') || n.includes('carrera'))
    return { icon: faGraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10', accent: '#6366f1' };
  if (n.includes('emergencia') || n.includes('fondo') || n.includes('seguro') || n.includes('reserve'))
    return { icon: faShield, color: 'text-rose-500', bg: 'bg-rose-500/10', accent: '#f43f5e' };
  if (n.includes('negocio') || n.includes('empresa') || n.includes('inversion') || n.includes('emprendimiento'))
    return { icon: faBriefcase, color: 'text-amber-600', bg: 'bg-amber-500/10', accent: '#d97706' };
  if (n.includes('telefono') || n.includes('celular') || n.includes('computadora') || n.includes('laptop') || n.includes('pc') || n.includes('mac'))
    return { icon: faLaptop, color: 'text-slate-500', bg: 'bg-slate-500/10', accent: '#64748b' };
  if (n.includes('boda') || n.includes('matrimonio') || n.includes('anillo'))
    return { icon: faRing, color: 'text-pink-500', bg: 'bg-pink-500/10', accent: '#ec4899' };
  if (n.includes('bebe') || n.includes('hijo') || n.includes('familia') || n.includes('niño'))
    return { icon: faBaby, color: 'text-purple-400', bg: 'bg-purple-500/10', accent: '#a855f7' };
  if (n.includes('salud') || n.includes('medico') || n.includes('hospital'))
    return { icon: faHeartPulse, color: 'text-red-500', bg: 'bg-red-500/10', accent: '#ef4444' };
  if (n.includes('mascota') || n.includes('perro') || n.includes('gato'))
    return { icon: faDog, color: 'text-amber-600', bg: 'bg-amber-200/40', accent: '#d97706' };
  if (n.includes('juego') || n.includes('consola') || n.includes('ps') || n.includes('xbox') || n.includes('nintendo'))
    return { icon: faGamepad, color: 'text-violet-500', bg: 'bg-violet-500/10', accent: '#8b5cf6' };
  if (n.includes('restaurante') || n.includes('comida') || n.includes('cena'))
    return { icon: faUtensils, color: 'text-orange-400', bg: 'bg-orange-500/10', accent: '#fb923c' };
  return { icon: faPiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-500/10', accent: '#10b981' };
};

// Custom donut center label
const DonutLabel = ({ cx, cy, label, sub }: { cx: number; cy: number; label: string; sub: string }) => (
  <g>
    <text x={cx} y={cy - 6} textAnchor="middle" fill="currentColor" fontSize={15} fontWeight={700} className="fill-current">{label}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} className="fill-current opacity-50">{sub}</text>
  </g>
);

export const GoalsView: React.FC<GoalsViewProps> = ({ history, goals, cards, onAddGoal, onUpdateGoal, onDeleteGoal, onContributeToGoal, onRomperMeta }) => {
  const { theme } = useTheme();
  const { currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeAccount, setContributeAccount] = useState('Billetera');
  const [contributeError, setContributeError] = useState('');

  // Romper chanchito state
  const [breakGoal, setBreakGoal] = useState<Goal | null>(null);
  const [breakAmount, setBreakAmount] = useState('');
  const [breakAccount, setBreakAccount] = useState('Billetera');

  // Eliminar meta con fondos — modal de devolución
  const [deleteGoalTarget, setDeleteGoalTarget] = useState<Goal | null>(null);
  const [deleteReturnAccount, setDeleteReturnAccount] = useState('Billetera');

  const activeGoals = goals.filter(g => g.estado === 'activa');
  const completedGoals = goals.filter(g => g.estado === 'completada');
  const totalApartado = goals.reduce((sum, g) => sum + g.monto_ahorrado, 0);
  const totalObjetivo = activeGoals.reduce((sum, g) => sum + g.monto_objetivo, 0);

  // Account balances — envelope budgeting
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    const INGRESO_TYPES: string[] = ['Ingresos', 'Ruptura_Meta'];
    const GASTO_TYPES: string[] = ['Gastos', 'Aporte_Meta'];
    const billeteraIng = history.filter(t => INGRESO_TYPES.includes(t.tipo) && t.cuenta === 'Billetera').reduce((s, t) => s + Number(t.monto), 0);
    const billeteraGas = history.filter(t => GASTO_TYPES.includes(t.tipo) && t.cuenta === 'Billetera').reduce((s, t) => s + Number(t.monto), 0);
    balances['Billetera'] = billeteraIng - billeteraGas;
    cards.filter(c => getCardType(c) === 'debito').forEach(card => {
      const ing = history.filter(t => INGRESO_TYPES.includes(t.tipo) && t.cuenta === card.alias).reduce((s, t) => s + Number(t.monto), 0);
      const gas = history.filter(t => GASTO_TYPES.includes(t.tipo) && t.cuenta === card.alias).reduce((s, t) => s + Number(t.monto), 0);
      balances[card.alias] = Number(card.limite || 0) + ing - gas;
    });
    return balances;
  }, [history, cards]);

  // Total free balance across all accounts
  const totalSaldoLibre = useMemo(() =>
    Object.values(accountBalances).reduce((s, v) => s + v, 0),
    [accountBalances]
  );

  const accountOptions = useMemo(() => {
    const debitCards = cards.filter(c => getCardType(c) === 'debito');
    return [
      { value: 'Billetera', label: 'Billetera Física', balance: accountBalances['Billetera'] ?? 0, icon: faWallet },
      ...debitCards.map(c => ({ value: c.alias, label: `${c.alias} · ${c.banco}`, balance: accountBalances[c.alias] ?? 0, icon: faMoneyBillWave })),
    ];
  }, [cards, accountBalances]);

  // Recent activity (Aporte_Meta + Ruptura_Meta) sorted desc
  const recentActivity = useMemo(() =>
    history
      .filter(t => t.tipo === 'Aporte_Meta' || t.tipo === 'Ruptura_Meta')
      .sort((a, b) => new Date(b.timestamp || b.fecha).getTime() - new Date(a.timestamp || a.fecha).getTime())
      .slice(0, 6),
    [history]
  );

  // Donut chart data
  const donutData = useMemo(() => {
    const libre = Math.max(0, totalSaldoLibre);
    const apartado = totalApartado;
    if (libre === 0 && apartado === 0) return [{ name: 'Sin datos', value: 1, color: '#374151' }];
    const result = [];
    if (apartado > 0) result.push({ name: 'En metas', value: apartado, color: '#10b981' });
    if (libre > 0) result.push({ name: 'Libre', value: libre, color: '#6366f1' });
    return result;
  }, [totalSaldoLibre, totalApartado]);

  // Per-goal monthly average aporte (last 30 days)
  const monthlyAporteByGoal = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const result: Record<string, number> = {};
    history.filter(t => t.tipo === 'Aporte_Meta' && t.meta_id && (now - new Date(t.timestamp || t.fecha).getTime()) < thirtyDays)
      .forEach(t => { result[t.meta_id!] = (result[t.meta_id!] || 0) + Number(t.monto); });
    return result;
  }, [history]);

  const handleSave = () => {
    if (!formData.nombre.trim() || formData.monto_objetivo <= 0) return;
    const goal: Goal = {
      id: editingId || ('META' + Date.now()),
      nombre: formData.nombre.trim(),
      monto_objetivo: formData.monto_objetivo,
      monto_ahorrado: editingId ? (goals.find(g => g.id === editingId)?.monto_ahorrado || 0) : 0,
      notas: formData.notas,
      estado: 'activa',
      icono: formData.icono || undefined,
      timestamp: getLocalISOString(),
    };
    if (editingId) { onUpdateGoal(goal); } else { onAddGoal(goal); }
    setShowForm(false); setEditingId(null); setFormData(EMPTY_FORM);
  };

  const handleEdit = (goal: Goal) => {
    setFormData({ nombre: goal.nombre, monto_objetivo: goal.monto_objetivo, notas: goal.notas || '', icono: goal.icono || '' });
    setEditingId(goal.id); setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY_FORM); };

  const handleContribute = (goalId: string) => {
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) return;
    const saldo = accountBalances[contributeAccount] ?? 0;
    if (amount > saldo) {
      setContributeError(`Saldo insuficiente. Disponible: ${formatCurrency(saldo)}`);
      return;
    }
    onContributeToGoal(goalId, amount, contributeAccount);
    setContributeId(null); setContributeAmount(''); setContributeAccount('Billetera'); setContributeError('');
  };

  const openBreakModal = (goal: Goal) => { setBreakGoal(goal); setBreakAmount(''); setBreakAccount('Billetera'); };

  const handleBreak = () => {
    if (!breakGoal) return;
    const amount = parseFloat(breakAmount);
    if (isNaN(amount) || amount <= 0 || amount > breakGoal.monto_ahorrado) return;
    onRomperMeta(breakGoal.id, amount, breakAccount);
    setBreakGoal(null); setBreakAmount('');
  };

  const handleDeleteGoal = (goal: Goal) => {
    if (goal.monto_ahorrado > 0) {
      // Tiene fondos — mostrar modal de devolución
      setDeleteGoalTarget(goal);
      setDeleteReturnAccount('Billetera');
    } else {
      onDeleteGoal(goal.id);
    }
  };

  const handleConfirmDeleteWithFunds = () => {
    if (!deleteGoalTarget) return;
    // 1. Devolver fondos a la cuenta seleccionada
    onRomperMeta(deleteGoalTarget.id, deleteGoalTarget.monto_ahorrado, deleteReturnAccount);
    // 2. Eliminar la meta (pequeño delay para que el optimistic update de romperMeta se procese primero)
    setTimeout(() => onDeleteGoal(deleteGoalTarget.id), 50);
    setDeleteGoalTarget(null);
  };

  const inputClass = `w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-xl px-4 py-3 ${theme.colors.textPrimary} outline-none focus:ring-2 focus:ring-current`;
  const breakAmountNum = parseFloat(breakAmount) || 0;
  const breakNuevoAhorrado = breakGoal ? Math.max(0, breakGoal.monto_ahorrado - breakAmountNum) : 0;
  const breakNuevoPorcentaje = breakGoal && breakGoal.monto_objetivo > 0 ? (breakNuevoAhorrado / breakGoal.monto_objetivo) * 100 : 0;
  const breakPorcentajeActual = breakGoal && breakGoal.monto_objetivo > 0 ? (breakGoal.monto_ahorrado / breakGoal.monto_objetivo) * 100 : 0;
  const breakNuevoRestante = breakGoal ? Math.max(0, breakGoal.monto_objetivo - breakNuevoAhorrado) : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
            <PiggyBank className={textColors.primary} size={28} />
            Metas de Ahorro
          </h2>
          <p className={`${theme.colors.textMuted} text-sm mt-0.5`}>
            {activeGoals.length === 0 ? 'Crea tu primera meta' : `${activeGoals.length} activa${activeGoals.length !== 1 ? 's' : ''} · ${formatCurrency(totalApartado)} comprometidos`}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className={`flex items-center gap-2 ${theme.colors.primary} text-white px-4 py-2 rounded-xl shadow-lg transition-all ${theme.colors.primaryHover}`}>
            <Plus size={16} /> Nueva Meta
          </button>
        )}
      </div>

      {/* ── KPI + Donut dashboard row ── */}
      {goals.length > 0 && (
        <div className={`${theme.colors.bgCard} rounded-3xl border ${theme.colors.border} shadow-xl p-6`}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Donut */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wider mb-2`}>Distribución de fondos</p>
              <div className="relative" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={donutData.length > 1 ? 3 : 0}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ background: 'var(--color-bg-card, #1e293b)', border: 'none', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className={`text-sm font-mono font-bold ${textColors.primary}`}>
                    {totalObjetivo > 0 ? ((totalApartado / totalObjetivo) * 100).toFixed(0) : 0}%
                  </p>
                  <p className={`text-[10px] ${theme.colors.textMuted}`}>logrado</p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-3 mt-1">
                {donutData.filter(d => d.name !== 'Sin datos').map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className={`text-[10px] ${theme.colors.textMuted}`}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total apartado */}
              <div className={`p-4 rounded-2xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Target size={14} className="text-emerald-500" />
                  </div>
                  <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wide`}>Apartado</p>
                </div>
                <p className={`text-base sm:text-lg font-mono font-bold truncate ${textColors.primary}`}>{formatCompact(totalApartado)}</p>
                <p className={`text-[10px] ${theme.colors.textMuted} mt-0.5`}>en {activeGoals.length} meta{activeGoals.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Saldo libre */}
              <div className={`p-4 rounded-2xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faWallet} className="text-indigo-400" style={{ fontSize: '12px' }} />
                  </div>
                  <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wide`}>Saldo libre</p>
                </div>
                <p className={`text-base sm:text-lg font-mono font-bold truncate ${totalSaldoLibre >= 0 ? theme.colors.textPrimary : 'text-rose-400'}`}>
                  {formatCompact(Math.max(0, totalSaldoLibre))}
                </p>
                <p className={`text-[10px] ${theme.colors.textMuted} mt-0.5`}>disponible</p>
              </div>

              {/* Objetivo total */}
              <div className={`p-4 rounded-2xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp size={14} className="text-amber-500" />
                  </div>
                  <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wide`}>Objetivo</p>
                </div>
                <p className={`text-base sm:text-lg font-mono font-bold truncate ${theme.colors.textPrimary}`}>{formatCompact(totalObjetivo)}</p>
                <p className={`text-[10px] ${theme.colors.textMuted} mt-0.5`}>falta {formatCurrency(Math.max(0, totalObjetivo - totalApartado))}</p>
              </div>

              {/* Completadas */}
              <div className={`p-4 rounded-2xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle size={14} className="text-emerald-500" />
                  </div>
                  <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wide`}>Completadas</p>
                </div>
                <p className={`text-lg font-mono font-bold ${theme.colors.textPrimary}`}>{completedGoals.length}</p>
                <p className={`text-[10px] ${theme.colors.textMuted} mt-0.5`}>de {goals.length} en total</p>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          {totalObjetivo > 0 && (
            <div className={`mt-5 pt-4 border-t ${theme.colors.border}`}>
              <div className="flex justify-between items-center mb-1.5">
                <p className={`text-xs font-medium ${theme.colors.textMuted}`}>Progreso general hacia todas las metas</p>
                <p className={`text-xs font-bold ${textColors.primary}`}>{((totalApartado / totalObjetivo) * 100).toFixed(1)}%</p>
              </div>
              <div className={`w-full h-2.5 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, (totalApartado / totalObjetivo) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create/Edit Form ── */}
      {showForm && (
        <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
          <div className="flex items-center gap-3 mb-4">
            {(() => {
              const preview = getGoalMeta(formData.nombre, formData.icono);
              return (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${preview.bg}`}>
                  <FontAwesomeIcon icon={preview.icon} style={{ fontSize: '18px', color: preview.accent }} />
                </div>
              );
            })()}
            <h3 className={`text-lg font-bold ${theme.colors.textPrimary}`}>
              {editingId ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>Nombre de la meta</label>
              <input type="text" value={formData.nombre} onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Carro, Viaje, Emergencia..." className={inputClass} />
            </div>

            {/* Icon picker */}
            <div>
              <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>
                Ícono
                {!formData.icono && formData.nombre && (
                  <span className={`ml-2 text-xs font-normal ${theme.colors.textMuted}`}>
                    (auto-detectado del nombre)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {/* "Auto" option — clears custom icon */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icono: '' }))}
                  title="Auto-detectar"
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${theme.colors.bgSecondary} ${
                    !formData.icono
                      ? 'border-emerald-500 opacity-100'
                      : `${theme.colors.border} opacity-50 hover:opacity-80`
                  }`}
                >
                  <span className={`text-base leading-none ${theme.colors.textMuted}`}>✨</span>
                  <span className={`text-[9px] ${theme.colors.textMuted} leading-tight`}>Auto</span>
                </button>
                {ICON_OPTIONS.map(opt => {
                  const isSelected = formData.icono === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icono: opt.key }))}
                      title={opt.label}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-2 opacity-100'
                          : `${theme.colors.border} border ${theme.colors.bgSecondary} opacity-60 hover:opacity-90`
                      }`}
                      style={isSelected ? { borderColor: opt.accent, background: opt.accent + '18' } : {}}
                    >
                      <FontAwesomeIcon icon={opt.icon} style={{ fontSize: '14px', color: isSelected ? opt.accent : undefined }} className={isSelected ? '' : theme.colors.textMuted} />
                      <span className={`text-[9px] leading-tight ${isSelected ? '' : theme.colors.textMuted}`} style={isSelected ? { color: opt.accent } : {}}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>Monto objetivo (S/)</label>
                <input type="number" max="99999999" value={formData.monto_objetivo || ''} onChange={e => setFormData(prev => ({ ...prev, monto_objetivo: parseFloat(e.target.value) || 0 }))} placeholder="20000" className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>Notas (opcional)</label>
                <input type="text" value={formData.notas} onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))} placeholder="Para qué es esta meta..." className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCancel} className={`flex items-center gap-2 ${theme.colors.bgSecondary} ${theme.colors.textPrimary} px-4 py-2 rounded-lg transition-colors`}>
                <X size={16} /> Cancelar
              </button>
              <button onClick={handleSave} disabled={!formData.nombre.trim() || formData.monto_objetivo <= 0} className={`flex items-center gap-2 ${theme.colors.primary} text-white px-4 py-2 rounded-lg transition-all shadow-lg disabled:opacity-50 ${theme.colors.primaryHover}`}>
                <Save size={16} /> {editingId ? 'Actualizar' : 'Crear Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content: Goals + Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Goals grid (2/3 width on XL) */}
        <div className="xl:col-span-2 space-y-4">
          {activeGoals.length > 0 && (
            <>
              <h3 className={`text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wider`}>Metas Activas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map(goal => {
                  const porcentaje = goal.monto_objetivo > 0 ? (goal.monto_ahorrado / goal.monto_objetivo) * 100 : 0;
                  const restante = Math.max(0, goal.monto_objetivo - goal.monto_ahorrado);
                  const isContributing = contributeId === goal.id;
                  const goalMeta = getGoalMeta(goal.nombre, goal.icono);
                  const selectedAccountBalance = accountBalances[contributeAccount] ?? 0;
                  const mensualAporte = monthlyAporteByGoal[goal.id] || 0;
                  const mesesRestantes = mensualAporte > 0 && restante > 0 ? Math.ceil(restante / mensualAporte) : null;

                  return (
                    <div key={goal.id} className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} shadow-lg overflow-hidden`}>
                      {/* Color accent strip */}
                      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${goalMeta.accent}99, ${goalMeta.accent}22)` }} />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${goalMeta.bg}`}>
                              <FontAwesomeIcon icon={goalMeta.icon} className={goalMeta.color} style={{ fontSize: '19px' }} />
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold ${theme.colors.textPrimary} text-base leading-tight truncate`}>{goal.nombre}</p>
                              {goal.notas && <p className={`text-xs ${theme.colors.textMuted} mt-0.5 truncate`}>{goal.notas}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <button onClick={() => handleEdit(goal)} className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-blue-500/20 transition-colors`}>
                              <Edit2 size={13} className="text-blue-400" />
                            </button>
                            <button onClick={() => handleDeleteGoal(goal)} className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-red-500/20 transition-colors`}>
                              <Trash2 size={13} className="text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Amount row */}
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className={`text-[10px] ${theme.colors.textMuted} uppercase tracking-wide`}>Ahorrado</p>
                            <p className={`text-lg sm:text-2xl font-mono font-bold truncate`} style={{ color: goalMeta.accent }}>{formatCompact(goal.monto_ahorrado)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] ${theme.colors.textMuted} uppercase tracking-wide`}>Objetivo</p>
                            <p className={`text-sm font-mono truncate ${theme.colors.textMuted}`}>{formatCompact(goal.monto_objetivo)}</p>
                          </div>
                        </div>

                        {/* Segmented progress bar */}
                        <div className={`w-full h-2.5 ${theme.colors.bgSecondary} rounded-full overflow-hidden mb-2`}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, porcentaje)}%`, backgroundColor: goalMeta.accent }}
                          />
                        </div>

                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-xs font-bold`} style={{ color: goalMeta.accent }}>{porcentaje.toFixed(1)}%</span>
                          <div className="flex items-center gap-2">
                            {mesesRestantes && (
                              <span className={`text-[10px] ${theme.colors.textMuted} flex items-center gap-1`}>
                                <Zap size={10} />~{mesesRestantes} mes{mesesRestantes !== 1 ? 'es' : ''} al ritmo actual
                              </span>
                            )}
                            <span className={`text-[10px] ${theme.colors.textMuted}`}>Falta {formatCurrency(restante)}</span>
                          </div>
                        </div>

                        {/* Contribute form */}
                        {isContributing ? (
                          <div className="space-y-2">
                            <div className={`flex items-center gap-2 p-2 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                              <FontAwesomeIcon icon={faWallet} className={`${textColors.primary} flex-shrink-0`} style={{ fontSize: '12px' }} />
                              <select value={contributeAccount} onChange={e => { setContributeAccount(e.target.value); setContributeError(''); }} className={`flex-1 bg-transparent text-sm ${theme.colors.textPrimary} outline-none`}>
                                {accountOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label} — {formatCurrency(opt.balance)}</option>
                                ))}
                              </select>
                            </div>
                            {contributeError && <p className="text-xs text-rose-400 ml-1">{contributeError}</p>}
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className={`absolute left-3 top-2.5 text-sm ${theme.colors.textMuted}`}>S/</span>
                                <input
                                  type="number" max="99999999" value={contributeAmount}
                                  onChange={e => { setContributeAmount(e.target.value); setContributeError(''); }}
                                  placeholder="0.00" autoFocus
                                  className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg pl-8 pr-3 py-2 text-sm ${theme.colors.textPrimary} font-mono outline-none focus:ring-2 focus:ring-current`}
                                  onKeyDown={e => { if (e.key === 'Enter') handleContribute(goal.id); if (e.key === 'Escape') { setContributeId(null); setContributeAmount(''); setContributeError(''); } }}
                                />
                              </div>
                              <button onClick={() => handleContribute(goal.id)} disabled={!contributeAmount || parseFloat(contributeAmount) <= 0} className={`${theme.colors.primary} text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${theme.colors.primaryHover}`}>
                                Aportar
                              </button>
                              <button onClick={() => { setContributeId(null); setContributeAmount(''); setContributeAccount('Billetera'); setContributeError(''); }} className={`${theme.colors.bgSecondary} ${theme.colors.textMuted} px-2 py-2 rounded-lg`}>
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => { setContributeId(goal.id); setContributeError(''); }} className={`flex-1 flex items-center justify-center gap-2 ${theme.colors.bgSecondary} ${theme.colors.textPrimary} py-2.5 rounded-xl text-sm font-semibold hover:brightness-95 transition-all border ${theme.colors.border}`}>
                              <ArrowUpRight size={15} /> Aportar
                            </button>
                            {goal.monto_ahorrado > 0 && (
                              <button onClick={() => openBreakModal(goal)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20">
                                <FontAwesomeIcon icon={faPiggyBank} style={{ fontSize: '13px' }} /> Romper
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wider pt-2`}>Metas Completadas ✓</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedGoals.map(goal => {
                  const goalMeta = getGoalMeta(goal.nombre, goal.icono);
                  return (
                    <div key={goal.id} className={`${theme.colors.bgCard} p-4 rounded-2xl border border-emerald-500/20 shadow flex items-center gap-3`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${goalMeta.bg}`}>
                        <FontAwesomeIcon icon={goalMeta.icon} className={goalMeta.color} style={{ fontSize: '15px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                          <p className={`font-semibold ${theme.colors.textPrimary} text-sm truncate`}>{goal.nombre}</p>
                        </div>
                        <p className="text-xs font-mono text-emerald-500">{formatCurrency(goal.monto_ahorrado)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {goal.monto_ahorrado > 0 && (
                          <button onClick={() => openBreakModal(goal)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-colors" title="Retirar fondos">
                            <FontAwesomeIcon icon={faPiggyBank} className="text-rose-400" style={{ fontSize: '12px' }} />
                          </button>
                        )}
                        <button onClick={() => handleDeleteGoal(goal)} className={`p-1.5 rounded-lg ${theme.colors.bgSecondary} hover:bg-red-500/20 transition-colors`}>
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && !showForm && (
            <div className={`${theme.colors.bgCard} p-12 rounded-2xl ${theme.colors.border} border shadow-lg text-center`}>
              <PiggyBank size={48} className={`mx-auto mb-4 ${theme.colors.textMuted}`} />
              <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>Sin metas de ahorro</h3>
              <p className={`${theme.colors.textMuted} text-sm mb-4`}>Crea metas como "Carro", "Viaje" o "Emergencia" y aparta dinero de tus ingresos para alcanzarlas.</p>
              <button onClick={() => setShowForm(true)} className={`${theme.colors.primary} text-white px-6 py-2 rounded-lg ${theme.colors.primaryHover} transition-all shadow-lg`}>
                Crear primera meta
              </button>
            </div>
          )}
        </div>

        {/* Activity feed (1/3 width on XL) */}
        {recentActivity.length > 0 && (
          <div className="xl:col-span-1">
            <div className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} shadow-lg p-5 h-fit`}>
              <p className={`text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wider mb-4`}>Actividad reciente</p>
              <div className="space-y-3">
                {recentActivity.map((t, i) => {
                  const isAporte = t.tipo === 'Aporte_Meta';
                  const relatedGoal = goals.find(g => g.id === t.meta_id);
                  const goalMeta = relatedGoal ? getGoalMeta(relatedGoal.nombre, relatedGoal.icono) : { icon: faPiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-500/10', accent: '#10b981' };
                  const dateStr = new Date(t.timestamp || t.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${goalMeta.bg}`}>
                        <FontAwesomeIcon icon={goalMeta.icon} className={goalMeta.color} style={{ fontSize: '12px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${theme.colors.textPrimary} truncate`}>
                          {isAporte ? '↑' : '↓'} {t.descripcion}
                        </p>
                        <p className={`text-[10px] ${theme.colors.textMuted}`}>{t.cuenta} · {dateStr}</p>
                      </div>
                      <span className={`text-xs font-mono font-bold flex-shrink-0 ${isAporte ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {isAporte ? '+' : '-'}{formatCurrency(Number(t.monto))}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Account balance summary */}
              {Object.keys(accountBalances).length > 0 && (
                <div className={`mt-5 pt-4 border-t ${theme.colors.border} space-y-2`}>
                  <p className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase tracking-wider`}>Saldos disponibles</p>
                  {Object.entries(accountBalances).map(([acc, bal]) => (
                    <div key={acc} className="flex justify-between items-center">
                      <span className={`text-xs ${theme.colors.textMuted} truncate`}>{acc === 'Billetera' ? '💵 Billetera' : `💳 ${acc}`}</span>
                      <span className={`text-xs font-mono font-bold ${bal >= 0 ? textColors.primary : 'text-rose-400'}`}>{formatCurrency(bal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Romper Chanchito Modal ── */}
      {breakGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} shadow-2xl w-full max-w-md p-6`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faPiggyBank} className="text-rose-400" style={{ fontSize: '22px' }} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary}`}>Romper chanchito</h3>
                <p className={`text-sm ${theme.colors.textMuted}`}>Retira fondos comprometidos</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl bg-rose-500/8 border border-rose-500/20 mb-5`}>
              <p className={`text-sm ${theme.colors.textPrimary} leading-relaxed`}>
                Estás retirando <strong className="text-rose-400">{breakAmountNum > 0 ? formatCurrency(breakAmountNum) : 'S/ ???'}</strong> de tu meta <strong>"{breakGoal.nombre}"</strong>.
              </p>
              {breakAmountNum > 0 && breakAmountNum <= breakGoal.monto_ahorrado && (
                <p className={`text-xs ${theme.colors.textMuted} mt-2`}>
                  Tu progreso bajará de <strong>{breakPorcentajeActual.toFixed(1)}%</strong> a <strong className="text-rose-400">{breakNuevoPorcentaje.toFixed(1)}%</strong>. Faltarán <strong>{formatCurrency(breakNuevoRestante)}</strong> para completar tu objetivo.
                </p>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <label className={`block text-sm font-medium ${theme.colors.textPrimary}`}>Cuenta destino</label>
              <div className={`flex items-center gap-2 p-2.5 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <FontAwesomeIcon icon={faWallet} className={`${textColors.primary} flex-shrink-0`} style={{ fontSize: '13px' }} />
                <select value={breakAccount} onChange={e => setBreakAccount(e.target.value)} className={`flex-1 bg-transparent text-sm ${theme.colors.textPrimary} outline-none`}>
                  {accountOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {formatCurrency(opt.balance)} disponible</option>
                  ))}
                </select>
              </div>
              <label className={`block text-sm font-medium ${theme.colors.textPrimary}`}>Monto a retirar (máx. {formatCurrency(breakGoal.monto_ahorrado)})</label>
              <div className="relative">
                <span className={`absolute left-3 top-3 text-sm ${theme.colors.textMuted}`}>S/</span>
                <input type="number" value={breakAmount} onChange={e => setBreakAmount(e.target.value)} placeholder="0.00" max={breakGoal.monto_ahorrado} autoFocus
                  className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-xl pl-9 pr-4 py-3 text-sm ${theme.colors.textPrimary} font-mono outline-none focus:ring-2 focus:ring-rose-500`}
                  onKeyDown={e => { if (e.key === 'Enter') handleBreak(); if (e.key === 'Escape') setBreakGoal(null); }}
                />
              </div>
              {breakAmountNum > breakGoal.monto_ahorrado && (
                <p className="text-xs text-rose-400">No puedes retirar más de lo ahorrado ({formatCurrency(breakGoal.monto_ahorrado)})</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setBreakGoal(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${theme.colors.bgSecondary} ${theme.colors.textPrimary} hover:brightness-95 transition-all border ${theme.colors.border}`}>
                Cancelar
              </button>
              <button onClick={handleBreak} disabled={!breakAmount || breakAmountNum <= 0 || breakAmountNum > breakGoal.monto_ahorrado}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all disabled:opacity-50 shadow-lg">
                Confirmar ruptura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar Meta con Fondos ── */}
      {deleteGoalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} shadow-2xl w-full max-w-md p-6`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Trash2 className="text-amber-400" size={22} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary}`}>Eliminar meta</h3>
                <p className={`text-sm ${theme.colors.textMuted}`}>Esta meta tiene fondos guardados</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 mb-5`}>
              <p className={`text-sm ${theme.colors.textPrimary} leading-relaxed`}>
                La meta <strong>"{deleteGoalTarget.nombre}"</strong> tiene <strong className="text-amber-400">{formatCurrency(deleteGoalTarget.monto_ahorrado)}</strong> ahorrados. ¿A qué cuenta quieres devolverlos?
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <label className={`block text-sm font-medium ${theme.colors.textPrimary}`}>Cuenta destino</label>
              <div className={`flex items-center gap-2 p-2.5 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <FontAwesomeIcon icon={faWallet} className={`${textColors.primary} flex-shrink-0`} style={{ fontSize: '13px' }} />
                <select value={deleteReturnAccount} onChange={e => setDeleteReturnAccount(e.target.value)} className={`flex-1 bg-transparent text-sm ${theme.colors.textPrimary} outline-none`}>
                  {accountOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {formatCurrency(opt.balance)} disponible</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setDeleteGoalTarget(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${theme.colors.bgSecondary} ${theme.colors.textPrimary} hover:brightness-95 transition-all border ${theme.colors.border}`}>
                Cancelar
              </button>
              <button onClick={handleConfirmDeleteWithFunds} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-lg">
                Devolver y eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
