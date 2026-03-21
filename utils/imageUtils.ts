/**
 * Detecta si el dispositivo es móvil basado en user agent y características
 */
const isMobileDevice = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasLimitedMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory < 4 : false;

  return isMobileUA || (isTouchDevice && hasLimitedMemory);
};

/**
 * Utility to compress an image file and convert it to Base64 (JPEG).
 * Uses Blob API for memory efficiency and platform-specific settings.
 * Mobile: max 400px, quality 0.3 | Desktop: max 1000px, quality 0.7
 */
export const compressAndToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`🖼️ [compressAndToBase64] Iniciando compresión - Archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Rechazar archivos muy grandes ANTES de procesarlos (>10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `Imagen demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 10MB`;
      console.error(`❌ [compressAndToBase64] ${errorMsg}`);
      reject(errorMsg);
      return;
    }

    console.log('🔄 [compressAndToBase64] Creando URL de objeto...');
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      console.log(`📐 [compressAndToBase64] Imagen cargada: ${img.width}x${img.height}px`);
      // Liberar memoria inmediatamente
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');

      // Platform-specific settings - ULTRA agresivo para móviles
      const isMobile = isMobileDevice();
      const MAX_DIMENSION = isMobile ? 400 : 1000;
      const QUALITY = isMobile ? 0.3 : 0.7;
      console.log(`📱 [compressAndToBase64] Modo: ${isMobile ? 'MÓVIL' : 'DESKTOP'}, MAX: ${MAX_DIMENSION}px, Calidad: ${QUALITY}`);

      let width = img.width;
      let height = img.height;

      // Scale down to max dimension while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        reject('Could not get canvas context');
        return;
      }

      // Draw image
      console.log(`🎨 [compressAndToBase64] Dibujando en canvas: ${width}x${height}px`);
      ctx.drawImage(img, 0, 0, width, height);

      // Use toBlob instead of toDataURL for better memory efficiency
      console.log('🔄 [compressAndToBase64] Convirtiendo a Blob...');
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('❌ [compressAndToBase64] Failed to create blob');
            // Limpiar canvas
            canvas.width = 0;
            canvas.height = 0;
            reject('Failed to create blob from canvas');
            return;
          }

          console.log(`💾 [compressAndToBase64] Blob creado: ${(blob.size / 1024).toFixed(2)}KB`);

          // Convert Blob to Base64 using FileReader (more memory-efficient)
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            console.log(`✅ [compressAndToBase64] Base64 generado: ${(base64.length / 1024).toFixed(2)}KB`);

            // Limpiar canvas y liberar memoria agresivamente
            canvas.width = 0;
            canvas.height = 0;

            resolve(base64);
          };
          reader.onerror = (err) => {
            console.error('❌ [compressAndToBase64] FileReader error:', err);
            // Limpiar canvas
            canvas.width = 0;
            canvas.height = 0;
            reject('Failed to read blob as base64');
          };
          console.log('🔄 [compressAndToBase64] Leyendo Blob como Base64...');
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = (err) => {
      console.error('❌ [compressAndToBase64] Image load error:', err);
      URL.revokeObjectURL(objectUrl);
      reject('Error loading image object URL');
    };
  });
};
