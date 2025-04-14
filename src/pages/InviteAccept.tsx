
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

const InviteAccept = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useAuth();

  // Get token from URL query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        toast({
          title: "Invalid invitation",
          description: "The invitation link is invalid or has expired.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setIsLoading(true);
      try {
        // Check if invitation is valid
        const { data, error } = await supabase
          .from("restaurant_invitations")
          .select("id, email, role, restaurant_id, created_at, expires_at, accepted_at")
          .eq("invitation_token", token)
          .is("accepted_at", null)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (error || !data) {
          toast({
            title: "Invalid invitation",
            description: "This invitation has expired or already been used.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setInvitation(data);
        setEmail(data.email);
      } catch (error) {
        console.error("Error checking invitation:", error);
        toast({
          title: "Error checking invitation",
          description: "There was a problem verifying your invitation.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkInvitation();
  }, [token, navigate]);

  const handleCreateAccount = async () => {
    if (!invitation) return;
    
    if (!password.trim()) {
      return toast({
        title: "Password required",
        description: "Please enter a password.",
        variant: "destructive",
      });
    }
    
    if (password !== confirmPassword) {
      return toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
    }
    
    setIsLoading(true);
    try {
      // If the user is not logged in, create an account
      const { error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      // Accept the invitation
      const { error: processError } = await supabase.rpc('process_invitation', {
        invitation_token: token,
        password
      });

      if (processError) {
        throw processError;
      }

      toast({
        title: "Account created",
        description: "Your account has been created and you've been added to the restaurant.",
      });
      
      // Sign in with the new credentials
      await signIn(invitation.email, password);
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error creating account",
        description: error.message || "There was a problem creating your account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;
    
    setIsLoading(true);
    try {
      // Accept the invitation using the stored procedure
      const { error } = await supabase.rpc('process_invitation', {
        invitation_token: token
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Invitation accepted",
        description: "You have been added to the restaurant.",
      });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error accepting invitation",
        description: error.message || "There was a problem accepting your invitation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Validating invitation...</span>
      </div>
    );
  }

  if (!invitation) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restaurant Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a restaurant as a {invitation.role}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {user ? (
            <p className="text-sm text-muted-foreground">
              You're already logged in. Click below to accept the invitation.
            </p>
          ) : (
            <>
              <div>
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {user ? (
            <Button 
              onClick={handleAcceptInvitation} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? <><Spinner size="sm" className="mr-2" /> Accepting...</> : "Accept Invitation"}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateAccount} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? <><Spinner size="sm" className="mr-2" /> Creating Account...</> : "Create Account & Join"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default InviteAccept;
