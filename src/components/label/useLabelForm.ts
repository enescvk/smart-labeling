
import { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { getRestaurantSettings } from "@/services/settings/restaurantSettings";
import { getRestaurantFoodTypes } from "@/services/settings/restaurantFoodTypes";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { getRestaurantMembers } from "@/services/restaurants/memberService";
import { LabelFormData } from "../CreateLabelForm";
import { toast } from "sonner";

export type MemberOption = { id: string; name: string };

export const useLabelForm = () => {
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

  const [containerTypes, setContainerTypes] = useState<string[]>([
    'Container', 'Bottle', 'Jar', 'Bag', 'Box', 'Other'
  ]);
  const [foodTypes, setFoodTypes] = useState<string[]>([
    'Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Side Dish'
  ]);
  const [members, setMembers] = useState<MemberOption[]>([]);

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
    // eslint-disable-next-line
  }, [selectedRestaurant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: keyof LabelFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      product: "",
      preparedBy: "",
      preparedDate: today,
      expiryDate: defaultExpiry,
      containerType: "Container"
    });
  };

  return {
    formData,
    setFormData,
    containerTypes,
    foodTypes,
    members,
    handleChange,
    handleSelectChange,
    resetForm,
    today,
    defaultExpiry,
  };
};
