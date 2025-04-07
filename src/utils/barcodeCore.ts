
import JsBarcode from 'jsbarcode';
import { getInitials, formatDateString, formatProductInfoLine } from './barcodeFormatters';

/**
 * Generate a new unique barcode ID
 * In a real application, this would be more sophisticated
 */
export const generateBarcodeId = (): string => {
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `KL${timestamp}${random}`;
};

/**
 * Generate a barcode SVG from a given ID
 */
export const generateBarcodeSvg = (
  barcodeId: string,
  productDetails?: {
    product: string;
    preparedBy: string;
    containerType: string;
    preparedDate: string;
    expiryDate: string;
  }
): string => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  try {
    // Configure barcode options
    const barcodeOptions = {
      format: 'CODE128',
      lineColor: '#000',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 5,
      background: '#fff',
      marginTop: 15 // Add margin at the top to shift everything down a bit
    };
    
    JsBarcode(svg, barcodeId, barcodeOptions);
    
    // If product details are provided, add them to the SVG
    if (productDetails) {
      // Format product info into a single line with initials
      const productInfoLine = formatProductInfoLine(
        productDetails.product,
        productDetails.preparedBy,
        productDetails.preparedDate,
        productDetails.expiryDate
      );
      
      // Get the current SVG dimensions
      const svgElement = svg.querySelector('svg') || svg;
      
      // Find where the barcode ID text is
      const barcodeText = svgElement.querySelector('text');
      let barcodeTextY = 0;
      
      if (barcodeText) {
        barcodeTextY = parseFloat(barcodeText.getAttribute('y') || '0');
        // Move barcode text up by 10px
        barcodeText.setAttribute('y', `${barcodeTextY - 10}`);
      }
      
      // Calculate dimensions
      const minWidth = Math.max(productInfoLine.length * 7, 300); // Estimate width based on text length
      const currentWidth = parseFloat(svgElement.getAttribute('width') || '200');
      const width = Math.max(currentWidth, minWidth);
      
      // Set width to accommodate the product info line
      svgElement.setAttribute('width', `${width}`);
      
      // Calculate height to add sufficient space for the product info line
      const currentHeight = parseFloat(svgElement.getAttribute('height') || '100');
      const extraSpace = 20; // Reduced space from 25px to 20px
      const newHeight = currentHeight + extraSpace;
      svgElement.setAttribute('height', `${newHeight}`);
      
      // Position the product info line at its original position (not moved up)
      const textY = barcodeTextY + 18; // Keep at original position
      
      // Add a white background rectangle behind the text for better visibility
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const padding = 6;
      const textWidth = productInfoLine.length * 5; // Width estimate for small font
      bgRect.setAttribute('x', `${(width - textWidth) / 2 - padding}`);
      bgRect.setAttribute('y', `${textY - 8}`); // Position just above text
      bgRect.setAttribute('width', `${textWidth + (padding * 2)}`);
      bgRect.setAttribute('height', '12'); // Reduced height for smaller text
      bgRect.setAttribute('fill', 'white');
      bgRect.setAttribute('rx', '2');
      
      // Add the elements in correct order (background first, then text)
      svgElement.appendChild(bgRect);
      
      // Add the product info line text
      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('x', `${width / 2}`); // Center text
      textElement.setAttribute('y', `${textY}`); 
      textElement.setAttribute('font-size', '9'); // Reduced from 10 to 9 for smaller text
      textElement.setAttribute('font-family', 'Arial, sans-serif');
      textElement.setAttribute('text-anchor', 'middle'); // Center align text
      textElement.setAttribute('fill', '#666'); // Light gray color
      
      // Set text content and add to SVG
      textElement.textContent = productInfoLine;
      svgElement.appendChild(textElement);
      
      // Move the barcode itself up by 10px
      const barcodeRects = svgElement.querySelectorAll('rect');
      barcodeRects.forEach(rect => {
        if (rect !== bgRect) { // Skip the background rectangle for product info
          const y = parseFloat(rect.getAttribute('y') || '0');
          rect.setAttribute('y', `${y - 10}`);
        }
      });
    }
    
    return svg.outerHTML;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};
