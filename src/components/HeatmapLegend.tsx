import { motion } from "framer-motion";

const items = [
  { color: "rgb(34,197,94)", label: "Alta viabilidad" },
  { color: "rgb(234,179,8)", label: "Media viabilidad" },
  { color: "rgb(249,115,22)", label: "Riesgo" },
  { color: "rgb(239,68,68)", label: "No recomendable" },
];

export default function HeatmapLegend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg"
    >
      <p className="font-headline text-[11px] font-semibold text-foreground mb-1.5 text-center">
        Calidad de zona
      </p>
      <div className="flex items-center gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-1.5">
            <span
              className="block w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: it.color }}
            />
            <span className="font-body text-[10px] text-muted-foreground whitespace-nowrap">
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
