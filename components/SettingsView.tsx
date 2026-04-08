import React, { useState } from 'react';
import { CreditCard as CreditCardType, UserProfile, NotificationConfig, FamilyConfig, getCardMoneda } from '../types';
import { CardForm } from './forms/CardForm';
import { NotificationSettings } from './NotificationSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { UpgradeModal } from './ui/UpgradeModal';
import { CreditCard, Settings as SettingsIcon, Pencil, Trash2, AlertTriangle, Bell, Users, Link2, Link2Off, LogOut, Shield } from 'lucide-react';
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
  const { theme, themeName, setTheme } = useTheme();
  const { user, isSubscribed, signOut } = useAuth();
  const { plan, isPro } = usePlan();
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
  const visibleCards = cards.slice(0, plan.maxCuentas); // Billetera no cuenta, solo tarjetas
  const [activeSection, setActiveSection] = useState<'tarjetas' | 'meta' | 'general' | 'notificaciones'>('general');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const avatar = profile ? getAvatarById(profile.avatar_id) : null;

  const sections = [
    { id: 'general' as const, label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'tarjetas' as const, label: 'Tarjetas', icon: <CreditCard size={18} /> },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: <Bell size={18} /> },
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

              {/* Account Section */}
              {user && (
                <div className={`${theme.colors.bgSecondary} p-4 rounded-xl border ${theme.colors.border} space-y-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-yn-primary-500" />
                    <h3 className={`font-bold ${theme.colors.textPrimary}`}>Cuenta</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${theme.colors.textPrimary}`}>{user.email}</p>
                      <p className={`text-xs ${isSubscribed ? 'text-yn-success-500' : 'text-amber-400'}`}>
                        {isSubscribed ? '● Suscripción activa' : '○ Sin suscripción'}
                      </p>
                    </div>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all border border-red-400/30"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
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

              {/* Tema de la Aplicación */}
              <div className={`pt-6 border-t ${theme.colors.border}`}>
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-4`}>
                  Apariencia
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('yunai')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      themeName === 'yunai' 
                        ? 'bg-yn-primary-500/10 border-yn-primary-500 ring-1 ring-yn-primary-500' 
                        : `${theme.colors.bgSecondary} ${theme.colors.border} hover:border-yn-primary-400`
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-yn-primary-500 flex items-center justify-center shadow-lg shadow-yn-primary-500/20">
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                    </div>
                    <span className={`text-xs font-bold ${themeName === 'yunai' ? 'text-yn-primary-600' : theme.colors.textPrimary}`}>
                      YUNAI Brand
                    </span>
                  </button>

                  <button
                    disabled
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${theme.colors.bgSecondary} opacity-40 cursor-not-allowed`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center`}>
                      <div className="w-4 h-4 rounded-sm bg-slate-600" />
                    </div>
                    <span className={`text-xs font-medium ${theme.colors.textMuted}`}>
                      Próximamente...
                    </span>
                  </button>
                </div>
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
              {visibleCards.length > 0 && (
                <div>
                  <h4 className={`text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-3`}>
                    Tarjetas Registradas ({visibleCards.length}{!isPro && cards.length > plan.maxCuentas ? ` de ${cards.length}` : ''})
                  </h4>
                  {!isPro && cards.length > plan.maxCuentas && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                      <p className="text-xs text-amber-600 font-medium">
                        Tienes {cards.length} cuentas. El plan Free muestra solo {plan.maxCuentas}.
                      </p>
                      <button
                        onClick={() => setUpgradeFeature('Cuentas ilimitadas')}
                        className="text-xs font-bold text-[#00a750] whitespace-nowrap hover:underline"
                      >
                        Ver Pro →
                      </button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {visibleCards.map(card => {
                      const isEditing = editingCard?.alias === card.alias && editingCard?.banco === card.banco;
                      const inputCls = `w-full ${theme.colors.bgCard} border ${theme.colors.border} rounded-lg px-3 py-2 text-sm ${theme.colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-yn-primary-500`;
                      return (
                        <div key={`${card.alias}-${card.banco}`} className={`${theme.colors.bgSecondary} rounded-xl border ${theme.colors.border} overflow-hidden`}>
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00A750, #005B41)' }}>
                                <CreditCard size={20} className="text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-semibold ${theme.colors.textPrimary}`}>{card.alias}</p>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getCardMoneda(card) === 'USD' ? 'bg-blue-500/15 text-blue-400' : 'bg-yn-primary-500/15 text-yn-primary-500'}`}>
                                    {getCardMoneda(card) === 'USD' ? '$ USD' : 'S/ PEN'}
                                  </span>
                                </div>
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
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingCard(isEditing ? null : { ...card })}
                                  className={`p-2 rounded-lg ${theme.colors.bgCard} hover:bg-yn-primary-500/20 transition-colors`}
                                  title="Editar"
                                >
                                  <Pencil size={14} style={{ color: '#00A750' }} />
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
                          {/* Inline Edit Form */}
                          {isEditing && editingCard && (
                            <div className={`px-4 pb-4 pt-2 border-t ${theme.colors.border} space-y-3 animate-in slide-in-from-top-2 duration-200`}>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase block mb-1`}>Alias</label>
                                  <input
                                    value={editingCard.alias}
                                    onChange={e => setEditingCard({ ...editingCard, alias: e.target.value })}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase block mb-1`}>Límite</label>
                                  <input
                                    type="number"
                                    value={editingCard.limite ?? ''}
                                    onChange={e => setEditingCard({ ...editingCard, limite: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase block mb-1`}>Día Cierre</label>
                                  <input
                                    type="number" min={1} max={31}
                                    value={editingCard.dia_cierre ?? ''}
                                    onChange={e => setEditingCard({ ...editingCard, dia_cierre: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase block mb-1`}>Día Pago</label>
                                  <input
                                    type="number" min={1} max={31}
                                    value={editingCard.dia_pago ?? ''}
                                    onChange={e => setEditingCard({ ...editingCard, dia_pago: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                              </div>
                              {editingCard.tipo_cuenta !== 'debito' && (
                                <div className="w-1/2 sm:w-1/4">
                                  <label className={`text-[10px] font-bold ${theme.colors.textMuted} uppercase block mb-1`}>TEA %</label>
                                  <input
                                    type="number" step="0.01"
                                    value={editingCard.tea ?? ''}
                                    onChange={e => setEditingCard({ ...editingCard, tea: Number(e.target.value) })}
                                    className={inputCls}
                                  />
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    onEditCard(editingCard);
                                    setEditingCard(null);
                                    notify('Tarjeta actualizada', 'success');
                                  }}
                                  className="px-4 py-2 rounded-lg text-white text-sm font-bold transition-all active:scale-95"
                                  style={{ backgroundColor: '#00A750' }}
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingCard(null)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.colors.textMuted} ${theme.colors.bgCard} border ${theme.colors.border}`}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                  initialShowForm={true}
                  supportsMultiCurrency={(gasVersion ?? 0) >= 7}
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

        </div>
      </div>
      <UpgradeModal isOpen={!!upgradeFeature} feature={upgradeFeature ?? ''} onClose={() => setUpgradeFeature(null)} />
    </div>
  );
};
