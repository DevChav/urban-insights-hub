import { motion } from "framer-motion";
import { MapPin, TrendingUp, Star, Users, Car, Briefcase, Swords, UsersRound, Home, Activity, Network, Route, Bookmark, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { AnalysisData } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

const cv = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

const COLORS = [
  "hsl(214 100% 40%)",
  "hsl(214 70% 55%)",
  "hsl(214 50% 65%)",
  "hsl(214 30% 75%)",
  "hsl(170 60% 45%)",
  "hsl(30 80% 55%)",
];

export default function AnalysisPanel({ data, onSave }: { data: AnalysisData; onSave?: () => void }) {
  const nivelColor =
    data.nivelActividad === "Alto"
      ? "text-green-600 bg-green-50"
      : data.nivelActividad === "Medio"
      ? "text-yellow-600 bg-yellow-50"
      : "text-red-500 bg-red-50";

  return (
    <div className="flex flex-col h-full">
      {/* Score header */}
      <motion.div custom={0} variants={cv} initial="hidden" animate="visible"
        className="border-b border-border p-5 bg-card">
        <div className="flex items-center justify-between mb-1">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Puntuación de la zona</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${nivelColor}`}>
            {data.nivelActividad}
          </span>
        </div>
        <p className="font-headline text-5xl font-bold text-primary">
          {data.puntuacion}<span className="text-lg text-muted-foreground font-body font-normal">/10</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Briefcase className="h-3.5 w-3.5 text-primary" />
          <p className="font-body text-xs text-primary font-medium">{data.subcategoriaLabel}</p>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-0.5">
          {data.lat.toFixed(4)}, {data.lng.toFixed(4)}
        </p>
        {onSave && (
          <Button size="sm" variant="outline" className="mt-3 w-full gap-2" onClick={onSave}>
            <Bookmark className="h-3.5 w-3.5" /> Guardar zona en mi historial
          </Button>
        )}
      </motion.div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {data.desgloseScore && (
          <motion.div custom={0.2} variants={cv} initial="hidden" animate="visible"
            className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">¿Por qué esta calificación?</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Flujo", value: data.desgloseScore.flujo, Icon: Users },
                { label: "Competencia", value: data.desgloseScore.competencia, Icon: Swords },
                { label: "Densidad", value: data.desgloseScore.densidad, Icon: Network },
                { label: "Accesibilidad", value: data.desgloseScore.accesibilidad, Icon: Route },
              ].map((v) => (
                <div key={v.label} className="grid grid-cols-[90px_1fr_38px] items-center gap-2">
                  <span className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                    <v.Icon className="h-3 w-3" /> {v.label}
                  </span>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(v.value / 10) * 100}%` }} />
                  </div>
                  <span className="font-headline text-xs font-bold text-foreground tabular-nums text-right">{v.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-md bg-primary/5 p-2.5">
              <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="font-body text-[11px] text-foreground leading-relaxed">{data.desgloseScore.explicacion}</p>
            </div>
          </motion.div>
        )}
        {/* Costo de renta estimado */}
        {data.renta && (
          <motion.div custom={0.5} variants={cv} initial="hidden" animate="visible"
            className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-body text-[11px] uppercase tracking-wider text-primary font-medium">Costo estimado de renta</p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    {data.renta.nivel}
                  </span>
                </div>
                <p className="font-headline text-2xl font-bold text-foreground tabular-nums">
                  ${data.renta.min.toLocaleString("es-MX")} – ${data.renta.max.toLocaleString("es-MX")}
                  <span className="text-xs text-muted-foreground font-body font-normal ml-1">MXN/mes</span>
                </p>
                <p className="font-body text-[11px] text-muted-foreground mt-1 truncate">
                  Zona comercial: <span className="font-medium text-foreground">{data.renta.zonaComercial}</span>
                </p>
                <p className="font-body text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {data.renta.descripcion}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Key metrics */}
        <motion.div custom={1} variants={cv} initial="hidden" animate="visible"
          className="grid grid-cols-2 gap-3">
          {[
            { label: "Negocios cercanos", value: data.totalNegocios, Icon: TrendingUp },
            { label: "Competidores directos", value: data.competidoresDirectos, Icon: Swords },
            { label: "Peatones / día", value: data.promedioPeatones.toLocaleString(), Icon: Users },
            { label: "Vehículos / día", value: data.flujoVehicular.toLocaleString(), Icon: Car },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-background p-4 flex items-center gap-3">
              <c.Icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-headline text-xl font-bold text-foreground">{c.value}</p>
                <p className="font-body text-xs text-muted-foreground">{c.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Business-specific analysis */}
        <motion.div custom={2} variants={cv} initial="hidden" animate="visible"
          className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-xs text-primary font-medium uppercase tracking-wider mb-1">
                Análisis para {data.subcategoriaLabel}
              </p>
              <p className="font-body text-sm text-foreground leading-relaxed">{data.analisisNegocio}</p>
            </div>
          </div>
        </motion.div>

        {/* Distribution chart */}
        {data.distribucion.length > 0 && (
          <motion.div custom={3} variants={cv} initial="hidden" animate="visible"
            className="rounded-lg border border-border bg-background p-4">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-3">Distribución de negocios</p>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={data.distribucion} barSize={28}>
                <XAxis dataKey="nombre" tick={{ fontSize: 9, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }}
                  cursor={{ fill: "hsl(210 25% 96%)" }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {data.distribucion.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Weekly flow chart */}
        <motion.div custom={4} variants={cv} initial="hidden" animate="visible"
          className="rounded-lg border border-border bg-background p-4">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-3">Flujo semanal estimado</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={data.flujoSemanal} barSize={14}>
              <XAxis dataKey="dia" tick={{ fontSize: 9, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }}
                cursor={{ fill: "hsl(210 25% 96%)" }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === "vehiculos" ? "Vehículos" : "Peatones",
                ]}
              />
              <Bar dataKey="vehiculos" fill="hsl(214 100% 40%)" radius={[3, 3, 0, 0]} name="vehiculos" />
              <Bar dataKey="peatones" fill="hsl(214 50% 65%)" radius={[3, 3, 0, 0]} name="peatones" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Vehículos
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(214 50% 65%)" }} /> Peatones
            </span>
          </div>
        </motion.div>

        {/* Demografía de la zona */}
        {data.demografia && (
          <motion.div custom={4.5} variants={cv} initial="hidden" animate="visible"
            className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <UsersRound className="h-4 w-4 text-primary" />
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Demografía de la zona</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="font-headline text-xl font-bold text-foreground">{data.demografia.poblacionTotal.toLocaleString("es-MX")}</p>
                <p className="font-body text-[11px] text-muted-foreground">Habitantes</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="font-headline text-xl font-bold text-foreground">${data.demografia.ingresoPromedioMensual.toLocaleString("es-MX")}</p>
                <p className="font-body text-[11px] text-muted-foreground">Ingreso prom. / mes</p>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-[11px] font-body text-muted-foreground mb-1">
                <span>Hombres {Math.round((data.demografia.porGenero.hombres / data.demografia.poblacionTotal) * 100)}%</span>
                <span>Mujeres {Math.round((data.demografia.porGenero.mujeres / data.demografia.poblacionTotal) * 100)}%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                <div style={{ width: `${(data.demografia.porGenero.hombres / data.demografia.poblacionTotal) * 100}%`, background: "hsl(214 100% 40%)" }} />
                <div style={{ width: `${(data.demografia.porGenero.mujeres / data.demografia.poblacionTotal) * 100}%`, background: "hsl(330 70% 60%)" }} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={data.demografia.porEdad} barSize={26}>
                <XAxis dataKey="rango" tick={{ fontSize: 10, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }} cursor={{ fill: "hsl(210 25% 96%)" }}
                  formatter={(v: number) => [v.toLocaleString("es-MX"), "Personas"]} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} fill="hsl(214 70% 55%)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recommendation */}
        <motion.div custom={5} variants={cv} initial="hidden" animate="visible"
          className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-xs text-primary font-medium uppercase tracking-wider mb-1">Recomendación</p>
              <p className="font-body text-sm text-foreground leading-relaxed">{data.recomendacion}</p>
            </div>
          </div>
        </motion.div>

        {/* Nearby businesses */}
        <motion.div custom={6} variants={cv} initial="hidden" animate="visible"
          className="rounded-lg border border-border bg-background p-4">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-3">Negocios cercanos</p>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {data.negocios.map((n, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{n.nombre}</p>
                  <p className="font-body text-xs text-muted-foreground">{n.tipo}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
