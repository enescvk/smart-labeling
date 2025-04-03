
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
      `);
      printWindow.document.close();
    }
    
    return true;
  } catch (error) {
    console.error('Error printing barcode:', error);
    return false;
  }
};
