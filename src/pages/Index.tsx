import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        className="text-center max-w-lg px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground mb-4">
          UrbanData
        </h1>
        <p className="font-body text-lg text-muted-foreground leading-relaxed mb-10">
          A tool that helps small businesses find the best location to start a business.
        </p>
        <button
          onClick={() => navigate("/analyze")}
          className="font-headline font-medium text-base px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Start Analysis
        </button>
      </motion.div>
    </div>
  );
};

export default Index;
