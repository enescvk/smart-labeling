
import React, { useState } from "react";
import { generateBarcodeId, generateBarcodeSvg, printBarcode } from "../utils/barcodeGenerator";
import { toast } from "sonner";
import { useLabelForm } from "./label/useLabelForm";
import { LabelFormFields } from "./label/LabelFormFields";
import { BarcodePreview } from "./label/BarcodePreview";

export interface LabelFormData {
  product: string;
  preparedBy: string;
  preparedDate: string;
  expiryDate: string;
  containerType: string;
}

interface CreateLabelFormProps {
  onSubmit: (data: LabelFormData & { barcodeId: string }) => void;
  isSubmitting?: boolean;
}

export const CreateLabelForm: React.FC<CreateLabelFormProps> = ({
  onSubmit,
  isSubmitting = false
}) => {
  const {
    formData,
    setFormData,
    containerTypes,
    foodTypes,
    members,
    handleChange,
    handleSelectChange,
    resetForm,
    today,
    defaultExpiry
  } = useLabelForm();

  const [barcodeId, setBarcodeId] = useState<string>("");
  const [barcodeSvg, setBarcodeSvg] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product || !formData.preparedBy) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsGenerating(true);
    try {
      setTimeout(() => {
        const newBarcodeId = generateBarcodeId();
        setBarcodeId(newBarcodeId);
        const memberName = members.find((m) => m.id === formData.preparedBy)?.name || "";
        const svg = generateBarcodeSvg(newBarcodeId, {
          product: formData.product,
          preparedBy: memberName,
          containerType: formData.containerType,
          preparedDate: formData.preparedDate,
          expiryDate: formData.expiryDate
        });
        setBarcodeSvg(svg);
        setIsGenerating(false);
        toast.success("Barcode generated successfully!");
      }, 800);
    } catch (error) {
      setIsGenerating(false);
      toast.error("Failed to generate barcode");
    }
  };

  const handlePrint = async () => {
    if (!barcodeId) return;
    const memberName = members.find((m) => m.id === formData.preparedBy)?.name || "";
    toast.promise(
      printBarcode(barcodeId, {
        product: formData.product,
        preparedBy: memberName,
        containerType: formData.containerType,
        preparedDate: formData.preparedDate,
        expiryDate: formData.expiryDate
      }),
      {
        loading: "Sending to printer...",
        success: "Sent to printer!",
        error: "Failed to print barcode",
      }
    );
  };

  const handleSave = () => {
    if (!barcodeId) return;
    onSubmit({
      ...formData,
      barcodeId,
    });

    if (!isSubmitting) {
      resetForm();
      setBarcodeId("");
      setBarcodeSvg("");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <LabelFormFields
        formData={formData}
        onInputChange={handleChange}
        onSelectChange={handleSelectChange}
        containerTypes={containerTypes}
        foodTypes={foodTypes}
        members={members}
        onGenerate={generateLabel}
        isGenerating={isGenerating}
      />
      <BarcodePreview
        barcodeSvg={barcodeSvg}
        barcodeId={barcodeId}
        isSubmitting={isSubmitting}
        onPrint={handlePrint}
        onSave={handleSave}
      />
    </div>
  );
};
