import React, { useMemo, useState } from 'react';
import { Transaction, SavingsGoalConfig } from '../types';
import { formatCurrency } from '../utils/format';
import { Target, TrendingUp, Edit2, Save, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface GoalsViewProps {
  history: Transaction[];
  savingsGoal: SavingsGoalConfig | null;
  onSaveGoal: (goal: SavingsGoalConfig) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ history, savingsGoal, onSaveGoal }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [isEditing, setIsEditing] = useState(!savingsGoal);

  const [formData, setFormData] = useState({
    meta_anual: savingsGoal?.meta_anual || 40000,
    proposito: savingsGoal?.proposito || 'Fondo de emergencia / Viaje / Auto',
    anio: savingsGoal?.anio || new Date().getFullYear()
  });

  const handleSave = () => {
    const goal: SavingsGoalConfig = {
      meta_anual: formData.meta_anual,
      ahorro_mensual_necesario: formData.meta_anual / 12,
      proposito: formData.proposito,
      anio: formData.anio,
      timestamp: new Date().toISOString()
    };
    onSaveGoal(goal);
    setIsEditing(false);
  };

  // Calculate monthly progress
  const monthlyProgress = useMemo(() => {
    const currentYear = formData.anio;
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let acumulado = 0;

    return months.map((mes, index) => {
      const monthHistory = history.filter(t => {
        const date = new Date(t.fecha);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });

      const ingresos = monthHistory
        .filter(t => t.tipo === 'Ingresos')
        .reduce((sum, t) => sum + Number(t.monto), 0);

      const gastos = monthHistory
        .filter(t => t.tipo === 'Gastos')
        .reduce((sum, t) => sum + Number(t.monto), 0);

      const ahorro_real = ingresos - gastos;
      acumulado += ahorro_real;

      const porcentaje_meta = formData.meta_anual > 0
        ? (acumulado / formData.meta_anual) * 100
        : 0;

      return {
        mes,
        ingresos,
        gastos,
        ahorro_real,
        acumulado,
        porcentaje_meta
      };
    });
  }, [history, formData.anio, formData.meta_anual]);

  const totalAhorrado = monthlyProgress[monthlyProgress.length - 1]?.acumulado || 0;
  const porcentajeCompletado = formData.meta_anual > 0 ? (totalAhorrado / formData.meta_anual) * 100 : 0;
  const falta = Math.max(0, formData.meta_anual - totalAhorrado);

  // Chart data
  const chartData = monthlyProgress.map(m => ({
    name: m.mes.substring(0, 3),
    acumulado: m.acumulado
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
            <Target className={textColors.primary} size={28} />
            Mis Metas de Ahorro {formData.anio}
          </h2>
          <p className={`${theme.colors.textMuted} text-sm mt-1`}>
            Planifica y da seguimiento a tus objetivos financieros
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={`flex items-center gap-2 ${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg transition-all shadow-lg`}
          >
            <Edit2 size={16} />
            Editar Meta
          </button>
        )}
      </div>

      {/* Goal Configuration Card */}
      <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
        <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-4`}>📊 Meta Anual</h3>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>
                  💰 Meta de ahorro anual
                </label>
                <input
                  type="number"
                  value={formData.meta_anual}
                  onChange={(e) => setFormData({...formData, meta_anual: parseFloat(e.target.value) || 0})}
                  className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-2 ${theme.colors.textPrimary} focus:ring-2 focus:ring-current outline-none`}
                />
                <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                  Ahorro mensual necesario: {formatCurrency(formData.meta_anual / 12)}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>
                  🎯 ¿Para qué estás ahorrando?
                </label>
                <input
                  type="text"
                  value={formData.proposito}
                  onChange={(e) => setFormData({...formData, proposito: e.target.value})}
                  placeholder="Fondo de emergencia / Viaje / Auto"
                  className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-2 ${theme.colors.textPrimary} focus:ring-2 focus:ring-current outline-none`}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              {savingsGoal && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      meta_anual: savingsGoal.meta_anual,
                      proposito: savingsGoal.proposito,
                      anio: savingsGoal.anio
                    });
                  }}
                  className={`flex items-center gap-2 ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} ${theme.colors.textPrimary} px-4 py-2 rounded-lg transition-colors`}
                >
                  <X size={16} />
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 ${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg transition-all shadow-lg`}
              >
                <Save size={16} />
                Guardar Meta
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <p className="text-sm text-emerald-700 mb-1">Meta Anual</p>
              <p className="text-3xl font-mono font-bold text-emerald-600">
                {formatCurrency(formData.meta_anual)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-sm text-blue-700 mb-1">Ahorro Mensual Necesario</p>
              <p className="text-3xl font-mono font-bold text-blue-600">
                {formatCurrency(formData.meta_anual / 12)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <p className="text-sm text-purple-700 mb-1">Propósito</p>
              <p className="text-lg font-bold text-purple-600">
                {formData.proposito}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
          <p className={`text-sm ${theme.colors.textMuted} mb-2`}>Total ahorrado hasta ahora</p>
          <p className={`text-3xl font-mono font-bold ${textColors.primary}`}>
            {formatCurrency(totalAhorrado)}
          </p>
        </div>

        <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
          <p className={`text-sm ${theme.colors.textMuted} mb-2`}>¿Llegaste a tu meta?</p>
          <p className={`text-2xl font-bold ${porcentajeCompletado >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {porcentajeCompletado >= 100 ? '✅ ¡Completado!' : '⏳ En progreso...'}
          </p>
        </div>

        <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
          <p className={`text-sm ${theme.colors.textMuted} mb-2`}>Te falta</p>
          <p className={`text-3xl font-mono font-bold text-rose-500`}>
            {formatCurrency(falta)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className={`font-bold ${theme.colors.textPrimary}`}>% Completado</h3>
          <span className={`text-2xl font-bold ${textColors.primary}`}>
            {porcentajeCompletado.toFixed(1)}%
          </span>
        </div>
        <div className={`w-full h-4 ${theme.colors.bgSecondary} rounded-full overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${textColors.primary === 'text-emerald-600' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
            style={{width: `${Math.min(100, porcentajeCompletado)}%`}}
          />
        </div>
      </div>

      {/* Chart */}
      <div className={`${theme.colors.bgCard} p-6 rounded-2xl ${theme.colors.border} border shadow-lg`}>
        <h3 className={`font-bold ${theme.colors.textPrimary} mb-4 flex items-center gap-2`}>
          <TrendingUp size={20} className={textColors.primary} />
          Evolución del Ahorro
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
              <XAxis
                dataKey="name"
                tick={{fill: currentTheme === 'light-premium' ? '#64748b' : '#64748b', fontSize: 12}}
              />
              <YAxis
                tick={{fill: currentTheme === 'light-premium' ? '#64748b' : '#64748b', fontSize: 12}}
                tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{backgroundColor: currentTheme === 'light-premium' ? '#f8fafc' : '#f1f5f9', borderRadius: '8px', border: `1px solid ${currentTheme === 'light-premium' ? '#e2e8f0' : '#cbd5e1'}`}}
                formatter={(val) => formatCurrency(Number(val))}
              />
              <Line
                type="monotone"
                dataKey="acumulado"
                stroke={textColors.primary === 'text-emerald-600' ? '#10b981' : '#3b82f6'}
                strokeWidth={3}
                dot={{ fill: textColors.primary === 'text-emerald-600' ? '#10b981' : '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Tracking Table */}
      <div className={`${theme.colors.bgCard} rounded-2xl ${theme.colors.border} border shadow-lg overflow-hidden`}>
        <div className="p-6 border-b ${theme.colors.border}">
          <h3 className={`font-bold ${theme.colors.textPrimary}`}>📅 Seguimiento Mensual (se actualiza automáticamente)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme.colors.bgSecondary} text-xs ${theme.colors.textMuted} uppercase`}>
              <tr>
                <th className="px-6 py-3 text-left">Mes</th>
                <th className="px-6 py-3 text-right">Ingresos</th>
                <th className="px-6 py-3 text-right">Gastos</th>
                <th className="px-6 py-3 text-right">Ahorro Real</th>
                <th className="px-6 py-3 text-right">Acumulado</th>
                <th className="px-6 py-3 text-right">% Meta Anual</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.colors.border}`}>
              {monthlyProgress.map((m, idx) => (
                <tr key={idx} className={`hover:${theme.colors.bgCardHover} transition-colors`}>
                  <td className={`px-6 py-4 font-medium ${theme.colors.textPrimary}`}>{m.mes}</td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-600">
                    {formatCurrency(m.ingresos)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-rose-600">
                    {formatCurrency(m.gastos)}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${m.ahorro_real >= 0 ? textColors.primary : 'text-rose-500'}`}>
                    {formatCurrency(m.ahorro_real)}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${theme.colors.textPrimary}`}>
                    {formatCurrency(m.acumulado)}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${m.porcentaje_meta >= 100 ? 'text-emerald-500' : textColors.primary}`}>
                    {m.porcentaje_meta.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className={`${theme.colors.bgSecondary} font-bold`}>
              <tr>
                <td className={`px-6 py-4 ${theme.colors.textPrimary}`}>TOTAL AÑO</td>
                <td className="px-6 py-4 text-right font-mono text-emerald-600">
                  {formatCurrency(monthlyProgress.reduce((sum, m) => sum + m.ingresos, 0))}
                </td>
                <td className="px-6 py-4 text-right font-mono text-rose-600">
                  {formatCurrency(monthlyProgress.reduce((sum, m) => sum + m.gastos, 0))}
                </td>
                <td className={`px-6 py-4 text-right font-mono ${textColors.primary}`}>
                  {formatCurrency(monthlyProgress.reduce((sum, m) => sum + m.ahorro_real, 0))}
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
