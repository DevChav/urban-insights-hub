import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const barData = [
  { zona: "Centro", negocios: 87 },
  { zona: "Río Nuevo", negocios: 64 },
  { zona: "Calexico", negocios: 52 },
  { zona: "Industrial", negocios: 41 },
  { zona: "Justo Sierra", negocios: 73 },
];

const pieData = [
  { name: "Restaurantes", value: 35, fill: "hsl(214 100% 40%)" },
  { name: "Tiendas", value: 25, fill: "hsl(214 70% 55%)" },
  { name: "Farmacias", value: 18, fill: "hsl(214 50% 65%)" },
  { name: "Bancos", value: 12, fill: "hsl(214 30% 75%)" },
  { name: "Otros", value: 10, fill: "hsl(216 14% 80%)" },
];

const stats = [
  { label: "Zonas analizadas", value: "1,240" },
  { label: "Negocios registrados", value: "8,530" },
  { label: "Puntuación promedio", value: "7.2 / 10" },
  { label: "Usuarios activos", value: "342" },
];

export default function EstadisticasPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Estadísticas generales</h1>
        <p className="font-body text-muted-foreground">Datos simulados de la actividad comercial en Mexicali.</p>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="font-headline text-2xl font-bold text-primary">{s.value}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-4">Negocios por zona</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={32}>
              <XAxis dataKey="zona" tick={{ fontSize: 11, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }} />
              <Bar dataKey="negocios" radius={[4, 4, 0, 0]} fill="hsl(214 100% 40%)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-4">Distribución por tipo</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {pieData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                {d.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
