
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Barcode, Printer, Save } from "lucide-react";

type BarcodePreviewProps = {
  barcodeSvg: string;
  barcodeId: string;
  isSubmitting: boolean;
  onPrint: () => void;
  onSave: () => void;
};

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({
  barcodeSvg,
  barcodeId,
  isSubmitting,
  onPrint,
  onSave,
}) => (
  <Card className="p-6 flex flex-col">
    <h3 className="text-lg font-medium mb-4">Generated Barcode</h3>

    {barcodeSvg ? (
      <>
        <div
          className="flex-1 flex items-center justify-center p-4 border border-dashed border-kitchen-200 rounded-md bg-kitchen-50 mb-4"
          style={{
            minHeight: "300px",
            maxWidth: "100%",
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{ __html: barcodeSvg }}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onPrint}
            className="flex items-center justify-center"
            disabled={isSubmitting}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Label
          </Button>

          <Button
            onClick={onSave}
            className="flex items-center justify-center"
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save to Inventory"}
          </Button>
        </div>
      </>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-kitchen-200 rounded-md bg-kitchen-50 text-kitchen-400">
        <Barcode className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-center">
          Fill out the form and generate a barcode to see it here
        </p>
      </div>
    )}
  </Card>
);
