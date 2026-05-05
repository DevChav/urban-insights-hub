import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mapa", label: "Mapa", icon: MapPin },
];

export default function BottomNav() {
  const { user, empresa } = useAuth();
  const { pathname } = useLocation();

  // Solo mostrar para usuarios autenticados con empresa registrada
  if (!user || !empresa) return null;
  // No mostrar en rutas de auth/onboarding
  if (pathname.startsWith("/login") || pathname.startsWith("/registro-empresa")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[1100] bg-card/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground active:bg-accent/40",
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="font-body text-[11px] font-medium">{it.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
