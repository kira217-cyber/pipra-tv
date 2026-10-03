import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  studioApi,
  TOKEN_KEY,
  USER_KEY,
  SESSION_EXPIRED_EVENT,
} from "../api/studioApi";
import { DEMO_FLAG, DEMO_USER, isDemoMode } from "../api/demoAdapter";
import { clearAuthCache } from "../hooks/useFetch";

// One account system for the new site: a creator account (StudioUser).
// Anyone can browse signed out; signing in unlocks the creator pages —
// Dashboard, All Videos, Analytics, Earning, Upload, Profile.
const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    localStorage.getItem(TOKEN_KEY) ? readStoredUser() : null,
  );
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = useCallback((token, nextUser) => {
    clearAuthCache();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DEMO_FLAG);
    clearAuthCache();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await studioApi.get("/api/studio/profile");
    const fresh = data?.data?.user || null;
    if (fresh) {
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setUser(fresh);
    }
    return fresh;
  }, []);

  // Re-validate a stored session once on load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    let cancelled = false;
    studioApi
      .get("/api/studio/profile")
      .then(({ data }) => {
        const fresh = data?.data?.user;
        if (cancelled || !fresh) return;
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  useEffect(() => {
    const onExpired = () => {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      logout();
      toast.error("Session expired. Please sign in again.");
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const login = useCallback(
    async ({ identifier, password }) => {
      localStorage.removeItem(DEMO_FLAG);
      const { data } = await studioApi.post("/api/studio/login", { identifier, password });
      saveSession(data.data.token, data.data.user);
      return data.data.user;
    },
    [saveSession],
  );

  // Signs in as the sample creator (see api/demoAdapter.js).
  const loginDemo = useCallback(() => {
    localStorage.setItem(DEMO_FLAG, "1");
    saveSession("demo", DEMO_USER);
    return DEMO_USER;
  }, [saveSession]);

  const register = useCallback(
    async (payload) => {
      localStorage.removeItem(DEMO_FLAG);
      const { data } = await studioApi.post("/api/studio/register", payload);
      saveSession(data.data.token, data.data.user);
      return data.data.user;
    },
    [saveSession],
  );

  return (
    <AuthContext.Provider
      value={{ user, checking, login, loginDemo, register, logout, refreshProfile, setUser, isDemo: Boolean(user) && isDemoMode() }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
