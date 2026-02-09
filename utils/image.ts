/**
 * Komprimerar en bildfil och returnerar en Blob redo för lagring.
 */
export const compressImage = async (file: File, maxWidth = 1000, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Skala ner om den är för stor
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Kunde inte skapa canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Konvertera till Blob (JPEG)
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Komprimering misslyckades"));
        }, 'image/jpeg', quality);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Hjälpfunktion för att skapa en URL som kan visas i <img src="...">
 */
export const blobToUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};