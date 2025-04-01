
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateBarcodeId, generateBarcodeSvg, printBarcode } from "../utils/barcodeGenerator";
import { toast } from "sonner";
import { Barcode, Printer, Save } from "lucide-react";
import { format, addDays } from "date-fns";
import { motion } from "framer-motion";

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
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultExpiry = format(addDays(new Date(), 3), "yyyy-MM-dd");
  
  const [formData, setFormData] = useState<LabelFormData>({
    product: "",
    preparedBy: "",
    preparedDate: today,
    expiryDate: defaultExpiry,
    containerType: "Container"
  });
  const [barcodeId, setBarcodeId] = useState<string>("");
  const [barcodeSvg, setBarcodeSvg] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleContainerTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, containerType: value }));
  };
  
  const generateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product || !formData.preparedBy) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate network delay for demo purposes
    setTimeout(() => {
      const newBarcodeId = generateBarcodeId();
      setBarcodeId(newBarcodeId);
      
      // Generate barcode SVG with product details
      const svg = generateBarcodeSvg(newBarcodeId, {
        product: formData.product,
        preparedBy: formData.preparedBy,
        containerType: formData.containerType,
        preparedDate: formData.preparedDate,
        expiryDate: formData.expiryDate
      });
      setBarcodeSvg(svg);
      setIsGenerating(false);
      
      toast.success("Barcode generated successfully!");
    }, 800);
  };
  
  const handlePrint = async () => {
    if (!barcodeId) return;
    
    toast.promise(
      printBarcode(barcodeId, {
        product: formData.product,
        preparedBy: formData.preparedBy,
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
    
    // Reset form if save is successful
    if (!isSubmitting) {
      setFormData({
        product: "",
        preparedBy: "",
        preparedDate: today,
        expiryDate: defaultExpiry,
        containerType: "Container"
      });
      setBarcodeId("");
      setBarcodeSvg("");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <form onSubmit={generateLabel} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product Name</Label>
            <Input
              id="product"
              name="product"
              placeholder="e.g. Chicken Stock"
              value={formData.product}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preparedBy">Prepared By</Label>
            <Input
              id="preparedBy"
              name="preparedBy"
              placeholder="e.g. John Smith"
              value={formData.preparedBy}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="containerType">Container Type</Label>
            <Select 
              value={formData.containerType} 
              onValueChange={handleContainerTypeChange}
            >
              <SelectTrigger id="containerType">
                <SelectValue placeholder="Select container type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Container">Container</SelectItem>
                <SelectItem value="Bottle">Bottle</SelectItem>
                <SelectItem value="Jar">Jar</SelectItem>
                <SelectItem value="Bag">Bag</SelectItem>
                <SelectItem value="Box">Box</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preparedDate">Preparation Date</Label>
              <Input
                id="preparedDate"
                name="preparedDate"
                type="date"
                value={formData.preparedDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiration Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                min={formData.preparedDate}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating}
          >
            <Barcode className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Barcode"}
          </Button>
        </form>
      </Card>
      
      <Card className="p-6 flex flex-col">
        <h3 className="text-lg font-medium mb-4">Generated Barcode</h3>
        
        {barcodeSvg ? (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center p-4 border border-dashed border-kitchen-200 rounded-md bg-kitchen-50 overflow-auto"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center justify-center"
                disabled={isSubmitting}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Label
              </Button>
              
              <Button 
                onClick={handleSave}
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
    </div>
  );
};
