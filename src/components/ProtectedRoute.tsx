import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

export function ProtectedRoute({ children, requireEmpresa = false }: { children: ReactNode; requireEmpresa?: boolean }) {
  const { user, empresa, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (requireEmpresa && !empresa) return <Navigate to="/registro-empresa" replace />;
  return <>{children}</>;
}
