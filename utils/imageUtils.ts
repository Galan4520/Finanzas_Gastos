/**
 * Utility to compress an image file and convert it to Base64 (JPEG).
 * Aiming for a balanced size (max 1200px) and quality (0.7) to stay within
 * payload limits and speed up processing.
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
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject('Could not get canvas context');
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as JPEG with 0.6 quality to reduce size even further
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject('Error loading image object URL');
    };
  });
};
