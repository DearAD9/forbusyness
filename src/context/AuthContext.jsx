/**
 * AuthContext — Forbusyness Web ERP
 *
 * Provides authentication state to the entire application.
 * Wraps authService so components never import authService directly.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getSession,
  saveRememberedUsername,
  clearRememberedUsername,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while session check is in flight

  // On mount: check for an existing session
  useEffect(() => {
    let cancelled = false;
    getSession()
      .then(data => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /**
   * Log in. Throws on failure so the form can display the error.
   */
  const login = useCallback(async (username, password, rememberMe) => {
    const data = await apiLogin(username, password);
    setUser(data.user);
    if (rememberMe) {
      saveRememberedUsername(username);
    } else {
      clearRememberedUsername();
    }
    return data;
  }, []);

  /**
   * Log out and clear state.
   */
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    clearRememberedUsername();
  }, []);

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume auth state anywhere in the tree.
 * Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
