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
 * Compresión en DOS PASOS para móviles con imágenes muy grandes (>4MB)
 * Paso 1: Reducir a 600px con calidad 0.5 → genera Blob intermedio
 * Paso 2: Reducir Blob a 300px con calidad 0.2 → genera Base64 final
 * Esto evita picos de memoria al procesar la imagen RAW completa
 */
const compressTwoStep = (
  file: File,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) => {
  console.log('🔄 [PASO 1/2] Compresión inicial a 600px...');
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.src = objectUrl;

  img.onload = () => {
    console.log(`📐 [PASO 1/2] Imagen cargada: ${img.width}x${img.height}px`);
    URL.revokeObjectURL(objectUrl);

    const canvas1 = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // PASO 1: Reducir a 600px
    const MAX_STEP1 = 600;
    if (width > height) {
      if (width > MAX_STEP1) {
        height *= MAX_STEP1 / width;
        width = MAX_STEP1;
      }
    } else {
      if (height > MAX_STEP1) {
        width *= MAX_STEP1 / height;
        height = MAX_STEP1;
      }
    }

    canvas1.width = width;
    canvas1.height = height;
    const ctx1 = canvas1.getContext('2d', { alpha: false });

    if (!ctx1) {
      reject('Could not get canvas context (step 1)');
      return;
    }

    ctx1.drawImage(img, 0, 0, width, height);
    (img as any).src = ''; // Liberar imagen original

    console.log('🔄 [PASO 1/2] Convirtiendo a Blob intermedio...');
    canvas1.toBlob(
      (blob1) => {
        if (!blob1) {
          canvas1.width = 0;
          canvas1.height = 0;
          reject('Failed to create intermediate blob');
          return;
        }

        console.log(`💾 [PASO 1/2] Blob intermedio: ${(blob1.size / 1024).toFixed(2)}KB`);
        canvas1.width = 0;
        canvas1.height = 0;

        // PASO 2: Comprimir blob intermedio a 300px final
        console.log('🔄 [PASO 2/2] Compresión final a 300px...');
        const objectUrl2 = URL.createObjectURL(blob1);
        const img2 = new Image();
        img2.src = objectUrl2;

        img2.onload = () => {
          console.log(`📐 [PASO 2/2] Imagen intermedia: ${img2.width}x${img2.height}px`);
          URL.revokeObjectURL(objectUrl2);

          const canvas2 = document.createElement('canvas');
          let width2 = img2.width;
          let height2 = img2.height;

          // Reducir a 300px
          const MAX_STEP2 = 300;
          if (width2 > height2) {
            if (width2 > MAX_STEP2) {
              height2 *= MAX_STEP2 / width2;
              width2 = MAX_STEP2;
            }
          } else {
            if (height2 > MAX_STEP2) {
              width2 *= MAX_STEP2 / height2;
              height2 = MAX_STEP2;
            }
          }

          canvas2.width = width2;
          canvas2.height = height2;
          const ctx2 = canvas2.getContext('2d', { alpha: false });

          if (!ctx2) {
            reject('Could not get canvas context (step 2)');
            return;
          }

          ctx2.drawImage(img2, 0, 0, width2, height2);
          (img2 as any).src = ''; // Liberar imagen intermedia

          console.log('🔄 [PASO 2/2] Convirtiendo a Blob final...');
          canvas2.toBlob(
            (blob2) => {
              if (!blob2) {
                canvas2.width = 0;
                canvas2.height = 0;
                reject('Failed to create final blob');
                return;
              }

              console.log(`💾 [PASO 2/2] Blob final: ${(blob2.size / 1024).toFixed(2)}KB`);

              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                console.log(`✅ [DOS PASOS] Base64 final: ${(base64.length / 1024).toFixed(2)}KB`);
                canvas2.width = 0;
                canvas2.height = 0;
                resolve(base64);
              };
              reader.onerror = () => {
                canvas2.width = 0;
                canvas2.height = 0;
                reject('Failed to read final blob as base64');
              };
              reader.readAsDataURL(blob2);
            },
            'image/jpeg',
            0.2 // Calidad final muy baja
          );
        };

        img2.onerror = () => {
          URL.revokeObjectURL(objectUrl2);
          reject('Error loading intermediate image');
        };
      },
      'image/jpeg',
      0.5 // Calidad intermedia
    );
  };

  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject('Error loading original image');
  };
};

/**
 * Utility to compress an image file and convert it to Base64 (JPEG).
 * Uses TWO-STEP compression for mobile to prevent OOM crashes.
 * Mobile: max 300px, quality 0.2 | Desktop: max 1000px, quality 0.7
 */
export const compressAndToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`🖼️ [compressAndToBase64] Iniciando compresión - Archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    const isMobile = isMobileDevice();

    // MOBILE: Validación MUY estricta - rechazar fotos de cámara muy grandes
    const MAX_FILE_SIZE = isMobile ? 8 * 1024 * 1024 : 15 * 1024 * 1024; // 8MB móvil, 15MB desktop
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `Imagen demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). ${isMobile ? 'Por favor, usa una foto de menor resolución o súbela desde galería.' : 'Máximo 15MB'}`;
      console.error(`❌ [compressAndToBase64] ${errorMsg}`);
      reject(errorMsg);
      return;
    }

    // MOBILE: Si la imagen es muy grande (>4MB), hacer compresión en DOS PASOS
    if (isMobile && file.size > 4 * 1024 * 1024) {
      console.log('⚡ [compressAndToBase64] MODO DOS PASOS activado para imagen grande en móvil');
      compressTwoStep(file, resolve, reject);
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
      const MAX_DIMENSION = isMobile ? 300 : 1000; // Reducido a 300px para móviles
      const QUALITY = isMobile ? 0.2 : 0.7; // Reducido a 0.2 para móviles
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

      // Liberar la imagen de memoria INMEDIATAMENTE después de dibujar
      (img as any).src = '';
      console.log('🗑️ [compressAndToBase64] Imagen liberada de memoria');

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
