import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Sparkles, Loader2, CheckCircle2, ArrowRight, ArrowLeft, DollarSign, ListChecks } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import BusinessSelector from "@/components/BusinessSelector";
import { SECTORES } from "@/lib/businessCategories";
import { generarConsultoria } from "@/lib/consultoriaIA";
import type { ConsultoriaResult } from "@/lib/auth";
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

export default function RegistroEmpresaPage() {
  const { user, empresa, saveEmpresa, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [nombre, setNombre] = useState(empresa?.nombre ?? "");
  const [subcatId, setSubcatId] = useState<string | null>(empresa?.subcatId ?? null);
  const [idea, setIdea] = useState(empresa?.ideaNegocio ?? "");
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<ConsultoriaResult | null>(empresa?.consultoria ?? null);

  const ctx = useMemo(() => (subcatId ? findContext(subcatId) : null), [subcatId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const canContinue = nombre.trim().length >= 2 && subcatId;

  const handleAnalizar = async () => {
    if (!subcatId || idea.trim().length < 15) {
      toast({ title: "Describe tu idea", description: "Escribe al menos 15 caracteres sobre tu concepto.", variant: "destructive" });
      return;
    }
    setAnalizando(true);
    setResultado(null);
    try {
      const r = await generarConsultoria(subcatId, idea);
      setResultado(r);
    } finally {
      setAnalizando(false);
    }
  };

  const handleFinalizar = () => {
    if (!ctx || !subcatId) return;
    saveEmpresa({
      nombre: nombre.trim(),
      sectorId: ctx.sectorId,
      categoriaId: ctx.categoriaId,
      subcatId,
      scian: ctx.scian,
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
                <div>
                  <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Nombre de la empresa</label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Tacos La Cachanilla" maxLength={80} />
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
                  <p className="font-body text-sm text-muted-foreground">Describe tu idea y recibe una estimación inicial.</p>
                </div>
              </div>

              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ej. Quiero abrir una taquería estilo norteño con servicio rápido enfocada a oficinistas, abierta de 7am a 5pm..."
                rows={5}
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
                    {/* Resumen */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-body text-xs uppercase tracking-wider text-primary font-medium mb-1">Análisis IA</p>
                          <p className="font-body text-sm text-foreground leading-relaxed">{resultado.resumen}</p>
                        </div>
                      </div>
                    </div>

                    {/* Inversión */}
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

                    {/* Críticos */}
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
