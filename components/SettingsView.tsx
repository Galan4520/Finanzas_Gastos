import React, { useState } from 'react';
import { CreditCard as CreditCardType, SavingsGoalConfig } from '../types';
import { CardForm } from './forms/CardForm';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../themes';
import { CreditCard, Target, Settings as SettingsIcon, Save, X } from 'lucide-react';
import { formatCurrency, getLocalISOString } from '../utils/format';

interface SettingsViewProps {
  scriptUrl: string;
  pin: string;
  cards: CreditCardType[];
  savingsGoal: SavingsGoalConfig | null;
  currentTheme: string;
  onAddCard: (card: CreditCardType) => void;
  onSaveGoal: (goal: SavingsGoalConfig) => void;
  onSetTheme: (theme: string) => void;
  onSync: () => void;
  notify: (msg: string, type: 'success' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  scriptUrl,
  pin,
  cards,
  savingsGoal,
  currentTheme,
  onAddCard,
  onSaveGoal,
  onSetTheme,
  onSync,
  notify
}) => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<'tarjetas' | 'meta' | 'general'>('general');
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const [goalFormData, setGoalFormData] = useState({
    meta_anual: savingsGoal?.meta_anual || 40000,
    proposito: savingsGoal?.proposito || 'Fondo de emergencia / Viaje / Auto',
    anio: savingsGoal?.anio || new Date().getFullYear()
  });

  const handleSaveGoal = () => {
    const goal: SavingsGoalConfig = {
      meta_anual: goalFormData.meta_anual,
      ahorro_mensual_necesario: goalFormData.meta_anual / 12,
      proposito: goalFormData.proposito,
      anio: goalFormData.anio,
      timestamp: getLocalISOString()
    };
    onSaveGoal(goal);
    setIsEditingGoal(false);
  };

  const sections = [
    { id: 'general' as const, label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'tarjetas' as const, label: 'Tarjetas', icon: <CreditCard size={18} /> },
    { id: 'meta' as const, label: 'Meta de Ahorro', icon: <Target size={18} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>⚙️ Configuración</h2>
        <p className={`${theme.colors.textMuted} text-sm mt-1`}>
          Gestiona tus tarjetas, metas y ajustes generales
        </p>
      </div>

      {/* Section Tabs */}
      <div className={`${theme.colors.bgCard} rounded-2xl ${theme.colors.border} border shadow-lg overflow-hidden`}>
        <div className="flex border-b ${theme.colors.border}">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 px-4 py-3 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeSection === section.id
                  ? `${theme.colors.primaryLight} ${theme.colors.textPrimary} border-b-2 border-current`
                  : `${theme.colors.textMuted} hover:${theme.colors.textPrimary}`
              }`}
            >
              {section.icon}
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* GENERAL SECTION */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div>
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                  Tema de la Aplicación
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(themes).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSetTheme(t.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        currentTheme === t.id
                          ? `${t.colors.border} ${t.colors.primaryLight} border-current`
                          : `${theme.colors.border} ${theme.colors.bgCard} hover:${theme.colors.bgCardHover}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${t.colors.gradientPrimary} shadow-md`}></div>
                        <div className="text-left">
                          <p className={`font-bold ${currentTheme === t.id ? theme.colors.textPrimary : theme.colors.textSecondary}`}>
                            {t.name}
                          </p>
                          <p className={`text-xs ${theme.colors.textMuted}`}>
                            {t.id === 'light-premium' ? 'Verde esmeralda' : 'Azul corporativo'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`pt-6 border-t ${theme.colors.border}`}></div>

              {/* Google Script URL */}
              <div>
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                  URL del Google Apps Script
                </label>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    value={scriptUrl}
                    readOnly
                    placeholder="https://script.google.com/..."
                    className={`flex-1 ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} font-mono text-sm focus:ring-2 focus:ring-current outline-none transition-all`}
                  />
                  <button
                    onClick={onSync}
                    className={`px-6 py-3 ${theme.colors.primary} ${theme.colors.primaryHover} rounded-lg text-white font-bold transition-all shadow-lg`}
                  >
                    Probar
                  </button>
                </div>
                <p className={`text-xs ${theme.colors.textMuted} mt-2`}>
                  Para cambiar la URL o PIN, reinicia la aplicación
                </p>
              </div>

              {/* PIN Display */}
              <div>
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                  PIN de Seguridad
                </label>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} font-mono text-sm`}>
                    {'•'.repeat(pin.length)}
                  </div>
                  <span className={`text-xs ${theme.colors.textMuted}`}>
                    {pin.length} dígitos
                  </span>
                </div>
                <p className={`text-xs ${theme.colors.textMuted} mt-2`}>
                  Para cambiar el PIN, actualiza la celda A2 en la hoja "Config" de tu Google Sheet
                </p>
              </div>

              <div className={`pt-6 border-t ${theme.colors.border}`}>
                <button
                  onClick={() => {
                    if(confirm("¿Borrar caché local y reiniciar?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className={`${theme.colors.danger} hover:bg-rose-700 text-white text-sm px-4 py-2 rounded-lg transition-colors`}
                >
                  ⚠️ Reiniciar aplicación
                </button>
              </div>
            </div>
          )}

          {/* TARJETAS SECTION */}
          {activeSection === 'tarjetas' && (
            <div>
              <CardForm
                scriptUrl={scriptUrl}
                pin={pin}
                onAddCard={onAddCard}
                existingCards={cards}
                notify={notify}
              />
            </div>
          )}

          {/* META DE AHORRO SECTION */}
          {activeSection === 'meta' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>
                  Configuración de Meta Anual
                </h3>
                <p className={`text-sm ${theme.colors.textMuted}`}>
                  Define tu objetivo de ahorro para el año {new Date().getFullYear()}
                </p>
              </div>

              {savingsGoal && !isEditingGoal ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${theme.colors.bgSecondary} p-4 rounded-lg`}>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Meta Anual</p>
                      <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>
                        {formatCurrency(savingsGoal.meta_anual)}
                      </p>
                    </div>
                    <div className={`${theme.colors.bgSecondary} p-4 rounded-lg`}>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Ahorro Mensual</p>
                      <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>
                        {formatCurrency(savingsGoal.ahorro_mensual_necesario)}
                      </p>
                    </div>
                    <div className={`${theme.colors.bgSecondary} p-4 rounded-lg`}>
                      <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Propósito</p>
                      <p className={`text-lg font-bold ${theme.colors.textPrimary}`}>
                        {savingsGoal.proposito}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setGoalFormData({
                        meta_anual: savingsGoal.meta_anual,
                        proposito: savingsGoal.proposito,
                        anio: savingsGoal.anio
                      });
                      setIsEditingGoal(true);
                    }}
                    className={`${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg transition-all`}
                  >
                    Editar Meta
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>
                        💰 Meta de ahorro anual
                      </label>
                      <input
                        type="number"
                        value={goalFormData.meta_anual}
                        onChange={(e) => setGoalFormData({...goalFormData, meta_anual: parseFloat(e.target.value) || 0})}
                        className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-2 ${theme.colors.textPrimary} focus:ring-2 focus:ring-current outline-none`}
                      />
                      <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                        Ahorro mensual necesario: {formatCurrency(goalFormData.meta_anual / 12)}
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${theme.colors.textPrimary} mb-2`}>
                        🎯 ¿Para qué estás ahorrando?
                      </label>
                      <input
                        type="text"
                        value={goalFormData.proposito}
                        onChange={(e) => setGoalFormData({...goalFormData, proposito: e.target.value})}
                        placeholder="Fondo de emergencia / Viaje / Auto"
                        className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-2 ${theme.colors.textPrimary} focus:ring-2 focus:ring-current outline-none`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {savingsGoal && (
                      <button
                        onClick={() => setIsEditingGoal(false)}
                        className={`flex items-center gap-2 ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} ${theme.colors.textPrimary} px-4 py-2 rounded-lg transition-colors`}
                      >
                        <X size={16} />
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={handleSaveGoal}
                      className={`flex items-center gap-2 ${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg transition-all shadow-lg`}
                    >
                      <Save size={16} />
                      Guardar Meta
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
