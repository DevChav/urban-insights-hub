import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Building2 } from "lucide-react";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
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

// ── Canvas-based heatmap layer ──────────────────────────────────
// Renders a single <canvas> with overlapping radial gradients for a
// smooth, DiDi-style demand visualization. Strictly one instance at a time.

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

    // Use screen blending for natural color overlap (like DiDi)
    ctx.globalCompositeOperation = "screen";

    const bounds = map.getBounds();
    const GRID = 36;
    const points = generateHeatmapGrid(this._subcat, {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
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

    // Reset composite
    ctx.globalCompositeOperation = "source-over";
  }
}

// ── Main page ────────────────────────────────────────────────────
const AnalyzePage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<HeatCanvas | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [subcatId, setSubcatId] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // ── Heatmap lifecycle — strictly one layer ─────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!subcatId) {
      // Remove existing
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
      return;
    }

    if (heatRef.current) {
      // Update existing layer in-place (no remove/add flicker)
      heatRef.current.update(subcatId);
    } else {
      const layer = new HeatCanvas(subcatId);
      layer.addTo(map);
      heatRef.current = layer;
    }
  }, [subcatId]);

  const runAnalysis = useCallback(
    (lat: number, lng: number, subId: string, r: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Clean previous point-specific layers
      if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
      if (markersRef.current) { map.removeLayer(markersRef.current); markersRef.current = null; }

      circleRef.current = L.circle([lat, lng], {
        radius: r,
        color: "hsl(216 48% 19%)",
        fillColor: "hsl(216 48% 19%)",
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: "6 4",
      }).addTo(map);

      setLoading(true);
      setAnalysis(null);

      analyzeZone(lat, lng, subId, r, ctrl.signal)
        .then((data) => {
          if (ctrl.signal.aborted) return;
          const group = L.layerGroup();
          data.negocios.forEach((n) => {
            const icon = L.divIcon({
              className: "business-marker",
              html: `<div style="background:hsl(216 48% 19%);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.2);border:2px solid #fff">${n.nombre.charAt(0)}</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
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
    [],
  );

  // Stable refs for the map click handler
  const runRef = useRef(runAnalysis);
  runRef.current = runAnalysis;
  const subRef = useRef(subcatId);
  subRef.current = subcatId;
  const radRef = useRef(radius);
  radRef.current = radius;

  // Map init — once
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
      setSelectedPoint({ lat, lng });
      runRef.current(lat, lng, sub, radRef.current);
    });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Re-analyze when radius or subcategory changes (if a point is selected)
  useEffect(() => {
    if (selectedPoint && subcatId) {
      runAnalysis(selectedPoint.lat, selectedPoint.lng, subcatId, radius);
    }
  }, [radius, subcatId, runAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  const radiusIndex = RADIUS_OPTIONS.indexOf(radius);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        {/* Business selector — top left */}
        <div className="absolute top-4 left-4 z-[1000]">
          <BusinessSelector value={subcatId} onChange={setSubcatId} />
        </div>

        {/* Radius control — top right */}
        <div className="absolute top-4 right-4 z-[1000] bg-card/90 backdrop-blur-sm shadow-lg border border-border rounded-lg px-4 py-3 w-[200px]">
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

        {/* Heatmap legend — bottom left, no overlap with other controls */}
        {subcatId && <HeatmapLegend />}

        <AnimatePresence>
          {!subcatId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-5 py-3 shadow-lg"
            >
              <p className="font-body text-sm text-muted-foreground">
                Selecciona el sector, categoría y subcategoría del negocio que deseas abrir
              </p>
            </motion.div>
          )}
          {subcatId && !analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
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
