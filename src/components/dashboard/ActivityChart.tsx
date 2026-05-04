import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PulseActividadHora } from "@/lib/marketPulse";

interface Props {
  data: PulseActividadHora[];
}

export default function ActivityChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.flujo, 0);
  const pico = data.reduce((a, b) => (b.flujo > a.flujo ? b : a));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-headline">Actividad económica · 24h</CardTitle>
          </div>
          <div className="text-right">
            <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Pico</p>
            <p className="font-headline text-sm font-bold text-primary">{pico.hora}:00 hrs</p>
          </div>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Índice agregado de tráfico comercial en Mexicali · {total.toLocaleString("es-MX")} pts acumulados
        </p>
      </CardHeader>
      <CardContent>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(214 100% 40%)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(214 100% 40%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 14% 92%)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fontSize: 10, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(216 20% 50%)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(216 14% 89%)", fontSize: 12 }}
                formatter={(v: number) => [`${v} pts`, "Flujo"]}
                labelFormatter={(l) => `${l}:00 hrs`}
              />
              <Area type="monotone" dataKey="flujo" stroke="hsl(214 100% 40%)" strokeWidth={2} fill="url(#pulseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}
