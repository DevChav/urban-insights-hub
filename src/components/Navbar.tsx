import { NavLink } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/analizar", label: "Mapa de análisis" },
  { to: "/estadisticas", label: "Estadísticas" },
  { to: "/acerca", label: "Acerca del proyecto" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-headline text-lg font-bold text-foreground">UrbanData</span>
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
        </nav>
      </div>
    </header>
  );
}
