import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, TrendingUp, AlertTriangle, Calendar, Package, MapPin, Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MarketPulse, PulseNoticia, PulseTipo } from "@/lib/marketPulse";

const TIPO_META: Record<PulseTipo, { icon: typeof Sparkles; label: string; color: string; ring: string }> = {
  oportunidad: { icon: Sparkles, label: "Oportunidad", color: "text-emerald-600", ring: "border-emerald-300/60 bg-emerald-50/60" },
  tendencia:   { icon: TrendingUp, label: "Tendencia", color: "text-primary", ring: "border-primary/30 bg-primary/5" },
  alerta:      { icon: AlertTriangle, label: "Alerta", color: "text-orange-600", ring: "border-orange-300/60 bg-orange-50/60" },
  evento:      { icon: Calendar, label: "Evento", color: "text-purple-600", ring: "border-purple-300/60 bg-purple-50/60" },
  insumo:      { icon: Package, label: "Insumo", color: "text-amber-600", ring: "border-amber-300/60 bg-amber-50/60" },
};

function timeAgo(ts: number): string {
  const diff = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diff < 60) return `hace ${diff} min`;
  const h = Math.floor(diff / 60);
  return `hace ${h} h`;
}

interface Props {
  pulse: MarketPulse;
}

export default function PulseFeed({ pulse }: Props) {
  const navigate = useNavigate();

  const ordenadas = useMemo(
    () => [...pulse.noticias].sort((a, b) => Number(b.relevante) - Number(a.relevante) || b.timestamp - a.timestamp),
    [pulse.noticias],
  );

  const verEnMapa = (n: PulseNoticia) => {
    const params = new URLSearchParams({
      lat: n.lat.toFixed(6),
      lng: n.lng.toFixed(6),
      radius: "500",
    });
    navigate(`/mapa?${params.toString()}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-headline">Pulso de Mexicali</CardTitle>
          </div>
          <Badge variant="outline" className="font-body text-[10px] gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En vivo
          </Badge>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Tendencias y eventos del mercado curados para tu giro.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[480px] pr-3">
          <ul className="space-y-3">
            <AnimatePresence initial>
              {ordenadas.map((n, i) => {
                const meta = TIPO_META[n.tipo];
                const Icon = meta.icon;
                return (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
                    className={`relative rounded-xl border p-4 ${meta.ring}`}
                  >
                    {n.relevante && (
                      <Badge className="absolute -top-2 right-3 font-body text-[10px] bg-primary text-primary-foreground">
                        Para tu giro
                      </Badge>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg bg-background flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-body text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="font-body text-[10px] text-muted-foreground">·</span>
                          <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" /> {n.zona}
                          </span>
                          <span className="font-body text-[10px] text-muted-foreground">·</span>
                          <span className="font-body text-[10px] text-muted-foreground">{timeAgo(n.timestamp)}</span>
                        </div>
                        <p className="font-headline text-sm font-bold text-foreground leading-snug">
                          {n.titulo}
                        </p>
                        <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
                          {n.descripcion}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          {n.delta !== 0 && (
                            <span className={`font-body text-[11px] font-semibold ${n.delta > 0 ? "text-emerald-600" : "text-orange-600"}`}>
                              {n.delta > 0 ? "▲" : "▼"} {Math.abs(n.delta)}%
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                            onClick={() => verEnMapa(n)}
                          >
                            <MapPin className="h-3 w-3" /> Ver en mapa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
