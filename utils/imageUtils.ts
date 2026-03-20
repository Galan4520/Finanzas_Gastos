/**
 * Utility to compress an image file and convert it to Base64 (JPEG).
 * Aiming for a balanced size (max 1200px) and quality (0.7) to stay within
 * payload limits and speed up processing.
 */
export const compressAndToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
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

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with 0.7 quality to reduce size significantly
        // The return format from toDataURL is "data:image/jpeg;base64,..."
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Remove the data URL prefix to get only the clean Base64 string
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
