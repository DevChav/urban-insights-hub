import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisData {
  lat: number;
  lng: number;
  score: number;
  nearbyCount: number;
  types: { name: string; count: number }[];
}

const MOCK_TYPES = [
  { name: "Restaurants & Cafés", count: 14 },
  { name: "Retail Shops", count: 9 },
  { name: "Professional Services", count: 7 },
  { name: "Health & Wellness", count: 4 },
  { name: "Entertainment", count: 3 },
];

function generateMockData(lat: number, lng: number): AnalysisData {
  const score = Math.floor(Math.random() * 4) + 6;
  const nearbyCount = Math.floor(Math.random() * 25) + 15;
  return { lat, lng, score, nearbyCount, types: MOCK_TYPES };
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
};

function SkeletonPanel() {
  return (
    <div className="p-6 space-y-6">
      <div className="skeleton-block h-6 w-40" />
      <div className="skeleton-block h-24 w-full" />
      <div className="skeleton-block h-6 w-48" />
      <div className="skeleton-block h-32 w-full" />
      <div className="skeleton-block h-6 w-36" />
      <div className="skeleton-block h-20 w-full" />
    </div>
  );
}

function AnalysisPanel({ data }: { data: AnalysisData }) {
  return (
    <div className="flex flex-col h-full">
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-10 bg-card border-b border-border p-6"
      >
        <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-1">
          Commercial Potential
        </p>
        <p className="font-headline text-5xl font-bold text-primary">
          {data.score}<span className="text-xl text-muted-foreground font-body font-normal">/10</span>
        </p>
        <p className="font-body text-sm text-muted-foreground mt-2">
          {data.lat.toFixed(4)}, {data.lng.toFixed(4)}
        </p>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible"
          className="border border-border rounded-lg p-5 bg-card">
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-1">Nearby Businesses</p>
          <p className="font-headline text-3xl font-bold text-foreground">{data.nearbyCount}</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Within 500m radius</p>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible"
          className="border border-border rounded-lg p-5 bg-card">
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-3">Types of Businesses</p>
          <div className="space-y-3">
            {data.types.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="font-body text-sm text-foreground">{t.name}</span>
                <span className="font-headline text-sm font-semibold text-foreground">{t.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible"
          className="border border-border rounded-lg p-5 bg-card">
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-3">Area Summary</p>
          <p className="font-body text-sm text-foreground leading-relaxed">
            This area shows moderate to high commercial activity with a diverse mix of business types.
            The density of restaurants and retail suggests strong foot traffic, making it suitable for
            consumer-facing businesses.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const AnalyzePage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;

    // Remove old circle
    if (circleRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(circleRef.current);
    }

    // Draw new circle
    if (mapInstanceRef.current) {
      circleRef.current = L.circle([lat, lng], {
        radius: 500,
        color: "#0052CC",
        fillColor: "#0052CC",
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(mapInstanceRef.current);
    }

    setLoading(true);
    setAnalysis(null);

    setTimeout(() => {
      setAnalysis(generateMockData(lat, lng));
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [41.9028, 12.4964],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", handleMapClick);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [handleMapClick]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Map — 60% */}
      <div className="w-[60%] h-full relative">
        <div ref={mapRef} className="h-full w-full" />

        <AnimatePresence>
          {!analysis && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-5 py-3"
            >
              <p className="font-body text-sm text-muted-foreground">
                Click anywhere on the map to analyze a location
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analysis panel — 40% */}
      <div className="w-[40%] h-full bg-card border-l border-border flex flex-col">
        {!analysis && !loading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="font-headline text-lg font-semibold text-foreground mb-2">No location selected</p>
              <p className="font-body text-sm text-muted-foreground">Click on the map to begin your analysis</p>
            </div>
          </div>
        )}
        {loading && <SkeletonPanel />}
        {analysis && !loading && <AnalysisPanel data={analysis} />}
      </div>
    </div>
  );
};

export default AnalyzePage;
