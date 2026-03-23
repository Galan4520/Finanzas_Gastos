import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { CreditCard, getCardType, YunaiExtractionResult } from '../../types';

interface VoiceRecorderProps {
  isOpen: boolean;
  onResult: (data: YunaiExtractionResult | YunaiExtractionResult[]) => void;
  onClose: () => void;
  userCards: CreditCard[];
  accountBalances: Record<string, number>;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isOpen,
  onResult,
  onClose,
  userCards,
  accountBalances,
}) => {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setError(null);
      setRecordingTime(0);
      setIsProcessing(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen]);

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        processAudio(blob, mediaRecorder.mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
      } else {
        setError('No se pudo acceder al micrófono: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const getSupportedMimeType = (): string => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Build detailed cuentas list with bank info, type AND balance
      const cuentasDetalladas = [
        { alias: 'Billetera', banco: 'Efectivo', tipo: 'efectivo', saldo: accountBalances['Billetera'] ?? 0 },
        ...userCards.map(card => ({
          alias: card.alias,
          banco: card.banco,
          tipo: getCardType(card), // 'credito' | 'debito'
          tipo_tarjeta: card.tipo_tarjeta,
          saldo: accountBalances[card.alias] ?? 0,
        })),
      ];

      const response = await fetch('/api/yunai-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64,
          mimeType: mimeType.split(';')[0],
          cuentas: cuentasDetalladas,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error('Yunai no pudo interpretar el audio');
      }

      onResult(result.data);
    } catch (err: any) {
      setError(err.message || 'Error procesando el audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isRecording && !isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative ${theme.colors.bgCard} rounded-3xl shadow-2xl w-full max-w-sm p-6 border ${theme.colors.border} animate-in fade-in zoom-in-95`}>
        {/* Close button */}
        {!isRecording && !isProcessing && (
          <button onClick={onClose} className={`absolute top-4 right-4 ${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}>
            <X size={20} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yn-primary-500/30 mx-auto mb-3 bg-white">
            <img src="/logos/Mascota_Yunai.svg" alt="Yunai" className="w-full h-full object-cover object-top" />
          </div>
          <h3 className={`text-lg font-bold ${theme.colors.textPrimary}`}>
            {isProcessing ? 'Yunai está pensando...' : isRecording ? 'Te estoy escuchando...' : 'Háblale a Yunai'}
          </h3>
          <p className={`text-sm ${theme.colors.textMuted} mt-1`}>
            {isProcessing
              ? 'Analizando tu mensaje de voz'
              : isRecording
              ? `Grabando ${formatTime(recordingTime)}`
              : 'Dime qué gastaste, cuánto y de dónde'}
          </p>
        </div>

        {/* Mic Button */}
        <div className="flex justify-center mb-6">
          {isProcessing ? (
            <div className="w-24 h-24 rounded-full bg-yn-primary-500/10 flex items-center justify-center">
              <Loader2 size={40} className="text-yn-primary-600 animate-spin" />
            </div>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-yn-primary-500 hover:bg-yn-primary-600 shadow-lg shadow-yn-primary-500/30'
              }`}
            >
              {isRecording ? (
                <MicOff size={36} className="text-white" />
              ) : (
                <Mic size={36} className="text-white" />
              )}
            </button>
          )}
        </div>

        {/* Sound waves animation when recording */}
        {isRecording && (
          <div className="flex justify-center items-end gap-1 h-8 mb-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-yn-primary-500 rounded-full"
                style={{
                  animation: `soundwave 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.07}s`,
                  height: `${Math.random() * 24 + 8}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Examples */}
        {!isRecording && !isProcessing && !error && (
          <div className={`space-y-2 text-sm ${theme.colors.textMuted}`}>
            <p className="text-center text-xs font-semibold uppercase tracking-wider mb-2">Ejemplos:</p>
            <div className={`${theme.colors.bgSecondary} rounded-xl p-3 text-center italic`}>
              "Gasté 45 soles en pizza con la visa"
            </div>
            <div className={`${theme.colors.bgSecondary} rounded-xl p-3 text-center italic`}>
              "Me pagaron 3000 de sueldo"
            </div>
            <div className={`${theme.colors.bgSecondary} rounded-xl p-3 text-center italic`}>
              "Compré zapatillas a 3 cuotas por 280"
            </div>
          </div>
        )}
      </div>

      {/* CSS for sound wave animation */}
      <style>{`
        @keyframes soundwave {
          0% { height: 4px; }
          100% { height: 28px; }
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;
