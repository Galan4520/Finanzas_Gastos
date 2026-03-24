import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Loader2, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface CameraCaptureProps {
  isOpen: boolean;
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

// Compress image using canvas — no external library needed
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // Sufficient for OCR text reading
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Returns clean base64 without data:image prefix
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsCompressing(true);

    try {
      const originalKB = (file.size / 1024).toFixed(0);
      console.log(`[CameraCapture] Original: ${originalKB}KB`);

      const base64 = await compressImage(file);

      console.log(`[CameraCapture] Compressed: ${(base64.length / 1024).toFixed(0)}KB base64`);

      // Show preview
      setPreview(`data:image/jpeg;base64,${base64}`);
    } catch (err) {
      console.error('[CameraCapture] Compression error:', err);
      setError('Error al procesar la imagen. Intenta con otra foto.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const confirmCapture = () => {
    if (preview) {
      // Send clean base64 (strip the data URL prefix)
      const base64 = preview.includes('base64,') ? preview.split('base64,')[1] : preview;
      onCapture(base64);
      handleClose();
    }
  };

  const retake = () => {
    setPreview(null);
    setError(null);
  };

  const handleClose = () => {
    setPreview(null);
    setError(null);
    setIsCompressing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!isCompressing ? handleClose : undefined} />

      {/* Modal */}
      <div className={`relative ${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border ${theme.colors.border}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={22} />
            <h3 className="text-lg font-semibold">Escanear Boleta</h3>
          </div>
          {!isCompressing && (
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Preview or capture buttons */}
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
          <div className="p-6">
            {/* Compressing indicator */}
            {isCompressing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={40} className="text-yn-primary-500 animate-spin" />
                <p className={`font-medium ${theme.colors.textPrimary}`}>Procesando imagen...</p>
              </div>
            ) : (
              <>
                {/* Capture buttons */}
                <div className="space-y-3">
                  {/* Camera button — uses native camera on mobile */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-yn-primary-500 to-yn-sec1-500 hover:from-yn-primary-600 hover:to-yn-sec1-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-lg"
                  >
                    <Camera size={22} />
                    Tomar Foto a Boleta
                  </button>

                  {/* Gallery button */}
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-3 ${theme.colors.bgSecondary} ${theme.colors.textPrimary} border ${theme.colors.border} transition-all`}
                  >
                    <Upload size={20} />
                    Subir desde Galería
                  </button>
                </div>

                {/* Tips */}
                <div className={`mt-5 text-center text-xs ${theme.colors.textMuted} space-y-1`}>
                  <p>Asegúrate que el ticket se vea completo y legible</p>
                  <p>Funciona con boletas, facturas y vouchers</p>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Hidden native inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
