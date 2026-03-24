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
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const recognitionRef = useRef<any>(null);

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
      setTranscript('');
      setInterimTranscript('');
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

  // Dynamic regex for account alias matching in live transcript
  const accountRegex = useMemo(() => {
    const names = accountsList.map(a => a.alias).filter(Boolean);
    if (names.length === 0) return null;
    return new RegExp(`(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  }, [accountsList]);

  // Highlight entities (montos, cuentas) in live transcript text
  const highlightEntities = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const montoRegex = /(?:S\/?\s*)?\d{1,6}(?:[.,]\d{1,2})?\s*(?:soles?|lucas?)?/gi;

    // Collect all matches with their positions
    type Match = { start: number; end: number; text: string; type: 'monto' | 'cuenta' };
    const matches: Match[] = [];

    let m: RegExpExecArray | null;
    // Find montos
    const montoRe = new RegExp(montoRegex.source, 'gi');
    while ((m = montoRe.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: 'monto' });
    }
    // Find cuentas
    if (accountRegex) {
      const accRe = new RegExp(accountRegex.source, 'gi');
      while ((m = accRe.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: 'cuenta' });
      }
    }

    if (matches.length === 0) return [text];

    // Sort by position and remove overlaps
    matches.sort((a, b) => a.start - b.start);
    const filtered: Match[] = [];
    for (const match of matches) {
      const last = filtered[filtered.length - 1];
      if (!last || match.start >= last.end) {
        filtered.push(match);
      }
    }

    // Build result with highlighted spans
    const result: React.ReactNode[] = [];
    let lastEnd = 0;
    filtered.forEach((match, i) => {
      if (match.start > lastEnd) {
        result.push(text.slice(lastEnd, match.start));
      }
      const cls = match.type === 'monto'
        ? 'text-green-600 dark:text-green-400 font-bold'
        : 'text-blue-600 dark:text-blue-400 font-semibold';
      result.push(<span key={i} className={cls}>{match.text}</span>);
      lastEnd = match.end;
    });
    if (lastEnd < text.length) {
      result.push(text.slice(lastEnd));
    }
    return result;
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (recordingTimeRef.current < 1) {
          setError('Grabación muy corta. Mantén presionado al menos 1 segundo.');
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        processAudio(blob, mediaRecorder.mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setTranscript('');
      setInterimTranscript('');

      // Start Web Speech API for live transcription (runs in parallel, free)
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-PE';

        recognition.onresult = (event: any) => {
          let final = '';
          let interim = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setTranscript(final.trim());
          setInterimTranscript(interim);
        };

        recognition.onerror = () => {}; // Silent fail — not critical
        recognition.start();
        recognitionRef.current = recognition;
      }

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
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
          transcriptHint: transcript || undefined,
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

      // Handle empty array (pure noise, no voice detected)
      const items = Array.isArray(result.data) ? result.data : [result.data];
      if (items.length === 0) {
        throw new Error('No se detectó ningún movimiento. Intenta hablar más claro o en un lugar con menos ruido.');
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
            <div className={`relative yunai-container ${
              isRecording ? 'yunai-listening' : isProcessing ? 'yunai-thinking' : 'yunai-idle'
            }`}>
              {/* Glow ring behind avatar */}
              <div className={`absolute inset-[-6px] rounded-full transition-all duration-500 ${
                isRecording
                  ? 'bg-red-400/20 yunai-pulse-ring'
                  : isProcessing
                  ? 'bg-yn-primary-400/20 yunai-think-ring'
                  : 'bg-yn-primary-500/0'
              }`} />

              {/* Avatar circle */}
              <div className={`relative w-24 h-24 rounded-full overflow-hidden border-3 bg-white transition-all duration-300 ${
                isRecording
                  ? 'border-red-400 shadow-xl shadow-red-500/30'
                  : isProcessing
                  ? 'border-yn-primary-400 shadow-xl shadow-yn-primary-500/30'
                  : 'border-yn-primary-500/30 shadow-md'
              }`}>
                <img
                  src="/logos/Mascota_Yunai.svg"
                  alt="Yunai"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Recording: floating sound dots */}
              {isRecording && (
                <>
                  <div className="absolute -left-2 top-1/2 yunai-sound-dot" style={{ animationDelay: '0s' }}>
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                  </div>
                  <div className="absolute -left-1 top-1/3 yunai-sound-dot" style={{ animationDelay: '0.3s' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                  </div>
                  <div className="absolute -right-2 top-1/2 yunai-sound-dot-r" style={{ animationDelay: '0.15s' }}>
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                  </div>
                  <div className="absolute -right-1 top-1/3 yunai-sound-dot-r" style={{ animationDelay: '0.45s' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
                  </div>
                </>
              )}

              {/* Processing: orbiting sparkles */}
              {isProcessing && (
                <>
                  <div className="absolute yunai-orbit" style={{ animationDelay: '0s' }}>
                    <span className="text-sm">✨</span>
                  </div>
                  <div className="absolute yunai-orbit" style={{ animationDelay: '-0.8s' }}>
                    <span className="text-xs">💡</span>
                  </div>
                  <div className="absolute yunai-orbit" style={{ animationDelay: '-1.6s' }}>
                    <span className="text-sm">✨</span>
                  </div>
                </>
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

          {/* Live transcript panel — shows while recording */}
          {isRecording && (transcript || interimTranscript) && (
            <div className={`mx-2 mb-3 p-3 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border} max-h-24 overflow-y-auto`}>
              <p className={`text-sm ${theme.colors.textPrimary} leading-relaxed`}>
                {highlightEntities(transcript)}
                {interimTranscript && (
                  <span className={`${theme.colors.textMuted} italic`}>
                    {transcript ? ' ' : ''}{interimTranscript}
                  </span>
                )}
              </p>
            </div>
          )}

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

      {/* CSS for Yunai animations */}
      <style>{`
        /* Sound wave bars */
        @keyframes soundwave {
          0% { height: 4px; }
          100% { height: 28px; }
        }

        /* ═══ IDLE: gentle floating sway ═══ */
        .yunai-idle {
          animation: yunaiFloat 3s ease-in-out infinite;
        }
        @keyframes yunaiFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(1.5deg); }
          75% { transform: translateY(-2px) rotate(-1.5deg); }
        }

        /* ═══ LISTENING: lean forward + vibrate ═══ */
        .yunai-listening {
          animation: yunaiListen 0.8s ease-in-out infinite;
        }
        @keyframes yunaiListen {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          15% { transform: translateY(-2px) rotate(-2deg) scale(1.02); }
          30% { transform: translateY(0) rotate(1.5deg) scale(1); }
          50% { transform: translateY(-3px) rotate(0deg) scale(1.03); }
          70% { transform: translateY(-1px) rotate(-1deg) scale(1.01); }
          85% { transform: translateY(0) rotate(2deg) scale(1); }
        }

        /* Pulse ring for recording */
        .yunai-pulse-ring {
          animation: yunaiPulseRing 1.5s ease-in-out infinite;
        }
        @keyframes yunaiPulseRing {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }

        /* Sound dots floating in from sides */
        .yunai-sound-dot {
          animation: yunaiSoundL 1.2s ease-in-out infinite;
        }
        @keyframes yunaiSoundL {
          0%, 100% { transform: translateX(0) scale(0.5); opacity: 0; }
          30% { transform: translateX(-6px) scale(1); opacity: 1; }
          70% { transform: translateX(-12px) scale(0.8); opacity: 0.5; }
          100% { transform: translateX(-16px) scale(0.3); opacity: 0; }
        }
        .yunai-sound-dot-r {
          animation: yunaiSoundR 1.2s ease-in-out infinite;
        }
        @keyframes yunaiSoundR {
          0%, 100% { transform: translateX(0) scale(0.5); opacity: 0; }
          30% { transform: translateX(6px) scale(1); opacity: 1; }
          70% { transform: translateX(12px) scale(0.8); opacity: 0.5; }
          100% { transform: translateX(16px) scale(0.3); opacity: 0; }
        }

        /* ═══ THINKING: wiggle + nod ═══ */
        .yunai-thinking {
          animation: yunaiThink 1.5s ease-in-out infinite;
        }
        @keyframes yunaiThink {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          20% { transform: translateY(-5px) rotate(-3deg); }
          40% { transform: translateY(-2px) rotate(3deg); }
          60% { transform: translateY(-6px) rotate(-2deg); }
          80% { transform: translateY(-1px) rotate(2deg); }
        }

        /* Think ring glow pulse */
        .yunai-think-ring {
          animation: yunaiThinkRing 2s ease-in-out infinite;
        }
        @keyframes yunaiThinkRing {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }

        /* Orbiting sparkles around avatar */
        .yunai-orbit {
          width: 20px;
          height: 20px;
          top: 50%;
          left: 50%;
          margin-top: -10px;
          margin-left: -10px;
          animation: yunaiOrbit 2.4s linear infinite;
        }
        @keyframes yunaiOrbit {
          0% { transform: rotate(0deg) translateX(52px) rotate(0deg) scale(0.8); opacity: 0.4; }
          25% { opacity: 1; transform: rotate(90deg) translateX(52px) rotate(-90deg) scale(1); }
          50% { opacity: 0.6; transform: rotate(180deg) translateX(52px) rotate(-180deg) scale(0.9); }
          75% { opacity: 1; transform: rotate(270deg) translateX(52px) rotate(-270deg) scale(1.1); }
          100% { transform: rotate(360deg) translateX(52px) rotate(-360deg) scale(0.8); opacity: 0.4; }
        }

        /* Container needs relative positioning */
        .yunai-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;
