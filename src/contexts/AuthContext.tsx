'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthState, User } from '../services/auth-service';

// Auth context type
interface AuthContextType extends AuthState {
  handleGoogleLoginSuccess: (credentialResponse: any) => Promise<void>;
  handleGoogleLoginError: () => void;
  logout: () => Promise<void>;
  validateToken: () => Promise<boolean>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true, // Start with loading true
    error: null,
  });

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    // Subscribe to auth service state changes
    const unsubscribe = authService.subscribe((newState: AuthState) => {
      setAuthState(newState);
    });

    // Validate existing token on mount
    const initializeAuth = async () => {
      try {
        const isValid = await authService.validateToken();
        if (!isValid && authService.getCurrentUser()) {
          // Token is invalid but user exists in storage, logout
          await authService.logout();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Set loading to false after initialization
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Handle Google login success
  const handleGoogleLoginSuccess = async (credentialResponse: any): Promise<void> => {
    try {
      await authService.handleGoogleLoginSuccess(credentialResponse);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Handle Google login error
  const handleGoogleLoginError = (): void => {
    authService.handleGoogleLoginError();
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  // Validate token
  const validateToken = async (): Promise<boolean> => {
    try {
      return await authService.validateToken();
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    handleGoogleLoginSuccess,
    handleGoogleLoginError,
    logout,
    validateToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for advanced usage
export { AuthContext };
export default AuthProvider;
