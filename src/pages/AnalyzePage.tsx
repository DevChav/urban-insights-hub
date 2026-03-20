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

// ── Canvas overlay for the heatmap ───────────────────────────────
class HeatCanvasOverlay extends L.Layer {
  _canvas: HTMLCanvasElement | null = null;
  _subcatId: string;
  _mapRef: L.Map | null = null;

  constructor(subcatId: string) {
    super();
    this._subcatId = subcatId;
  }

  setSubcatId(id: string) {
    this._subcatId = id;
    this._redraw();
  }

  onAdd(map: L.Map) {
    this._mapRef = map;
    this._canvas = L.DomUtil.create("canvas", "heatmap-canvas") as HTMLCanvasElement;
    const pane = map.getPane("overlayPane")!;
    pane.appendChild(this._canvas);
    this._canvas.style.position = "absolute";
    this._canvas.style.pointerEvents = "none";
    this._canvas.style.zIndex = "250";

    map.on("moveend zoomend resize", this._redraw, this);
    this._redraw();
    return this;
  }

  onRemove(map: L.Map) {
    if (this._canvas) {
      this._canvas.remove();
      this._canvas = null;
    }
    map.off("moveend zoomend resize", this._redraw, this);
    this._map = null;
    return this;
  }

  _redraw = () => {
    const map = this._map;
    const canvas = this._canvas;
    if (!map || !canvas) return;

    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    canvas.style.width = size.x + "px";
    canvas.style.height = size.y + "px";

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.x, size.y);

    const bounds = map.getBounds();
    const gridSize = 28;
    const points = generateHeatmapGrid(this._subcatId, {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    }, gridSize);

    // Each point becomes a soft radial gradient circle
    const cellW = size.x / gridSize;
    const cellH = size.y / gridSize;
    const dotRadius = Math.max(cellW, cellH) * 1.2;

    points.forEach((p) => {
      const px = map.latLngToContainerPoint([p.lat, p.lng]);
      const grad = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, dotRadius);
      grad.addColorStop(0, viabilityColor(p.value, 0.45));
      grad.addColorStop(1, viabilityColor(p.value, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px.x, px.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  };
}

// ── Main page ────────────────────────────────────────────────────
const AnalyzePage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<HeatCanvasOverlay | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [subcatId, setSubcatId] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // ── Heatmap: add/update when subcatId changes ──────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!subcatId) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    if (heatLayerRef.current) {
      heatLayerRef.current.setSubcatId(subcatId);
    } else {
      const layer = new HeatCanvasOverlay(subcatId);
      layer.addTo(map);
      heatLayerRef.current = layer;
    }
  }, [subcatId]);

  const runAnalysis = useCallback(
    (lat: number, lng: number, subId: string, r: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

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

      analyzeZone(lat, lng, subId, r, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
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
    []
  );

  // Refs for map click handler
  const runAnalysisRef = useRef(runAnalysis);
  runAnalysisRef.current = runAnalysis;
  const subcatRef = useRef(subcatId);
  subcatRef.current = subcatId;
  const radiusRef = useRef(radius);
  radiusRef.current = radius;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { center: [32.6245, -115.4523], zoom: 14, zoomControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      const sub = subcatRef.current;
      if (!sub) return;
      const { lat, lng } = e.latlng;
      setSelectedPoint({ lat, lng });
      runAnalysisRef.current(lat, lng, sub, radiusRef.current);
    });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Re-analyze on radius or subcategory change
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

        {/* Business selector - top left */}
        <div className="absolute top-4 left-4 z-[1000]">
          <BusinessSelector value={subcatId} onChange={setSubcatId} />
        </div>

        {/* Radius control - top right */}
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

        {/* Heatmap legend - top center (only when subcategory selected) */}
        {subcatId && <HeatmapLegend />}

        <AnimatePresence>
          {!subcatId && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-5 py-3 shadow-lg">
              <p className="font-body text-sm text-muted-foreground">
                Selecciona el sector, categoría y subcategoría del negocio que deseas abrir
              </p>
            </motion.div>
          )}
          {subcatId && !analysis && !loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-5 py-3 shadow-lg">
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
