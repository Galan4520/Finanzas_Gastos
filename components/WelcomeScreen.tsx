import React, { useState } from 'react';
import { Sparkles, BookOpen, Link as LinkIcon, CheckCircle, Copy, ExternalLink } from 'lucide-react';

interface WelcomeScreenProps {
  onUrlSubmit: (url: string) => Promise<void>;
  isSyncing?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUrlSubmit, isSyncing = false }) => {
  const [url, setUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isValidating) {
      setIsValidating(true);
      setValidationError('');
      try {
        await onUrlSubmit(url.trim());
        // Si llegamos aquí, la validación fue exitosa
      } catch (error) {
        // Mostrar error de validación
        setValidationError('No se pudo conectar. Verifica que la URL sea correcta y que el script esté desplegado.');
      } finally {
        setIsValidating(false);
      }
    }
  };

  const googleAppsScriptCode = `function doGet() {
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tipo = e.parameter.tipo;

  if (!tipo) return ContentService.createTextOutput('Error: tipo no especificado');

  const sheet = ss.getSheetByName(tipo);
  if (!sheet) return ContentService.createTextOutput('Error: hoja no encontrada');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => e.parameter[header] || '');

  sheet.appendRow(newRow);

  return ContentService.createTextOutput('OK');
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-white" />
              <h1 className="text-3xl font-bold text-white mb-2">Guía de Configuración</h1>
              <p className="text-indigo-100">Configura tu Google Apps Script en 5 pasos</p>
            </div>

            {/* Instructions */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Crea una copia de la plantilla</h3>
                  <p className="text-slate-300 mb-3">Abre esta plantilla de Google Sheets y haz una copia para tu cuenta:</p>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1234567890/copy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <ExternalLink size={16} />
                    Abrir Plantilla
                  </a>
                  <p className="text-xs text-slate-400 mt-2">O crea un Google Sheet con estas hojas: Tarjetas, Gastos_Pendientes, Gastos, Ingresos, Pagos</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Abre el Editor de Apps Script</h3>
                  <p className="text-slate-300 mb-2">En tu Google Sheet:</p>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1 ml-4">
                    <li>Ve a <span className="text-indigo-400 font-mono">Extensiones → Apps Script</span></li>
                    <li>Borra todo el código que aparece por defecto</li>
                  </ol>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Copia y pega este código</h3>
                  <div className="relative">
                    <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto max-h-64 overflow-y-auto">
                      <code>{googleAppsScriptCode}</code>
                    </pre>
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Implementa el script</h3>
                  <ol className="list-decimal list-inside text-slate-300 space-y-2 ml-4">
                    <li>Click en <span className="text-indigo-400 font-mono">Implementar → Nueva implementación</span></li>
                    <li>Selecciona tipo: <span className="text-indigo-400 font-mono">Aplicación web</span></li>
                    <li>Ejecutar como: <span className="text-indigo-400 font-mono">Yo</span></li>
                    <li>Quién tiene acceso: <span className="text-indigo-400 font-mono">Cualquier persona</span></li>
                    <li>Click en <span className="text-indigo-400 font-mono">Implementar</span></li>
                    <li>Autoriza los permisos necesarios</li>
                  </ol>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">5</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Copia la URL de implementación</h3>
                  <p className="text-slate-300 mb-2">Google te dará una URL que se ve así:</p>
                  <code className="block bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-emerald-400 break-all">
                    https://script.google.com/macros/s/XXXXXXXXX/exec
                  </code>
                  <p className="text-slate-400 text-sm mt-2">Copia esta URL y pégala en la pantalla anterior</p>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
                <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  Importante
                </h4>
                <ul className="text-amber-200 text-sm space-y-1 list-disc list-inside">
                  <li>Guarda tu URL en un lugar seguro</li>
                  <li>No compartas tu URL públicamente</li>
                  <li>Puedes cambiar la URL más tarde desde Ajustes</li>
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
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-600/20"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Control Financiero+</h1>
            <p className="text-indigo-100">Tu gestor de finanzas personales</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Bienvenido</h2>
              <p className="text-slate-400 text-sm">Para comenzar, necesitas la URL de tu Google Apps Script</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <LinkIcon size={16} />
                  URL de Google Apps Script
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setValidationError(''); // Limpiar error al escribir
                  }}
                  placeholder="https://script.google.com/macros/s/..."
                  required
                  disabled={isValidating}
                  className={`w-full bg-slate-900/50 border ${validationError ? 'border-rose-500' : 'border-slate-600'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {validationError && (
                  <p className="mt-2 text-sm text-rose-400 flex items-center gap-2">
                    <span>❌</span> {validationError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isValidating}
                className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 ${
                  isValidating
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:from-indigo-500 hover:to-purple-500 active:scale-95'
                }`}
              >
                {isValidating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Validando conexión...
                  </span>
                ) : (
                  'Comenzar'
                )}
              </button>
            </form>

            {/* Help Section */}
            <div className="pt-6 border-t border-slate-700/50">
              <button
                onClick={() => setShowInstructions(true)}
                className="w-full text-center group"
              >
                <p className="text-slate-400 text-sm mb-2">¿Primera vez?</p>
                <div className="flex items-center justify-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <BookOpen size={16} />
                  <span className="font-medium">Ver guía de configuración</span>
                </div>
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Tus datos están seguros y solo tú tienes acceso a ellos
        </p>
      </div>
    </div>
  );
};
