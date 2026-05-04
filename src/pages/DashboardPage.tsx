import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Wallet, Building2, TrendingUp, MapPin, ArrowRight,
  Trophy, BarChart3, Briefcase, CheckCircle2, AlertTriangle, Compass, Bookmark, Trash2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEstadisticasCiudad, buildPresupuesto, scianDeSubcat } from "@/lib/cityStats";
import { getLastZone, getSavedZones, removeSavedZone } from "@/lib/zoneStorage";
import { getMarketPulse } from "@/lib/marketPulse";
import PulseFeed from "@/components/dashboard/PulseFeed";
import ActivityChart from "@/components/dashboard/ActivityChart";
import MissionsPanel from "@/components/dashboard/MissionsPanel";
import { useState } from "react";

const ZONA_COLORS: Record<string, string> = {
  Centro:   "hsl(214 100% 40%)",
  Norte:    "hsl(190 75% 45%)",
  Sur:      "hsl(30 85% 55%)",
  Oriente:  "hsl(280 60% 55%)",
  Poniente: "hsl(150 55% 45%)",
};

const fade = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function DashboardPage() {
  const { user, empresa, loading } = useAuth();

  const scian = useMemo(() => scianDeSubcat(empresa?.subcatId), [empresa?.subcatId]);
  const estadisticas = useMemo(() => getEstadisticasCiudad(scian), [scian]);
  const presupuesto = useMemo(
    () => (empresa?.consultoria ? buildPresupuesto(empresa.consultoria) : null),
    [empresa?.consultoria],
  );
  const lastZone = useMemo(() => getLastZone(), []);
  const pulse = useMemo(() => getMarketPulse(scian), [scian]);
  const [savedZones, setSavedZones] = useState(() => getSavedZones());

  // Sentinel: detecta competidores nuevos cerca de la última zona analizada
  const alertas = useMemo(() => {
    if (!lastZone) return [];
    const items: { tipo: "competencia" | "oportunidad"; texto: string }[] = [];
    if (lastZone.competidoresDirectos > 5) {
      items.push({ tipo: "competencia", texto: `Se detectaron ${lastZone.competidoresDirectos} competidores directos en un radio de ${lastZone.radio}m de tu última zona analizada.` });
    }
    if (lastZone.totalNegocios > 30 && lastZone.competidoresDirectos <= 2) {
      items.push({ tipo: "oportunidad", texto: `Zona con alto movimiento comercial (${lastZone.totalNegocios} negocios) y muy poca competencia directa: oportunidad clara.` });
    }
    if (lastZone.desgloseScore && lastZone.desgloseScore.flujo < 4) {
      items.push({ tipo: "competencia", texto: "El flujo peatonal estimado en tu zona está por debajo del promedio: revisa horarios y estrategia de delivery." });
    }
    if (!items.length) {
      items.push({ tipo: "oportunidad", texto: "Sin alertas relevantes en este momento. Tu última zona analizada se mantiene estable." });
    }
    return items;
  }, [lastZone]);

  // Predictor: sugiere la "siguiente mejor zona" basada en distribución por zona del DENUE
  const siguienteZona = useMemo(() => {
    if (!estadisticas) return null;
    const ordenadas = [...estadisticas.porZona].sort((a, b) => a.cantidad - b.cantidad);
    const sugerida = ordenadas[0];
    const lider = [...estadisticas.porZona].sort((a, b) => b.cantidad - a.cantidad)[0];
    return {
      zona: sugerida.zona,
      competidores: sugerida.cantidad,
      lider: lider.zona,
      lideres: lider.cantidad,
    };
  }, [estadisticas]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!empresa) return <Navigate to="/registro-empresa" replace />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div custom={0} variants={fade} initial="hidden" animate="visible"
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-body text-xs uppercase tracking-wider text-primary font-medium mb-1">Centro de Inteligencia</p>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
              {empresa.nombre}
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              {estadisticas?.scianNombre ?? "Empresa registrada"}
              {scian && <span className="font-mono text-xs text-muted-foreground/70">SCIAN {scian}</span>}
            </p>
          </div>
          <Link to="/mapa">
            <Button size="lg" className="gap-2">
              <MapPin className="h-4 w-4" />
              Validar una ubicación
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Última zona analizada */}
        {lastZone && (
          <motion.div custom={1} variants={fade} initial="hidden" animate="visible">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[11px] uppercase tracking-wider text-primary font-medium">Última zona validada · {lastZone.zona}</p>
                    <p className="font-headline text-lg font-bold text-foreground truncate">
                      {lastZone.demografia.poblacionTotal.toLocaleString("es-MX")} hab. · Puntuación {lastZone.puntuacion}/10
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {lastZone.competidoresDirectos} competidores · {lastZone.totalNegocios} negocios totales · radio {lastZone.radio >= 1000 ? `${lastZone.radio / 1000}km` : `${lastZone.radio}m`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-center">
                  <div className="px-3">
                    <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">H</p>
                    <p className="font-headline text-base font-bold text-primary">{Math.round((lastZone.demografia.porGenero.hombres / lastZone.demografia.poblacionTotal) * 100)}%</p>
                  </div>
                  <div className="px-3">
                    <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">M</p>
                    <p className="font-headline text-base font-bold text-primary">{Math.round((lastZone.demografia.porGenero.mujeres / lastZone.demografia.poblacionTotal) * 100)}%</p>
                  </div>
                </div>
                <Link to="/mapa">
                  <Button variant="outline" size="sm">Ver detalle</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recomendación IA */}
          <motion.div custom={2} variants={fade} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card className="h-full border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Recomendación IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {empresa.consultoria ? (
                  <p className="font-body text-sm text-foreground leading-relaxed">{empresa.consultoria.resumen}</p>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">
                    Aún no has generado un análisis IA para tu empresa. Vuelve al registro para obtener una estimación personalizada.
                  </p>
                )}
                {empresa.consultoria && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider">Inversión mín.</p>
                      <p className="font-headline text-xl font-bold text-foreground">${empresa.consultoria.inversionMin.toLocaleString("es-MX")}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider">Inversión máx.</p>
                      <p className="font-headline text-xl font-bold text-foreground">${empresa.consultoria.inversionMax.toLocaleString("es-MX")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Saturación / actividad sectorial */}
          <motion.div custom={3} variants={fade} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Saturación del sector</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {estadisticas ? (
                  <>
                    <p className="font-headline text-4xl font-bold text-primary mb-1">
                      {estadisticas.totalEnCiudad}
                    </p>
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      empresas registradas en Mexicali (DENUE)
                    </p>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-xs text-muted-foreground">Saturación</span>
                      <span className="font-body text-xs font-semibold text-foreground">{estadisticas.saturacionPromedio}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${estadisticas.saturacionPromedio}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">No hay datos para tu giro.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Presupuesto detallado */}
        {presupuesto && (
          <motion.div custom={4} variants={fade} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Desglose del presupuesto</CardTitle>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Inversión estimada: <span className="font-semibold text-foreground">${presupuesto.total.min.toLocaleString("es-MX")} – ${presupuesto.total.max.toLocaleString("es-MX")} MXN</span>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {presupuesto.rubros.map((r) => {
                    const pctMax = Math.max(...presupuesto.rubros.map((x) => x.monto));
                    const pct = (r.monto / pctMax) * 100;
                    return (
                      <div key={r.concepto} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 py-1.5 border-b border-border last:border-0">
                        <Badge variant="secondary" className="justify-self-start font-body">{r.concepto}</Badge>
                        <div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="font-body text-[11px] text-muted-foreground mt-1 truncate">{r.detalle}</p>
                        </div>
                        <p className="font-headline text-sm font-bold text-foreground tabular-nums">
                          ${r.monto.toLocaleString("es-MX")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Estadísticas Mexicali */}
        {estadisticas && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por zona */}
            <motion.div custom={5} variants={fade} initial="hidden" animate="visible">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-headline">Distribución por zona</CardTitle>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Cantidad de negocios del giro en cada zona de Mexicali
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={estadisticas.porZona} barSize={42}>
                      <XAxis dataKey="zona" tick={{ fontSize: 11, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }}
                        cursor={{ fill: "hsl(210 25% 96%)" }}
                        formatter={(v: number) => [v, "Negocios"]}
                      />
                      <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                        {estadisticas.porZona.map((z) => (
                          <Cell key={z.zona} fill={ZONA_COLORS[z.zona] ?? "hsl(214 100% 40%)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top competidores */}
            <motion.div custom={6} variants={fade} initial="hidden" animate="visible">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-headline">Empresas más importantes</CardTitle>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Competencia líder del sector en Mexicali
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {estadisticas.topCompetidores.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-headline font-bold text-sm flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-foreground truncate">{c.nombre_establecimiento}</p>
                          <p className="font-body text-[11px] text-muted-foreground truncate">
                            {c.colonia} · Zona {c.zona} · {c.empleados} empleados
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">{c.scian}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Checklist de apertura */}
        {empresa.consultoria?.criticos && (
          <motion.div custom={7} variants={fade} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Checklist de apertura</CardTitle>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Pasos legales y operativos clave antes de abrir tu negocio en Mexicali.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {empresa.consultoria.criticos.map((c) => (
                    <li key={c.item} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{c.item}</p>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">{c.descripcion}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Sección Gestión de Negocio: Sentinel + Predictor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={8} variants={fade} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Sentinel · Alertas</CardTitle>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">Monitoreo de competencia y movimientos en tu zona.</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {alertas.map((a, i) => (
                    <li key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${a.tipo === "competencia" ? "border-orange-300/50 bg-orange-50/50" : "border-primary/30 bg-primary/5"}`}>
                      {a.tipo === "competencia"
                        ? <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        : <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />}
                      <p className="font-body text-sm text-foreground leading-relaxed">{a.texto}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={9} variants={fade} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Compass className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Predictor de expansión</CardTitle>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">Sugerencia para abrir una sucursal.</p>
              </CardHeader>
              <CardContent>
                {siguienteZona ? (
                  <>
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Siguiente mejor zona</p>
                    <p className="font-headline text-3xl font-bold text-primary">Zona {siguienteZona.zona}</p>
                    <p className="font-body text-sm text-foreground mt-2 leading-relaxed">
                      Solo <span className="font-semibold">{siguienteZona.competidores}</span> negocios de tu giro operan aquí, frente a <span className="font-semibold">{siguienteZona.lideres}</span> en la zona {siguienteZona.lider} (saturada). Es la zona con mayor potencial de captura de mercado para una sucursal.
                    </p>
                    <Link to="/mapa">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        Validar en el mapa <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">Aún no hay datos suficientes para sugerir una zona.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Zonas guardadas */}
        {savedZones.length > 0 && (
          <motion.div custom={10} variants={fade} initial="hidden" animate="visible">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bookmark className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-headline">Mis zonas guardadas</CardTitle>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">Historial de ubicaciones validadas en el mapa.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedZones.map((z) => (
                    <div key={z.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-headline text-sm font-bold text-primary">{z.puntuacion}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-foreground truncate">
                          {z.renta?.zonaComercial ?? `Zona ${z.zona}`}
                        </p>
                        <p className="font-body text-[11px] text-muted-foreground truncate">
                          {z.competidoresDirectos} competidores · ${z.renta?.promedio?.toLocaleString("es-MX") ?? "—"} MXN/mes · {new Date(z.savedAt).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <button
                        onClick={() => { removeSavedZone(z.id); setSavedZones(getSavedZones()); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer info */}
        <motion.div custom={7} variants={fade} initial="hidden" animate="visible"
          className="text-center pt-4 pb-2">
          <p className="font-body text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Building2 className="h-3 w-3" />
            Datos simulados con estructura DENUE · Mexicali, B.C.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
