import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { Input } from "@/components/ui/input";
import { fetchUserProfile, updateUserProfile } from "@/services/user/profileService";

export const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const { selectedRestaurant } = useRestaurantStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !selectedRestaurant) return;
      try {
        const { data, error } = await supabase.rpc('is_admin_of_restaurant', { p_restaurant_id: selectedRestaurant.id });
        if (error) {
          console.error("Error checking admin status:", error);
          return;
        }
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Error in admin check:", error);
      }
    };

    checkAdminStatus();
  }, [user, selectedRestaurant]);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const profile = await fetchUserProfile(user.id);
        setFirstName(profile?.first_name ?? "");
        setLastName(profile?.last_name ?? "");
      }
    };
    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, { first_name: firstName.trim(), last_name: lastName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          View and manage your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4 max-w-md">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">First Name</label>
              {isEditing ? (
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  disabled={saving}
                />
              ) : (
                <div className="text-base">{firstName || <span className="text-muted-foreground italic">Not set</span>}</div>
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Last Name</label>
              {isEditing ? (
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  disabled={saving}
                />
              ) : (
                <div className="text-base">{lastName || <span className="text-muted-foreground italic">Not set</span>}</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          {isEditing ? (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
