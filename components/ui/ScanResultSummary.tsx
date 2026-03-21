import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Check, Edit, DollarSign, Calendar, Tag, FileText, Wallet } from 'lucide-react';

interface ScanResultData {
  monto: number;
  fecha: string;
  categoria: string;
  descripcion: string;
}

interface AccountOption {
  alias: string;
  balance: number;
}

interface ScanResultSummaryProps {
  isOpen: boolean;
  result: ScanResultData;
  availableAccounts: AccountOption[];
  onConfirm: (cuenta: string) => void;
  onEdit: () => void;
  onClose: () => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(value);
};

export const ScanResultSummary: React.FC<ScanResultSummaryProps> = ({
  isOpen,
  result,
  availableAccounts,
  onConfirm,
  onEdit,
  onClose
}) => {
  const { theme } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState('Billetera');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-md w-full p-6 relative transform transition-all border ${theme.colors.border}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors hover:${theme.colors.bgSecondary} ${theme.colors.textMuted}`}
        >
          <X size={20} />
        </button>

        {/* Logo y título */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 mb-3">
            <span className="text-2xl font-bold text-white">Y</span>
          </div>
          <h3 className={`text-xl font-semibold flex items-center justify-center gap-2 ${theme.colors.textPrimary}`}>
            <Check className="text-yn-success-500" size={24} />
            Ticket escaneado correctamente
          </h3>
        </div>

        {/* Resumen de datos */}
        <div className="space-y-3 mb-6">
          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${theme.colors.bgSecondary}`}
          >
            <DollarSign className="text-yn-success-500" size={20} />
            <div className="flex-1">
              <p className={`text-xs ${theme.colors.textMuted}`}>Monto</p>
              <p className={`font-semibold text-lg ${theme.colors.textPrimary}`}>{formatCurrency(result.monto)}</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${theme.colors.bgSecondary}`}
          >
            <Calendar className="text-yn-primary-500" size={20} />
            <div className="flex-1">
              <p className={`text-xs ${theme.colors.textMuted}`}>Fecha</p>
              <p className={`font-semibold ${theme.colors.textPrimary}`}>{result.fecha}</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${theme.colors.bgSecondary}`}
          >
            <Tag className="text-yn-sec1-500" size={20} />
            <div className="flex-1">
              <p className={`text-xs ${theme.colors.textMuted}`}>Categoría</p>
              <p className={`font-semibold ${theme.colors.textPrimary}`}>{result.categoria}</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${theme.colors.bgSecondary}`}
          >
            <FileText className="text-yn-sec2-500" size={20} />
            <div className="flex-1">
              <p className={`text-xs ${theme.colors.textMuted}`}>Detalles</p>
              <p className={`font-semibold ${theme.colors.textPrimary}`}>{result.descripcion}</p>
            </div>
          </div>
        </div>

        {/* Selector de cuenta */}
        <div className="mb-6">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme.colors.textPrimary}`}>
            <Wallet size={18} className="text-yn-primary-500" />
            Cuenta a cargar
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${theme.colors.bgSecondary} ${theme.colors.border} ${theme.colors.textPrimary} focus:border-yn-primary-500 focus:outline-none focus:ring-2 focus:ring-yn-primary-500/20`}
          >
            <option value="Billetera">💵 Billetera Física</option>
            {availableAccounts.map((acc) => (
              <option key={acc.alias} value={acc.alias}>
                💳 {acc.alias} - {formatCurrency(acc.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(selectedAccount)}
            className="flex-1 bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-yn-primary-600 hover:to-yn-sec1-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Confirmar
          </button>
          <button
            onClick={onEdit}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} ${theme.colors.textPrimary}`}
          >
            <Edit size={20} />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};
