import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mic, MicOff, X, Loader2, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
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

  // Build accounts list for display
  const accountsList = useMemo(() => {
    const list: { alias: string; banco: string; tipo: string; saldo: number }[] = [
      { alias: 'Billetera', banco: 'Efectivo', tipo: 'efectivo', saldo: accountBalances['Billetera'] ?? 0 },
    ];
    userCards.forEach(card => {
      list.push({
        alias: card.alias,
        banco: card.banco,
        tipo: getCardType(card),
        saldo: accountBalances[card.alias] ?? 0,
      });
    });
    return list;
  }, [userCards, accountBalances]);

  // Build dynamic example using the user's first card name
  const dynamicExamples = useMemo(() => {
    const firstDebit = userCards.find(c => getCardType(c) === 'debito');
    const firstCredit = userCards.find(c => getCardType(c) === 'credito');
    const debitName = firstDebit?.alias || firstDebit?.banco || 'mi tarjeta';
    const creditName = firstCredit?.alias || firstCredit?.banco || 'la visa';

    return [
      `"Gasté 45 soles en pizza con ${debitName}"`,
      `"Me pagaron 3000 de sueldo en ${firstDebit ? debitName : 'Interbank'}"`,
      `"Compré zapatillas a 3 cuotas por 280 con ${creditName}"`,
    ];
  }, [userCards]);

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
          tipo: getCardType(card),
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

  const formatCurrency = (n: number) => `S/${n.toFixed(2)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isRecording && !isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative ${theme.colors.bgCard} rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto border ${theme.colors.border} animate-in fade-in zoom-in-95`}>
        {/* Close button */}
        {!isRecording && !isProcessing && (
          <button onClick={onClose} className={`absolute top-4 right-4 z-10 ${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}>
            <X size={20} />
          </button>
        )}

        <div className="p-6">
          {/* Yunai Avatar — animated based on state */}
          <div className="flex justify-center mb-4">
            <div className={`relative w-20 h-20 rounded-full overflow-hidden border-3 bg-white transition-all ${
              isRecording
                ? 'border-red-400 shadow-lg shadow-red-500/30 animate-pulse'
                : isProcessing
                ? 'border-yn-primary-400 shadow-lg shadow-yn-primary-500/20'
                : 'border-yn-primary-500/30'
            }`}>
              <img
                src="/logos/Mascota_Yunai.svg"
                alt="Yunai"
                className={`w-full h-full object-cover object-top transition-transform ${
                  isProcessing ? 'animate-bounce' : ''
                }`}
              />
              {/* Recording pulse ring */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
              )}
            </div>
          </div>

          {/* State text */}
          <div className="text-center mb-5">
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
          <div className="flex justify-center mb-5">
            {isProcessing ? (
              <div className="w-20 h-20 rounded-full bg-yn-primary-500/10 flex items-center justify-center">
                <Loader2 size={36} className="text-yn-primary-600 animate-spin" />
              </div>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                    : 'bg-yn-primary-500 hover:bg-yn-primary-600 shadow-lg shadow-yn-primary-500/30'
                }`}
              >
                {isRecording ? (
                  <MicOff size={32} className="text-white" />
                ) : (
                  <Mic size={32} className="text-white" />
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

          {/* Content when idle (not recording, not processing) */}
          {!isRecording && !isProcessing && !error && (
            <>
              {/* User's accounts/cards — so they know what names to say */}
              <div className="mb-4">
                <p className={`text-center text-[10px] font-bold uppercase tracking-widest ${theme.colors.textMuted} mb-2`}>
                  Tus cuentas (di el nombre)
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {accountsList.map(acc => (
                    <div
                      key={acc.alias}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${theme.colors.bgSecondary} border ${theme.colors.border}`}
                    >
                      {acc.tipo === 'efectivo' ? (
                        <Wallet size={12} className={theme.colors.textMuted} />
                      ) : acc.tipo === 'credito' ? (
                        <CreditCardIcon size={12} className="text-blue-500" />
                      ) : (
                        <CreditCardIcon size={12} className="text-green-500" />
                      )}
                      <span className={`text-xs font-semibold ${theme.colors.textPrimary}`}>
                        {acc.alias}
                      </span>
                      <span className={`text-[10px] ${theme.colors.textMuted}`}>
                        {formatCurrency(acc.saldo)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic examples using real card names */}
              <div className={`space-y-1.5 text-sm ${theme.colors.textMuted}`}>
                <p className={`text-center text-[10px] font-bold uppercase tracking-widest ${theme.colors.textMuted} mb-1.5`}>
                  Ejemplos
                </p>
                {dynamicExamples.map((example, i) => (
                  <div key={i} className={`${theme.colors.bgSecondary} rounded-xl px-3 py-2 text-center italic text-xs`}>
                    {example}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
