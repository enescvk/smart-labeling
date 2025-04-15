
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getUserRestaurants } from "@/services/restaurants/restaurantService";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Store, Users } from "lucide-react";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { RestaurantsTab } from "@/components/settings/RestaurantsTab";
import { TeamMembersTab } from "@/components/settings/TeamMembersTab";

const Settings = () => {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  const {
    data: restaurants = [],
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: getUserRestaurants
  });

  useEffect(() => {
    if (restaurants && restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account, restaurants, and team members</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="restaurants">
              <Store className="h-4 w-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="restaurants">
            <RestaurantsTab />
          </TabsContent>

          <TabsContent value="team">
            <TeamMembersTab selectedRestaurantId={selectedRestaurantId} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
