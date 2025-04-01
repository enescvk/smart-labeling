
import JsBarcode from 'jsbarcode';

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
    JsBarcode(svg, barcodeId, {
      format: 'CODE128',
      lineColor: '#000',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 5,
      background: '#fff'
    });
    
    // If product details are provided, add them to the SVG
    if (productDetails) {
      // Get the current SVG dimensions
      const svgElement = svg.querySelector('svg') || svg;
      const width = parseFloat(svgElement.getAttribute('width') || '200');
      const height = parseFloat(svgElement.getAttribute('height') || '100');
      
      // Set a new height to accommodate the additional text
      const newHeight = height + 80; // Add extra space for product details
      svgElement.setAttribute('height', `${newHeight}`);
      
      // Create text elements for product details
      const details = [
        `Product: ${productDetails.product}`,
        `Prepared By: ${productDetails.preparedBy}`,
        `Container: ${productDetails.containerType}`,
        `Prep Date: ${productDetails.preparedDate}`,
        `Expires: ${productDetails.expiryDate}`
      ];
      
      // Add each line of text
      details.forEach((text, index) => {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', '10');
        textElement.setAttribute('y', `${height + 15 + (index * 15)}`);
        textElement.setAttribute('font-size', '10');
        textElement.setAttribute('font-family', 'Arial, sans-serif');
        textElement.textContent = text;
        svgElement.appendChild(textElement);
      });
    }
    
    return svg.outerHTML;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};

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

/**
 * Simulate printing a barcode with product details
 */
export const printBarcode = async (
  barcodeId: string, 
  productDetails?: {
    product: string;
    preparedBy: string;
    containerType: string;
    preparedDate: string;
    expiryDate: string;
  }
) => {
  // Generate barcode SVG with product details
  const svgString = generateBarcodeSvg(barcodeId, productDetails);
  try {
    const imageUrl = await svgToImage(svgString);
    
    // In a real application, send to printer
    // For demo, we'll open in a new window/tab
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode: ${barcodeId}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                font-family: system-ui, sans-serif;
              }
              .print-container {
                border: 1px dashed #ccc;
                padding: 15px;
                text-align: center;
                min-width: 300px;
              }
              img {
                max-width: 100%;
              }
              .info {
                margin-top: 10px;
                font-size: 14px;
                color: #666;
              }
              .product-details {
                margin-top: 5px;
                font-size: 11px;
                color: #333;
                text-align: left;
              }
              .product-details p {
                margin: 2px 0;
              }
              button {
                margin-top: 20px;
                padding: 8px 16px;
                background: #0070f3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${imageUrl}" alt="Barcode ${barcodeId}" />
              <div class="info">
                Barcode ID: ${barcodeId}
              </div>
              ${productDetails ? `
                <div class="product-details">
                  <p><strong>Product:</strong> ${productDetails.product}</p>
                  <p><strong>Prepared By:</strong> ${productDetails.preparedBy}</p>
                  <p><strong>Container:</strong> ${productDetails.containerType}</p>
                  <p><strong>Prep Date:</strong> ${productDetails.preparedDate}</p>
                  <p><strong>Expires:</strong> ${productDetails.expiryDate}</p>
                </div>
              ` : ''}
            </div>
            <button onclick="window.print(); return false;">Print Barcode</button>
            <p class="info">In a real application, this would be sent directly to a label printer.</p>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    return true;
  } catch (error) {
    console.error('Error printing barcode:', error);
    return false;
  }
};
