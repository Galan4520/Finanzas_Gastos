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
 * Mobile: max 800px, quality 0.5 | Desktop: max 1200px, quality 0.7
 */
export const compressAndToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      // Liberar memoria inmediatamente
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');

      // Platform-specific settings
      const isMobile = isMobileDevice();
      const MAX_DIMENSION = isMobile ? 800 : 1200;
      const QUALITY = isMobile ? 0.5 : 0.7;

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
      ctx.drawImage(img, 0, 0, width, height);

      // Use toBlob instead of toDataURL for better memory efficiency
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject('Failed to create blob from canvas');
            return;
          }

          // Convert Blob to Base64 using FileReader (more memory-efficient)
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => {
            reject('Failed to read blob as base64');
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject('Error loading image object URL');
    };
  });
};
