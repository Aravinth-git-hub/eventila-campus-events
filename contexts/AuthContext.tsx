import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { User } from '../types';
import * as api from '../api';
import { supabase } from '../src/lib/supabase';

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (user: Omit<User, 'id'>, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isSigningUpRef = useRef<boolean>(false);

  const isLoggingInRef = useRef<boolean>(false);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadAuthenticatedState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{ data: { session: null }; error: Error }>((resolve) => {
          timeoutId = setTimeout(
            () => resolve({ data: { session: null }, error: new Error('Session check timed out') }),
            5000
          );
        }),
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      const session = sessionResult.data?.session;
      if (!session?.user) {
        if (!sessionResult.error) {
          setUser(null);
          setUsers([]);
        }
        return;
      }

      let currentUser: User | null = null;
      try {
        currentUser = await api.apiFetchUserProfile(session.user.id);
      } catch {
        // Retry once on transient network hiccup before preserving/clearing state
        try {
          currentUser = await api.apiFetchUserProfile(session.user.id);
        } catch {
          if (userRef.current?.id === session.user.id) {
            return;
          }
          currentUser = null;
        }
      }

      if (currentUser) {
        setUser(currentUser);
        api.apiFetchUsers().then((fetchedUsers) => {
          setUsers(fetchedUsers);
        }).catch(() => {});
      } else {
        setUser(null);
        setUsers([]);
      }
    } catch {
      if (!userRef.current) {
        setUser(null);
        setUsers([]);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadAuthenticatedState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Ignore transient session events emitted during signup before immediate signOut or active login
      if (isSigningUpRef.current || isLoggingInRef.current) {
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY') {
        return;
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setUsers([]);
        setIsLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed automatically; keep existing authenticated user and refresh profile silently
        if (userRef.current?.id === session.user.id) {
          setTimeout(async () => {
            if (!isMounted || isSigningUpRef.current || isLoggingInRef.current) return;
            try {
              const refreshedProfile = await api.apiFetchUserProfile(session.user.id);
              if (isMounted && refreshedProfile) {
                setUser(refreshedProfile);
              }
            } catch {
              // Preserve current session user on transient profile refresh errors
            }
          }, 0);
          return;
        }
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        // Defer Supabase queries out of the onAuthStateChange callback to avoid auth lock contention
        setTimeout(async () => {
          if (!isMounted || isSigningUpRef.current || isLoggingInRef.current) return;
          try {
            const currentUser = await api.apiFetchUserProfile(session.user.id);
            if (!isMounted) return;
            if (currentUser) {
              setUser(currentUser);
              api.apiFetchUsers().then((fetchedUsers) => {
                if (isMounted) setUsers(fetchedUsers);
              }).catch(() => {});
            } else if (!userRef.current || userRef.current.id !== session.user.id) {
              setUser(null);
              setUsers([]);
            }
          } catch {
            // Do not log out an active user on transient profile lookup failures
            if (isMounted && (!userRef.current || userRef.current.id !== session.user.id)) {
              setUser(null);
              setUsers([]);
            }
          }
        }, 0);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadAuthenticatedState]);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    isLoggingInRef.current = true;
    try {
      const loggedInUser = await api.apiLogin(email, password);
      setUser(loggedInUser);
      api.apiFetchUsers().then((fetchedUsers) => {
        setUsers(fetchedUsers);
      }).catch(() => {});
      return loggedInUser;
    } catch (err: any) {
      setUser(null);
      setUsers([]);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      isLoggingInRef.current = false;
    }
  };

  const signup = async (
    userToSignup: Omit<User, 'id'>,
    password: string
  ): Promise<void> => {
    setError(null);
    isSigningUpRef.current = true;
    try {
      await api.apiSignup(userToSignup, password);
      setUser(null);
      setUsers([]);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    } finally {
      isSigningUpRef.current = false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.apiLogout();
      setUser(null);
      setUsers([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) {
      throw new Error('You must be logged in to update your profile.');
    }
    setError(null);
    try {
      const updatedUser = await api.apiUpdateUser(user.id, updatedData);
      setUser(updatedUser);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === user.id ? updatedUser : u))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      throw err;
    }
  };

  const refreshUser = async () => {
    await loadAuthenticatedState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoading,
        isAuthenticated: Boolean(user),
        error,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
