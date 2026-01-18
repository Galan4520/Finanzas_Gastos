import React, { useState } from 'react';
import { PendingExpense } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { RefreshCw, Trash2, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface DebugPanelProps {
  pendingExpenses: PendingExpense[];
  onForceSync: () => Promise<void>;
  onClearCache: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ pendingExpenses, onForceSync, onClearCache }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await onForceSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAndSync = async () => {
    if (confirm('⚠️ Esto borrará todos los datos locales y volverá a sincronizar desde Google Sheets. ¿Continuar?')) {
      onClearCache();
      setIsSyncing(true);
      setTimeout(async () => {
        await onForceSync();
        setIsSyncing(false);
        window.location.reload();
      }, 1000);
    }
  };

  const deudasCount = pendingExpenses.filter(p => !p.tipo || p.tipo === 'deuda').length;
  const suscripcionesCount = pendingExpenses.filter(p => p.tipo === 'suscripcion').length;
  const sinTipoCount = pendingExpenses.filter(p => !p.tipo).length;
  const sinMontoPagadoCount = pendingExpenses.filter(p => p.monto_pagado_total === undefined).length;

  const hasIssues = sinTipoCount > 0 || sinMontoPagadoCount > 0;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 ${hasIssues ? 'bg-red-500 hover:bg-red-600' : theme.colors.primary} text-white p-3 rounded-full shadow-lg z-50 transition-all hover:scale-110`}
        title="Herramientas de Depuración"
      >
        {hasIssues ? <AlertCircle size={24} /> : <Database size={24} />}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 ${theme.colors.bgCard} border ${theme.colors.border} rounded-2xl shadow-2xl p-6 w-96 z-50`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
          <Database size={20} />
          Panel de Depuración
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className={`${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}
        >
          ✕
        </button>
      </div>

      {/* Estado de Datos */}
      <div className="space-y-3 mb-4">
        <div className={`p-3 rounded-lg ${theme.colors.bgSecondary}`}>
          <div className={`text-xs font-semibold ${theme.colors.textMuted} mb-2`}>ESTADO DE DATOS</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={theme.colors.textSecondary}>Deudas:</span>
              <span className={`font-bold ${theme.colors.textPrimary}`}>{deudasCount}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.colors.textSecondary}>Suscripciones:</span>
              <span className={`font-bold ${theme.colors.textPrimary}`}>{suscripcionesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className={sinTipoCount > 0 ? 'text-red-400' : theme.colors.textSecondary}>Sin campo tipo:</span>
              <span className={`font-bold ${sinTipoCount > 0 ? 'text-red-400' : theme.colors.textPrimary}`}>
                {sinTipoCount}
                {sinTipoCount > 0 && ' ⚠️'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={sinMontoPagadoCount > 0 ? 'text-orange-400' : theme.colors.textSecondary}>Sin monto_pagado_total:</span>
              <span className={`font-bold ${sinMontoPagadoCount > 0 ? 'text-orange-400' : theme.colors.textPrimary}`}>
                {sinMontoPagadoCount}
                {sinMontoPagadoCount > 0 && ' ⚠️'}
              </span>
            </div>
          </div>
        </div>

        {/* Mensajes de Error */}
        {hasIssues && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-300">
                <p className="font-semibold mb-1">Problemas detectados:</p>
                {sinTipoCount > 0 && <p>• {sinTipoCount} registro(s) sin campo "tipo" (deuda/suscripcion)</p>}
                {sinMontoPagadoCount > 0 && <p>• {sinMontoPagadoCount} registro(s) sin "monto_pagado_total"</p>}
                <p className="mt-2 font-semibold">Solución: Usar "Limpiar y Re-sincronizar"</p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-2">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className={`w-full ${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-3 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}
          </button>

          <button
            onClick={handleClearAndSync}
            disabled={isSyncing}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Limpiar y Re-sincronizar
          </button>
        </div>

        {/* Info de localStorage */}
        <div className={`text-xs ${theme.colors.textMuted} p-2 rounded ${theme.colors.bgSecondary}`}>
          <div className="font-semibold mb-1">LocalStorage:</div>
          <div className="font-mono text-[10px]">
            <div>Versión: {localStorage.getItem('app_version') || 'N/A'}</div>
            <div>Deudas: {localStorage.getItem('pendientes') ? JSON.parse(localStorage.getItem('pendientes')!).length : 0}</div>
            <div>Tarjetas: {localStorage.getItem('cards') ? JSON.parse(localStorage.getItem('cards')!).length : 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
