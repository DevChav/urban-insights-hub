import { useState, useMemo } from "react";
import { SECTORES, type Sector, type Categoria } from "@/lib/businessCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";

interface Props {
  value: string | null; // subcategoriaId
  onChange: (subcatId: string) => void;
}

export default function BusinessSelector({ value, onChange }: Props) {
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  const sector = useMemo(() => SECTORES.find((s) => s.id === sectorId) ?? null, [sectorId]);
  const categoria = useMemo(
    () => sector?.categorias.find((c) => c.id === categoriaId) ?? null,
    [sector, categoriaId]
  );

  // Find current labels for display
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

  return (
    <div className="flex flex-col gap-2 w-[280px]">
      {/* Sector */}
      <Select
        value={sectorId ?? ""}
        onValueChange={(v) => {
          setSectorId(v);
          setCategoriaId(null);
        }}
      >
        <SelectTrigger className="bg-card shadow-lg border-border text-xs h-9">
          <SelectValue placeholder="① Sector" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {SECTORES.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Categoría (only if sector has >1 categories) */}
      {sector && sector.categorias.length > 1 && (
        <Select
          value={categoriaId ?? ""}
          onValueChange={(v) => setCategoriaId(v)}
        >
          <SelectTrigger className="bg-card shadow-lg border-border text-xs h-9">
            <SelectValue placeholder="② Categoría" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {sector.categorias.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Subcategoría */}
      {(categoria || (sector && sector.categorias.length === 1)) && (
        <Select
          value={value ?? ""}
          onValueChange={onChange}
        >
          <SelectTrigger className="bg-card shadow-lg border-border text-xs h-9">
            <SelectValue placeholder={sector!.categorias.length > 1 ? "③ Subcategoría" : "② Subcategoría"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {(categoria ?? sector!.categorias[0]).subcategorias.map((sc) => (
              <SelectItem key={sc.id} value={sc.id} className="text-xs">
                {sc.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Current selection badge */}
      {selectedLabel && (
        <div className="bg-primary/10 text-primary rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          {selectedLabel}
        </div>
      )}
    </div>
  );
}
