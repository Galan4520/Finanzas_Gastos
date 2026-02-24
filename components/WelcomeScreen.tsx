import React, { useState } from 'react';
import { BookOpen, Link as LinkIcon, CheckCircle, ExternalLink, Lock, Wallet, Play, ChevronRight, ChevronLeft, AlertTriangle, Shield, Bell, RefreshCw, Globe, KeyRound, UserPlus, Copy, Cloud } from 'lucide-react';

interface WelcomeScreenProps {
  onUrlSubmit: (url: string, pin: string) => Promise<void>;
  isSyncing?: boolean;
}

// ─── Video Placeholder Component ───────────────────────────────────────
const VideoPlaceholder: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mt-4 bg-slate-950 border-2 border-dashed border-slate-600 rounded-2xl overflow-hidden">
    <div className="aspect-video flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mb-3">
        <Play className="w-8 h-8 text-emerald-400 ml-1" />
      </div>
      <p className="text-white font-bold text-sm mb-1">{title}</p>
      <p className="text-slate-400 text-xs max-w-xs">{description}</p>
    </div>
  </div>
);

// ─── Step Indicator ────────────────────────────────────────────────────
const StepBadge: React.FC<{ number: number; active: boolean; completed: boolean; onClick: () => void }> = ({ number, active, completed, onClick }) => (
  <button
    onClick={onClick}
    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${completed
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
        : active
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-110'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
      }`}
  >
    {completed ? <CheckCircle size={16} /> : number}
  </button>
);

// ─── Sub-step component ────────────────────────────────────────────────
const SubStep: React.FC<{ label: string; color: string; children: React.ReactNode }> = ({ label, color, children }) => (
  <div className="flex items-start gap-2">
    <span className={`${color} font-bold text-xs mt-0.5 flex-shrink-0`}>{label}</span>
    <div className="text-slate-300 text-sm">{children}</div>
  </div>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUrlSubmit, isSyncing = false }) => {
  const [url, setUrl] = useState('');
  const [pin, setPin] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && pin.trim() && !isValidating) {
      setIsValidating(true);
      setValidationError('');
      try {
        await onUrlSubmit(url.trim(), pin.trim());
      } catch (error) {
        setValidationError('No se pudo conectar. Verifica que la URL, el PIN sean correctos y que el script esté desplegado.');
      } finally {
        setIsValidating(false);
      }
    }
  };

  const markStepCompleted = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const goToNextStep = () => {
    markStepCompleted(currentStep);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ─── Step Definitions (5 pasos) ────────────────────────────────────
  const steps = [
    // ════════════════════════════════════════════════════════════════
    // PASO 1: Copiar plantilla
    // ════════════════════════════════════════════════════════════════
    {
      icon: <Copy size={24} />,
      title: 'Copia tu Hoja de Cálculo',
      subtitle: 'Tu base de datos personal en Google Sheets',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              Vamos a crear <strong className="text-white">tu propia hoja de Google</strong> donde se guardarán todos tus datos financieros.
              Nadie más tendrá acceso a tu información.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p className="text-slate-300 text-sm">Haz clic en el botón verde de abajo. Se abrirá Google Sheets.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p className="text-slate-300 text-sm">Google te pedirá <strong className="text-white">"Hacer una copia"</strong>. Acepta y ponle un nombre como <em className="text-emerald-400">"Mis Finanzas 2026"</em>.</p>
            </div>
          </div>

          <a
            href="https://docs.google.com/spreadsheets/d/1WNw94cR-IJrxZIKETz1BHGuPl2ZQ2VFSnmgrAT4etsk/copy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/30 w-full text-center"
          >
            <ExternalLink size={18} />
            Copiar Plantilla
          </a>

          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              La plantilla ya incluye el código y los permisos pre-configurados.
            </p>
          </div>

          <VideoPlaceholder
            title="Video: Como copiar la plantilla"
            description="Mira como hacer tu copia en 1 minuto"
          />
        </div>
      ),
    },

    // ════════════════════════════════════════════════════════════════
    // PASO 2: Configurar Google Cloud (consolidado)
    // ════════════════════════════════════════════════════════════════
    {
      icon: <Cloud size={24} />,
      title: 'Configura Google Cloud',
      subtitle: 'Activa las funciones avanzadas (auto-updates, emails)',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              Este paso activa los <strong className="text-white">"superpoderes"</strong> de tu app: actualizaciones automaticas
              y notificaciones por email. Es gratis y solo se hace una vez.
            </p>
          </div>

          {/* Sub-paso A: Crear proyecto */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <h4 className="text-blue-300 font-bold text-sm mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">A</span>
              Crear proyecto en Google Cloud
            </h4>
            <div className="space-y-2">
              <SubStep label="A1." color="text-blue-400">
                <p>Abre Google Cloud Console con tu misma cuenta de Google:</p>
                <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline text-xs mt-1">
                  <ExternalLink size={10} /> Crear proyecto nuevo
                </a>
              </SubStep>
              <SubStep label="A2." color="text-blue-400">
                <p>Ponle nombre: <em className="text-emerald-400">"Yunai"</em> y clic en <strong className="text-white">Crear</strong></p>
              </SubStep>
              <SubStep label="A3." color="text-blue-400">
                <p>Ve a <strong className="text-white">Configuracion del proyecto</strong> y copia el <strong className="text-emerald-400">"Numero de proyecto"</strong> (es un numero largo)</p>
                <p className="text-xs text-slate-500 mt-1">Ejemplo: 1028272702630</p>
              </SubStep>
            </div>
          </div>

          {/* Sub-paso B: Habilitar API */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
            <h4 className="text-purple-300 font-bold text-sm mb-3 flex items-center gap-2">
              <span className="bg-purple-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">B</span>
              Habilitar Apps Script API
            </h4>
            <div className="space-y-2">
              <SubStep label="B1." color="text-purple-400">
                <p>Abre este link directo (asegurate de tener seleccionado tu proyecto "Yunai"):</p>
                <a href="https://console.cloud.google.com/apis/library/script.googleapis.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline text-xs mt-1">
                  <ExternalLink size={10} /> Habilitar Apps Script API
                </a>
              </SubStep>
              <SubStep label="B2." color="text-purple-400">
                <p>Clic en el boton <span className="bg-emerald-700 text-white px-2 py-0.5 rounded text-xs">HABILITAR</span></p>
              </SubStep>
              <SubStep label="B3." color="text-purple-400">
                <p>Tambien activa la API en tu cuenta personal:</p>
                <a href="https://script.google.com/home/usersettings" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline text-xs mt-1">
                  <ExternalLink size={10} /> Configuracion de Apps Script
                </a>
                <p className="text-xs text-slate-500 mt-1">Activa el switch de "Google Apps Script API"</p>
              </SubStep>
            </div>
          </div>

          {/* Sub-paso C: Vincular */}
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
            <h4 className="text-orange-300 font-bold text-sm mb-3 flex items-center gap-2">
              <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">C</span>
              Vincular con tu Script
            </h4>
            <div className="space-y-2">
              <SubStep label="C1." color="text-orange-400">
                <p>Abre tu Google Sheet y ve a <span className="bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">Extensiones</span> → <span className="bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">Apps Script</span></p>
              </SubStep>
              <SubStep label="C2." color="text-orange-400">
                <p>En la barra lateral, clic en <span className="bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">Configuracion del proyecto</span> (icono de engranaje)</p>
              </SubStep>
              <SubStep label="C3." color="text-orange-400">
                <p>Busca <strong className="text-white">"Proyecto de Google Cloud Platform (GCP)"</strong> → clic en <span className="bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">Cambiar proyecto</span></p>
              </SubStep>
              <SubStep label="C4." color="text-orange-400">
                <p>Pega el <strong className="text-emerald-400">Numero de proyecto</strong> que copiaste en el paso A3 y confirma</p>
              </SubStep>
            </div>
          </div>

          <VideoPlaceholder
            title="Video: Configurar Google Cloud"
            description="Los 3 sub-pasos explicados en 3 minutos"
          />
        </div>
      ),
    },

    // ════════════════════════════════════════════════════════════════
    // PASO 3: Desplegar
    // ════════════════════════════════════════════════════════════════
    {
      icon: <RefreshCw size={24} />,
      title: 'Despliega tu Script',
      subtitle: 'Publica tu script como aplicacion web',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              Ahora vamos a "publicar" tu script para que la app pueda conectarse.
              Esto genera una <strong className="text-white">URL unica y privada</strong> que solo tu tendras.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p className="text-slate-300 text-sm">En Apps Script, clic en el boton azul <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">Implementar</span> (arriba a la derecha)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p className="text-slate-300 text-sm">Selecciona <span className="bg-slate-700 text-emerald-400 px-2 py-0.5 rounded font-mono text-xs">Nueva implementacion</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <p className="text-slate-300 text-sm">En el icono de engranaje al lado de "Seleccionar tipo", elige <strong className="text-white">"Aplicacion web"</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <div className="text-slate-300 text-sm">
                <p className="mb-2">Configura asi:</p>
                <div className="bg-slate-950 rounded-lg p-3 space-y-1">
                  <p className="text-xs"><span className="text-slate-500">Ejecutar como:</span> <span className="text-emerald-400">Yo (tu email)</span></p>
                  <p className="text-xs"><span className="text-slate-500">Quien tiene acceso:</span> <span className="text-emerald-400">Cualquier persona</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</span>
              <p className="text-slate-300 text-sm">Clic en <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">Implementar</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">6</span>
              <div className="text-slate-300 text-sm">
                <p className="mb-2">Te pedira <strong className="text-white">autorizar permisos</strong>:</p>
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 space-y-1">
                  <p className="text-amber-200 text-xs">Clic en "Revisar permisos" → Selecciona tu cuenta</p>
                  <p className="text-amber-200 text-xs">Si dice "Esta app no es verificada" → clic en <strong>"Avanzado"</strong> → <strong>"Ir a Proyecto (no seguro)"</strong></p>
                  <p className="text-amber-200 text-xs">Clic en <strong>"Permitir"</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* URL Copy Area */}
          <div className="bg-emerald-900/20 border-2 border-emerald-500/50 rounded-xl p-4">
            <h4 className="text-emerald-300 font-bold text-sm mb-2 flex items-center gap-2">
              <CheckCircle size={16} />
              Copia tu URL
            </h4>
            <p className="text-slate-300 text-xs mb-2">Google te dara una URL que se ve asi:</p>
            <code className="block bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-emerald-400 break-all">
              https://script.google.com/macros/s/AKfycbx.../exec
            </code>
            <p className="text-emerald-200 text-xs mt-2 font-bold">Copiala y guardala — la necesitaras en el siguiente paso</p>
          </div>

          <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-3">
            <p className="text-rose-200 text-sm flex items-start gap-2">
              <Shield size={16} className="flex-shrink-0 mt-0.5" />
              <span><strong>NUNCA compartas esta URL</strong> con nadie. Es la llave de tu informacion financiera.</span>
            </p>
          </div>

          <VideoPlaceholder
            title="Video: Como desplegar y autorizar"
            description="Todo el proceso de despliegue paso a paso"
          />
        </div>
      ),
    },

    // ════════════════════════════════════════════════════════════════
    // PASO 4: Conectar app
    // ════════════════════════════════════════════════════════════════
    {
      icon: <LinkIcon size={24} />,
      title: 'Conecta tu App',
      subtitle: 'Ultimo paso — pega tu URL y PIN',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              Ya casi terminas. Solo pega la URL que copiaste y tu PIN.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p className="text-slate-300 text-sm">Clic en <strong className="text-white">"Ya tengo mi URL"</strong> al final de esta guia</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p className="text-slate-300 text-sm">Pega tu <strong className="text-white">URL del script</strong> en el primer campo</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <p className="text-slate-300 text-sm">Ingresa tu <strong className="text-white">PIN</strong> (por defecto es <span className="bg-slate-700 text-emerald-400 px-2 py-0.5 rounded font-mono text-xs font-bold">1234</span>)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <p className="text-slate-300 text-sm">Clic en <strong className="text-white">"Comenzar"</strong> — deberas ver tu Dashboard</p>
            </div>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
            <h4 className="text-emerald-300 font-bold text-sm mb-2">Para cambiar tu PIN:</h4>
            <ol className="text-slate-300 text-xs space-y-1 list-decimal list-inside">
              <li>Abre tu Google Sheet → hoja <span className="text-emerald-400 font-mono">Config</span></li>
              <li>Cambia el valor de la celda <span className="text-emerald-400 font-mono">A2</span></li>
              <li>Usa el nuevo PIN para entrar</li>
            </ol>
          </div>

          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-xl p-6 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-white font-bold text-lg">Felicidades!</p>
            <p className="text-slate-300 text-sm mt-1">Tu app de finanzas esta lista para usar</p>
          </div>
        </div>
      ),
    },

    // ════════════════════════════════════════════════════════════════
    // PASO 5: Notificaciones (opcional)
    // ════════════════════════════════════════════════════════════════
    {
      icon: <Bell size={24} />,
      title: 'Activa las Notificaciones',
      subtitle: 'Opcional: recibe alertas de pagos por vencer',
      content: (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-200 text-sm leading-relaxed">
              <strong className="text-emerald-400">Paso opcional pero recomendado.</strong> Recibe alertas por email
              cuando tus pagos esten proximos a vencer.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p className="text-slate-300 text-sm">Dentro de la app, ve a <span className="bg-slate-700 text-emerald-400 px-2 py-0.5 rounded font-mono text-xs">Configuracion</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p className="text-slate-300 text-sm">Busca <strong className="text-white">"Notificaciones"</strong> y activalas</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <p className="text-slate-300 text-sm">Ingresa tu <strong className="text-white">email</strong> y elige cuantos dias antes quieres el aviso</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <p className="text-slate-300 text-sm">Clic en <strong className="text-white">"Guardar"</strong> y luego <strong className="text-white">"Enviar email de prueba"</strong> para verificar</p>
            </div>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-emerald-200 text-sm flex items-start gap-2">
              <Bell size={16} className="flex-shrink-0 mt-0.5" />
              <span>Tambien puedes activar el <strong>Trigger Diario</strong> para recibir un resumen automatico cada manana.
                Si no llega el email, revisa tu carpeta de <strong>Spam</strong>.</span>
            </p>
          </div>

          <VideoPlaceholder
            title="Video: Como configurar notificaciones"
            description="Activa las alertas para nunca olvidar un pago"
          />

          <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-xl p-6 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-white font-bold">Todo listo!</p>
            <p className="text-slate-300 text-sm mt-1">Ya puedes empezar a gestionar tus finanzas</p>
          </div>
        </div>
      ),
    },
  ];

  // ─── Instructions View ─────────────────────────────────────────────
  if (showInstructions) {
    const currentStepData = steps[currentStep];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BookOpen className="w-7 h-7 text-white" />
                <h1 className="text-2xl font-bold text-white">Guia de Configuracion</h1>
              </div>
              <p className="text-emerald-50 text-sm">Paso {currentStep + 1} de {steps.length} — {currentStepData.subtitle}</p>
            </div>

            {/* Step Indicators */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-center gap-2">
                {steps.map((_, index) => (
                  <React.Fragment key={index}>
                    <StepBadge
                      number={index + 1}
                      active={index === currentStep}
                      completed={completedSteps.includes(index)}
                      onClick={() => setCurrentStep(index)}
                    />
                    {index < steps.length - 1 && (
                      <div className={`w-6 h-0.5 ${index < currentStep ? 'bg-emerald-500' : 'bg-slate-700'} transition-colors`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400">
                  {currentStepData.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
              </div>
              {currentStepData.content}
            </div>

            {/* Navigation Footer */}
            <div className="bg-slate-900/50 p-4 flex justify-between items-center border-t border-slate-700/50">
              <button
                onClick={() => setShowInstructions(false)}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-3 py-2"
              >
                ← Volver
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={goToPrevStep}
                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={goToNextStep}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-600/30"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-600/30"
                  >
                    Ya tengo mi URL
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─── Main Login View ───────────────────────────────────────────────
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
              <span className="text-5xl">🦗</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Yunai</h1>
            <p className="text-emerald-50 text-sm font-medium">Tu gestor de finanzas personales</p>
          </div>
        </div>

        {/* White Card with Form */}
        <div className="bg-white rounded-b-[2rem] shadow-2xl p-8">

          {/* Welcome Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
            <p className="text-gray-500 text-sm">Para comenzar, conecta tu hoja de calculo financiera.</p>
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
                  <span>X</span> {validationError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isValidating}
              className={`w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 ${isValidating
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98]'
                }`}
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validando conexion...
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
            <p className="text-gray-500 text-sm mb-2">Primera vez?</p>
            <button
              onClick={() => setShowInstructions(true)}
              className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
            >
              <BookOpen size={16} />
              Ver guia de configuracion paso a paso
            </button>
          </div>

          {/* Security Message */}
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
            <Lock size={12} />
            <span>Tus datos estan encriptados y seguros.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
