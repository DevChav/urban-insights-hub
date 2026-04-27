import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Search, Loader2, ArrowLeft, Briefcase } from "lucide-react";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import type { AnalysisData } from "@/lib/mockData";
import { analyzeZone } from "@/lib/analyzeZone";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { scianDeSubcat } from "@/lib/cityStats";
import { getLastZone, setLastZone, getMapState, setMapState } from "@/lib/zoneStorage";
import { MEXICALI_CENTER } from "@/lib/denueData";

const RADIUS_OPTIONS = [200, 500, 1000, 2000];

function radiusLabel(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

const AnalyzePage = () => {
  const { user, empresa, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pointMarkerRef = useRef<L.Marker | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const persisted = getMapState();
  const lastZone = getLastZone();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(lastZone);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState<number>(persisted.radius ?? 500);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(
    lastZone ? { lat: lastZone.lat, lng: lastZone.lng } : null,
  );

  // Geocoder
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // Persist radius/center
  useEffect(() => {
    setMapState({
      radius,
      center: mapInstanceRef.current
        ? { lat: mapInstanceRef.current.getCenter().lat, lng: mapInstanceRef.current.getCenter().lng }
        : undefined,
      zoom: mapInstanceRef.current?.getZoom(),
    });
  }, [radius]);

  // Persist last zone
  useEffect(() => {
    if (analysis) setLastZone(analysis);
  }, [analysis]);

  const drawLayers = useCallback((map: L.Map, data: AnalysisData, r: number) => {
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    if (markersRef.current) { map.removeLayer(markersRef.current); markersRef.current = null; }
    if (pointMarkerRef.current) { map.removeLayer(pointMarkerRef.current); pointMarkerRef.current = null; }

    circleRef.current = L.circle([data.lat, data.lng], {
      radius: r,
      color: "hsl(214, 100%, 40%)",
      fillColor: "hsl(214, 100%, 40%)",
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "selected-pin",
      html: `<div style="background:hsl(214, 100%, 40%);width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    pointMarkerRef.current = L.marker([data.lat, data.lng], { icon: pinIcon }).addTo(map);

    const group = L.layerGroup();
    data.negocios.forEach((n) => {
      const icon = L.divIcon({
        className: "business-marker",
        html: `<div style="background:hsl(214, 100%, 40%);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.2);border:2px solid #fff">${n.nombre.charAt(0)}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([n.lat, n.lng], { icon }).bindTooltip(n.nombre).addTo(group);
    });
    group.addTo(map);
    markersRef.current = group;
  }, []);

  const runAnalysis = useCallback(
    (lat: number, lng: number, r: number) => {
      const map = mapInstanceRef.current;
      const subId = empresa?.subcatId;
      if (!map || !subId) return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Limpiar capas previas inmediatamente
      if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
      if (markersRef.current) { map.removeLayer(markersRef.current); markersRef.current = null; }
      if (pointMarkerRef.current) { map.removeLayer(pointMarkerRef.current); pointMarkerRef.current = null; }

      circleRef.current = L.circle([lat, lng], {
        radius: r,
        color: "hsl(214, 100%, 40%)",
        fillColor: "hsl(214, 100%, 40%)",
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: "6 4",
      }).addTo(map);

      setLoading(true);
      analyzeZone(lat, lng, subId, r, ctrl.signal)
        .then((data) => {
          if (ctrl.signal.aborted) return;
          drawLayers(map, data, r);
          setAnalysis(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    [empresa?.subcatId, drawLayers],
  );

  const runRef = useRef(runAnalysis);
  runRef.current = runAnalysis;
  const radRef = useRef(radius);
  radRef.current = radius;

  // Map init
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const start = persisted.center ?? (lastZone ? { lat: lastZone.lat, lng: lastZone.lng } : MEXICALI_CENTER);
    const startZoom = persisted.zoom ?? 14;

    const map = L.map(mapRef.current, {
      center: [start.lat, start.lng],
      zoom: startZoom,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedPoint({ lat, lng });
      runRef.current(lat, lng, radRef.current);
    });

    map.on("moveend", () => {
      setMapState({
        radius: radRef.current,
        center: { lat: map.getCenter().lat, lng: map.getCenter().lng },
        zoom: map.getZoom(),
      });
    });

    mapInstanceRef.current = map;

    // Restore previous analysis layers
    if (lastZone) {
      requestAnimationFrame(() => drawLayers(map, lastZone, persisted.radius ?? 500));
    }

    return () => { map.remove(); mapInstanceRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-analyze on radius change
  useEffect(() => {
    if (selectedPoint && empresa?.subcatId) {
      runAnalysis(selectedPoint.lat, selectedPoint.lng, radius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  const radiusIndex = RADIUS_OPTIONS.indexOf(radius);

  // ── Geocoder (Nominatim) ─────────────────────────────────────
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, Mexicali, Baja California, México`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([lat, lng], 16, { animate: true });
          setSelectedPoint({ lat, lng });
          runRef.current(lat, lng, radRef.current);
        }
      }
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!empresa) return <Navigate to="/registro-empresa" replace />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Mapa */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        {/* Top bar: back + búsqueda + giro */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row gap-2 md:items-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="bg-card/90 backdrop-blur-sm shadow-md shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>

          <form onSubmit={handleSearch} className="flex-1 max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar dirección o colonia en Mexicali…"
                className="pl-9 bg-card/95 backdrop-blur-sm shadow-md"
              />
            </div>
            <Button type="submit" size="sm" disabled={searching || !searchQuery.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </form>

          <div className="hidden md:flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 shadow-md">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
            <span className="font-body text-xs text-foreground font-medium truncate max-w-[180px]">
              {empresa.nombre}
            </span>
          </div>
        </div>

        {/* Radio control */}
        <div className="absolute bottom-6 left-4 z-[1000]">
          <div className="bg-card/95 backdrop-blur-sm shadow-lg border border-border rounded-xl px-4 py-3 w-[260px]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Radio de análisis</p>
              <span className="font-headline text-sm font-semibold text-primary">{radiusLabel(radius)}</span>
            </div>
            <Slider
              min={0}
              max={RADIUS_OPTIONS.length - 1}
              step={1}
              value={[radiusIndex >= 0 ? radiusIndex : 1]}
              onValueChange={([i]) => setRadius(RADIUS_OPTIONS[i])}
            />
            <div className="flex justify-between mt-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <span key={r} className="font-body text-[10px] text-muted-foreground">
                  {radiusLabel(r)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {!analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-xl"
            >
              <p className="font-body text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Busca una dirección o haz clic en el mapa para validar la ubicación
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side panel */}
      <div className="w-[420px] h-full bg-card border-l border-border flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!analysis && !loading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-headline text-lg font-semibold text-foreground mb-1">Sin ubicación seleccionada</p>
                <p className="font-body text-sm text-muted-foreground">
                  Validamos automáticamente para tu giro: <span className="text-primary font-medium">{empresa.nombre}</span>
                </p>
              </div>
            </motion.div>
          )}
          {loading && <SkeletonPanel key="skeleton" />}
          {analysis && !loading && (
            <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              <AnalysisPanel data={analysis} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function SkeletonPanel() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 p-5">
      <div className="h-20 rounded-lg bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-32 rounded-lg bg-muted animate-pulse" />
      <div className="h-40 rounded-lg bg-muted animate-pulse" />
    </motion.div>
  );
}

export default AnalyzePage;
