import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, GitCompareArrows, Clock, ChevronRight } from "lucide-react";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ComparisonPanel from "@/components/analysis/ComparisonPanel";
import HistoryPanel, { type HistoryEntry } from "@/components/analysis/HistoryPanel";
import BusinessSelector from "@/components/BusinessSelector";
import HeatmapLegend from "@/components/HeatmapLegend";
import type { AnalysisData } from "@/lib/mockData";
import { analyzeZone } from "@/lib/analyzeZone";
import { generateHeatmapGrid, viabilityColor } from "@/lib/heatmapData";
import { Slider } from "@/components/ui/slider";

const RADIUS_OPTIONS = [200, 500, 1000, 2000, 5000];

function radiusLabel(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

// ── Canvas heatmap layer ────────────────────────────────────────
class HeatCanvas extends L.Layer {
  _el: HTMLCanvasElement | null = null;
  _host: L.Map | null = null;
  _subcat: string;
  _raf = 0;

  constructor(subcatId: string) {
    super();
    this._subcat = subcatId;
  }

  update(subcatId: string) {
    this._subcat = subcatId;
    this._scheduleRedraw();
  }

  onAdd(map: L.Map) {
    this._host = map;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "250";
    canvas.className = "gm-heat-canvas";
    map.getPane("overlayPane")!.appendChild(canvas);
    this._el = canvas;
    map.on("moveend", this._scheduleRedraw, this);
    map.on("zoomend", this._scheduleRedraw, this);
    map.on("resize", this._scheduleRedraw, this);
    this._draw();
    return this;
  }

  onRemove(map: L.Map) {
    cancelAnimationFrame(this._raf);
    map.off("moveend", this._scheduleRedraw, this);
    map.off("zoomend", this._scheduleRedraw, this);
    map.off("resize", this._scheduleRedraw, this);
    this._el?.remove();
    this._el = null;
    this._host = null;
    return this;
  }

  _scheduleRedraw = () => {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => this._draw());
  };

  _draw() {
    const map = this._host;
    const c = this._el;
    if (!map || !c) return;
    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;
    c.width = size.x * dpr;
    c.height = size.y * dpr;
    c.style.width = `${size.x}px`;
    c.style.height = `${size.y}px`;
    const origin = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(c, origin);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.x, size.y);
    ctx.globalCompositeOperation = "screen";
    const bounds = map.getBounds();
    const GRID = 36;
    const points = generateHeatmapGrid(this._subcat, {
      north: bounds.getNorth(), south: bounds.getSouth(),
      east: bounds.getEast(), west: bounds.getWest(),
    }, GRID);
    const cellW = size.x / GRID;
    const cellH = size.y / GRID;
    const radius = Math.max(cellW, cellH) * 1.6;
    for (const p of points) {
      const px = map.latLngToContainerPoint([p.lat, p.lng]);
      const g = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, radius);
      g.addColorStop(0, viabilityColor(p.value, 0.42));
      g.addColorStop(0.5, viabilityColor(p.value, 0.18));
      g.addColorStop(1, viabilityColor(p.value, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px.x, px.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
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
  const heatRef = useRef<HeatCanvas | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [subcatId, setSubcatId] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Comparison
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonData, setComparisonData] = useState<AnalysisData | null>(null);
  const [compPoint, setCompPoint] = useState<{ lat: number; lng: number } | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Panel mode
  const [panelMode, setPanelMode] = useState<PanelMode>("analysis");

  // ── Heatmap lifecycle ─────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!subcatId) {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
      return;
    }
    if (heatRef.current) {
      heatRef.current.update(subcatId);
    } else {
      const layer = new HeatCanvas(subcatId);
      layer.addTo(map);
      heatRef.current = layer;
    }
  }, [subcatId]);

  // ── Add to history ────────────────────────────────────────────
  const addToHistory = useCallback((data: AnalysisData) => {
    setHistory(prev => {
      const entry: HistoryEntry = { id: `${Date.now()}-${Math.random()}`, data, timestamp: Date.now() };
      return [entry, ...prev].slice(0, 20);
    });
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
          setAnalysis(data);
          setLoading(false);
          addToHistory(data);
          setPanelMode("analysis");
        }).catch((err) => {
          if (err?.name === "AbortError") return;
          setLoading(false);
        });
      } else {
        // Comparison point
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
    [addToHistory],
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

  // Map init
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
      const sub = subRef.current;
      if (!sub) return;
      const { lat, lng } = e.latlng;

      if (compModeRef.current && analysisRef.current) {
        // Second click in compare mode
        setCompPoint({ lat, lng });
        runRef.current(lat, lng, sub, radRef.current, true);
      } else {
        setSelectedPoint({ lat, lng });
        // Reset comparison
        setComparisonData(null);
        setCompPoint(null);
        runRef.current(lat, lng, sub, radRef.current, false);
      }
    });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Re-analyze on radius/subcat change
  useEffect(() => {
    if (selectedPoint && subcatId) {
      runAnalysis(selectedPoint.lat, selectedPoint.lng, subcatId, radius, false);
    }
  }, [radius, subcatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const radiusIndex = RADIUS_OPTIONS.indexOf(radius);

  // Clear comparison layers
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

  // History handlers
  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([entry.data.lat, entry.data.lng], 14, { animate: true });
    setSelectedPoint({ lat: entry.data.lat, lng: entry.data.lng });
    setAnalysis(entry.data);
    setPanelMode("analysis");
  }, []);

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

        {/* Heatmap legend */}
        {subcatId && <HeatmapLegend />}

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
              <p className="font-body text-sm font-medium">
                Haz clic en otro punto para comparar
              </p>
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
                <MapPinIcon className="h-4 w-4 text-primary" />
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

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
