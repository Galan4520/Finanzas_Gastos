import React, { useState, useEffect } from 'react';
import { Check, Edit3, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { YunaiExtractionResult, CampoIncierto } from '../../types';

interface YunaiConfirmationProps {
  isOpen: boolean;
  data: YunaiExtractionResult;
  availableAccounts: string[];
  onConfirm: (finalData: YunaiExtractionResult) => void;
  onEdit: (prefillData: YunaiExtractionResult) => void;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  tipo: 'Tipo',
  monto: 'Monto',
  descripcion: 'Descripción',
  categoria: 'Categoría',
  cuenta: 'Cuenta',
  fecha: 'Fecha',
  notas: 'Notas',
  num_cuotas: 'Cuotas',
  tipo_gasto: 'Tipo de gasto',
};

const YunaiConfirmation: React.FC<YunaiConfirmationProps> = ({
  isOpen,
  data,
  availableAccounts,
  onConfirm,
  onEdit,
  onClose,
}) => {
  const { theme } = useTheme();
  const [resolvedData, setResolvedData] = useState<YunaiExtractionResult>(data);
  const [unresolvedFields, setUnresolvedFields] = useState<Set<string>>(new Set());

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (data) {
      setResolvedData({ ...data });
      const unresolved = new Set<string>();
      (data.campos_inciertos || []).forEach(ci => unresolved.add(ci.campo));
      // Also mark cuenta as unresolved if null
      if (!data.cuenta) unresolved.add('cuenta');
      setUnresolvedFields(unresolved);
    }
  }, [data]);

  const resolveField = (campo: string, value: string | number) => {
    setResolvedData(prev => ({ ...prev, [campo]: value }));
    setUnresolvedFields(prev => {
      const next = new Set(prev);
      next.delete(campo);
      return next;
    });
  };

  const allResolved = unresolvedFields.size === 0;

  const getConfidenceColor = (confianza: number) => {
    if (confianza >= 0.8) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (confianza >= 0.5) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'gasto': return 'Gasto';
      case 'ingreso': return 'Ingreso';
      case 'tarjeta': return 'Tarjeta (Crédito)';
      default: return tipo;
    }
  };

  if (!isOpen || !data) return null;

  const uncertainMap = new Map<string, CampoIncierto>();
  (data.campos_inciertos || []).forEach(ci => uncertainMap.set(ci.campo, ci));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className={`relative ${theme.colors.bgCard} rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-t ${theme.colors.border} sm:border animate-in slide-in-from-bottom`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-yn-primary-600 to-yn-primary-700 rounded-t-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 bg-white">
                <img src="/logos/Mascota_Yunai.svg" alt="Yunai" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Yunai entendió esto</h3>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getConfidenceColor(resolvedData.confianza)}`}>
                  {Math.round(resolvedData.confianza * 100)}% seguro
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Yunai question if uncertain */}
        {data.campos_inciertos.length > 0 && unresolvedFields.size > 0 && (
          <div className="mx-4 mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {data.campos_inciertos.find(ci => unresolvedFields.has(ci.campo))?.pregunta ||
                'Hay campos que necesito que confirmes'}
            </p>
          </div>
        )}

        {/* Fields */}
        <div className="p-4 space-y-3">
          {/* Tipo */}
          <FieldRow
            label="Tipo"
            value={getTipoLabel(resolvedData.tipo)}
            uncertain={uncertainMap.get('tipo')}
            isUnresolved={unresolvedFields.has('tipo')}
            onResolve={(val) => resolveField('tipo', val)}
            theme={theme}
          />

          {/* Monto */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${theme.colors.bgSecondary}`}>
            <span className={`text-sm font-medium ${theme.colors.textMuted}`}>Monto</span>
            <span className={`text-lg font-bold ${theme.colors.textPrimary}`}>
              S/ {resolvedData.monto?.toFixed(2) || '0.00'}
            </span>
          </div>

          {/* Descripcion */}
          <FieldRow
            label="Descripción"
            value={resolvedData.descripcion}
            theme={theme}
          />

          {/* Categoria */}
          <FieldRow
            label="Categoría"
            value={resolvedData.categoria}
            uncertain={uncertainMap.get('categoria')}
            isUnresolved={unresolvedFields.has('categoria')}
            onResolve={(val) => resolveField('categoria', val)}
            theme={theme}
          />

          {/* Cuenta — use AI-filtered options from campos_inciertos first, fallback to all accounts */}
          {unresolvedFields.has('cuenta') ? (
            <div className={`p-3 rounded-xl border-2 border-yellow-400 dark:border-yellow-600 ${theme.colors.bgSecondary}`}>
              <span className={`text-sm font-medium ${theme.colors.textMuted} block mb-2`}>
                {uncertainMap.get('cuenta')?.pregunta || 'Cuenta *'}
              </span>
              <div className="flex flex-wrap gap-2">
                {/* Use AI-filtered options if available, otherwise fallback to all accounts */}
                {(uncertainMap.get('cuenta')?.opciones?.length
                  ? uncertainMap.get('cuenta')!.opciones
                  : availableAccounts
                ).map(acc => (
                  <button
                    key={acc}
                    onClick={() => resolveField('cuenta', acc)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      acc === uncertainMap.get('cuenta')?.valor_sugerido
                        ? 'bg-yn-primary-500/20 text-yn-primary-700 dark:text-yn-primary-300 border-yn-primary-500/40'
                        : 'bg-yn-primary-500/10 text-yn-primary-700 dark:text-yn-primary-300 border-yn-primary-500/20'
                    } hover:bg-yn-primary-500/20`}
                  >
                    {acc}
                    {acc === uncertainMap.get('cuenta')?.valor_sugerido && ' (sugerido)'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <FieldRow
              label="Cuenta"
              value={resolvedData.cuenta || 'Sin asignar'}
              theme={theme}
            />
          )}

          {/* Fecha */}
          <FieldRow label="Fecha" value={resolvedData.fecha} theme={theme} />

          {/* Cuotas (only if > 1 or tipo is tarjeta) */}
          {(resolvedData.num_cuotas > 1 || resolvedData.tipo === 'tarjeta') && (
            <FieldRow
              label="Cuotas"
              value={resolvedData.num_cuotas > 1 ? `${resolvedData.num_cuotas} cuotas` : 'Sin cuotas'}
              uncertain={uncertainMap.get('num_cuotas')}
              isUnresolved={unresolvedFields.has('num_cuotas')}
              onResolve={(val) => resolveField('num_cuotas', Number(val))}
              theme={theme}
            />
          )}

          {/* Notas (if any) */}
          {resolvedData.notas && (
            <FieldRow label="Notas" value={resolvedData.notas} theme={theme} />
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 p-4 border-t border-yn-neutral-100 dark:border-yn-neutral-700 bg-inherit">
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(resolvedData)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm ${theme.colors.bgSecondary} ${theme.colors.textSecondary} flex items-center justify-center gap-2`}
            >
              <Edit3 size={16} />
              Editar manual
            </button>
            <button
              onClick={() => allResolved && onConfirm(resolvedData)}
              disabled={!allResolved}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                allResolved
                  ? 'bg-yn-primary-500 text-white hover:bg-yn-primary-600 shadow-md'
                  : 'bg-yn-neutral-200 dark:bg-yn-neutral-700 text-yn-neutral-400 cursor-not-allowed'
              }`}
            >
              <Check size={16} />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for each field row
interface FieldRowProps {
  label: string;
  value: string | number;
  uncertain?: CampoIncierto;
  isUnresolved?: boolean;
  onResolve?: (value: string) => void;
  theme: any;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, uncertain, isUnresolved, onResolve, theme }) => {
  if (isUnresolved && uncertain && onResolve) {
    return (
      <div className={`p-3 rounded-xl border-2 border-yellow-400 dark:border-yellow-600 ${theme.colors.bgSecondary}`}>
        <span className={`text-sm font-medium ${theme.colors.textMuted} block mb-2`}>{label} *</span>
        <div className="flex flex-wrap gap-2">
          {uncertain.opciones.map(opt => (
            <button
              key={opt}
              onClick={() => onResolve(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                opt === uncertain.valor_sugerido
                  ? 'bg-yn-primary-500/20 text-yn-primary-700 dark:text-yn-primary-300 border-yn-primary-500/40'
                  : 'bg-yn-neutral-100 dark:bg-yn-neutral-700 text-yn-neutral-600 dark:text-yn-neutral-300 border-yn-neutral-200 dark:border-yn-neutral-600'
              } hover:bg-yn-primary-500/20`}
            >
              {opt}
              {opt === uncertain.valor_sugerido && ' (sugerido)'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${theme.colors.bgSecondary}`}>
      <span className={`text-sm font-medium ${theme.colors.textMuted}`}>{label}</span>
      <span className={`text-sm font-semibold ${theme.colors.textPrimary} text-right max-w-[60%] truncate`}>
        {value}
      </span>
    </div>
  );
};

export default YunaiConfirmation;
