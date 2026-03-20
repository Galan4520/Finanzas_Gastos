import React, { useState } from 'react';
import { CreditCard as CreditCardType, UserProfile, NotificationConfig, FamilyConfig } from '../types';
import { CardForm } from './forms/CardForm';
import { NotificationSettings } from './NotificationSettings';
import { useTheme } from '../contexts/ThemeContext';
import { CreditCard, Settings as SettingsIcon, Pencil, Trash2, AlertTriangle, Bell, Users, Link2, Link2Off } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { getAvatarById } from '../avatars';
import { AvatarSvg } from './ui/AvatarSvg';

interface SettingsViewProps {
  scriptUrl: string;
  pin: string;
  cards: CreditCardType[];
  profile?: UserProfile | null;
  notificationConfig?: NotificationConfig | null;
  onAddCard: (card: CreditCardType) => void;
  onEditCard: (card: CreditCardType) => void;
  onDeleteCard: (card: CreditCardType) => void;
  onSetTheme?: (theme: string) => void;
  onSync: () => void;
  onSaveNotificationConfig: (config: NotificationConfig) => Promise<{ success: boolean; verified: boolean }>;
  onSendTestEmail: () => Promise<{ enviado: boolean; verified: boolean; razon?: string }>;
  onSendNotifications: () => Promise<{ enviado: boolean; verified: boolean; razon?: string }>;
  onSetupDailyTrigger: () => Promise<void>;
  notify: (msg: string, type: 'success' | 'error') => void;
  familyConfig?: FamilyConfig | null;
  onDisconnectPartner?: () => void;
  onNavigateToFamilia?: () => void;
  gasVersion?: number | null;
  schemaVersion?: number | null;
  hasGeminiKey?: boolean;
  onSaveGeminiKey?: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  scriptUrl,
  pin,
  cards,
  profile,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onSync,
  notificationConfig,
  onSaveNotificationConfig,
  onSendTestEmail,
  onSendNotifications,
  onSetupDailyTrigger,
  notify,
  familyConfig,
  onDisconnectPartner,
  onNavigateToFamilia,
  gasVersion,
  schemaVersion,
  hasGeminiKey,
  onSaveGeminiKey
}) => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<'tarjetas' | 'meta' | 'general' | 'notificaciones' | 'ia'>('general');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const avatar = profile ? getAvatarById(profile.avatar_id) : null;

  const sections = [
    { id: 'general' as const, label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'tarjetas' as const, label: 'Tarjetas', icon: <CreditCard size={18} /> },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: <Bell size={18} /> },
    { id: 'ia' as const, label: 'IA (Scanner)', icon: <Pencil size={18} /> }, // Using Pencil as temporary icon for IA setup
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
          <SettingsIcon size={28} />
          Configuración
        </h2>
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
              className={`flex-1 px-4 py-3 font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeSection === section.id
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

              {/* Profile Card (Added for Mobile visibility) */}
              {profile && avatar && (
                <div className={`${theme.colors.bgSecondary} p-4 rounded-xl border ${theme.colors.border} flex items-center gap-4`}>
                  <div className="relative">
                    <AvatarSvg avatarId={avatar.id} size={64} className="border-4 border-white shadow-md" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-yn-success-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${theme.colors.textPrimary}`}>{profile.nombre}</h3>
                    <p className={`text-sm ${theme.colors.textMuted}`}>{avatar.label}</p>
                    <p className="text-xs text-yn-primary-500 font-medium mt-1">● Cuenta Activa</p>
                  </div>
                </div>
              )}

              {/* Divider before URL section */}
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
                    className={`flex-1 ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} font-sans text-sm focus:ring-2 focus:ring-current outline-none transition-all`}
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
                  <div className={`flex-1 ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} font-sans text-sm`}>
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

              {/* Plan Familiar */}
              <div className={`pt-6 border-t ${theme.colors.border}`}>
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                  <Users size={16} /> Plan Familiar
                </label>
                {familyConfig ? (
                  <div className={`${theme.colors.bgSecondary} rounded-xl border ${theme.colors.border} p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Link2 size={16} className="text-yn-success-400" />
                      <div>
                        <p className={`text-sm font-bold ${theme.colors.textPrimary}`}>{familyConfig.partnerName}</p>
                        <p className={`text-xs ${theme.colors.textMuted}`}>Pareja conectada</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {onNavigateToFamilia && (
                        <button onClick={onNavigateToFamilia} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                          Ver
                        </button>
                      )}
                      {onDisconnectPartner && (
                        <button onClick={onDisconnectPartner} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                          <Link2Off size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`${theme.colors.bgSecondary} rounded-xl border ${theme.colors.border} p-4`}>
                    <p className={`text-sm ${theme.colors.textMuted} mb-3`}>
                      Conecta la cuenta de tu pareja para ver un resumen combinado de finanzas familiares.
                    </p>
                    {onNavigateToFamilia && (
                      <button
                        onClick={onNavigateToFamilia}
                        className={`w-full py-2.5 rounded-xl font-bold text-white text-sm ${theme.colors.gradientPrimary} transition-all`}
                      >
                        Configurar Plan Familiar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Version Info */}
              {(gasVersion !== null || schemaVersion !== null) && (
                <div className={`pt-6 border-t ${theme.colors.border}`}>
                  <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                    Información del Sistema
                  </label>
                  <div className={`${theme.colors.bgSecondary} rounded-xl p-4 border ${theme.colors.border}`}>
                    <div className="flex flex-wrap gap-4 text-xs font-sans">
                      {gasVersion !== null && (
                        <div>
                          <span className={theme.colors.textMuted}>GAS</span>{' '}
                          <span className={`${theme.colors.textPrimary} font-bold`}>v{gasVersion}</span>
                        </div>
                      )}
                      {schemaVersion !== null && (
                        <div>
                          <span className={theme.colors.textMuted}>Schema</span>{' '}
                          <span className={`${theme.colors.textPrimary} font-bold`}>v{schemaVersion}</span>
                        </div>
                      )}
                      <div>
                        <span className={theme.colors.textMuted}>App</span>{' '}
                        <span className={`${theme.colors.textPrimary} font-bold`}>5.2</span>
                      </div>
                    </div>
                    <p className={`text-xs ${theme.colors.textMuted} mt-2`}>
                      El schema y código se actualizan automáticamente
                    </p>
                  </div>
                </div>
              )}

              <div className={`pt-6 border-t ${theme.colors.border}`}>
                <button
                  onClick={() => {
                    if (confirm("¿Borrar caché local y reiniciar?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className={`${theme.colors.danger} hover:bg-yn-error-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 justify-center`}
                >
                  <AlertTriangle size={16} />
                  Reiniciar aplicación
                </button>
              </div>
            </div>
          )}

          {/* TARJETAS SECTION */}
          {activeSection === 'tarjetas' && (
            <div className="space-y-6">
              {/* Existing Cards List */}
              {cards.length > 0 && (
                <div>
                  <h4 className={`text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                    Tarjetas Registradas ({cards.length})
                  </h4>
                  <div className="space-y-3">
                    {cards.map(card => (
                      <div
                        key={`${card.alias}-${card.banco}`}
                        className={`${theme.colors.bgSecondary} p-4 rounded-xl border ${theme.colors.border} flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yn-primary-500 to-yn-primary-700 flex items-center justify-center">
                            <CreditCard size={20} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-semibold ${theme.colors.textPrimary}`}>{card.alias}</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>{card.banco} • {card.tipo_tarjeta}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className={`text-xs ${theme.colors.textMuted}`}>Límite</p>
                            <p className={`font-sans font-semibold ${theme.colors.textSecondary}`}>{formatCurrency(card.limite)}</p>
                          </div>
                          <p className={`text-xs ${theme.colors.textMuted} hidden sm:block`}>
                            Cierre: {card.dia_cierre} | Pago: {card.dia_pago}
                          </p>
                          {/* Edit/Delete Buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => onEditCard(card)}
                              className={`p-2 rounded-lg ${theme.colors.bgCard} hover:bg-yn-primary-500/20 transition-colors`}
                              title="Editar"
                            >
                              <Pencil size={14} className="text-yn-primary-500" />
                            </button>
                            <button
                              onClick={() => onDeleteCard(card)}
                              className={`p-2 rounded-lg ${theme.colors.bgCard} hover:bg-red-500/20 transition-colors`}
                              title="Eliminar"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {cards.length > 0 && <div className={`border-t ${theme.colors.border}`}></div>}

              {/* Add New Card Form */}
              <div>
                <h4 className={`text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                  Agregar Nueva Tarjeta
                </h4>
                <CardForm
                  scriptUrl={scriptUrl}
                  pin={pin}
                  onAddCard={onAddCard}
                  existingCards={cards}
                  notify={notify}
                />
              </div>
            </div>
          )}

          {/* NOTIFICACIONES SECTION */}
          {activeSection === 'notificaciones' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>
                  Notificaciones de Vencimiento
                </h3>
                <p className={`text-sm ${theme.colors.textMuted}`}>
                  Recibe un email cuando tus pagos de tarjeta de crédito estén por vencer
                </p>
              </div>
              <NotificationSettings
                scriptUrl={scriptUrl}
                pin={pin}
                notificationConfig={notificationConfig || null}
                onSaveConfig={onSaveNotificationConfig}
                onSendTest={onSendTestEmail}
                onSendNotifications={onSendNotifications}
                onSetupTrigger={onSetupDailyTrigger}
                notify={notify}
              />
            </div>
          )}

          {/* IA SECTION */}
          {activeSection === 'ia' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2 flex items-center gap-2`}>
                   Scanner con Inteligencia Artificial
                </h3>
                <p className={`text-sm ${theme.colors.textMuted}`}>
                  Configura tu API Key de Gemini para activar el escaneo automático de tickets y comprobantes.
                </p>
              </div>

              <div className={`${theme.colors.bgSecondary} p-6 rounded-2xl border ${theme.colors.border} space-y-4`}>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-xs font-bold ${theme.colors.textPrimary} uppercase tracking-wider`}>
                    Gemini API Key
                  </label>
                  {hasGeminiKey ? (
                    <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">
                      ● CONFIGURADO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">
                      ● NO CONFIGURADO
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={hasGeminiKey ? "••••••••••••••••" : "Tu API Key de Google Gemini"}
                    className={`w-full ${theme.colors.bgCard} ${theme.colors.border} border rounded-xl px-4 py-3 ${theme.colors.textPrimary} font-mono text-sm focus:ring-2 focus:ring-yn-primary-500 outline-none`}
                  />
                  <button
                    onClick={async () => {
                      if (!geminiKey) return;
                      setIsSavingKey(true);
                      try {
                        const res = await onSaveGeminiKey?.(geminiKey);
                        if (res?.success) {
                          setGeminiKey('');
                          notify('API Key guardada correctamente', 'success');
                        } else {
                          notify(res?.error || 'Error al guardar la clave', 'error');
                        }
                      } finally {
                        setIsSavingKey(false);
                      }
                    }}
                    disabled={isSavingKey || !geminiKey}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isSavingKey || !geminiKey
                      ? 'bg-yn-neutral-700 opacity-50'
                      : 'bg-yn-primary-600 hover:bg-yn-primary-700 active:scale-[0.98]'
                      }`}
                  >
                    {isSavingKey ? 'Guardando...' : 'Guardar API Key'}
                  </button>
                </div>

                <div className="pt-4 border-t border-yn-neutral-800/50">
                  <h4 className={`text-xs font-bold ${theme.colors.textPrimary} uppercase mb-2`}>¿Cómo obtener tu clave?</h4>
                  <ul className={`text-xs ${theme.colors.textMuted} space-y-2 list-disc pl-4`}>
                    <li>Ingresa a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-yn-primary-400 hover:underline">Google AI Studio</a>.</li>
                    <li>Crea una nueva "API Key" (es gratuita hasta cierto límite).</li>
                    <li>Pégala aquí y guarda los cambios.</li>
                    <li>¡Listo! Ya puedes tomar fotos a tus tickets en la pestaña "Registrar".</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-yn-primary-500/5 border border-yn-primary-500/20">
                <p className={`text-xs ${theme.colors.textMuted} leading-relaxed italic text-center`}>
                  Nota: Tu clave se almacena de forma segura en tu propio script de Google y nunca sale de tu ecosistema de Google.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
