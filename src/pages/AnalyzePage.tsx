import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Building2 } from "lucide-react";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import { TIPOS_NEGOCIO, type AnalysisData, type TipoNegocio } from "@/lib/mockData";
import { analyzeZone } from "@/lib/analyzeZone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AnalyzePage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tipoNegocio, setTipoNegocio] = useState<TipoNegocio | null>(null);

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!tipoNegocio) return;
      const { lat, lng } = e.latlng;
      const map = mapInstanceRef.current;
      if (!map) return;

      if (circleRef.current) map.removeLayer(circleRef.current);
      if (markersRef.current) map.removeLayer(markersRef.current);

      circleRef.current = L.circle([lat, lng], {
        radius: 500,
        color: "hsl(214 100% 40%)",
        fillColor: "hsl(214 100% 40%)",
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map);

      const group = L.layerGroup();
      const data = generateMockData(lat, lng, tipoNegocio);
      data.negocios.forEach((n) => {
        const icon = L.divIcon({
          className: "business-marker",
          html: `<div style="background:hsl(214 100% 40%);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.25)">${n.nombre.charAt(0)}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([n.lat, n.lng], { icon }).bindTooltip(n.nombre).addTo(group);
      });
      group.addTo(map);
      markersRef.current = group;

      setLoading(true);
      setAnalysis(null);

      setTimeout(() => {
        setAnalysis(data);
        setLoading(false);
      }, 700);
    },
    [tipoNegocio]
  );

  // Keep map click handler in sync with tipoNegocio
  const handleMapClickRef = useRef(handleMapClick);
  handleMapClickRef.current = handleMapClick;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [32.6245, -115.4523],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => handleMapClickRef.current(e));
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        {/* Business type selector overlay */}
        <div className="absolute top-4 left-4 z-[1000]">
          <Select
            value={tipoNegocio ?? ""}
            onValueChange={(v) => setTipoNegocio(v as TipoNegocio)}
          >
            <SelectTrigger className="w-[240px] bg-card shadow-lg border-border">
              <SelectValue placeholder="Selecciona tipo de negocio" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_NEGOCIO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence>
          {!tipoNegocio && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-5 py-3 shadow-lg"
            >
              <p className="font-body text-sm text-muted-foreground">
                Primero selecciona el tipo de negocio que deseas abrir
              </p>
            </motion.div>
          )}
          {tipoNegocio && !analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-5 py-3 shadow-lg"
            >
              <p className="font-body text-sm text-muted-foreground">
                Haz clic en cualquier punto del mapa para analizar la zona
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panel */}
      <div className="w-[420px] h-full bg-card border-l border-border flex flex-col overflow-hidden">
        {!analysis && !loading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-headline text-lg font-semibold text-foreground mb-1">
                Sin ubicación seleccionada
              </p>
              <p className="font-body text-sm text-muted-foreground">
                {tipoNegocio
                  ? "Selecciona un punto en el mapa para comenzar el análisis"
                  : "Selecciona un tipo de negocio y luego haz clic en el mapa"}
              </p>
            </div>
          </div>
        )}
        {loading && <SkeletonPanel />}
        {analysis && !loading && <AnalysisPanel data={analysis} />}
      </div>
    </div>
  );
};

function SkeletonPanel() {
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-block h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default AnalyzePage;
