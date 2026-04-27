import { motion } from "framer-motion";
import { MapPin, TrendingUp, Star, Users, Car, Briefcase, Swords, UsersRound } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { AnalysisData } from "@/lib/mockData";

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

export default function AnalysisPanel({ data }: { data: AnalysisData }) {
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
      </motion.div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
