import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Sparkles, Loader2, CheckCircle2, ArrowRight, ArrowLeft, DollarSign, ListChecks, User, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BusinessSelector from "@/components/BusinessSelector";
import { SECTORES } from "@/lib/businessCategories";
import { generarConsultoria } from "@/lib/consultoriaIA";
import type { ConsultoriaResult, TamanoEmpresa } from "@/lib/auth";
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

  const [step, setStep] = useState<1 | 2>(1);
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
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<ConsultoriaResult | null>(empresa?.consultoria ?? null);

  const ctx = useMemo(() => (subcatId ? findContext(subcatId) : null), [subcatId]);
  const presupuesto = useMemo(() => PRESUPUESTOS.find((p) => p.id === presupuestoId)!, [presupuestoId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const canContinue =
    duenoNombre.trim().length >= 2 &&
    nombre.trim().length >= 2 &&
    !!subcatId &&
    !!tamano &&
    !!presupuesto;

  const handleAnalizar = async () => {
    if (!subcatId || idea.trim().length < 15) {
      toast({ title: "Describe tu idea", description: "Escribe al menos 15 caracteres sobre tu concepto.", variant: "destructive" });
      return;
    }
    setAnalizando(true);
    setResultado(null);
    try {
      const r = await generarConsultoria(subcatId, idea, { tamano, presupuestoMin: presupuesto.min, presupuestoMax: presupuesto.max });
      setResultado(r);
    } finally {
      setAnalizando(false);
    }
  };

  const handleFinalizar = () => {
    if (!ctx || !subcatId) return;
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
      consultoria: resultado ?? undefined,
      createdAt: empresa?.createdAt ?? new Date().toISOString(),
    });
    toast({ title: "Empresa registrada", description: "Tu perfil de negocio está listo." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-headline text-sm font-bold transition-colors ${
                  step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {n}
              </div>
              <span className={`font-body text-sm ${step >= n ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {n === 1 ? "Datos de la empresa" : "Consultor IA"}
              </span>
              {n === 1 && <div className={`flex-1 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"} transition-colors`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl font-bold text-foreground">Registra tu empresa</h1>
                  <p className="font-body text-sm text-muted-foreground">Cuéntanos sobre tu negocio para personalizar el análisis.</p>
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
                  <p className="font-body text-xs text-muted-foreground mb-2">La IA usará esta descripción para personalizar las recomendaciones.</p>
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
                <Button onClick={() => setStep(2)} disabled={!canContinue}>
                  Continuar <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl font-bold text-foreground">Consultor de negocios IA</h1>
                  <p className="font-body text-sm text-muted-foreground">Analiza tu idea con base en tu tamaño y presupuesto.</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4 text-sm font-body text-muted-foreground">
                <span className="text-foreground font-medium">{nombre}</span> · {tamano === "micro" ? "Micro" : tamano === "pequena" ? "Pequeña" : "Mediana"} empresa · Presupuesto {presupuesto.label}
              </div>

              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe tu idea de negocio con más detalle..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="font-body text-xs text-muted-foreground">{idea.length}/1000 caracteres</p>
                <Button onClick={handleAnalizar} disabled={analizando || idea.trim().length < 15} variant="outline" size="sm">
                  {analizando ? (
                    <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Analizando...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1.5" /> Analizar con IA</>
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {analizando && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
                  >
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
                    <p className="font-headline text-sm font-medium text-foreground">Procesando tu idea de negocio...</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">Calculando inversión y requisitos críticos</p>
                  </motion.div>
                )}

                {resultado && !analizando && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-body text-xs uppercase tracking-wider text-primary font-medium mb-1">Análisis IA</p>
                          <p className="font-body text-sm text-foreground leading-relaxed">{resultado.resumen}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground font-medium">Estimación de inversión</p>
                      </div>
                      <p className="font-headline text-2xl font-bold text-foreground mb-3">
                        ${resultado.inversionMin.toLocaleString("es-MX")} – ${resultado.inversionMax.toLocaleString("es-MX")}
                        <span className="text-sm text-muted-foreground font-body font-normal ml-1">MXN</span>
                      </p>
                      <div className="space-y-2">
                        {resultado.desglose.map((d) => (
                          <div key={d.concepto} className="flex justify-between items-center text-sm font-body py-1 border-b border-border last:border-0">
                            <span className="text-muted-foreground">{d.concepto}</span>
                            <span className="text-foreground font-medium">${d.monto.toLocaleString("es-MX")}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ListChecks className="h-4 w-4 text-primary" />
                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground font-medium">Elementos críticos</p>
                      </div>
                      <div className="space-y-3">
                        {resultado.criticos.map((c) => (
                          <div key={c.item} className="flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-body text-sm font-medium text-foreground">{c.item}</p>
                              <p className="font-body text-xs text-muted-foreground">{c.descripcion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button onClick={handleFinalizar}>
                  Finalizar registro <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
