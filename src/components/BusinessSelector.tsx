import { useState, useMemo, useRef, useEffect } from "react";
import { SECTORES, type Sector, type Categoria } from "@/lib/businessCategories";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  value: string | null;
  onChange: (subcatId: string) => void;
}

interface DropdownProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  placeholder: string;
  selectedLabel: string | null;
  children: React.ReactNode;
  step: string;
}

function Dropdown({ open, onToggle, onClose, placeholder, selectedLabel, children, step }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-body shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-headline font-bold shrink-0">
            {step}
          </span>
          <span className={selectedLabel ? "text-foreground font-medium" : "text-muted-foreground"}>
            {selectedLabel || placeholder}
          </span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-lg z-[2000] max-h-[280px] overflow-y-auto"
          >
            <div className="p-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full gap-2 px-3 py-2 text-xs rounded-md font-body transition-colors duration-150 ${
        selected
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-accent"
      }`}
    >
      <span className="flex-1 text-left truncate">{children}</span>
      {selected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
    </button>
  );
}

export default function BusinessSelector({ value, onChange }: Props) {
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<"sector" | "categoria" | "subcat" | null>(null);

  const sector = useMemo(() => SECTORES.find((s) => s.id === sectorId) ?? null, [sectorId]);
  const categoria = useMemo(
    () => sector?.categorias.find((c) => c.id === categoriaId) ?? null,
    [sector, categoriaId]
  );

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    for (const s of SECTORES) {
      for (const c of s.categorias) {
        const sub = c.subcategorias.find((sc) => sc.id === value);
        if (sub) return sub.nombre;
      }
    }
    return null;
  }, [value]);

  const toggleMenu = (menu: "sector" | "categoria" | "subcat") => {
    setOpenMenu(prev => prev === menu ? null : menu);
  };

  const showCategoria = sector && sector.categorias.length > 1;
  const showSubcat = categoria || (sector && sector.categorias.length === 1);
  const subcatSource = categoria ?? sector?.categorias[0] ?? null;

  return (
    <div className="flex flex-col gap-1.5 w-[260px]">
      {/* Sector */}
      <Dropdown
        open={openMenu === "sector"}
        onToggle={() => toggleMenu("sector")}
        onClose={() => setOpenMenu(null)}
        placeholder="Sector"
        selectedLabel={sector?.nombre.replace("Sector ", "") ?? null}
        step="1"
      >
        {[...SECTORES].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((s) => (
          <DropdownItem
            key={s.id}
            selected={s.id === sectorId}
            onClick={() => {
              setSectorId(s.id);
              setCategoriaId(null);
              setOpenMenu(s.categorias.length > 1 ? "categoria" : "subcat");
            }}
          >
            {s.nombre}
          </DropdownItem>
        ))}
      </Dropdown>

      {/* Categoría */}
      {showCategoria && (
        <Dropdown
          open={openMenu === "categoria"}
          onToggle={() => toggleMenu("categoria")}
          onClose={() => setOpenMenu(null)}
          placeholder="Categoría"
          selectedLabel={categoria?.nombre ?? null}
          step="2"
        >
          {sector!.categorias.map((c) => (
            <DropdownItem
              key={c.id}
              selected={c.id === categoriaId}
              onClick={() => {
                setCategoriaId(c.id);
                setOpenMenu("subcat");
              }}
            >
              {c.nombre}
            </DropdownItem>
          ))}
        </Dropdown>
      )}

      {/* Subcategoría */}
      {showSubcat && subcatSource && (
        <Dropdown
          open={openMenu === "subcat"}
          onToggle={() => toggleMenu("subcat")}
          onClose={() => setOpenMenu(null)}
          placeholder="Subcategoría"
          selectedLabel={selectedLabel}
          step={showCategoria ? "3" : "2"}
        >
          {subcatSource.subcategorias.map((sc) => (
            <DropdownItem
              key={sc.id}
              selected={sc.id === value}
              onClick={() => {
                onChange(sc.id);
                setOpenMenu(null);
              }}
            >
              {sc.nombre}
            </DropdownItem>
          ))}
        </Dropdown>
      )}

      {/* Current selection badge */}
      {selectedLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 font-body"
        >
          <ChevronRight className="h-3 w-3" />
          {selectedLabel}
        </motion.div>
      )}
    </div>
  );
}
