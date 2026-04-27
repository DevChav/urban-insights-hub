import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegistroEmpresaPage from "./pages/RegistroEmpresaPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyzePage from "./pages/AnalyzePage";
import EstadisticasPage from "./pages/EstadisticasPage";
import AcercaPage from "./pages/AcercaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/registro-empresa"
              element={
                <ProtectedRoute>
                  <RegistroEmpresaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireEmpresa>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mapa"
              element={
                <ProtectedRoute requireEmpresa>
                  <AnalyzePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analizar"
              element={
                <ProtectedRoute requireEmpresa>
                  <AnalyzePage />
                </ProtectedRoute>
              }
            />
            <Route path="/estadisticas" element={<EstadisticasPage />} />
            <Route path="/acerca" element={<AcercaPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
