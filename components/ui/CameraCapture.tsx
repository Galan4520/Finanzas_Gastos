import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Upload } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import imageCompression from 'browser-image-compression';

interface CameraCaptureProps {
  isOpen: boolean;
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onCapture,
  onClose
}) => {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');

  // Iniciar la cámara web (WebRTC)
  const startCamera = async () => {
    setError(null);
    setImagePreview(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Usar la cámara trasera si está disponible
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accediendo a la cámara:", err);
      setError("No se pudo acceder a la cámara. Por favor, otorga los permisos.");
    }
  };

  // Detener la cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Iniciar cámara al abrir el modal
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
      setImagePreview(null);
      setError(null);
    }
    return () => stopCamera();
  }, [isOpen, mode]);

  // Manejar archivo subido desde galería
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    setError(null);

    try {
      console.log(`📂 [handleFileUpload] Archivo original: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Comprimir la imagen — calidad alta para OCR
      const options = {
        maxSizeMB: 0.8, // 800KB max — necesario para que IA lea texto
        maxWidthOrHeight: 1280, // 1280px para mantener legibilidad
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
        initialQuality: 0.8
      };

      const compressedFile = await imageCompression(file, options);
      console.log(`✅ [handleFileUpload] Archivo comprimido: ${(compressedFile.size / 1024).toFixed(2)}KB`);

      // Convertir a Base64
      const base64Image = await imageCompression.getDataUrlFromFile(compressedFile);
      setImagePreview(base64Image);
      setMode('upload');
    } catch (error) {
      console.error('❌ [handleFileUpload] Error al comprimir:', error);
      setError('Error al procesar la imagen');
    } finally {
      setIsCapturing(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Configurar el canvas al tamaño del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dibujar el frame actual en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir canvas a Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      console.log(`📸 [capturePhoto] Imagen original: ${(blob.size / 1024).toFixed(2)}KB`);

      // Comprimir la imagen — calidad alta para OCR
      const options = {
        maxSizeMB: 0.8, // 800KB max — necesario para que IA lea texto
        maxWidthOrHeight: 1280, // 1280px para mantener legibilidad
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
        initialQuality: 0.8
      };

      const compressedFile = await imageCompression(blob as File, options);
      console.log(`✅ [capturePhoto] Imagen comprimida: ${(compressedFile.size / 1024).toFixed(2)}KB`);

      // Convertir a Base64
      const base64Image = await imageCompression.getDataUrlFromFile(compressedFile);
      setImagePreview(base64Image);

      // Detener la cámara mientras el usuario confirma
      stopCamera();
    } catch (error) {
      console.error('❌ [capturePhoto] Error al comprimir:', error);
      setError('Error al capturar la foto');
    } finally {
      setIsCapturing(false);
    }
  };

  const confirmCapture = () => {
    if (imagePreview) {
      onCapture(imagePreview);
      handleClose();
    }
  };

  const retakePhoto = () => {
    setImagePreview(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  const switchToUpload = () => {
    stopCamera();
    setMode('upload');
    setImagePreview(null);
    fileInputRef.current?.click();
  };

  const switchToCamera = () => {
    setMode('camera');
    setImagePreview(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setImagePreview(null);
    setError(null);
    setMode('camera');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={24} />
            <h3 className="text-lg font-semibold">Escanear Ticket</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cámara o Preview */}
        <div className="relative bg-slate-900 aspect-[3/4] flex items-center justify-center">
          {!imagePreview ? (
            mode === 'camera' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-slate-400">
                <Upload size={64} />
                <p className="text-center">Selecciona una imagen desde tu galería</p>
              </div>
            )
          ) : (
            <img
              src={imagePreview}
              alt="Ticket capturado"
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay de carga */}
          {isCapturing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 animate-spin mb-3 text-yn-primary-400" />
              <p className="font-medium animate-pulse">Capturando foto...</p>
            </div>
          )}
        </div>

        {/* Canvas oculto para capturar la foto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Input oculto para subir archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Mensaje de Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm border-t border-red-100">
            {error}
          </div>
        )}

        {/* Controles */}
        <div className="p-4 space-y-3">
          {!imagePreview ? (
            <>
              {/* Botón principal según modo */}
              {mode === 'camera' ? (
                <button
                  onClick={capturePhoto}
                  disabled={!stream || isCapturing}
                  className="w-full bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 hover:from-yn-primary-600 hover:to-yn-sec1-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Camera className="w-5 h-5" />
                  Capturar Foto
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 hover:from-yn-primary-600 hover:to-yn-sec1-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-5 h-5" />
                  Subir desde Galería
                </button>
              )}

              {/* Botón para cambiar de modo */}
              <button
                onClick={mode === 'camera' ? switchToUpload : switchToCamera}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} ${theme.colors.textPrimary}`}
              >
                {mode === 'camera' ? (
                  <>
                    <Upload className="w-5 h-5" />
                    Subir desde Galería
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Usar Cámara
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={retakePhoto}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${theme.colors.bgSecondary} hover:${theme.colors.bgCardHover} ${theme.colors.textPrimary}`}
              >
                <RefreshCw className="w-5 h-5" />
                {mode === 'camera' ? 'Tomar Otra' : 'Otra Imagen'}
              </button>
              <button
                onClick={confirmCapture}
                className="flex-1 bg-gradient-to-r from-yn-success-500 to-yn-success-600 hover:from-yn-success-600 hover:to-yn-success-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Usar Foto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
