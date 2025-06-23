// Note: Google OAuth will be handled by @react-oauth/google in the component layer
// This service manages the authentication state and user data
import { GOOGLE_CLIENT_ID } from '../utils/env';

// Types for authentication
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Google OAuth configuration is imported from env utility

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    // Try to restore user from localStorage on initialization
    this.restoreUserFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.getAuthState());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current auth state
  public getAuthState(): AuthState {
    return {
      isAuthenticated: !!this.currentUser,
      user: this.currentUser,
      loading: false,
      error: null,
    };
  }

  // Notify all listeners of state changes
  private notifyListeners(state: AuthState): void {
    this.listeners.forEach(listener => listener(state));
  }

  // Handle successful Google OAuth login (called from component)
  public async handleGoogleLoginSuccess(credentialResponse: any): Promise<User> {
    try {
      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
      });

      // Decode the JWT token from Google
      const decoded = this.decodeJWT(credentialResponse.credential);

      const user: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        accessToken: credentialResponse.credential,
      };

      this.currentUser = user;
      this.saveUserToStorage(user);

      this.notifyListeners({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';

      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }

  // Handle Google OAuth login error
  public handleGoogleLoginError(): void {
    const errorMessage = 'Google login failed';

    this.notifyListeners({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: errorMessage,
    });
  }

  // Decode JWT token from Google
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Failed to decode Google JWT token');
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      // Clear user data
      this.currentUser = null;
      this.clearUserFromStorage();
      
      // Revoke Google token if available
      // In a real implementation, you'd call Google's revoke endpoint
      
      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      this.currentUser = null;
      this.clearUserFromStorage();
      
      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Save user to localStorage
  private saveUserToStorage(user: User): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('agentify_user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  // Restore user from localStorage
  private restoreUserFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedUser = localStorage.getItem('agentify_user');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
      }
    } catch (error) {
      console.error('Failed to restore user from storage:', error);
      this.clearUserFromStorage();
    }
  }

  // Clear user from localStorage
  private clearUserFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('agentify_user');
      }
    } catch (error) {
      console.error('Failed to clear user from storage:', error);
    }
  }

  // Validate token (check if it's still valid)
  public async validateToken(): Promise<boolean> {
    if (!this.currentUser?.accessToken) {
      return false;
    }

    try {
      // In a real implementation, you'd validate the token with Google
      // For now, we'll assume it's valid if it exists
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      await this.logout();
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export types and service
export default authService;
