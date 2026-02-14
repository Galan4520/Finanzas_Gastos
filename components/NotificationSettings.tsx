import React, { useState } from 'react';
import { NotificationConfig } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Bell, BellOff, Send, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface NotificationSettingsProps {
  scriptUrl: string;
  pin: string;
  notificationConfig: NotificationConfig | null;
  onSaveConfig: (config: NotificationConfig) => Promise<void>;
  onSendTest: () => Promise<void>;
  onSendNotifications: () => Promise<void>;
  onSetupTrigger: () => Promise<void>;
  notify: (msg: string, type: 'success' | 'error') => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notificationConfig,
  onSaveConfig,
  onSendTest,
  onSendNotifications,
  onSetupTrigger,
  notify
}) => {
  const { theme } = useTheme();

  const [email, setEmail] = useState(notificationConfig?.email || '');
  const [diasAnticipacion, setDiasAnticipacion] = useState(notificationConfig?.diasAnticipacion || 3);
  const [activas, setActivas] = useState(notificationConfig?.notificacionesActivas !== false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [settingTrigger, setSettingTrigger] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSave = async () => {
    if (!isValidEmail(email)) {
      notify('Ingresa un email válido', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSaveConfig({ email, diasAnticipacion, notificacionesActivas: activas });
      notify('Configuración de notificaciones guardada', 'success');
    } catch {
      notify('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!isValidEmail(email)) {
      notify('Primero guarda un email válido', 'error');
      return;
    }
    setSendingTest(true);
    try {
      await onSendTest();
      notify('Email de prueba enviado. Revisa tu bandeja de entrada.', 'success');
    } catch {
      notify('Error al enviar email de prueba', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendNotifications = async () => {
    setSendingNotif(true);
    try {
      await onSendNotifications();
      notify('Notificaciones enviadas. Revisa tu email.', 'success');
    } catch {
      notify('Error al enviar notificaciones', 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleSetupTrigger = async () => {
    setSettingTrigger(true);
    try {
      await onSetupTrigger();
      notify('Trigger diario configurado (8:00 AM)', 'success');
    } catch {
      notify('Error al configurar trigger. Configúralo manualmente desde Apps Script.', 'error');
    } finally {
      setSettingTrigger(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle de notificaciones */}
      <div className={`flex items-center justify-between p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
        <div className="flex items-center gap-3">
          {activas ? <Bell size={20} className="text-emerald-500" /> : <BellOff size={20} className="text-gray-400" />}
          <div>
            <p className={`font-semibold ${theme.colors.textPrimary}`}>Notificaciones por Email</p>
            <p className={`text-xs ${theme.colors.textMuted}`}>
              Recibe alertas cuando tus pagos estén próximos a vencer
            </p>
          </div>
        </div>
        <button
          onClick={() => setActivas(!activas)}
          className={`relative w-12 h-6 rounded-full transition-colors ${activas ? 'bg-emerald-500' : 'bg-gray-400'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${activas ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {activas && (
        <>
          {/* Email */}
          <div>
            <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-2`}>
              <Mail size={14} className="inline mr-2" />
              Email para notificaciones
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-email@gmail.com"
              className={`w-full ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-emerald-500 outline-none transition-all`}
            />
            <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
              El email se envía desde la cuenta de Google asociada al Sheet
            </p>
          </div>

          {/* Días de anticipación */}
          <div>
            <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider mb-2`}>
              <Clock size={14} className="inline mr-2" />
              Días de anticipación
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setDiasAnticipacion(d)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    diasAnticipacion === d
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : `${theme.colors.bgSecondary} ${theme.colors.textSecondary} border ${theme.colors.border} hover:border-emerald-500`
                  }`}
                >
                  {d} {d === 1 ? 'día' : 'días'}
                </button>
              ))}
            </div>
            <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
              Te notificaremos {diasAnticipacion} día(s) antes del vencimiento
            </p>
          </div>

          {/* Guardar */}
          <button
            onClick={handleSave}
            disabled={saving || !isValidEmail(email)}
            className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              isValidEmail(email)
                ? `${theme.colors.primary} ${theme.colors.primaryHover} text-white shadow-lg`
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>

          {/* Acciones */}
          {isValidEmail(email) && (
            <div className={`border-t ${theme.colors.border} pt-4 space-y-3`}>
              <p className={`text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider`}>
                Acciones
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email de prueba */}
                <button
                  onClick={handleTestEmail}
                  disabled={sendingTest}
                  className={`p-3 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} hover:border-emerald-500 transition-all flex items-center gap-3`}
                >
                  {sendingTest ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <Send size={18} className="text-emerald-500" />}
                  <div className="text-left">
                    <p className={`font-medium text-sm ${theme.colors.textPrimary}`}>Email de Prueba</p>
                    <p className={`text-xs ${theme.colors.textMuted}`}>Verifica que funcione</p>
                  </div>
                </button>

                {/* Enviar notificaciones ahora */}
                <button
                  onClick={handleSendNotifications}
                  disabled={sendingNotif}
                  className={`p-3 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} hover:border-blue-500 transition-all flex items-center gap-3`}
                >
                  {sendingNotif ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <Bell size={18} className="text-blue-500" />}
                  <div className="text-left">
                    <p className={`font-medium text-sm ${theme.colors.textPrimary}`}>Enviar Ahora</p>
                    <p className={`text-xs ${theme.colors.textMuted}`}>Revisa pagos pendientes</p>
                  </div>
                </button>
              </div>

              {/* Trigger diario */}
              <div className={`p-4 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${theme.colors.textPrimary}`}>Notificación Automática Diaria</p>
                    <p className={`text-xs ${theme.colors.textMuted} mt-1`}>
                      Para recibir emails automáticos cada día a las 8:00 AM, necesitas configurar un trigger
                      en Google Apps Script. Puedes intentar configurarlo desde aquí, o hacerlo manualmente
                      ejecutando la función <code className="bg-gray-700/50 px-1 rounded text-emerald-400">configurarTriggerDiario</code> desde
                      el editor de Apps Script.
                    </p>
                    <button
                      onClick={handleSetupTrigger}
                      disabled={settingTrigger}
                      className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {settingTrigger ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                      {settingTrigger ? 'Configurando...' : 'Configurar Trigger Diario'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
