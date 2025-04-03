
/**
 * Convert SVG to image for printing or downloading
 */
export const svgToImage = (svgString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svg = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svg);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to convert SVG to image'));
    };
    
    img.src = url;
  });
};
