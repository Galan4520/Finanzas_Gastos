import imageCompression from 'browser-image-compression';

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
 * Comprime una imagen usando browser-image-compression (librería optimizada)
 * y la convierte a Base64 para enviar a Gemini API.
 *
 * Esta librería maneja automáticamente:
 * - Detección de tipo de dispositivo
 * - Optimización de memoria
 * - Compresión progresiva
 * - Prevención de OOM crashes
 */
export const compressAndToBase64 = async (file: File): Promise<string> => {
  try {
    console.log(`🖼️ [compressAndToBase64] Iniciando compresión - Archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    const isMobile = isMobileDevice();

    // Configuración de compresión adaptativa
    const options = {
      maxSizeMB: isMobile ? 0.3 : 1, // Móvil: 300KB max, Desktop: 1MB max
      maxWidthOrHeight: isMobile ? 400 : 1200, // Móvil: 400px, Desktop: 1200px
      useWebWorker: true, // Usar Web Worker para evitar bloquear UI
      fileType: 'image/jpeg' as const,
      initialQuality: isMobile ? 0.6 : 0.8, // Calidad inicial
    };

    console.log(`📱 [compressAndToBase64] Comprimiendo - Modo: ${isMobile ? 'MÓVIL' : 'DESKTOP'}, Target: ${options.maxSizeMB}MB, Max: ${options.maxWidthOrHeight}px`);

    // Comprimir usando la librería optimizada
    const compressedFile = await imageCompression(file, options);

    console.log(`✅ [compressAndToBase64] Compresión exitosa: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024).toFixed(2)}KB`);

    // Convertir a Base64
    const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
    const base64Clean = base64.split(',')[1];

    console.log(`📦 [compressAndToBase64] Base64 generado: ${(base64Clean.length / 1024).toFixed(2)}KB`);

    return base64Clean;

  } catch (error) {
    console.error('❌ [compressAndToBase64] Error:', error);
    throw new Error(`Error al comprimir imagen: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
