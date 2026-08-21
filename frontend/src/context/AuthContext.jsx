import { createContext, useState, useCallback, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";

export const AuthContext = createContext(null);

const hydrate = () => {
  try {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "null");
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ token, user }, setAuth] = useState(hydrate);

  const persist = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ token, user });
  };

  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await axiosInstance.post("/auth/register", payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, login, register, logout }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
