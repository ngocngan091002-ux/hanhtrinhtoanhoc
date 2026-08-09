import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../config/supabase';
import { UserProfile, UserRole } from '../../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, fullName: string, role: UserRole) => Promise<void>;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  loginAsGuest: (fullName: string, role: UserRole, customEmail?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'hanhtrinhtoanhoc_guest_session';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check Supabase session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        // 2. Check local guest session fallback
        const savedGuest = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedGuest) {
          try {
            const guestObj = JSON.parse(savedGuest);
            setProfile(guestObj.profile);
            setUser(guestObj.user);
          } catch (e) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        await fetchProfile(session.user.id, session.user);
      } else {
        const savedGuest = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedGuest) {
          try {
            const guestObj = JSON.parse(savedGuest);
            setProfile(guestObj.profile);
            setUser(guestObj.user);
          } catch (e) {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, currentUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile does not exist yet -> New Google or Email account
        const meta = currentUser?.user_metadata || {};
        const metaRole = (meta.role as UserRole) || selectedRole || 'student';
        
        const newProfile: UserProfile = {
          id: userId,
          email: currentUser?.email || '',
          full_name: meta.full_name || meta.name || currentUser?.email?.split('@')[0] || 'Người dùng Google',
          role: metaRole,
          avatar_url: meta.avatar_url || meta.picture || '',
          created_at: new Date().toISOString(),
        };

        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        if (!createErr && created) {
          setProfile(created as UserProfile);
        } else {
          setProfile(newProfile);
        }
      } else if (data) {
        // Profile exists -> Preserve existing role & learning data!
        const googleAvatar = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
        if (googleAvatar && !data.avatar_url) {
          try {
            await supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', userId);
            data.avatar_url = googleAvatar;
          } catch (e) {}
        }
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async (role: UserRole) => {
    setSelectedRole(role);
    const redirectTo = window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const loginAsGuest = async (fullName: string, role: UserRole, customEmail?: string) => {
    const guestId = generateUUID();
    const email = customEmail || `${role}_${Math.floor(Math.random() * 1000)}@hanhtrinhtoanhoc.edu.vn`;

    const guestProfile: UserProfile = {
      id: guestId,
      email: email,
      full_name: fullName || (role === 'teacher' ? 'Giáo Viên' : role === 'admin' ? 'Quản Trị Viên' : 'Học Sinh'),
      role: role,
      created_at: new Date().toISOString(),
    };

    const guestUser: any = {
      id: guestId,
      email: email,
      user_metadata: {
        full_name: guestProfile.full_name,
        role: role,
      },
    };

    // Save to localStorage for persistence
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        user: guestUser,
        profile: guestProfile,
      })
    );

    try {
      await supabase.from('profiles').upsert(guestProfile);
    } catch (e) {
      // Ignore DB network errors
    }

    setUser(guestUser);
    setProfile(guestProfile);
    setSelectedRole(role);
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        selectedRole,
        setSelectedRole,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        loginAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
