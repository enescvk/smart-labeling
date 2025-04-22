import React, { useState, useEffect } from "react";
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
import { getRestaurantSettings } from "@/services/settings/restaurantSettings";
import { getRestaurantFoodTypes } from "@/services/settings/restaurantFoodTypes";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { getRestaurantMembers } from "@/services/restaurants/memberService";

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
  const { selectedRestaurant } = useRestaurantStore();
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
  const [containerTypes, setContainerTypes] = useState<string[]>([
    'Container', 'Bottle', 'Jar', 'Bag', 'Box', 'Other'
  ]);
  const [foodTypes, setFoodTypes] = useState<string[]>([
    'Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Side Dish'
  ]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedRestaurant) return;

      try {
        const settings = await getRestaurantSettings(selectedRestaurant.id);
        if (settings && settings.container_types && settings.container_types.length > 0) {
          setContainerTypes(settings.container_types);
          if (!settings.container_types.includes(formData.containerType)) {
            setFormData(prev => ({ ...prev, containerType: settings.container_types[0] }));
          }
        }
      } catch (error) {
        console.error("Failed to load container types:", error);
      }

      try {
        const types = await getRestaurantFoodTypes(selectedRestaurant.id);
        if (types && Array.isArray(types.food_types) && types.food_types.length > 0) {
          setFoodTypes(types.food_types);
          if (!types.food_types.includes(formData.product)) {
            setFormData(prev => ({ ...prev, product: "" }));
          }
        }
      } catch (error) {
        console.error("Failed to load food types:", error);
      }

      try {
        const fetchedMembers = await getRestaurantMembers(selectedRestaurant.id);
        const memberOptions = fetchedMembers.map((m) => {
          let name = "";
          if (m.user?.first_name || m.user?.last_name) {
            if (m.user?.first_name && m.user?.last_name) {
              name = `${m.user.first_name} ${m.user.last_name}`;
            } else {
              name = m.user?.first_name || m.user?.last_name || "";
            }
          } else {
            name = m.user?.email || m.user_id;
          }
          return ({
            id: m.user_id,
            name
          });
        });
        setMembers(memberOptions);
        if (formData.preparedBy && !memberOptions.find(m => m.id === formData.preparedBy)) {
          setFormData(prev => ({ ...prev, preparedBy: "" }));
        }
      } catch (error) {
        console.error("Failed to fetch restaurant members:", error);
      }
    };

    loadData();
  }, [selectedRestaurant]);
  
  const handleContainerTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, containerType: value }));
  };

  const handleProductTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, product: value }));
  };

  const handlePreparedByChange = (value: string) => {
    setFormData((prev) => ({ ...prev, preparedBy: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
            <Select
              value={formData.product}
              onValueChange={handleProductTypeChange}
              required
            >
              <SelectTrigger id="product" name="product">
                <SelectValue placeholder="Select a product (food type)" />
              </SelectTrigger>
              <SelectContent>
                {foodTypes.length > 0 ? (
                  foodTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-food-types" value="no-food-types" disabled>
                    No food types defined
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preparedBy">Prepared By</Label>
            <Select
              value={formData.preparedBy}
              onValueChange={handlePreparedByChange}
              required
            >
              <SelectTrigger id="preparedBy" name="preparedBy">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {members.length > 0 ? (
                  members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-members" value="no-members" disabled>
                    No team members found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
                {containerTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
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
              className="flex-1 flex items-center justify-center p-4 border border-dashed border-kitchen-200 rounded-md bg-kitchen-50 mb-4"
              style={{ 
                minHeight: "300px",
                maxWidth: "100%", 
                overflow: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
            
            <div className="grid grid-cols-2 gap-3">
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
