import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { checkSubscription, checkSubscriptionByEmail, linkPendingSubscription, getUserConfig, saveUserConfig } from '../services/subscriptionService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSubscribed: boolean;
  scriptUrl: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  saveScriptUrl: (url: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);

  // Load user data after authentication
  const loadUserData = async (currentUser: User) => {
    // 1. Link pending subscriptions by email
    if (currentUser.email) {
      await linkPendingSubscription(currentUser.id, currentUser.email);
    }

    // 2. Check subscription
    let subscribed = await checkSubscription(currentUser.id);
    if (!subscribed && currentUser.email) {
      subscribed = await checkSubscriptionByEmail(currentUser.email);
    }
    setIsSubscribed(subscribed);

    // 3. Load script_url
    const config = await getUserConfig(currentUser.id);
    if (config) {
      setScriptUrl(config.scriptUrl);
      localStorage.setItem('scriptUrl', config.scriptUrl);
    } else {
      // Check if there's a scriptUrl in localStorage (migration)
      const localUrl = localStorage.getItem('scriptUrl');
      if (localUrl) {
        setScriptUrl(localUrl);
      }
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadUserData(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadUserData(s.user).finally(() => setLoading(false));
      } else {
        setIsSubscribed(false);
        setScriptUrl(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSubscribed(false);
    setScriptUrl(null);
    // Clear local auth data but keep theme/preferences
    localStorage.removeItem('scriptUrl');
    localStorage.removeItem('pin');
    localStorage.removeItem('yn_history');
    localStorage.removeItem('yn_cards');
    localStorage.removeItem('yn_pendingExpenses');
    localStorage.removeItem('yn_goals');
    localStorage.removeItem('yn_lastSyncTime');
    localStorage.removeItem('profile');
  };

  const refreshSubscription = async () => {
    if (!user) return;
    let subscribed = await checkSubscription(user.id);
    if (!subscribed && user.email) {
      subscribed = await checkSubscriptionByEmail(user.email);
    }
    setIsSubscribed(subscribed);
  };

  const saveScriptUrlFn = async (url: string) => {
    if (!user) return false;
    const success = await saveUserConfig(user.id, url);
    if (success) {
      setScriptUrl(url);
      localStorage.setItem('scriptUrl', url);
    }
    return success;
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, isSubscribed, scriptUrl,
      signIn, signUp, signOut, refreshSubscription,
      saveScriptUrl: saveScriptUrlFn
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
