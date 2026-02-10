import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import * as Linking from 'expo-linking';
import { AppState } from 'react-native';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoaded: false,
  isSignedIn: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle OAuth deep links
  useEffect(() => {
    // Handle initial URL when app is opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming deep links while app is running
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('========================================');
    console.log('[Auth] Deep link received:', url);
    console.log('========================================');
    
    // Check if this is an OAuth callback (contains access_token)
    if (url.includes('#access_token') || url.includes('?access_token')) {
      console.log('[Auth] ✅ OAuth callback detected');
      try {
        // Handle both Expo Go and production URLs
        let tokenString = '';
        
        // For Expo Go: exp://10.162.52.86:8081/--/google-callback#access_token=...
        // For Production: zenith-task://google-callback#access_token=...
        if (url.includes('#')) {
          tokenString = url.split('#')[1];
        } else if (url.includes('?')) {
          tokenString = url.split('?')[1];
        }
        
        console.log('[Auth] Token string:', tokenString);
        
        const params = new URLSearchParams(tokenString);
        
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        console.log('[Auth] Access token exists:', !!access_token);
        console.log('[Auth] Refresh token exists:', !!refresh_token);
        
        if (access_token && refresh_token) {
          console.log('[Auth] 🔄 Setting session with tokens...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            console.error('[Auth] ❌ Error setting session:', error);
            return;
          }
          
          if (data?.session) {
            console.log('[Auth] ✅ OAuth session created successfully!');
            console.log('[Auth] User:', data.session.user.email);
          }
        } else {
          console.warn('[Auth] No tokens found in URL');
        }
      } catch (err) {
        console.error('[Auth] Deep link handling error:', err);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoaded,
        isSignedIn: !!session,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access auth state
export function useAuth() {
  return useContext(AuthContext);
}

// Additional hook for compatibility with Clerk's useUser
export function useUser() {
  const { user } = useAuth();
  return { user };
}
