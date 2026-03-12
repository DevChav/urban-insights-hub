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
import { Slider } from "@/components/ui/slider";

const RADIUS_OPTIONS = [200, 500, 1000, 2000, 5000];

function radiusLabel(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

const AnalyzePage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tipoNegocio, setTipoNegocio] = useState<TipoNegocio | null>(null);
  const [radius, setRadius] = useState(500);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Core analysis function
  const runAnalysis = useCallback(
    (lat: number, lng: number, tipo: TipoNegocio, r: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Clear previous overlays
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
        markersRef.current = null;
      }

      // Draw new circle
      circleRef.current = L.circle([lat, lng], {
        radius: r,
        color: "hsl(214 100% 40%)",
        fillColor: "hsl(214 100% 40%)",
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map);

      setLoading(true);
      setAnalysis(null);

      analyzeZone(lat, lng, tipo, r, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;

          const group = L.layerGroup();
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

          setAnalysis(data);
          setLoading(false);
        })
        .catch((err) => {
          if (err?.name === "AbortError") return;
          setLoading(false);
        });
    },
    []
  );

  // Map click
  const runAnalysisRef = useRef(runAnalysis);
  runAnalysisRef.current = runAnalysis;
  const tipoRef = useRef(tipoNegocio);
  tipoRef.current = tipoNegocio;
  const radiusRef = useRef(radius);
  radiusRef.current = radius;

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

    map.on("click", (e: L.LeafletMouseEvent) => {
      const tipo = tipoRef.current;
      if (!tipo) return;
      const { lat, lng } = e.latlng;
      setSelectedPoint({ lat, lng });
      runAnalysisRef.current(lat, lng, tipo, radiusRef.current);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Re-analyze when radius changes (if a point is already selected)
  useEffect(() => {
    if (selectedPoint && tipoNegocio) {
      runAnalysis(selectedPoint.lat, selectedPoint.lng, tipoNegocio, radius);
    }
  }, [radius, tipoNegocio, runAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find closest radius option index for slider
  const radiusIndex = RADIUS_OPTIONS.indexOf(radius);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        {/* Controls overlay */}
        <div className="absolute top-4 left-4 z-[1000] space-y-3">
          {/* Business type selector */}
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

          {/* Radius control */}
          <div className="bg-card shadow-lg border border-border rounded-md px-4 py-3 w-[240px]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-xs text-muted-foreground">Radio de búsqueda</p>
              <span className="font-headline text-sm font-semibold text-primary">
                {radiusLabel(radius)}
              </span>
            </div>
            <Slider
              min={0}
              max={RADIUS_OPTIONS.length - 1}
              step={1}
              value={[radiusIndex >= 0 ? radiusIndex : 1]}
              onValueChange={([i]) => setRadius(RADIUS_OPTIONS[i])}
            />
            <div className="flex justify-between mt-1">
              <span className="font-body text-[10px] text-muted-foreground">200 m</span>
              <span className="font-body text-[10px] text-muted-foreground">5 km</span>
            </div>
          </div>
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
