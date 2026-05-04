import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PulseMision } from "@/lib/marketPulse";

interface Props {
  misiones: PulseMision[];
}

export default function MissionsPanel({ misiones }: Props) {
  const navigate = useNavigate();
  const ir = (m: PulseMision) => {
    const params = new URLSearchParams({
      lat: m.lat.toFixed(6),
      lng: m.lng.toFixed(6),
      radius: "1000",
    });
    navigate(`/mapa?${params.toString()}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-headline">Misiones de emprendimiento</CardTitle>
        </div>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Zonas desatendidas en Mexicali que necesitan tu tipo de negocio.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {misiones.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="rounded-lg border border-border p-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary font-headline font-bold text-xs flex items-center justify-center shrink-0">
                  {m.potencial}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-body text-sm font-semibold text-foreground truncate">{m.titulo}</p>
                    <Badge variant="outline" className="font-body text-[10px]">Zona {m.zona}</Badge>
                  </div>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{m.descripcion}</p>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary" onClick={() => ir(m)}>
                    Validar zona <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
