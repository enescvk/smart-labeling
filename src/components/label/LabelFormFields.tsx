
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Barcode } from "lucide-react";
import { LabelFormData } from "../CreateLabelForm";
import { MemberOption } from "./useLabelForm";
import { toast } from "sonner";

type LabelFormFieldsProps = {
  formData: LabelFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (field: keyof LabelFormData, value: string) => void;
  containerTypes: string[];
  foodTypes: string[];
  members: MemberOption[];
  onGenerate: (e: React.FormEvent) => void;
  isGenerating: boolean;
};

export const LabelFormFields: React.FC<LabelFormFieldsProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  containerTypes,
  foodTypes,
  members,
  onGenerate,
  isGenerating,
}) => (
  <Card className="p-6">
    <form onSubmit={onGenerate} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product">Product Name</Label>
        <Select
          value={formData.product}
          onValueChange={(val) => onSelectChange('product', val)}
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
          onValueChange={(val) => onSelectChange('preparedBy', val)}
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
          onValueChange={(val) => onSelectChange('containerType', val)}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
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
);
