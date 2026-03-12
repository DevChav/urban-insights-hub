import { motion } from "framer-motion";
import { MapPin, Users, Lightbulb } from "lucide-react";

const items = [
  { icon: MapPin, title: "¿Qué es GeoMarket?", text: "GeoMarket es una plataforma interactiva que permite a emprendedores analizar zonas comerciales antes de abrir un negocio. Utiliza datos reales de OpenStreetMap para mostrar los negocios cercanos a cualquier punto de Mexicali y evalúa el potencial comercial de la zona." },
  { icon: Users, title: "¿Para quién es?", text: "Está diseñada para emprendedores, inversionistas y pequeños empresarios que buscan tomar decisiones informadas sobre la ubicación de su nuevo negocio." },
  { icon: Lightbulb, title: "¿Cómo funciona?", text: "El usuario selecciona el tipo de negocio que desea abrir y un punto en el mapa. El sistema consulta datos reales de OpenStreetMap para identificar negocios cercanos, calcular una puntuación de viabilidad y generar un análisis personalizado de la zona." },
];

export default function AcercaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Acerca del proyecto</h1>
        <p className="font-body text-muted-foreground">Conoce más sobre GeoMarket y cómo puede ayudarte.</p>
      </motion.div>

      <div className="space-y-6">
        {items.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm flex gap-4">
            <item.icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-headline text-lg font-semibold text-foreground mb-1">{item.title}</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="font-body text-xs text-muted-foreground text-center pt-6 border-t border-border">
        Este es un prototipo interactivo con datos simulados. Desarrollado como demostración de concepto.
      </motion.p>
    </div>
  );
}
