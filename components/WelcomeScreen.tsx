import React, { useState } from 'react';
import { Sparkles, BookOpen, Link as LinkIcon, CheckCircle, Copy, ExternalLink, Lock, Wallet } from 'lucide-react';

interface WelcomeScreenProps {
  onUrlSubmit: (url: string, pin: string) => Promise<void>;
  isSyncing?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUrlSubmit, isSyncing = false }) => {
  const [url, setUrl] = useState('');
  const [pin, setPin] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && pin.trim() && !isValidating) {
      setIsValidating(true);
      setValidationError('');
      try {
        await onUrlSubmit(url.trim(), pin.trim());
        // Si llegamos aquí, la validación fue exitosa
      } catch (error) {
        // Mostrar error de validación
        setValidationError('No se pudo conectar. Verifica que la URL, el PIN sean correctos y que el script esté desplegado.');
      } finally {
        setIsValidating(false);
      }
    }
  };

  const googleAppsScriptCode = `function doGet(e) {
  // Validar PIN
  const providedPin = e.parameter.pin;
  if (!validatePin(providedPin)) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'PIN inválido' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  return ContentService
    .createTextOutput(JSON.stringify({
      cards: getSheetData('Tarjetas'),
      pending: getSheetData('Gastos_Pendientes'),
      history: [...getSheetData('Gastos'), ...getSheetData('Ingresos')]
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Validar PIN
  const providedPin = e.parameter.pin;
  if (!validatePin(providedPin)) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'PIN inválido' }));
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tipo = e.parameter.tipo;

  if (!tipo) return ContentService.createTextOutput(JSON.stringify({ error: 'tipo no especificado' }));

  const sheet = ss.getSheetByName(tipo);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: 'hoja no encontrada' }));

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => e.parameter[header] || '');

  sheet.appendRow(newRow);

  return ContentService.createTextOutput(JSON.stringify({ success: true }));
}

function validatePin(providedPin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config');

    // Si no existe Config, crearla con PIN por defecto
    if (!configSheet) {
      const newConfig = ss.insertSheet('Config');
      newConfig.getRange('A1').setValue('PIN');
      newConfig.getRange('A2').setValue('1234');
      return providedPin === '1234';
    }

    // Obtener PIN de Config (celda A2)
    const storedPin = configSheet.getRange('A2').getValue().toString();

    return providedPin === storedPin;
  } catch (error) {
    Logger.log('Error validando PIN: ' + error);
    return false;
  }
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(googleAppsScriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-white" />
              <h1 className="text-3xl font-bold text-white mb-2">Guía de Configuración</h1>
              <p className="text-emerald-50">Configura tu Google Apps Script en 4 pasos simples</p>
            </div>

            {/* Instructions */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Crea una copia de la plantilla</h3>
                  <p className="text-slate-300 mb-3">Abre esta plantilla de Google Sheets y haz una copia para tu cuenta:</p>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <ExternalLink size={16} />
                    Abrir Plantilla
                  </a>
                  <p className="text-xs text-slate-400 mt-2">O crea un Google Sheet con estas hojas: Tarjetas, Gastos_Pendientes, Gastos, Ingresos, Pagos, Config</p>
                </div>
              </div>

              {/* Step 2 - Verify Script */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Verifica el Script (ya incluido)</h3>
                  <p className="text-slate-300 mb-2">En tu copia de Google Sheet:</p>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1 ml-4">
                    <li>Ve a <span className="text-emerald-400 font-mono">Extensiones → Apps Script</span></li>
                    <li>El código ya debería estar ahí (no necesitas copiar nada)</li>
                    <li>Si el editor está vacío, contacta al administrador</li>
                  </ol>
                  <div className="mt-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle size={14} />
                      La plantilla incluye el script completo pre-configurado
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 - Deploy */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Despliega el Script</h3>
                  <ol className="list-decimal list-inside text-slate-300 space-y-2 ml-4">
                    <li>En el editor de Apps Script, click en <span className="text-emerald-400 font-mono">Implementar → Nueva implementación</span></li>
                    <li>Selecciona tipo: <span className="text-emerald-400 font-mono">Aplicación web</span></li>
                    <li>Ejecutar como: <span className="text-emerald-400 font-mono">Yo</span></li>
                    <li>Quién tiene acceso: <span className="text-emerald-400 font-mono">Cualquier persona</span></li>
                    <li>Click en <span className="text-emerald-400 font-mono">Implementar</span></li>
                    <li>Autoriza los permisos cuando te lo pida</li>
                  </ol>
                </div>
              </div>

              {/* Step 4 - Copy URL */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Copia la URL de Despliegue</h3>
                  <p className="text-slate-300 mb-2">Google te dará una URL que se ve así:</p>
                  <code className="block bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-emerald-400 break-all">
                    https://script.google.com/macros/s/XXXXXXXXX/exec
                  </code>
                  <p className="text-slate-400 text-sm mt-2">Copia esta URL y pégala en la pantalla anterior</p>
                </div>
              </div>

              {/* Step 5 - PIN Info */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  <Lock size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Configura tu PIN</h3>
                  <p className="text-slate-300 mb-2">El PIN por defecto es <span className="text-emerald-400 font-mono font-bold">1234</span></p>
                  <p className="text-slate-300 text-sm mb-2">Para cambiarlo:</p>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1 ml-4 text-sm">
                    <li>En tu Google Sheet, ve a la hoja <span className="text-emerald-400 font-mono">Config</span></li>
                    <li>En la celda A2, cambia el valor por tu PIN preferido</li>
                    <li>Usa ese nuevo PIN para conectarte</li>
                  </ol>
                  <div className="mt-3 bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-amber-200 text-xs flex items-center gap-2">
                      <Sparkles size={14} />
                      Cambia el PIN por defecto para mayor seguridad
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
                <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  Importante
                </h4>
                <ul className="text-amber-200 text-sm space-y-1 list-disc list-inside">
                  <li>Guarda tu URL y PIN en un lugar seguro</li>
                  <li>No compartas tu URL ni tu PIN públicamente</li>
                  <li>Puedes cambiar el PIN en la hoja Config de tu Google Sheet</li>
                  <li>Para cambiar la URL o PIN, reinicia la aplicación</li>
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-900/50 p-6 flex justify-between items-center border-t border-slate-700/50">
              <button
                onClick={() => setShowInstructions(false)}
                className="text-slate-400 hover:text-white font-medium transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={() => setShowInstructions(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg"
              >
                Ya tengo mi URL
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Green Header with Logo and Title */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-t-[2rem] p-8 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-700/20 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Wallet className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">MoneyCrock</h1>
            <p className="text-emerald-50 text-sm font-medium">Tu gestor de finanzas personales</p>
          </div>
        </div>

        {/* White Card with Form */}
        <div className="bg-white rounded-b-[2rem] shadow-2xl p-8">

          {/* Welcome Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
            <p className="text-gray-500 text-sm">Para comenzar, conecta tu hoja de cálculo financiera.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* URL Input */}
            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <LinkIcon size={16} />
                URL de Google Apps Script
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setValidationError('');
                }}
                placeholder="https://script.google.com/macros/s/..."
                required
                disabled={isValidating}
                className={`w-full bg-gray-50 border ${validationError ? 'border-rose-400' : 'border-gray-200'} rounded-xl px-4 py-3.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:outline-none transition-all ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <Lock size={16} />
                PIN de Seguridad
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setValidationError('');
                }}
                placeholder="Ingresa tu PIN (por defecto: 1234)"
                required
                disabled={isValidating}
                className={`w-full bg-gray-50 border ${validationError ? 'border-rose-400' : 'border-gray-200'} rounded-xl px-4 py-3.5 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:outline-none transition-all ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {validationError && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-2">
                  <span>❌</span> {validationError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isValidating}
              className={`w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 ${
                isValidating
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98]'
              }`}
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validando conexión...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Comenzar
                  <span>→</span>
                </span>
              )}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm mb-2">¿Primera vez?</p>
            <button
              onClick={() => setShowInstructions(true)}
              className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
            >
              <BookOpen size={16} />
              Ver guía de configuración
            </button>
          </div>

          {/* Security Message */}
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
            <Lock size={12} />
            <span>Tus datos están encriptados y seguros.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
