import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for authentication
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  accessToken: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

class SupabaseAuthService {
  private static instance: SupabaseAuthService;
  private currentUser: User | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    // Initialize auth state from Supabase session
    this.initializeAuth();
  }

  public static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  // Initialize authentication state
  private async initializeAuth(): Promise<void> {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session?.user) {
        this.currentUser = this.mapSupabaseUserToUser(session.user, session.access_token);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          this.currentUser = this.mapSupabaseUserToUser(session.user, session.access_token);
          this.notifyListeners(this.getAuthState());
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.notifyListeners(this.getAuthState());
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  // Map Supabase user to our User interface
  private mapSupabaseUserToUser(supabaseUser: any, accessToken: string): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || '',
      picture: supabaseUser.user_metadata?.picture || supabaseUser.user_metadata?.avatar_url || '',
      accessToken
    };
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

  // Handle Google OAuth login
  public async handleGoogleLoginSuccess(credentialResponse: any): Promise<User> {
    try {
      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
      });

      // Sign in with Google using Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credentialResponse.credential,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('No user data returned from Supabase');
      }

      const user = this.mapSupabaseUserToUser(data.user, data.session.access_token);
      this.currentUser = user;

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

  // Handle email/password sign in
  public async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('No user data returned from Supabase');
      }

      const user = this.mapSupabaseUserToUser(data.user, data.session.access_token);
      this.currentUser = user;

      this.notifyListeners({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';

      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }

  // Handle email/password sign up
  public async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      this.notifyListeners({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
      });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user data returned from Supabase');
      }

      // For sign up, session might not be available immediately if email confirmation is required
      const user = this.mapSupabaseUserToUser(data.user, data.session?.access_token || '');
      
      if (data.session) {
        this.currentUser = user;
      }

      this.notifyListeners({
        isAuthenticated: !!data.session,
        user: data.session ? user : null,
        loading: false,
        error: null,
      });

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';

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

  // Logout user
  public async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      
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

  // Validate token
  public async validateToken(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      await this.logout();
      return false;
    }
  }

  // Get Supabase client for direct access
  public getSupabaseClient() {
    return supabase;
  }
}

// Export singleton instance
export const supabaseAuthService = SupabaseAuthService.getInstance();
export default supabaseAuthService;
