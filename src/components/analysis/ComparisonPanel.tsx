import { motion } from "framer-motion";
import { MapPin, TrendingUp, Swords, Users, Car, Star, X } from "lucide-react";
import type { AnalysisData } from "@/lib/mockData";

interface Props {
  dataA: AnalysisData;
  dataB: AnalysisData;
  onClose: () => void;
}

function MetricRow({ label, a, b, icon: Icon }: { label: string; a: string | number; b: string | number; icon: React.ElementType }) {
  const numA = typeof a === "number" ? a : parseFloat(a);
  const numB = typeof b === "number" ? b : parseFloat(b);
  const better = numA > numB ? "A" : numA < numB ? "B" : null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className={`text-right font-headline text-sm font-bold ${better === "A" ? "text-green-600" : "text-foreground"}`}>
        {typeof a === "number" ? a.toLocaleString() : a}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-body text-[9px] text-muted-foreground text-center leading-tight">{label}</span>
      </div>
      <div className={`text-left font-headline text-sm font-bold ${better === "B" ? "text-green-600" : "text-foreground"}`}>
        {typeof b === "number" ? b.toLocaleString() : b}
      </div>
    </div>
  );
}

export default function ComparisonPanel({ dataA, dataB, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="border-b border-border p-4 bg-card flex items-center justify-between">
        <div>
          <p className="font-headline text-sm font-bold text-foreground">Comparación de zonas</p>
          <p className="font-body text-[10px] text-muted-foreground">Los valores en verde indican la mejor opción</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Location labels */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-2.5 py-1">
            <MapPin className="h-3 w-3" />
            <span className="font-body text-[10px] font-medium">Ubicación A</span>
          </div>
          <p className="font-body text-[9px] text-muted-foreground mt-1">
            {dataA.lat.toFixed(4)}, {dataA.lng.toFixed(4)}
          </p>
        </div>
        <span className="font-headline text-xs font-bold text-muted-foreground">VS</span>
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-2.5 py-1">
            <MapPin className="h-3 w-3" />
            <span className="font-body text-[10px] font-medium">Ubicación B</span>
          </div>
          <p className="font-body text-[9px] text-muted-foreground mt-1">
            {dataB.lat.toFixed(4)}, {dataB.lng.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 border-b border-border">
        <div className="text-center">
          <p className={`font-headline text-4xl font-bold ${dataA.puntuacion >= dataB.puntuacion ? "text-green-600" : "text-foreground"}`}>
            {dataA.puntuacion}
          </p>
          <p className="font-body text-[10px] text-muted-foreground">/10</p>
        </div>
        <div className="flex flex-col items-center">
          <Star className="h-4 w-4 text-primary" />
          <span className="font-body text-[9px] text-muted-foreground">Puntuación</span>
        </div>
        <div className="text-center">
          <p className={`font-headline text-4xl font-bold ${dataB.puntuacion >= dataA.puntuacion ? "text-green-600" : "text-foreground"}`}>
            {dataB.puntuacion}
          </p>
          <p className="font-body text-[10px] text-muted-foreground">/10</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <MetricRow label="Negocios" a={dataA.totalNegocios} b={dataB.totalNegocios} icon={TrendingUp} />
        <MetricRow label="Competidores" a={dataA.competidoresDirectos} b={dataB.competidoresDirectos} icon={Swords} />
        <MetricRow label="Peatones/día" a={dataA.promedioPeatones} b={dataB.promedioPeatones} icon={Users} />
        <MetricRow label="Vehículos/día" a={dataA.flujoVehicular} b={dataB.flujoVehicular} icon={Car} />

        {/* Recommendations */}
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="font-body text-[10px] text-primary font-medium uppercase tracking-wider mb-1">Ubicación A</p>
            <p className="font-body text-xs text-foreground leading-relaxed">{dataA.recomendacion}</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="font-body text-[10px] text-destructive font-medium uppercase tracking-wider mb-1">Ubicación B</p>
            <p className="font-body text-xs text-foreground leading-relaxed">{dataB.recomendacion}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
