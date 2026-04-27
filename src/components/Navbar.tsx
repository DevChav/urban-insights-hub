import { NavLink, useNavigate } from "react-router-dom";
import { MapPin, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const publicLinks = [
  { to: "/", label: "Inicio" },
  { to: "/acerca", label: "Acerca" },
];

const privateLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analizar", label: "Mapa de análisis" },
  { to: "/estadisticas", label: "Estadísticas" },
];

export default function Navbar() {
  const { user, empresa, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? privateLinks : publicLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <NavLink to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-headline text-lg font-bold text-foreground">GeoMarket</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 font-body text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="max-w-[140px] truncate">{empresa?.nombre ?? user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="ml-2 rounded-md bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Iniciar sesión
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
