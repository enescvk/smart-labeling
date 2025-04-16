
import { generateBarcodeSvg } from './barcodeCore';
import { svgToImage } from './svgUtils';
import { formatProductInfoLine } from './barcodeFormatters';

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
    
    // Format product info for display
    const productInfoLine = productDetails ? 
      formatProductInfoLine(
        productDetails.product,
        productDetails.preparedBy,
        productDetails.preparedDate,
        productDetails.expiryDate
      ) : '';
    
    // Instead of using window.open directly, create a new approach
    // that ensures content is fully loaded before showing to user
    
    // Create a temporary anchor element
    const printLink = document.createElement('a');
    printLink.target = '_blank';
    printLink.rel = 'noopener noreferrer';
    
    // Create a Blob with the HTML content
    const htmlContent = `
      <!DOCTYPE html>
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
              font-size: 12px;
              color: #333;
              text-align: center;
              font-weight: bold;
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
            ${productInfoLine ? `
              <div class="product-details">
                <p>${productInfoLine}</p>
              </div>
            ` : ''}
          </div>
          <button onclick="window.print(); return false;">Print Barcode</button>
          <p class="info">In a real application, this would be sent directly to a label printer.</p>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Set the href and click to open
    printLink.href = blobUrl;
    document.body.appendChild(printLink);
    printLink.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(printLink);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error printing barcode:', error);
    return false;
  }
};
