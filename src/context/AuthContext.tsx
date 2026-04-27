import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  type MockUser,
  type Empresa,
  getSession,
  getEmpresa,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  saveEmpresa as persistEmpresa,
  clearEmpresa as removeEmpresa,
} from "@/lib/auth";

interface AuthContextValue {
  user: MockUser | null;
  empresa: Empresa | null;
  loading: boolean;
  login: (email: string, password: string) => void;
  register: (email: string, password: string) => void;
  logout: () => void;
  saveEmpresa: (e: Empresa) => void;
  clearEmpresa: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setEmpresa(getEmpresa());
    setLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const u = authLogin(email, password);
    setUser(u);
    setEmpresa(getEmpresa());
  }, []);

  const register = useCallback((email: string, password: string) => {
    const u = authRegister(email, password);
    setUser(u);
    setEmpresa(null);
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const saveEmpresa = useCallback((e: Empresa) => {
    persistEmpresa(e);
    setEmpresa(e);
  }, []);

  const clearEmpresa = useCallback(() => {
    removeEmpresa();
    setEmpresa(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, empresa, loading, login, register, logout, saveEmpresa, clearEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
