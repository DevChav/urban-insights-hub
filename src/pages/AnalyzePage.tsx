import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, GitCompareArrows, Clock, ChevronRight } from "lucide-react";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ComparisonPanel from "@/components/analysis/ComparisonPanel";
import HistoryPanel, { type HistoryEntry } from "@/components/analysis/HistoryPanel";
import BusinessSelector from "@/components/BusinessSelector";
import type { AnalysisData } from "@/lib/mockData";
import { analyzeZone } from "@/lib/analyzeZone";
import { Slider } from "@/components/ui/slider";

const RADIUS_OPTIONS = [200, 500, 1000, 2000, 5000];
const STORAGE_KEY = "geomarket_state";

function radiusLabel(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

// ── Persistence helpers ─────────────────────────────────────────
interface PersistedState {
  subcatId?: string | null;
  radius: number;
  selectedPoint: { lat: number; lng: number } | null;
  analysis: AnalysisData | null;
  history: HistoryEntry[];
}

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(s: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

type PanelMode = "analysis" | "comparison" | "history";

// ── Main page ────────────────────────────────────────────────────
const AnalyzePage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const circleCompRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markerCompRef = useRef<L.Marker | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subcatId, setSubcatId] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Comparison
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonData, setComparisonData] = useState<AnalysisData | null>(null);
  const [compPoint, setCompPoint] = useState<{ lat: number; lng: number } | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Panel mode
  const [panelMode, setPanelMode] = useState<PanelMode>("analysis");
  
  useEffect(() => {
    localStorage.clear();
  }, []);

  useEffect(() => {
    setSelectedPoint(null);
    setAnalysis(null);
  }, [subcatId]);

  // ── Persist state on changes ──────────────────────────────────
  useEffect(() => {
    saveState({radius, selectedPoint, analysis, history});
  }, [radius, selectedPoint, analysis, history]);

  // ── Add to history ────────────────────────────────────────────
  const addToHistory = useCallback((data: AnalysisData) => {
    setHistory(prev => {
      const entry: HistoryEntry = { id: `${Date.now()}-${Math.random()}`, data, timestamp: Date.now() };
      return [entry, ...prev].slice(0, 20);
    });
  }, []);

  // ── Draw point layers (circle + business markers) ─────────────
  const drawPointLayers = useCallback((map: L.Map, data: AnalysisData, r: number) => {
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    if (markersRef.current) { map.removeLayer(markersRef.current); markersRef.current = null; }

    circleRef.current = L.circle([data.lat, data.lng], {
      radius: r,
      color: "hsl(214, 100%, 40%)",
      fillColor: "hsl(214, 100%, 40%)",
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);

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

  // ── Run analysis ──────────────────────────────────────────────
  const runAnalysis = useCallback(
    (lat: number, lng: number, subId: string, r: number, isComparison = false) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (!isComparison) {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
        if (markersRef.current) { map.removeLayer(markersRef.current); markersRef.current = null; }

        circleRef.current = L.circle([lat, lng], {
          radius: r,
          color: "hsl(214, 100%, 40%)",
          fillColor: "hsl(214, 100%, 40%)",
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: "6 4",
        }).addTo(map);

        setLoading(true);
        setAnalysis(null);

        analyzeZone(lat, lng, subId, r, ctrl.signal).then((data) => {
          if (ctrl.signal.aborted) return;
          drawPointLayers(map, data, r);
          setAnalysis(data);
          setLoading(false);
          addToHistory(data);
          setPanelMode("analysis");
        }).catch((err) => {
          if (err?.name === "AbortError") return;
          setLoading(false);
        });
      } else {
        if (circleCompRef.current) { map.removeLayer(circleCompRef.current); circleCompRef.current = null; }
        if (markerCompRef.current) { map.removeLayer(markerCompRef.current); markerCompRef.current = null; }

        circleCompRef.current = L.circle([lat, lng], {
          radius: r,
          color: "hsl(0, 84%, 60%)",
          fillColor: "hsl(0, 84%, 60%)",
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: "6 4",
        }).addTo(map);

        const compIcon = L.divIcon({
          className: "comp-marker",
          html: `<div style="background:hsl(0, 84%, 60%);color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">B</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        markerCompRef.current = L.marker([lat, lng], { icon: compIcon }).addTo(map);

        analyzeZone(lat, lng, subId, r).then((data) => {
          setComparisonData(data);
          addToHistory(data);
          setPanelMode("comparison");
        });
      }
    },
    [addToHistory, drawPointLayers],
  );

  // Stable refs
  const runRef = useRef(runAnalysis);
  runRef.current = runAnalysis;
  const subRef = useRef(subcatId);
  subRef.current = subcatId;
  const radRef = useRef(radius);
  radRef.current = radius;
  const compModeRef = useRef(compareMode);
  compModeRef.current = compareMode;
  const analysisRef = useRef(analysis);
  analysisRef.current = analysis;

  // Map init + restore persisted state
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const savedPoint = null;
    const center: [number, number] = savedPoint ? [savedPoint.lat, savedPoint.lng] : [32.6245, -115.4523];

    const map = L.map(mapRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const sub = subRef.current;
      if (!sub) return;
      const { lat, lng } = e.latlng;

      if (compModeRef.current && analysisRef.current) {
        setCompPoint({ lat, lng });
        runRef.current(lat, lng, sub, radRef.current, true);
      } else {
        setSelectedPoint({ lat, lng });
        setComparisonData(null);
        setCompPoint(null);
        runRef.current(lat, lng, sub, radRef.current, false);
      }
    });

    mapInstanceRef.current = map;

    // Restore previous analysis layers
    const savedAnalysis = null;
    const savedRadius = 500;
    if (savedPoint && savedAnalysis) {
      // Small delay to let map render
      requestAnimationFrame(() => {
        drawPointLayers(map, savedAnalysis, savedRadius);
      });
    }

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-analyze on radius/subcat change
  useEffect(() => {
    if (selectedPoint && subcatId) {
      runAnalysis(selectedPoint.lat, selectedPoint.lng, subcatId, radius, false);
    }
  }, [radius, subcatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const radiusIndex = RADIUS_OPTIONS.indexOf(radius);

  const clearComparison = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) {
      if (circleCompRef.current) { map.removeLayer(circleCompRef.current); circleCompRef.current = null; }
      if (markerCompRef.current) { map.removeLayer(markerCompRef.current); markerCompRef.current = null; }
    }
    setComparisonData(null);
    setCompPoint(null);
    setCompareMode(false);
    setPanelMode("analysis");
  }, []);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([entry.data.lat, entry.data.lng], 14, { animate: true });
    setSelectedPoint({ lat: entry.data.lat, lng: entry.data.lng });
    setAnalysis(entry.data);
    drawPointLayers(map, entry.data, radius);
    setPanelMode("analysis");
  }, [radius, drawPointLayers]);

  const handleHistoryRemove = useCallback((id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleHistoryClear = useCallback(() => setHistory([]), []);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        {/* Business selector — top left */}
        <div className="absolute top-4 left-4 z-[1000]">
          <BusinessSelector value={subcatId} onChange={setSubcatId} />
        </div>

        {/* Right controls — top right */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Radius */}
          <div className="bg-card/90 backdrop-blur-sm shadow-lg border border-border rounded-xl px-4 py-3 w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-xs text-muted-foreground">Radio</p>
              <span className="font-headline text-sm font-semibold text-primary">{radiusLabel(radius)}</span>
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

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (compareMode) clearComparison();
                else setCompareMode(true);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-medium shadow-lg border transition-all duration-200 ${
                compareMode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/90 backdrop-blur-sm text-foreground border-border hover:border-primary/40"
              }`}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              {compareMode ? "Cancelar" : "Comparar"}
            </button>
            <button
              onClick={() => setPanelMode(panelMode === "history" ? "analysis" : "history")}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-medium shadow-lg border transition-all duration-200 ${
                panelMode === "history"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/90 backdrop-blur-sm text-foreground border-border hover:border-primary/40"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {history.length > 0 && (
                <span className="bg-primary/20 text-primary rounded-full px-1.5 py-0 text-[10px] font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Compare mode indicator */}
        <AnimatePresence>
          {compareMode && analysis && !comparisonData && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-xl flex items-center gap-2"
            >
              <GitCompareArrows className="h-4 w-4" />
              <p className="font-body text-sm font-medium">Haz clic en otro punto para comparar</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <AnimatePresence>
          {!subcatId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-xl px-5 py-3 shadow-lg"
            >
              <p className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Selecciona el tipo de negocio para comenzar
              </p>
            </motion.div>
          )}
          {subcatId && !analysis && !loading && !compareMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-xl px-5 py-3 shadow-lg"
            >
              <p className="font-body text-sm text-muted-foreground flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Haz clic en cualquier punto del mapa para analizar la zona
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side Panel */}
      <div className="w-[420px] h-full bg-card border-l border-border flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {panelMode === "history" ? (
            <HistoryPanel
              key="history"
              entries={history}
              onSelect={handleHistorySelect}
              onRemove={handleHistoryRemove}
              onClear={handleHistoryClear}
              onClose={() => setPanelMode("analysis")}
            />
          ) : panelMode === "comparison" && analysis && comparisonData ? (
            <ComparisonPanel
              key="comparison"
              dataA={analysis}
              dataB={comparisonData}
              onClose={clearComparison}
            />
          ) : (
            <motion.div key="main" className="flex flex-col h-full"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!analysis && !loading && (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="font-headline text-lg font-semibold text-foreground mb-1">Sin ubicación seleccionada</p>
                    <p className="font-body text-sm text-muted-foreground">
                      {subcatId
                        ? "Selecciona un punto en el mapa para comenzar el análisis"
                        : "Selecciona un tipo de negocio y luego haz clic en el mapa"}
                    </p>
                  </div>
                </div>
              )}
              {loading && <SkeletonPanel />}
              {analysis && !loading && <AnalysisPanel data={analysis} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function SkeletonPanel() {
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-block h-20 w-full rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default AnalyzePage;
