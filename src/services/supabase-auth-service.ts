import { createClient, SupabaseClient, Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';

// Define the callback type for auth state changes
type AuthStateChangeCallback = (event: string, session: Session | null) => void;

// Define a type for our mock Supabase client to ensure type safety
interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null }, error: Error | null }>;
    getUser: () => Promise<{ data: { user: SupabaseUser | null, session: Session | null }, error: Error | null }>;
    signInWithIdToken: (params: any) => Promise<{ data: { user: SupabaseUser | null, session: Session | null }, error: Error | null }>;
    signInWithPassword: (params: any) => Promise<{ data: { user: SupabaseUser | null, session: Session | null }, error: Error | null }>;
    signUp: (params: any) => Promise<{ data: { user: SupabaseUser | null, session: Session | null }, error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
    onAuthStateChange: (callback: AuthStateChangeCallback) => 
      { data: { subscription: { unsubscribe: () => void } } };
  };
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: any | null, error: Error | null }>;
    insert: (data: any) => Promise<{ data: any | null, error: Error | null }>;
    upsert: (data: any) => Promise<{ data: any | null, error: Error | null }>;
    update: (data: any) => Promise<{ data: any | null, error: Error | null }>;
    delete: () => Promise<{ data: any | null, error: Error | null }>;
  };
}

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client with error handling
let supabase: SupabaseClient | MockSupabaseClient;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing. Authentication will not work properly.');
    // Create a dummy client that will throw clear errors when used
    supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase configuration missing') }),
        getUser: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase configuration missing') }),
        signInWithIdToken: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase configuration missing') }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase configuration missing') }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase configuration missing') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback: AuthStateChangeCallback) => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
        upsert: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase configuration missing') }),
      })
    };
  } else {
    // Initialize with actual credentials
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Provide a fallback that won't crash the app
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase initialization failed') }),
      getUser: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase initialization failed') }),
      signInWithIdToken: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase initialization failed') }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase initialization failed') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase initialization failed') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: AuthStateChangeCallback) => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      upsert: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase initialization failed') }),
    })
  };
}

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
      supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
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
  private mapSupabaseUserToUser(supabaseUser: SupabaseUser, accessToken: string): User {
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
