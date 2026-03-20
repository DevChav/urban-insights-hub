import { motion } from "framer-motion";
import { viabilityColorSolid } from "@/lib/heatmapData";

const GRADIENT_STEPS = 48;

function buildGradient() {
  const stops: string[] = [];
  for (let i = 0; i <= GRADIENT_STEPS; i++) {
    const t = i / GRADIENT_STEPS;
    stops.push(`${viabilityColorSolid(t)} ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

const gradient = buildGradient();

const labels = [
  { value: 0, text: "No recomendable" },
  { value: 0.33, text: "Riesgo" },
  { value: 0.6, text: "Media" },
  { value: 1, text: "Alta oportunidad" },
];

export default function HeatmapLegend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-6 left-4 z-[1000] bg-card/92 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-xl max-w-[260px]"
    >
      <p className="font-headline text-[11px] font-semibold text-foreground mb-2">
        Viabilidad de zona
      </p>

      {/* Continuous gradient bar */}
      <div
        className="h-2.5 w-full rounded-full"
        style={{ background: gradient }}
      />

      {/* Labels under gradient */}
      <div className="flex justify-between mt-1.5">
        {labels.map((l) => (
          <span
            key={l.text}
            className="font-body text-[9px] text-muted-foreground leading-tight"
          >
            {l.text}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
