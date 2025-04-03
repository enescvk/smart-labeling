
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
      background: '#fff'
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
      }
      
      // Calculate dimensions
      const minWidth = Math.max(productInfoLine.length * 7, 300); // Estimate width based on text length
      const currentWidth = parseFloat(svgElement.getAttribute('width') || '200');
      const width = Math.max(currentWidth, minWidth);
      
      // Set width to accommodate the product info line
      svgElement.setAttribute('width', `${width}`);
      
      // Calculate height to add sufficient space for the product info line
      const currentHeight = parseFloat(svgElement.getAttribute('height') || '100');
      const extraSpace = 40; // Increased from 30 to 40 for more padding
      const newHeight = currentHeight + extraSpace;
      svgElement.setAttribute('height', `${newHeight}`);
      
      // Add the product info line text
      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('x', `${width / 2}`); // Center text
      textElement.setAttribute('y', `${currentHeight + 25}`); // Better positioning below barcode text
      textElement.setAttribute('font-size', '14'); // Clear font size
      textElement.setAttribute('font-family', 'Arial, sans-serif');
      textElement.setAttribute('text-anchor', 'middle'); // Center align text
      textElement.setAttribute('font-weight', 'bold'); // Make text bold
      
      // Add a white background rectangle behind the text for better visibility
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const padding = 10;
      const textWidth = productInfoLine.length * 7.5; // Estimate text width
      bgRect.setAttribute('x', `${(width - textWidth) / 2 - padding}`);
      bgRect.setAttribute('y', `${currentHeight + 12}`); // Placed just above text
      bgRect.setAttribute('width', `${textWidth + (padding * 2)}`);
      bgRect.setAttribute('height', '20');
      bgRect.setAttribute('fill', 'white');
      bgRect.setAttribute('rx', '3'); // Rounded corners
      
      // Add the elements in correct order (background first, then text)
      svgElement.appendChild(bgRect);
      
      // Set text content and add to SVG
      textElement.textContent = productInfoLine;
      svgElement.appendChild(textElement);
    }
    
    return svg.outerHTML;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};
