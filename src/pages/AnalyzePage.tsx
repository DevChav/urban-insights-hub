import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Circle, useMapEvents } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

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
  const score = Math.floor(Math.random() * 4) + 6; // 6-9
  const nearbyCount = Math.floor(Math.random() * 25) + 15;
  return { lat, lng, score, nearbyCount, types: MOCK_TYPES };
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
};

function AnalysisPanel({ data }: { data: AnalysisData }) {
  return (
    <div className="flex flex-col h-full">
      {/* Sticky score card */}
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

      {/* Scrollable detail cards */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="border border-border rounded-lg p-5 bg-card"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-1">
            Nearby Businesses
          </p>
          <p className="font-headline text-3xl font-bold text-foreground">
            {data.nearbyCount}
          </p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Within 500m radius
          </p>
        </motion.div>

        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="border border-border rounded-lg p-5 bg-card"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Types of Businesses
          </p>
          <div className="space-y-3">
            {data.types.map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="font-body text-sm text-foreground">{t.name}</span>
                <span className="font-headline text-sm font-semibold text-foreground">{t.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="border border-border rounded-lg p-5 bg-card"
        >
          <p className="font-body text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Area Summary
          </p>
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
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCircleCenter([lat, lng]);
    setLoading(true);
    setAnalysis(null);

    // Simulate API delay
    setTimeout(() => {
      setAnalysis(generateMockData(lat, lng));
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Map — 60% */}
      <div className="w-[60%] h-full relative">
        <MapContainer
          center={[41.9028, 12.4964]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {circleCenter && (
            <Circle
              center={circleCenter}
              radius={500}
              pathOptions={{
                color: "hsl(214, 100%, 40%)",
                fillColor: "hsl(214, 100%, 40%)",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          )}
        </MapContainer>

        {/* Instruction overlay */}
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
              <p className="font-headline text-lg font-semibold text-foreground mb-2">
                No location selected
              </p>
              <p className="font-body text-sm text-muted-foreground">
                Click on the map to begin your analysis
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

export default AnalyzePage;
