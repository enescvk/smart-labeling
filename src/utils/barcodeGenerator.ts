
// This file now acts as a facade that re-exports everything from the refactored modules
import { generateBarcodeId, generateBarcodeSvg } from './barcodeCore';
import { printBarcode } from './barcodePrinter';
import { getInitials, formatDateString } from './barcodeFormatters';
import { svgToImage } from './svgUtils';

export {
  generateBarcodeId,
  generateBarcodeSvg,
  printBarcode,
  getInitials,
  formatDateString,
  svgToImage
};
