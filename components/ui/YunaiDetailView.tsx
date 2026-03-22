import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, Mic, Camera, RefreshCw, Shield, AlertTriangle, CheckCircle2, Lightbulb, BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { YunaiContext, YunaiAdviceResult } from '../../services/googleSheetService';

interface YunaiDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  adviceData: YunaiAdviceResult | null;
  yunaiContext: YunaiContext;
  onStartVoice: () => void;
  onStartScan: () => void;
  onRefreshAdvice: () => void;
}

const YunaiDetailView: React.FC<YunaiDetailViewProps> = ({
  isOpen,
  onClose,
  adviceData,
  yunaiContext,
  onStartVoice,
  onStartScan,
  onRefreshAdvice,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const { semana, mes, categoriasTop, pagos } = yunaiContext;
  const estado = adviceData?.estado || 'bien';

  const estadoConfig = {
    bien: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', label: 'Vas bien' },
    alerta: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', label: 'Atención' },
    mal: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', label: 'Cuidado' },
  };

  const ec = estadoConfig[estado];
  const EstadoIcon = ec.icon;

  const weekTrend = semana.porcentajeCambio;
  const TrendIcon = weekTrend > 5 ? TrendingUp : weekTrend < -5 ? TrendingDown : Minus;
  const trendColor = weekTrend > 5 ? 'text-red-500' : weekTrend < -5 ? 'text-green-500' : 'text-yellow-500';
  const trendLabel = weekTrend > 5
    ? `${Math.abs(weekTrend).toFixed(0)}% más que la semana pasada`
    : weekTrend < -5
    ? `${Math.abs(weekTrend).toFixed(0)}% menos que la semana pasada`
    : 'Similar a la semana pasada';

  // Calculate max for bar chart
  const maxCat = categoriasTop.length > 0 ? Math.max(...categoriasTop.map(c => c.monto)) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Full screen sheet */}
      <div className={`relative ${theme.colors.bgPrimary} w-full h-full sm:max-w-lg sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-yn-primary-600 via-yn-primary-700 to-yn-sec1-700 px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 bg-white">
                <img src="/logos/Mascota_Yunai.svg" alt="Yunai" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Análisis de Yunai</h2>
                <p className="text-white/70 text-xs">Tu resumen financiero semanal</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-2">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Section 1: Estado financiero */}
          <div className={`${ec.bg} ${ec.border} border rounded-2xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
              <EstadoIcon size={24} className={ec.color} />
              <span className={`font-bold text-base ${ec.color}`}>{ec.label}</span>
            </div>
            {adviceData?.consejo && (
              <p className={`text-sm ${theme.colors.textSecondary} leading-relaxed`}>
                {adviceData.consejo}
              </p>
            )}
          </div>

          {/* Section 2: Resumen numérico */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`${theme.colors.bgCard} rounded-2xl p-4 border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} uppercase font-semibold`}>Gastos semana</p>
              <p className={`text-xl font-bold ${theme.colors.textPrimary} mt-1`}>
                S/ {semana.gastoEstaSemana.toFixed(0)}
              </p>
              <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                <TrendIcon size={14} />
                <span className="text-xs font-medium">{trendLabel}</span>
              </div>
            </div>
            <div className={`${theme.colors.bgCard} rounded-2xl p-4 border ${theme.colors.border}`}>
              <p className={`text-xs ${theme.colors.textMuted} uppercase font-semibold`}>Balance mes</p>
              <p className={`text-xl font-bold ${mes.ingresosMes - mes.gastosMes >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                S/ {(mes.ingresosMes - mes.gastosMes).toFixed(0)}
              </p>
              <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                Ingresos: S/ {mes.ingresosMes.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Section 3: Deuda y pagos */}
          {(mes.deudaTotal > 0 || pagos.esteMes > 0) && (
            <div className={`${theme.colors.bgCard} rounded-2xl p-4 border ${theme.colors.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-yn-primary-600" />
                <span className={`text-xs font-bold uppercase tracking-wider ${theme.colors.textMuted}`}>Deudas y pagos</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={`text-xs ${theme.colors.textMuted}`}>Deuda total</p>
                  <p className={`text-base font-bold text-red-600`}>S/ {mes.deudaTotal.toFixed(0)}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.colors.textMuted}`}>Uso crédito</p>
                  <p className={`text-base font-bold ${mes.usoCredito > 60 ? 'text-red-600' : 'text-green-600'}`}>
                    {mes.usoCredito.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${theme.colors.textMuted}`}>Pagar este mes</p>
                  <p className={`text-base font-bold ${theme.colors.textPrimary}`}>S/ {pagos.esteMes.toFixed(0)}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme.colors.textMuted}`}>Próximo mes</p>
                  <p className={`text-base font-bold ${theme.colors.textPrimary}`}>S/ {pagos.proximoMes.toFixed(0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Top categorías con barras */}
          {categoriasTop.length > 0 && (
            <div className={`${theme.colors.bgCard} rounded-2xl p-4 border ${theme.colors.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-yn-primary-600" />
                <span className={`text-xs font-bold uppercase tracking-wider ${theme.colors.textMuted}`}>
                  Top categorías del mes
                </span>
              </div>
              <div className="space-y-3">
                {categoriasTop.slice(0, 5).map((cat, i) => {
                  const pct = (cat.monto / maxCat) * 100;
                  const isHighlighted = adviceData?.categoriaDestacada && cat.nombre.includes(adviceData.categoriaDestacada.replace(/^[^\s]+\s/, ''));
                  return (
                    <div key={cat.nombre}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${isHighlighted ? 'font-bold text-yn-primary-600' : theme.colors.textSecondary}`}>
                          {cat.nombre}
                        </span>
                        <span className={`text-sm font-semibold ${theme.colors.textPrimary}`}>
                          S/ {cat.monto.toFixed(0)}
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${theme.colors.bgSecondary} overflow-hidden`}>
                        <div
                          className={`h-full rounded-full transition-all ${
                            i === 0 ? 'bg-gradient-to-r from-yn-primary-500 to-yn-primary-700' :
                            i === 1 ? 'bg-yn-sec1-500' :
                            'bg-yn-neutral-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: Tip de ahorro */}
          {adviceData?.tipAhorro && (
            <div className="bg-gradient-to-r from-yn-primary-500/10 to-yn-sec1-500/10 rounded-2xl p-4 border border-yn-primary-500/20">
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider text-yn-primary-600 dark:text-yn-primary-400 mb-1`}>
                    Tip de ahorro
                  </p>
                  <p className={`text-sm ${theme.colors.textSecondary} leading-relaxed`}>
                    {adviceData.tipAhorro}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Acciones rápidas */}
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${theme.colors.textMuted} mb-3`}>
              Acciones rápidas
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => { onClose(); onStartVoice(); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${theme.colors.bgCard} border ${theme.colors.border} hover:border-yn-primary-500 transition-all`}
              >
                <Mic size={24} className="text-yn-sec1-600" />
                <span className={`text-xs font-medium ${theme.colors.textSecondary}`}>Por voz</span>
              </button>
              <button
                onClick={() => { onClose(); onStartScan(); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${theme.colors.bgCard} border ${theme.colors.border} hover:border-yn-primary-500 transition-all`}
              >
                <Camera size={24} className="text-yn-primary-600" />
                <span className={`text-xs font-medium ${theme.colors.textSecondary}`}>Escanear</span>
              </button>
              <button
                onClick={onRefreshAdvice}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${theme.colors.bgCard} border ${theme.colors.border} hover:border-yn-primary-500 transition-all`}
              >
                <RefreshCw size={24} className="text-yn-primary-600" />
                <span className={`text-xs font-medium ${theme.colors.textSecondary}`}>Nuevo análisis</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default YunaiDetailView;
