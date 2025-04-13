
import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { createRestaurant, getCurrentRestaurantName } from "@/services/restaurantService";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Define the validation schema for login
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Define the validation schema for signup - now with restaurant name
const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  restaurantName: z.string().min(1, { message: "Restaurant name is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Define the validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const Auth: React.FC = () => {
  const [activeTab, setActiveTab] = useState("login");
  const { signIn, signUp, signInWithGoogle, user, isLoading } = useAuth();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const navigate = useNavigate();
  
  // Get the current restaurant name if any
  const { data: restaurantName } = useQuery({
    queryKey: ['currentRestaurantName'],
    queryFn: getCurrentRestaurantName,
    enabled: false, // Don't fetch automatically, we'll do it manually after login
  });
  
  // Initialize forms outside of any conditional returns
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      restaurantName: "",
    },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Handle signup form submission
  const onSignupSubmit = async (values: SignupFormValues) => {
    try {
      setIsCreatingRestaurant(true);
      // First sign up the user
      await signUp(values.email, values.password);
      
      // After signing up, create the restaurant - this will now happen automatically
      // on first login through the private route logic
      toast({
        title: "Account created",
        description: "Please verify your email to continue.",
      });
      
      setActiveTab("login");
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsCreatingRestaurant(false);
    }
  };
  
  // Handle forgot password form submission
  const onForgotPasswordSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsResettingPassword(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password",
      });
      
      // Return to login tab after successful submission
      setActiveTab("login");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset password email",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // If still loading, show loading spinner
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
          <span className="ml-2">Loading authentication...</span>
        </div>
      </Layout>
    );
  }
  
  // If user is already logged in, redirect to home page
  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Login to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => signInWithGoogle()}
                    disabled={isLoading}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Enter your details to create your account and restaurant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="restaurantName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Restaurant Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isCreatingRestaurant}>
                        {isCreatingRestaurant ? (
                          <>
                            <Spinner className="mr-2" size="sm" />
                            Creating Account...
                          </>
                        ) : (
                          "Create account"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => signInWithGoogle()}
                    disabled={isLoading}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-xs text-muted-foreground">
                    By clicking create account, you agree to our{" "}
                    <a href="#" className="underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="forgot">
              <Card>
                <CardHeader>
                  <CardTitle>Forgot Password</CardTitle>
                  <CardDescription>
                    Enter your email and we'll send you a link to reset your password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isResettingPassword}
                      >
                        {isResettingPassword ? 
                          <>
                            <Spinner className="mr-2" size="sm" /> 
                            Sending Email...
                          </> : 
                          "Send Reset Link"
                        }
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="link" 
                    className="w-full" 
                    onClick={() => setActiveTab("login")}
                  >
                    Back to Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Auth;
