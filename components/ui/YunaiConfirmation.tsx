import React, { useState, useEffect } from 'react';
import { Check, Edit3, X, AlertTriangle, ChevronDown, ChevronUp, Wallet, TrendingUp, CreditCard, ArrowRightLeft, Receipt } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { YunaiExtractionResult, CampoIncierto } from '../../types';

interface YunaiConfirmationProps {
  isOpen: boolean;
  data: YunaiExtractionResult[];
  availableAccounts: string[];
  onConfirm: (selectedItems: YunaiExtractionResult[]) => void;
  onEdit: (prefillData: YunaiExtractionResult) => void;
  onClose: () => void;
}

const YunaiConfirmation: React.FC<YunaiConfirmationProps> = ({
  isOpen,
  data,
  availableAccounts,
  onConfirm,
  onEdit,
  onClose,
}) => {
  const { theme } = useTheme();
  // Track selected items (checked) by index
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Track resolved data per item (for resolving uncertain fields)
  const [resolvedItems, setResolvedItems] = useState<YunaiExtractionResult[]>([]);
  // Track unresolved fields per item
  const [unresolvedByItem, setUnresolvedByItem] = useState<Set<string>[]>([]);
  // Track expanded item for detail/resolution
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Initialize state when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      // Select all by default
      setSelected(new Set(data.map((_, i) => i)));
      setResolvedItems(data.map(d => ({ ...d })));

      const unresolvedSets = data.map(d => {
        const unresolved = new Set<string>();
        (d.campos_inciertos || []).forEach(ci => unresolved.add(ci.campo));
        if (!d.cuenta) unresolved.add('cuenta');
        return unresolved;
      });
      setUnresolvedByItem(unresolvedSets);

      // Auto-expand the first item with unresolved fields, or none
      const firstUnresolved = unresolvedSets.findIndex(s => s.size > 0);
      setExpandedIdx(firstUnresolved >= 0 ? firstUnresolved : null);
    }
  }, [data]);

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const resolveField = (itemIdx: number, campo: string, value: string | number) => {
    setResolvedItems(prev => {
      const next = [...prev];
      next[itemIdx] = { ...next[itemIdx], [campo]: value };
      return next;
    });
    setUnresolvedByItem(prev => {
      const next = [...prev];
      const s = new Set(next[itemIdx]);
      s.delete(campo);
      next[itemIdx] = s;
      return next;
    });
  };

  // Check if all selected items have resolved fields
  const allSelectedResolved = [...selected].every(idx =>
    !unresolvedByItem[idx] || unresolvedByItem[idx].size === 0
  );

  const selectedCount = selected.size;

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'gasto': return { label: 'Gasto', icon: Wallet, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'ingreso': return { label: 'Ingreso', icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
      case 'tarjeta': return { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'pago_tarjeta': return { label: 'Pago Tarjeta', icon: Receipt, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' };
      case 'transferencia': return { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' };
      default: return { label: tipo, icon: Wallet, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const handleConfirm = () => {
    const selectedItems = [...selected].map(idx => resolvedItems[idx]);
    onConfirm(selectedItems);
  };

  if (!isOpen || !data || data.length === 0) return null;

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
                <h3 className="text-white font-bold text-base">
                  {data.length === 1 ? 'Yunai detectó 1 movimiento' : `Yunai detectó ${data.length} movimientos`}
                </h3>
                <p className="text-white/70 text-xs">
                  {data.length > 1 ? 'Marca los que quieras registrar' : 'Revisa y confirma'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Movement List */}
        <div className="p-4 space-y-3">
          {resolvedItems.map((item, idx) => {
            const tipoConfig = getTipoConfig(item.tipo);
            const TipoIcon = tipoConfig.icon;
            const isSelected = selected.has(idx);
            const isExpanded = expandedIdx === idx;
            const hasUnresolved = unresolvedByItem[idx]?.size > 0;
            const uncertainMap = new Map<string, CampoIncierto>();
            (data[idx]?.campos_inciertos || []).forEach(ci => uncertainMap.set(ci.campo, ci));

            return (
              <div
                key={idx}
                className={`rounded-2xl border-2 transition-all ${
                  isSelected
                    ? hasUnresolved
                      ? 'border-yn-sec1-400'
                      : 'border-yn-primary-500'
                    : `${theme.colors.border} opacity-50`
                }`}
              >
                {/* Compact Row */}
                <div
                  className={`flex items-center gap-3 p-3 cursor-pointer ${theme.colors.bgSecondary} rounded-t-2xl ${!isExpanded ? 'rounded-b-2xl' : ''}`}
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(idx); }}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-yn-primary-500 border-yn-primary-500 text-white'
                        : `${theme.colors.border} border-yn-neutral-300 dark:border-yn-neutral-600`
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </button>

                  {/* Type icon */}
                  <div className={`w-8 h-8 rounded-lg ${tipoConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <TipoIcon size={16} className={tipoConfig.color} />
                  </div>

                  {/* Description + category */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${theme.colors.textPrimary} truncate`}>
                      {item.descripcion || 'Sin descripción'}
                    </p>
                    <p className={`text-xs ${theme.colors.textMuted} truncate`}>
                      {item.categoria}
                      {item.cuenta_destino && item.cuenta
                        ? ` · ${item.cuenta} → ${item.cuenta_destino}`
                        : item.cuenta ? ` · ${item.cuenta}` : ''}
                    </p>
                  </div>

                  {/* Amount + expand */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-base font-bold ${
                      item.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400'
                        : item.tipo === 'transferencia' ? 'text-orange-600 dark:text-orange-400'
                        : item.tipo === 'pago_tarjeta' ? 'text-purple-600 dark:text-purple-400'
                        : theme.colors.textPrimary
                    }`}>
                      {item.tipo === 'ingreso' ? '+' : item.tipo === 'transferencia' ? '↔' : '-'}S/{item.monto?.toFixed(2)}
                    </span>
                    {hasUnresolved && (
                      <AlertTriangle size={14} className="text-yn-sec1-500 flex-shrink-0" />
                    )}
                    {isExpanded ? <ChevronUp size={16} className={theme.colors.textMuted} /> : <ChevronDown size={16} className={theme.colors.textMuted} />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className={`px-4 pb-4 pt-2 space-y-2 border-t ${theme.colors.border}`}>
                    {/* Unresolved fields alert */}
                    {hasUnresolved && (
                      <div className="bg-yn-primary-500/10 border border-yn-primary-500/30 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-yn-primary-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yn-primary-700">
                          {data[idx]?.campos_inciertos?.find(ci => unresolvedByItem[idx]?.has(ci.campo))?.pregunta ||
                            'Hay campos que necesitan tu confirmación'}
                        </p>
                      </div>
                    )}

                    {/* Detail fields */}
                    <DetailField label="Tipo" value={tipoConfig.label} theme={theme} />
                    <DetailField label="Monto" value={`S/ ${item.monto?.toFixed(2)}`} theme={theme} bold />
                    <DetailField label="Fecha" value={item.fecha} theme={theme} />

                    {/* Cuenta — with resolution if needed */}
                    {unresolvedByItem[idx]?.has('cuenta') ? (
                      <div className="space-y-1.5">
                        <span className={`text-xs font-medium ${theme.colors.textMuted}`}>
                          {uncertainMap.get('cuenta')?.pregunta || 'Cuenta *'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(uncertainMap.get('cuenta')?.opciones?.length
                            ? uncertainMap.get('cuenta')!.opciones
                            : availableAccounts
                          ).map(acc => (
                            <button
                              key={acc}
                              onClick={() => resolveField(idx, 'cuenta', acc)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                acc === uncertainMap.get('cuenta')?.valor_sugerido
                                  ? 'bg-yn-primary-500 text-white border-yn-primary-600 shadow-sm'
                                  : 'bg-yn-primary-500/10 text-yn-primary-700 border-yn-primary-500/25 hover:bg-yn-primary-500/20'
                              }`}
                            >
                              {acc}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <DetailField label="Cuenta" value={item.cuenta || 'Sin asignar'} theme={theme} />
                    )}

                    {/* Other uncertain fields */}
                    {[...uncertainMap.entries()]
                      .filter(([campo]) => campo !== 'cuenta' && unresolvedByItem[idx]?.has(campo))
                      .map(([campo, ci]) => (
                        <div key={campo} className="space-y-1.5">
                          <span className={`text-xs font-medium ${theme.colors.textMuted}`}>{ci.pregunta || campo}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {ci.opciones.map(opt => (
                              <button
                                key={opt}
                                onClick={() => resolveField(idx, campo, campo === 'num_cuotas' ? Number(opt) : opt)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                  opt === ci.valor_sugerido
                                    ? 'bg-yn-primary-500 text-white border-yn-primary-600 shadow-sm'
                                    : 'bg-yn-primary-500/10 text-yn-primary-700 border-yn-primary-500/25 hover:bg-yn-primary-500/20'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    }

                    {item.cuenta_destino && (
                      <DetailField label="Cuenta destino" value={item.cuenta_destino} theme={theme} />
                    )}

                    {(item.num_cuotas > 1) && (
                      <DetailField label="Cuotas" value={`${item.num_cuotas} cuotas`} theme={theme} />
                    )}

                    {item.notas && <DetailField label="Notas" value={item.notas} theme={theme} />}

                    {/* Edit single item */}
                    <button
                      onClick={() => onEdit(resolvedItems[idx])}
                      className={`w-full mt-2 py-2 rounded-xl text-xs font-semibold ${theme.colors.bgSecondary} ${theme.colors.textSecondary} flex items-center justify-center gap-1.5`}
                    >
                      <Edit3 size={12} />
                      Editar este manualmente
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary + Actions */}
        <div className={`sticky bottom-0 p-4 border-t ${theme.colors.border} bg-inherit`}>
          {/* Summary */}
          {selectedCount > 0 && (
            <div className={`flex items-center justify-between mb-3 text-sm ${theme.colors.textMuted}`}>
              <span>{selectedCount} de {data.length} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
              <span className={`font-bold ${theme.colors.textPrimary}`}>
                Total: S/ {[...selected].reduce((sum, idx) => {
                  const item = resolvedItems[idx];
                  if (item.tipo === 'ingreso') return sum + item.monto;
                  if (item.tipo === 'transferencia') return sum; // net zero
                  return sum - item.monto;
                }, 0).toFixed(2)}
              </span>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || !allSelectedResolved}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              selectedCount > 0 && allSelectedResolved
                ? 'bg-yn-primary-500 text-white hover:bg-yn-primary-600 shadow-md'
                : 'bg-yn-neutral-200 dark:bg-yn-neutral-700 text-yn-neutral-400 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            {selectedCount === 0
              ? 'Selecciona al menos uno'
              : !allSelectedResolved
              ? 'Resuelve los campos pendientes'
              : selectedCount === 1
              ? 'Confirmar movimiento'
              : `Confirmar ${selectedCount} movimientos`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple detail field
const DetailField: React.FC<{ label: string; value: string; theme: any; bold?: boolean }> = ({ label, value, theme, bold }) => (
  <div className="flex items-center justify-between">
    <span className={`text-xs ${theme.colors.textMuted}`}>{label}</span>
    <span className={`text-xs ${bold ? 'font-bold' : 'font-medium'} ${theme.colors.textPrimary} text-right max-w-[65%] truncate`}>
      {value}
    </span>
  </div>
);

export default YunaiConfirmation;
