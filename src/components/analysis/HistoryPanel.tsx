import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Star, Trash2, X } from "lucide-react";
import type { AnalysisData } from "@/lib/mockData";

export interface HistoryEntry {
  id: string;
  data: AnalysisData;
  timestamp: number;
}

interface Props {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  return `Hace ${Math.floor(diff / 3600)} h`;
}

const nivelColor = (nivel: string) =>
  nivel === "Alto" ? "text-green-600 bg-green-50" :
  nivel === "Medio" ? "text-yellow-600 bg-yellow-50" :
  "text-red-500 bg-red-50";

export default function HistoryPanel({ entries, onSelect, onRemove, onClear, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      <div className="border-b border-border p-4 bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <p className="font-headline text-sm font-bold text-foreground">Historial de análisis</p>
        </div>
        <div className="flex items-center gap-1">
          {entries.length > 0 && (
            <button onClick={onClear} className="font-body text-[10px] text-destructive hover:underline px-2 py-1">
              Limpiar
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="font-body text-sm text-muted-foreground">Sin análisis previos</p>
            <p className="font-body text-xs text-muted-foreground/70">Los análisis que realices aparecerán aquí</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.button
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => onSelect(entry)}
                className="w-full text-left px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-3 w-3 text-primary shrink-0" />
                      <span className="font-headline text-lg font-bold text-primary">{entry.data.puntuacion}</span>
                      <span className="font-body text-[10px] text-muted-foreground">/10</span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${nivelColor(entry.data.nivelActividad)}`}>
                        {entry.data.nivelActividad}
                      </span>
                    </div>
                    <p className="font-body text-xs text-foreground truncate">{entry.data.subcategoriaLabel}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="font-body text-[10px] text-muted-foreground">
                        {entry.data.lat.toFixed(4)}, {entry.data.lng.toFixed(4)}
                      </span>
                    </div>
                    <p className="font-body text-[10px] text-muted-foreground/60 mt-0.5">{timeAgo(entry.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
