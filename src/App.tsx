import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";
import Pacientes from "@/pages/Pacientes";
import Profissionais from "@/pages/Profissionais";
import Marcacoes from "@/pages/Marcacoes";
import Consulta from "@/pages/Consulta";
import Recepcao from "@/pages/Recepcao";
import Caixa from "@/pages/Caixa";
import Placeholder from "@/pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/marcacoes" element={<Marcacoes />} />
              <Route path="/consulta" element={<Consulta />} />
              <Route path="/recepcao" element={<Recepcao />} />
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/catalogo" element={<Placeholder title="Catálogo Clínico" description="Códigos de atos, preços e comissões (Fase 5)." />} />
              <Route path="/relatorios" element={<Placeholder title="Relatórios" description="Indicadores financeiros e clínicos (Fase 5)." />} />
              <Route path="/lembretes" element={<Placeholder title="Lembretes" description="SMS, WhatsApp e email (Fase 6)." />} />
              <Route path="/configuracoes" element={<Placeholder title="Configurações" description="Especialidades, salas e permissões." />} />
              <Route path="/mensagens" element={<Placeholder title="Mensagens" />} />
              <Route path="/ficha" element={<Placeholder title="Ficha clínica" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
