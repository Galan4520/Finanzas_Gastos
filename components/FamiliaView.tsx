import React, { useState, useMemo } from 'react';
import { Users, User, Eye, EyeOff, RefreshCw, Link2, Link2Off, TrendingUp, TrendingDown, Target, UserPlus, X } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';
import { FamilyConfig, FamilyMember, Transaction, Goal, CreditCard as CreditCardType, UserProfile } from '../types';
import { getAvatarById } from '../avatars';
import { AvatarSvg } from './ui/AvatarSvg';
import { formatCurrency } from '../utils/format';
import {
  faCar, faPlane, faHouse, faGraduationCap, faShield, faBriefcase,
  faLaptop, faHeart, faHeartPulse, faPiggyBank, faMotorcycle,
  faUmbrellaBeach, faRing, faBaby, faDog, faGamepad, faUtensils
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type MemberData = { history: Transaction[]; goals: Goal[]; cards: CreditCardType[]; profile: UserProfile | null };
type Period = 3 | 6 | 12;

interface FamiliaViewProps {
  myProfile: UserProfile | null;
  myHistory: Transaction[];
  myGoals: Goal[];
  myCards: CreditCardType[];
  familyConfig: FamilyConfig | null;
  membersData: Record<string, MemberData>;
  isSyncingPartner: boolean;
  onSaveFamilyConfig: (config: FamilyConfig) => Promise<void>;
  onDisconnectPartner: () => void;
  onRefreshPartner: () => Promise<void>;
  notify: (msg: string, type: 'success' | 'error') => void;
}

// ── Goal icon helper (mirrors GoalsView)
const ICON_MAP: Record<string, any> = {
  car: faCar, moto: faMotorcycle, plane: faPlane, beach: faUmbrellaBeach,
  house: faHouse, edu: faGraduationCap, shield: faShield, work: faBriefcase,
  laptop: faLaptop, ring: faRing, baby: faBaby, health: faHeartPulse,
  pet: faDog, game: faGamepad, food: faUtensils, heart: faHeart, piggy: faPiggyBank,
};
const ACCENT_MAP: Record<string, { accent: string; bg: string; text: string }> = {
  car: { accent: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  moto: { accent: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-500' },
  plane: { accent: '#0ea5e9', bg: 'bg-sky-500/10', text: 'text-sky-500' },
  beach: { accent: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  house: { accent: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  edu: { accent: '#6366f1', bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  shield: { accent: '#f43f5e', bg: 'bg-rose-500/10', text: 'text-rose-500' },
  work: { accent: '#d97706', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  laptop: { accent: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-500' },
  ring: { accent: '#ec4899', bg: 'bg-pink-500/10', text: 'text-pink-500' },
  baby: { accent: '#a855f7', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  health: { accent: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-500' },
  pet: { accent: '#d97706', bg: 'bg-amber-200/40', text: 'text-amber-600' },
  game: { accent: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-500' },
  food: { accent: '#fb923c', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  heart: { accent: '#fb7185', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  piggy: { accent: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
};
function getGoalStyle(icono?: string) {
  if (icono && ACCENT_MAP[icono]) return { icon: ICON_MAP[icono] || faPiggyBank, ...ACCENT_MAP[icono] };
  return { icon: faPiggyBank, accent: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-500' };
}

// ── Helper: build N months of data
function buildMonthlyData(history: Transaction[], months: Period) {
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
    const ingresos = history
      .filter(t => t.tipo === 'Ingresos' && t.fecha?.startsWith(key))
      .reduce((s, t) => s + Number(t.monto), 0);
    const gastos = history
      .filter(t => t.tipo === 'Gastos' && t.fecha?.startsWith(key))
      .reduce((s, t) => s + Number(t.monto), 0);
    result.push({ key, label, ingresos, gastos, balance: ingresos - gastos });
  }
  return result;
}

// ── Helper: category breakdown for a period
type CatFilter = 'mes' | 'periodo';
const CAT_COLORS = [
  '#3b82f6','#10b981','#f97316','#a855f7','#ec4899',
  '#eab308','#14b8a6','#ef4444','#64748b','#6366f1',
  '#d97706','#0ea5e9','#fb923c','#84cc16'
];
function buildCategoryData(history: Transaction[], months: Period, filter: CatFilter) {
  const now = new Date();
  const filterKeys: string[] = [];
  if (filter === 'mes') {
    filterKeys.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  } else {
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      filterKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  }
  const map: Record<string, number> = {};
  history
    .filter(t => t.tipo === 'Gastos' && filterKeys.some(k => t.fecha?.startsWith(k)))
    .forEach(t => { map[t.categoria] = (map[t.categoria] || 0) + Number(t.monto); });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([cat, monto], i) => ({ cat, monto, pct: total > 0 ? (monto / total) * 100 : 0, color: CAT_COLORS[i % CAT_COLORS.length] }));
}

// ── Helper: recent goal contributions
function getGoalActivity(history: Transaction[], goalId: string, limit = 4) {
  return history
    .filter(t => (t.tipo === 'Aporte_Meta' || t.tipo === 'Ruptura_Meta') && t.meta_id === goalId)
    .sort((a, b) => new Date(b.timestamp || b.fecha).getTime() - new Date(a.timestamp || a.fecha).getTime())
    .slice(0, limit);
}

// ── Recharts tooltip styler
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-gray-300 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Goal card styled like GoalsView
const GoalCard: React.FC<{
  goal: Goal & { owner?: string };
  history: Transaction[];
  ownerColor?: string;
  readOnly?: boolean;
}> = ({ goal, history, ownerColor = '#3b82f6', readOnly }) => {
  const { theme } = useTheme();
  const style = getGoalStyle(goal.icono);
  const pct = goal.monto_objetivo > 0 ? Math.min(100, (goal.monto_ahorrado / goal.monto_objetivo) * 100) : 0;
  const falta = Math.max(0, goal.monto_objetivo - goal.monto_ahorrado);
  const activity = getGoalActivity(history, goal.id);

  return (
    <div className={`${theme.colors.bgSecondary} rounded-2xl p-4 border ${theme.colors.border}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
          <FontAwesomeIcon icon={style.icon} className={`${style.text} text-sm`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-sm ${theme.colors.textPrimary} truncate`}>{goal.nombre}</p>
            {goal.owner && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${ownerColor}20`, color: ownerColor }}>
                {goal.owner}
              </span>
            )}
            {readOnly && <Eye size={12} className="text-amber-500" />}
          </div>
          <p className={`text-xs ${theme.colors.textMuted} mt-0.5`}>
            Falta {formatCurrency(falta)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-sm font-mono`} style={{ color: style.accent }}>
            {formatCurrency(goal.monto_ahorrado)}
          </p>
          <p className={`text-xs ${theme.colors.textMuted}`}>de {formatCurrency(goal.monto_objetivo)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`w-full rounded-full h-2 mb-1 ${theme.colors.bgCard}`}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: style.accent }}
        />
      </div>
      <p className={`text-xs ${theme.colors.textMuted} text-right mb-3`}>{pct.toFixed(1)}%</p>

      {/* Recent contributions */}
      {activity.length > 0 && (
        <div className="space-y-1.5">
          <p className={`text-xs font-semibold ${theme.colors.textMuted} uppercase tracking-wider`}>Últimos movimientos</p>
          {activity.map((t, i) => {
            const isAporte = t.tipo === 'Aporte_Meta';
            const dateStr = new Date(t.timestamp || t.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${isAporte ? 'text-green-400' : 'text-red-400'}`}>
                    {isAporte ? '↑' : '↓'}
                  </span>
                  <span className={`text-xs ${theme.colors.textMuted}`}>{dateStr}</span>
                  {t.cuenta && <span className={`text-xs ${theme.colors.textMuted} opacity-60`}>· {t.cuenta}</span>}
                </div>
                <span className={`text-xs font-mono font-semibold ${isAporte ? 'text-green-400' : 'text-red-400'}`}>
                  {isAporte ? '+' : '-'}{formatCurrency(Number(t.monto))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Monthly chart + goal cards for one person
const PersonView: React.FC<{
  nombre: string;
  avatarId?: string;
  history: Transaction[];
  goals: Goal[];
  readOnly?: boolean;
  isSyncing?: boolean;
  period: Period;
  onPeriodChange: (p: Period) => void;
  ownerColor?: string;
}> = ({ nombre, avatarId, history, goals, readOnly, isSyncing, period, onPeriodChange, ownerColor = '#3b82f6' }) => {
  const { theme } = useTheme();
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const monthlyData = useMemo(() => buildMonthlyData(history, period), [history, period]);
  const metasActivas = goals.filter(g => g.estado === 'activa');
  const currentMonth = monthlyData[monthlyData.length - 1] || { ingresos: 0, gastos: 0, balance: 0 };
  const [catFilter, setCatFilter] = useState<CatFilter>('mes');
  const categoryData = useMemo(() => buildCategoryData(history, period, catFilter), [history, period, catFilter]);

  const PERIODS: { label: string; value: Period }[] = [
    { label: '3M', value: 3 }, { label: '6M', value: 6 }, { label: '12M', value: 12 }
  ];

  return (
    <div className="space-y-4">
      {/* Person header */}
      <div className="flex items-center gap-3">
        {avatar ? (
          <AvatarSvg avatarId={avatar.id} size={40} className="border-2 border-white shadow-sm" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${ownerColor}30` }}>
            <User size={20} style={{ color: ownerColor }} />
          </div>
        )}
        <div>
          <p className={`font-bold ${theme.colors.textPrimary}`}>{nombre}</p>
          <div className="flex items-center gap-2">
            {readOnly && (
              <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Eye size={10} /> Solo lectura
              </span>
            )}
            {isSyncing && <p className={`text-xs ${theme.colors.textMuted} animate-pulse`}>Sincronizando...</p>}
          </div>
        </div>
        {/* Period filter */}
        <div className={`ml-auto flex gap-1 p-1 rounded-xl ${theme.colors.bgSecondary}`}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : `${theme.colors.textMuted}`
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${theme.colors.bgSecondary} rounded-xl p-3 text-center`}>
          <TrendingUp size={14} className="text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-bold text-xs font-mono">{formatCurrency(currentMonth.ingresos)}</p>
          <p className={`text-xs ${theme.colors.textMuted}`}>Ingresos</p>
        </div>
        <div className={`${theme.colors.bgSecondary} rounded-xl p-3 text-center`}>
          <TrendingDown size={14} className="text-red-400 mx-auto mb-1" />
          <p className="text-red-400 font-bold text-xs font-mono">{formatCurrency(currentMonth.gastos)}</p>
          <p className={`text-xs ${theme.colors.textMuted}`}>Gastos</p>
        </div>
        <div className={`${theme.colors.bgSecondary} rounded-xl p-3 text-center`}>
          <p className={`font-bold text-xs font-mono ${currentMonth.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currentMonth.balance >= 0 ? '+' : ''}{formatCurrency(currentMonth.balance)}
          </p>
          <p className={`text-xs ${theme.colors.textMuted}`}>Balance</p>
        </div>
      </div>

      {/* Area Chart: Ingresos vs Gastos por mes */}
      <div className={`${theme.colors.bgSecondary} rounded-xl p-4`}>
        <p className={`text-xs font-semibold ${theme.colors.textMuted} uppercase tracking-wider mb-3`}>
          Tendencia mensual
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradIn${nombre}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`gradOut${nombre}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
            <RechartTooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2}
              fill={`url(#gradIn${nombre})`} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2}
              fill={`url(#gradOut${nombre})`} dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className={`${theme.colors.bgSecondary} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold ${theme.colors.textMuted} uppercase tracking-wider`}>
            Gastos por categoría
          </p>
          <div className={`flex gap-1 p-0.5 rounded-lg ${theme.colors.bgCard}`}>
            <button
              onClick={() => setCatFilter('mes')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                catFilter === 'mes'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : theme.colors.textMuted
              }`}
            >
              Este mes
            </button>
            <button
              onClick={() => setCatFilter('periodo')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                catFilter === 'periodo'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : theme.colors.textMuted
              }`}
            >
              {period}M
            </button>
          </div>
        </div>
        {categoryData.length === 0 ? (
          <p className={`text-xs ${theme.colors.textMuted} text-center py-3`}>Sin gastos en este período</p>
        ) : (
          <div className="space-y-2.5">
            {categoryData.map(({ cat, monto, pct, color }) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className={`text-xs truncate ${theme.colors.textSecondary}`}>{cat}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs font-mono font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>
                    {!readOnly && <span className={`text-xs font-mono ${theme.colors.textMuted}`}>{formatCurrency(monto)}</span>}
                  </div>
                </div>
                <div className={`w-full rounded-full h-1.5 ${theme.colors.bgCard}`}>
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metas activas con cards estilo GoalsView */}
      {metasActivas.length > 0 && (
        <div>
          <p className={`text-xs font-semibold ${theme.colors.textMuted} uppercase tracking-wider mb-3 flex items-center gap-1`}>
            <Target size={12} /> Metas activas ({metasActivas.length})
          </p>
          <div className="space-y-3">
            {metasActivas.map(goal => (
              <GoalCard key={goal.id} goal={goal} history={history} ownerColor={ownerColor} readOnly={readOnly} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Vista combinada familiar
const VistaCombinada: React.FC<{
  myNombre: string;
  myAvatarId?: string;
  myHistory: Transaction[];
  myGoals: Goal[];
  members: FamilyMember[];
  membersData: Record<string, MemberData>;
  period: Period;
  onPeriodChange: (p: Period) => void;
}> = ({ myNombre, myAvatarId, myHistory, myGoals, members, membersData, period, onPeriodChange }) => {
  const { theme } = useTheme();
  const MEMBER_COLORS = ['#3b82f6', '#a855f7', '#f97316', '#14b8a6', '#ec4899'];
  const [catFilter, setCatFilter] = useState<CatFilter>('mes');

  const allPeople = [
    { nombre: myNombre, history: myHistory, goals: myGoals, color: MEMBER_COLORS[0] },
    ...members.map((m, i) => ({
      nombre: m.name,
      history: membersData[m.name]?.history || [],
      goals: membersData[m.name]?.goals || [],
      color: MEMBER_COLORS[(i + 1) % MEMBER_COLORS.length]
    }))
  ];

  // Build combined monthly data
  const combinedData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: period }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (period - 1 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
      const entry: Record<string, any> = { key, label };
      let totalIngresos = 0, totalGastos = 0;
      allPeople.forEach(({ nombre, history }) => {
        const ing = history.filter(t => t.tipo === 'Ingresos' && t.fecha?.startsWith(key)).reduce((s, t) => s + Number(t.monto), 0);
        const gas = history.filter(t => t.tipo === 'Gastos' && t.fecha?.startsWith(key)).reduce((s, t) => s + Number(t.monto), 0);
        entry[`ing_${nombre}`] = ing;
        entry[`gas_${nombre}`] = gas;
        totalIngresos += ing;
        totalGastos += gas;
      });
      entry.ingresos = totalIngresos;
      entry.gastos = totalGastos;
      entry.balance = totalIngresos - totalGastos;
      return entry;
    });
  }, [allPeople, period]);

  const lastMonth = combinedData[combinedData.length - 1] || { ingresos: 0, gastos: 0, balance: 0 };
  const totalGastos = lastMonth.gastos as number;

  // All active goals from all members
  const allGoals = allPeople.flatMap(({ nombre, goals, history, color }) =>
    goals.filter(g => g.estado === 'activa').map(g => ({ ...g, owner: nombre, ownerHistory: history, ownerColor: color }))
  );

  // Combined history for category breakdown
  const combinedHistory = useMemo(
    () => allPeople.flatMap(({ history }) => history),
    [allPeople]
  );
  const combinedCatData = useMemo(
    () => buildCategoryData(combinedHistory, period, catFilter),
    [combinedHistory, period, catFilter]
  );

  const PERIODS: { label: string; value: Period }[] = [
    { label: '3M', value: 3 }, { label: '6M', value: 6 }, { label: '12M', value: 12 }
  ];

  return (
    <div className="space-y-5">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${theme.colors.textPrimary}`}>Balance Familiar</p>
        <div className={`flex gap-1 p-1 rounded-xl ${theme.colors.bgSecondary}`}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : `${theme.colors.textMuted}`
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-xl p-3 text-center`}>
          <TrendingUp size={14} className="text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-bold font-mono text-sm">{formatCurrency(lastMonth.ingresos as number)}</p>
          <p className={`text-xs ${theme.colors.textMuted}`}>Ingresos</p>
        </div>
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-xl p-3 text-center`}>
          <TrendingDown size={14} className="text-red-400 mx-auto mb-1" />
          <p className="text-red-400 font-bold font-mono text-sm">{formatCurrency(lastMonth.gastos as number)}</p>
          <p className={`text-xs ${theme.colors.textMuted}`}>Gastos</p>
        </div>
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-xl p-3 text-center`}>
          <p className={`font-bold font-mono text-sm ${(lastMonth.balance as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(lastMonth.balance as number) >= 0 ? '+' : ''}{formatCurrency(lastMonth.balance as number)}
          </p>
          <p className={`text-xs ${theme.colors.textMuted}`}>Balance</p>
        </div>
      </div>

      {/* Combined area chart */}
      <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-2xl p-5`}>
        <h3 className={`font-bold ${theme.colors.textPrimary} mb-4 flex items-center gap-2`}>
          <Users size={16} /> Tendencia Familiar
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={combinedData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradFamIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFamOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
            <RechartTooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2}
              fill="url(#gradFamIn)" dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2}
              fill="url(#gradFamOut)" dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Distribución de gastos */}
      {totalGastos > 0 && (
        <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-2xl p-5`}>
          <h3 className={`font-bold ${theme.colors.textPrimary} mb-3`}>Distribución de gastos este mes</h3>
          <div className="flex rounded-full overflow-hidden h-4 mb-2">
            {allPeople.map(({ nombre, history, color }) => {
              const gas = history.filter(t => t.tipo === 'Gastos' && t.fecha?.startsWith(combinedData[combinedData.length - 1]?.key)).reduce((s, t) => s + Number(t.monto), 0);
              const pct = totalGastos > 0 ? (gas / totalGastos) * 100 : 0;
              return pct > 0 ? (
                <div key={nombre} className="transition-all" style={{ width: `${pct}%`, background: color }} title={`${nombre}: ${pct.toFixed(0)}%`} />
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {allPeople.map(({ nombre, history, color }) => {
              const gas = history.filter(t => t.tipo === 'Gastos' && t.fecha?.startsWith(combinedData[combinedData.length - 1]?.key)).reduce((s, t) => s + Number(t.monto), 0);
              const pct = totalGastos > 0 ? (gas / totalGastos) * 100 : 0;
              return pct > 0 ? (
                <span key={nombre} className="text-xs font-medium" style={{ color }}>
                  ■ {nombre}: {pct.toFixed(0)}% ({formatCurrency(gas)})
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Category breakdown - combined */}
      <div className={`${theme.colors.bgCard} border ${theme.colors.border} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${theme.colors.textPrimary}`}>Gastos por categoría</h3>
          <div className={`flex gap-1 p-0.5 rounded-lg ${theme.colors.bgSecondary}`}>
            <button
              onClick={() => setCatFilter('mes')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                catFilter === 'mes'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : theme.colors.textMuted
              }`}
            >
              Este mes
            </button>
            <button
              onClick={() => setCatFilter('periodo')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                catFilter === 'periodo'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : theme.colors.textMuted
              }`}
            >
              {period}M
            </button>
          </div>
        </div>
        {combinedCatData.length === 0 ? (
          <p className={`text-xs ${theme.colors.textMuted} text-center py-3`}>Sin gastos en este período</p>
        ) : (
          <div className="space-y-3">
            {combinedCatData.map(({ cat, monto, pct, color }) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className={`text-sm truncate ${theme.colors.textSecondary}`}>{cat}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className={`text-xs font-mono ${theme.colors.textMuted}`}>{pct.toFixed(0)}%</span>
                    <span className="text-sm font-mono font-semibold" style={{ color }}>{formatCurrency(monto)}</span>
                  </div>
                </div>
                <div className={`w-full rounded-full h-2 ${theme.colors.bgSecondary}`}>
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metas compartidas de todo el plan */}
      {allGoals.length > 0 && (
        <div>
          <h3 className={`font-bold ${theme.colors.textPrimary} mb-3 flex items-center gap-2`}>
            <Target size={16} /> Metas del Plan ({allGoals.length})
          </h3>
          <div className="space-y-3">
            {allGoals.map((goal, idx) => (
              <GoalCard
                key={`${goal.id}-${idx}`}
                goal={goal}
                history={goal.ownerHistory}
                ownerColor={goal.ownerColor}
                readOnly={goal.owner !== allPeople[0].nombre}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Add member form
const AddMemberForm: React.FC<{
  existingMembers: FamilyMember[];
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
  notify: (msg: string, type: 'success' | 'error') => void;
}> = ({ existingMembers, onSave, onCancel, notify }) => {
  const { theme } = useTheme();
  const [url, setUrl] = useState('');
  const [pin, setPin] = useState('');
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !pin.trim() || !nombre.trim()) { notify('Completa todos los campos', 'error'); return; }
    if (existingMembers.some(m => m.name.toLowerCase() === nombre.trim().toLowerCase())) {
      notify('Ya existe un miembro con ese nombre', 'error'); return;
    }
    setSaving(true);
    try { onSave({ url: url.trim(), pin: pin.trim(), name: nombre.trim(), avatarId: 'avatar_1' }); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <h4 className={`font-bold ${theme.colors.textPrimary} flex items-center gap-2`}><UserPlus size={18} /> Agregar miembro</h4>
        <button type="button" onClick={onCancel} className={theme.colors.textMuted}><X size={18} /></button>
      </div>
      <div>
        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1.5`}>Nombre</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Ana García"
          className={`w-full px-4 py-3 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
      </div>
      <div>
        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1.5`}>URL del Script</label>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..."
          className={`w-full px-4 py-3 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
      </div>
      <div>
        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1.5`}>PIN</label>
        <div className="relative">
          <input type={showPin ? 'text' : 'password'} value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN de acceso"
            className={`w-full px-4 py-3 pr-10 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`} />
          <button type="button" onClick={() => setShowPin(v => !v)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.colors.textMuted}`}>
            {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div className={`text-xs ${theme.colors.textMuted} bg-amber-500/10 border border-amber-500/20 rounded-xl p-3`}>
        🔒 Los datos son de <strong>solo lectura</strong>. El miembro debe compartir su URL y PIN voluntariamente.
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className={`flex-1 py-2.5 rounded-xl font-medium text-sm border ${theme.colors.border} ${theme.colors.textMuted}`}>Cancelar</button>
        <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white ${theme.colors.gradientPrimary} disabled:opacity-50`}>
          {saving ? 'Conectando...' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

// ── Main component
export const FamiliaView: React.FC<FamiliaViewProps> = ({
  myProfile, myHistory, myGoals, myCards,
  familyConfig, membersData, isSyncingPartner,
  onSaveFamilyConfig, onDisconnectPartner, onRefreshPartner, notify
}) => {
  const { theme } = useTheme();
  const textColors = getTextColor(useTheme().currentTheme);
  const members = familyConfig?.members || [];

  type SubTab = 'yo' | 'familiar' | string;
  const [subTab, setSubTab] = useState<SubTab>('yo');
  const [showAddForm, setShowAddForm] = useState(false);
  const [period, setPeriod] = useState<Period>(6);

  const MEMBER_COLORS = ['#3b82f6', '#a855f7', '#f97316', '#14b8a6', '#ec4899'];

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'yo', label: `Yo${myProfile?.nombre ? ` (${myProfile.nombre})` : ''}` },
    ...members.map(m => ({ id: m.name, label: m.name })),
    { id: 'familiar', label: 'Familiar' },
  ];

  const handleAddMember = async (newMember: FamilyMember) => {
    const updatedConfig: FamilyConfig = { members: [...members, newMember] };
    try {
      await onSaveFamilyConfig(updatedConfig);
      setShowAddForm(false);
      setSubTab(newMember.name);
      notify(`${newMember.name} agregado al plan familiar`, 'success');
    } catch {
      notify('No se pudo conectar. Verifica la URL y el PIN.', 'error');
    }
  };

  const handleRemoveMember = async (memberName: string) => {
    const updatedConfig: FamilyConfig = { members: members.filter(m => m.name !== memberName) };
    if (updatedConfig.members.length === 0) { onDisconnectPartner(); }
    else {
      await onSaveFamilyConfig(updatedConfig);
      setSubTab('yo');
      notify(`${memberName} removido del plan`, 'success');
    }
  };

  if (!familyConfig || members.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}><Users size={28} /> Plan Familiar</h2>
          <p className={`${theme.colors.textMuted} text-sm mt-1`}>Conecta las cuentas de tu familia para ver finanzas combinadas.</p>
        </div>
        {showAddForm ? (
          <AddMemberForm existingMembers={[]} onSave={handleAddMember} onCancel={() => setShowAddForm(false)} notify={notify} />
        ) : (
          <div className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} p-8 text-center`}>
            <div className={`w-20 h-20 rounded-full ${theme.colors.gradientPrimary} flex items-center justify-center mx-auto mb-4`}>
              <Users size={40} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${theme.colors.textPrimary} mb-2`}>Conecta tu Plan Familiar</h3>
            <p className={`text-sm ${theme.colors.textMuted} mb-6 max-w-sm mx-auto`}>
              Agrega a los miembros de tu familia. Cada uno debe compartir su URL y PIN voluntariamente.
            </p>
            <button onClick={() => setShowAddForm(true)}
              className={`px-6 py-3 rounded-xl font-bold text-white ${theme.colors.gradientPrimary} flex items-center gap-2 mx-auto`}>
              <UserPlus size={18} /> Agregar primer miembro
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}><Users size={28} /> Plan Familiar</h2>
          <p className={`${theme.colors.textMuted} text-sm mt-1 flex items-center gap-1`}>
            <Link2 size={12} className="text-green-400" />
            {members.length} {members.length === 1 ? 'miembro conectado' : 'miembros conectados'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(v => !v)}
            className={`p-2 rounded-lg ${theme.colors.bgSecondary} ${textColors.primary} border ${theme.colors.border}`} title="Agregar miembro">
            <UserPlus size={16} />
          </button>
          <button onClick={onRefreshPartner} disabled={isSyncingPartner}
            className={`p-2 rounded-lg ${theme.colors.bgSecondary} ${theme.colors.textMuted} border ${theme.colors.border}`} title="Actualizar datos">
            <RefreshCw size={16} className={isSyncingPartner ? 'animate-spin' : ''} />
          </button>
          <button onClick={onDisconnectPartner}
            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" title="Desconectar">
            <Link2Off size={16} />
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddMemberForm existingMembers={members} onSave={handleAddMember} onCancel={() => setShowAddForm(false)} notify={notify} />
      )}

      {/* Tabs */}
      <div className={`${theme.colors.bgCard} rounded-2xl border ${theme.colors.border} overflow-hidden`}>
        <div className="flex border-b border-gray-700/30 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSubTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                subTab === tab.id
                  ? `${theme.colors.primaryLight} ${textColors.primary} border-b-2 border-current`
                  : `${theme.colors.textMuted}`
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* My tab */}
          {subTab === 'yo' && (
            <PersonView
              nombre={myProfile?.nombre || 'Yo'}
              avatarId={myProfile?.avatar_id}
              history={myHistory}
              goals={myGoals}
              period={period}
              onPeriodChange={setPeriod}
              ownerColor={MEMBER_COLORS[0]}
            />
          )}

          {/* Member tabs */}
          {members.map((member, idx) => subTab === member.name && (
            <div key={member.name}>
              {membersData[member.name] ? (
                <>
                  <PersonView
                    nombre={member.name}
                    avatarId={member.avatarId}
                    history={membersData[member.name].history}
                    goals={membersData[member.name].goals}
                    readOnly
                    isSyncing={isSyncingPartner}
                    period={period}
                    onPeriodChange={setPeriod}
                    ownerColor={MEMBER_COLORS[(idx + 1) % MEMBER_COLORS.length]}
                  />
                  <button onClick={() => handleRemoveMember(member.name)}
                    className="mt-4 w-full py-2 text-xs text-red-400 border border-red-500/20 rounded-xl bg-red-500/5 hover:bg-red-500/10 transition-all">
                    Remover a {member.name} del plan
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  {isSyncingPartner ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={32} className={`${theme.colors.textMuted} animate-spin`} />
                      <p className={theme.colors.textMuted}>Cargando datos de {member.name}...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <p className={theme.colors.textMuted}>No se pudieron cargar los datos de {member.name}.</p>
                      <button onClick={onRefreshPartner} className={`text-sm ${textColors.primary} underline`}>Reintentar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Familiar tab */}
          {subTab === 'familiar' && (
            <VistaCombinada
              myNombre={myProfile?.nombre || 'Yo'}
              myAvatarId={myProfile?.avatar_id}
              myHistory={myHistory}
              myGoals={myGoals}
              members={members}
              membersData={membersData}
              period={period}
              onPeriodChange={setPeriod}
            />
          )}
        </div>
      </div>
    </div>
  );
};
