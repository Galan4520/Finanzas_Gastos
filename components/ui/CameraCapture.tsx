import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, X, Loader2, RefreshCw, SwitchCamera } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CameraCaptureProps {
  isOpen: boolean;
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

// Compress image from canvas or file — returns clean base64 (no data: prefix)
function compressFromCanvas(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number
): string {
  const canvas = document.createElement('canvas');
  const MAX_WIDTH = 1024;
  const scale = srcWidth > MAX_WIDTH ? MAX_WIDTH / srcWidth : 1;
  canvas.width = srcWidth * scale;
  canvas.height = srcHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
}

async function compressFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onerror = reject;
      img.onload = () => {
        const base64 = compressFromCanvas(img, img.width, img.height);
        resolve(base64);
      };
    };
  });
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onCapture,
  onClose
}) => {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setCameraError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setFacingMode(facing);
    } catch (err: any) {
      console.error('[CameraCapture] getUserMedia error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Permiso de cámara denegado. Habilítalo en la configuración del navegador.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No se encontró una cámara en este dispositivo.');
      } else {
        setCameraError('No se pudo acceder a la cámara.');
      }
    }
  }, [stopCamera]);

  // Auto-start camera when modal opens, ALWAYS cleanup on close/unmount
  useEffect(() => {
    if (isOpen && !preview) {
      startCamera(facingMode);
    }
    if (!isOpen) {
      stopCamera();
    }
    // Always release stream on unmount — prevents mic/camera conflicts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture photo from video feed
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraActive) return;

    // Ensure video has valid dimensions (frame must be rendered)
    if (!video.videoWidth || !video.videoHeight) {
      setError('La cámara aún no está lista. Espera un momento.');
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = compressFromCanvas(video, video.videoWidth, video.videoHeight);
      console.log(`[CameraCapture] Captured: ${video.videoWidth}x${video.videoHeight} → ${(base64.length / 1024).toFixed(0)}KB base64`);
      setPreview(`data:image/jpeg;base64,${base64}`);
      stopCamera();
    } catch (err) {
      console.error('[CameraCapture] Capture error:', err);
      setError('Error al capturar la foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch front/back camera
  const switchCamera = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(newFacing);
  };

  // Handle gallery file upload
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsProcessing(true);
    setError(null);
    try {
      const base64 = await compressFile(file);
      console.log(`[CameraCapture] Gallery: ${(base64.length / 1024).toFixed(0)}KB base64`);
      setPreview(`data:image/jpeg;base64,${base64}`);
      stopCamera();
    } catch (err) {
      console.error('[CameraCapture] Gallery error:', err);
      setError('Error al procesar la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and send captured image
  const confirmCapture = () => {
    if (preview) {
      const base64 = preview.includes('base64,') ? preview.split('base64,')[1] : preview;
      onCapture(base64);
      handleClose();
    }
  };

  // Retake — go back to live camera
  const retake = () => {
    setPreview(null);
    setError(null);
    startCamera(facingMode);
  };

  // Close modal and cleanup
  const handleClose = () => {
    stopCamera();
    setPreview(null);
    setError(null);
    setCameraError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!isProcessing ? handleClose : undefined} />

      {/* Modal */}
      <div className={`relative ${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border ${theme.colors.border}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={22} />
            <h3 className="text-lg font-semibold">Escanear Boleta</h3>
          </div>
          {!isProcessing && (
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        {preview ? (
          <>
            {/* Image preview */}
            <div className="bg-slate-900">
              <img src={preview} alt="Boleta capturada" className="w-full max-h-80 object-contain" />
            </div>

            {/* Confirm / Retake */}
            <div className="p-4 flex gap-3">
              <button
                onClick={retake}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${theme.colors.bgSecondary} ${theme.colors.textPrimary} transition-all`}
              >
                <RefreshCw size={18} />
                Otra Foto
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 bg-gradient-to-r from-yn-success-500 to-yn-success-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Camera size={18} />
                Analizar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Live camera viewfinder */}
            <div className="bg-black relative" style={{ minHeight: 280 }}>
              {cameraError ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 px-6">
                  <Camera size={40} className="text-gray-500" />
                  <p className="text-gray-400 text-sm text-center">{cameraError}</p>
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="mt-2 px-4 py-2 bg-yn-primary-500 text-white rounded-lg text-sm font-medium"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-80 object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />

                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={36} className="text-white animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Camera controls */}
            <div className="p-4 space-y-3">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Loader2 size={32} className="text-yn-primary-500 animate-spin" />
                  <p className={`text-sm font-medium ${theme.colors.textPrimary}`}>Procesando...</p>
                </div>
              ) : (
                <>
                  {/* Capture + Switch buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                      className="flex-1 bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 hover:from-yn-primary-600 hover:to-yn-sec1-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                    >
                      <Camera size={20} />
                      Capturar
                    </button>
                    <button
                      onClick={switchCamera}
                      disabled={!cameraActive}
                      className={`px-4 rounded-xl ${theme.colors.bgSecondary} ${theme.colors.textPrimary} border ${theme.colors.border} transition-all disabled:opacity-50`}
                      title="Cambiar cámara"
                    >
                      <SwitchCamera size={20} />
                    </button>
                  </div>

                  {/* Gallery option */}
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${theme.colors.bgSecondary} ${theme.colors.textPrimary} border ${theme.colors.border} transition-all text-sm`}
                  >
                    <Upload size={18} />
                    Subir desde Galería
                  </button>
                </>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Tips */}
              <div className={`text-center text-xs ${theme.colors.textMuted} space-y-1`}>
                <p>Asegúrate que el ticket se vea completo y legible</p>
              </div>
            </div>
          </>
        )}

        {/* Hidden gallery input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleGalleryChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
