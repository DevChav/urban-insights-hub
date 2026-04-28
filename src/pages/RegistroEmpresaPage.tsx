import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Loader2, ArrowRight, DollarSign, User, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BusinessSelector from "@/components/BusinessSelector";
import { SECTORES } from "@/lib/businessCategories";
import { generarConsultoria } from "@/lib/consultoriaIA";
import type { TamanoEmpresa } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

function findContext(subcatId: string) {
  for (const sector of SECTORES) {
    for (const cat of sector.categorias) {
      const sub = cat.subcategorias.find((s) => s.id === subcatId);
      if (sub) return { sectorId: sector.id, categoriaId: cat.id, subcatNombre: sub.nombre, scian: sub.scian };
    }
  }
  return null;
}

const PRESUPUESTOS: { id: string; label: string; min: number; max: number }[] = [
  { id: "muy-bajo", label: "Menos de $100,000 MXN", min: 50_000, max: 100_000 },
  { id: "bajo", label: "$100,000 – $300,000 MXN", min: 100_000, max: 300_000 },
  { id: "medio", label: "$300,000 – $700,000 MXN", min: 300_000, max: 700_000 },
  { id: "alto", label: "$700,000 – $1,500,000 MXN", min: 700_000, max: 1_500_000 },
  { id: "muy-alto", label: "Más de $1,500,000 MXN", min: 1_500_000, max: 3_000_000 },
];

export default function RegistroEmpresaPage() {
  const { user, empresa, saveEmpresa, loading } = useAuth();
  const navigate = useNavigate();

  const [duenoNombre, setDuenoNombre] = useState(empresa?.duenoNombre ?? "");
  const [nombre, setNombre] = useState(empresa?.nombre ?? "");
  const [subcatId, setSubcatId] = useState<string | null>(empresa?.subcatId ?? null);
  const [tamano, setTamano] = useState<TamanoEmpresa>(empresa?.tamano ?? "micro");
  const [presupuestoId, setPresupuestoId] = useState<string>(() => {
    if (!empresa) return "bajo";
    const match = PRESUPUESTOS.find((p) => p.min === empresa.presupuestoMin && p.max === empresa.presupuestoMax);
    return match?.id ?? "bajo";
  });
  const [idea, setIdea] = useState(empresa?.ideaNegocio ?? "");
  const [guardando, setGuardando] = useState(false);

  const ctx = useMemo(() => (subcatId ? findContext(subcatId) : null), [subcatId]);
  const presupuesto = useMemo(() => PRESUPUESTOS.find((p) => p.id === presupuestoId)!, [presupuestoId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const canSubmit =
    duenoNombre.trim().length >= 2 &&
    nombre.trim().length >= 2 &&
    !!subcatId &&
    !!tamano &&
    !!presupuesto &&
    idea.trim().length >= 15;

  const handleFinalizar = async () => {
    if (!ctx || !subcatId || !canSubmit) {
      if (idea.trim().length < 15) {
        toast({ title: "Describe tu negocio", description: "Escribe al menos 15 caracteres para que la IA genere una recomendación.", variant: "destructive" });
      }
      return;
    }
    setGuardando(true);
    try {
      const consultoria = await generarConsultoria(subcatId, idea, {
        tamano,
        presupuestoMin: presupuesto.min,
        presupuestoMax: presupuesto.max,
      });
      saveEmpresa({
        nombre: nombre.trim(),
        duenoNombre: duenoNombre.trim(),
        sectorId: ctx.sectorId,
        categoriaId: ctx.categoriaId,
        subcatId,
        scian: ctx.scian,
        tamano,
        presupuestoMin: presupuesto.min,
        presupuestoMax: presupuesto.max,
        ideaNegocio: idea.trim() || undefined,
        consultoria,
        createdAt: empresa?.createdAt ?? new Date().toISOString(),
      });
      toast({ title: "Empresa registrada", description: "Tu perfil y análisis IA están listos." });
      navigate("/dashboard");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl shadow-sm p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-foreground">Registra tu empresa</h1>
              <p className="font-body text-sm text-muted-foreground">Cuéntanos sobre tu negocio para personalizar el análisis con IA.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Nombre del dueño
                </label>
                <Input
                  value={duenoNombre}
                  onChange={(e) => setDuenoNombre(e.target.value)}
                  placeholder="Ej. Alexander Pérez"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Nombre comercial
                </label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. GeoCafé"
                  maxLength={80}
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Tipo de empresa (SCIAN)</label>
              <p className="font-body text-xs text-muted-foreground mb-2">Selecciona Sector → Categoría → Subcategoría.</p>
              <BusinessSelector value={subcatId} onChange={setSubcatId} />
              {ctx?.scian && (
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Código SCIAN: <span className="font-mono text-foreground">{ctx.scian}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Tamaño de la empresa
                </label>
                <Select value={tamano} onValueChange={(v) => setTamano(v as TamanoEmpresa)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro (1–10 empleados)</SelectItem>
                    <SelectItem value="pequena">Pequeña (11–50 empleados)</SelectItem>
                    <SelectItem value="mediana">Mediana (51+ empleados)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" /> Presupuesto estimado
                </label>
                <Select value={presupuestoId} onValueChange={setPresupuestoId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESUPUESTOS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Descripción del negocio</label>
              <p className="font-body text-xs text-muted-foreground mb-2">La IA usará esta descripción para personalizar las recomendaciones de inversión y elementos críticos.</p>
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ej. Cafetería de especialidad enfocada a oficinistas de la zona Justo Sierra, con servicio rápido en barra y delivery..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
              <p className="font-body text-xs text-muted-foreground mt-1">{idea.length}/1000 caracteres</p>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={handleFinalizar} disabled={!canSubmit || guardando} size="lg">
              {guardando ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando análisis IA...</>
              ) : (
                <>Finalizar registro <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
