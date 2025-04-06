
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
      displayValue: false, // Don't display the barcode text within the barcode itself
      fontSize: 12,
      margin: 5,
      background: '#fff'
    };
    
    JsBarcode(svg, barcodeId, barcodeOptions);
    
    // If product details are provided, add them to the SVG
    // Get the current SVG dimensions
    const svgElement = svg.querySelector('svg') || svg;
    
    // Calculate dimensions
    const minWidth = 300; // Minimum width for the SVG
    const currentWidth = parseFloat(svgElement.getAttribute('width') || '200');
    const width = Math.max(currentWidth, minWidth);
    
    // Set width
    svgElement.setAttribute('width', `${width}`);
    
    // Calculate height and add extra space for the combined text line
    const currentHeight = parseFloat(svgElement.getAttribute('height') || '100');
    const extraSpace = 30; // Space for the text line
    const newHeight = currentHeight + extraSpace;
    svgElement.setAttribute('height', `${newHeight}`);
    
    // Position for the combined text line
    const textY = currentHeight + 20; // Position below the barcode
    
    // Add background for better visibility
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', `${textY - 12}`); // Position just above text
    bgRect.setAttribute('width', `${width}`);
    bgRect.setAttribute('height', '16'); // Height for the text line
    bgRect.setAttribute('fill', 'white');
    svgElement.appendChild(bgRect);
    
    // Add the barcode ID text
    const idElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idElement.setAttribute('x', '10'); // Left-aligned
    idElement.setAttribute('y', `${textY}`);
    idElement.setAttribute('font-size', '12'); // Larger font for barcode ID
    idElement.setAttribute('font-family', 'Arial, sans-serif');
    idElement.setAttribute('font-weight', 'bold');
    idElement.setAttribute('fill', '#000');
    idElement.textContent = barcodeId;
    svgElement.appendChild(idElement);
    
    // Add product info if available
    if (productDetails) {
      // Format product info
      const productInfoLine = formatProductInfoLine(
        productDetails.product,
        productDetails.preparedBy,
        productDetails.preparedDate,
        productDetails.expiryDate
      );
      
      // Measure approximate width of barcode ID text
      const idTextWidth = barcodeId.length * 8; // Approximate width based on font size
      
      // Add the product info text right-aligned
      const infoElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      infoElement.setAttribute('x', `${width - 10}`); // Right-aligned
      infoElement.setAttribute('y', `${textY}`);
      infoElement.setAttribute('font-size', '9'); // Smaller font for product info
      infoElement.setAttribute('font-family', 'Arial, sans-serif');
      infoElement.setAttribute('text-anchor', 'end'); // Right-align text
      infoElement.setAttribute('fill', '#666'); // Light gray color
      
      // Set text content and add to SVG
      infoElement.textContent = productInfoLine;
      svgElement.appendChild(infoElement);
    }
    
    return svg.outerHTML;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};
