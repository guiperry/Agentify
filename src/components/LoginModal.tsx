'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from '@/utils/env';
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

const LoginModal = ({ open, onOpenChange, onLoginSuccess }: LoginModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { handleGoogleLoginSuccess, handleGoogleLoginError, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  // Get Google Client ID from environment
  const googleClientId = GOOGLE_CLIENT_ID;

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      onOpenChange(false);

      // Check if there was an intent to register agent
      const authIntent = localStorage.getItem('auth-intent');
      if (authIntent === 'register-agent') {
        localStorage.removeItem('auth-intent');
        // Trigger any callback provided by parent component
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }

      toast({
        title: "Login Successful",
        description: "Welcome back to Agentify!",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password);
      onOpenChange(false);

      // Check if there was an intent to register agent
      const authIntent = localStorage.getItem('auth-intent');
      if (authIntent === 'register-agent') {
        localStorage.removeItem('auth-intent');
        // Trigger any callback provided by parent component
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }

      toast({
        title: "Account Created",
        description: "Welcome to Agentify! Please check your email to verify your account.",
      });
    } catch (error) {
      console.error('Sign up failed:', error);
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "Please check your information and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful Google login
  const onGoogleLoginSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      await handleGoogleLoginSuccess(credentialResponse);
      onOpenChange(false); // Close modal on successful login

      // Check if there was an intent to register agent
      const authIntent = localStorage.getItem('auth-intent');
      if (authIntent === 'register-agent') {
        localStorage.removeItem('auth-intent');
        // Trigger any callback provided by parent component
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }

      toast({
        title: "Login Successful",
        description: "Welcome to Agentify!",
      });
    } catch (error) {
      console.error('Google login failed:', error);
      toast({
        title: "Google Login Failed",
        description: error instanceof Error ? error.message : "Google login failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login error
  const onGoogleLoginError = () => {
    console.error('Google login error');
    handleGoogleLoginError();
    toast({
      title: "Google Login Error",
      description: "Google login failed. Please try again.",
      variant: "destructive"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl text-center">Welcome to Agentify</DialogTitle>
          <DialogDescription className="text-white/70 text-center">
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
            <TabsTrigger value="signin" className="data-[state=active]:bg-purple-500/20">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-purple-500/20">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="signin-email" className="text-white">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input 
                    id="signin-email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white/5 border-white/10 text-white pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="signin-password" className="text-white">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input 
                    id="signin-password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-white/5 border-white/10 text-white pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/50 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
              >
                Forgot Password?
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-white/50">Or continue with</span>
                </div>
              </div>

              {/* Google Login Button */}
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <div className="w-full">
                    <GoogleLogin
                      onSuccess={onGoogleLoginSuccess}
                      onError={onGoogleLoginError}
                      theme="filled_black"
                      size="large"
                      width="100%"
                      text="signin_with"
                    />
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <Button
                  variant="outline"
                  className="w-full bg-white text-black hover:bg-gray-100 border-white/20"
                  disabled
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google OAuth not configured
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="signup-email" className="text-white">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input 
                    id="signup-email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white/5 border-white/10 text-white pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-white">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input 
                    id="signup-password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="bg-white/5 border-white/10 text-white pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/50 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <p className="text-xs text-white/50 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-white/50">Or continue with</span>
                </div>
              </div>

              {/* Google Login Button */}
              {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <div className="w-full">
                    <GoogleLogin
                      onSuccess={onGoogleLoginSuccess}
                      onError={onGoogleLoginError}
                      theme="filled_black"
                      size="large"
                      width="100%"
                      text="signup_with"
                    />
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <Button
                  variant="outline"
                  className="w-full bg-white text-black hover:bg-gray-100 border-white/20"
                  disabled
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google OAuth not configured
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
