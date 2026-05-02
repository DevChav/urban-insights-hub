import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, BarChart3, Building2, Target } from "lucide-react";
import fondo_principal from "../assets/fondo.jpg";

const features = [
  { icon: MapPin, title: "Ubicación estratégica", desc: "Analiza cualquier zona comercial en el mapa de forma interactiva." },
  { icon: BarChart3, title: "Datos en tiempo real", desc: "Consulta métricas de actividad comercial y densidad de negocios." },
  { icon: Building2, title: "Negocios cercanos", desc: "Descubre qué tipo de comercios operan cerca de tu ubicación." },
  { icon: Target, title: "Puntuación inteligente", desc: "Recibe una calificación del 1 al 10 sobre el potencial de la zona." },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex min-h-[80vh] items-center justify-center bg-background px-6"
        style={{backgroundImage: 'url(${fondo_principal})'}}>
        <motion.div
          className="max-w-2xl text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 font-body text-sm font-medium text-primary mb-6">
            Plataforma para emprendedores
          </span>
          <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
            GeoMarke
          </h1>
          <p className="font-headline text-xl text-muted-foreground mb-2">
            Análisis inteligente de ubicaciones para emprendedores
          </p>
          <p className="font-body text-base text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto">
            Explora zonas comerciales, descubre negocios cercanos y evalúa el potencial de cualquier ubicación antes de abrir tu negocio.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="font-headline font-medium text-base px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Comenzar ahora
          </button>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-card py-20 px-6 border-t border-border">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-xl border border-border bg-background p-6 text-center"
            >
              <f.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-headline text-sm font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
