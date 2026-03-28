import React, { useState } from 'react';
import { Link as LinkIcon, Lock, ArrowRight, LogOut, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { YunaiLogo } from '../ui/YunaiLogo';

interface SetupScreenProps {
  email: string;
  onSetup: (scriptUrl: string, pin: string) => Promise<void>;
  onLogout: () => void;
  prefillUrl?: string;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ email, onSetup, onLogout, prefillUrl }) => {
  const [url, setUrl] = useState(prefillUrl || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'guide' | 'form'>('guide');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onSetup(url.trim(), pin.trim());
    } catch {
      setError('No se pudo conectar. Verifica que la URL y el PIN sean correctos.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-yn-neutral-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <YunaiLogo size={50} />
          </div>
          <h1 className="font-brand text-2xl text-white mb-1">Configurar Yunai</h1>
          <p className="text-yn-neutral-400 text-sm">Conecta tu Google Sheet para empezar</p>
          <p className="text-yn-neutral-500 text-xs mt-1">{email}</p>
        </div>

        {step === 'guide' ? (
          <div className="bg-yn-neutral-800 rounded-2xl p-6 border border-yn-neutral-700 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Antes de empezar necesitas:</h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-yn-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yn-primary-500 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Copia la plantilla de Google Sheet</p>
                  <p className="text-yn-neutral-400 text-xs">Abre el enlace que recibiste al suscribirte y haz una copia en tu Google Drive.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-yn-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yn-primary-500 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Despliega el Apps Script</p>
                  <p className="text-yn-neutral-400 text-xs">En tu copia, ve a Extensiones &gt; Apps Script &gt; Implementar &gt; Nueva implementación.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-yn-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yn-primary-500 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Copia la URL y anota el PIN</p>
                  <p className="text-yn-neutral-400 text-xs">La URL se muestra al desplegar. El PIN está en la pestaña Config (celda A2).</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-yn-primary-500 hover:bg-yn-primary-700 transition-all flex items-center justify-center gap-2"
            >
              Ya tengo mi URL y PIN
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bg-yn-neutral-800 rounded-2xl p-6 border border-yn-neutral-700 shadow-xl">
            <button
              onClick={() => setStep('guide')}
              className="text-yn-neutral-400 hover:text-white text-sm mb-4 transition-colors"
            >
              &larr; Volver a la guía
            </button>

            <h2 className="text-lg font-bold text-white mb-4">Conectar Google Sheet</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Script URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-yn-neutral-400 uppercase ml-1">URL del Apps Script</label>
                <div className="relative">
                  <LinkIcon size={18} className="absolute left-3 top-3 text-yn-neutral-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    required
                    className="w-full bg-yn-neutral-900 border border-yn-neutral-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-yn-neutral-500 focus:ring-2 focus:ring-yn-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* PIN */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-yn-neutral-400 uppercase ml-1">PIN de seguridad</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-yn-neutral-500" />
                  <input
                    type="password"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="PIN de tu Google Sheet"
                    required
                    className="w-full bg-yn-neutral-900 border border-yn-neutral-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-yn-neutral-500 focus:ring-2 focus:ring-yn-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !url || !pin}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${loading ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-yn-primary-500 hover:bg-yn-primary-700'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Conectar y empezar
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full mt-4 py-2 text-yn-neutral-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-1"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
