import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
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
              <Route path="/agenda" element={<Placeholder title="Agenda" description="Calendário multi-profissional, marcação e agendamento online (Fase 2)." />} />
              <Route path="/pacientes" element={<Placeholder title="Pacientes" description="Lista, ficha clínica completa e construtor de anamnese (Fase 2/7)." />} />
              <Route path="/profissionais" element={<Placeholder title="Profissionais" description="Equipa clínica, horários, comissões." />} />
              <Route path="/consulta" element={<Placeholder title="Consulta Clínica" description="Registo de procedimentos e odontograma (Fase 3)." />} />
              <Route path="/catalogo" element={<Placeholder title="Catálogo Clínico" description="Códigos de atos clínicos, preços e comissões." />} />
              <Route path="/caixa" element={<Placeholder title="Caixa & Faturação" description="Pagamentos, faturação e caixa diária (Fase 4/5)." />} />
              <Route path="/relatorios" element={<Placeholder title="Relatórios" description="Indicadores financeiros e clínicos (Fase 5)." />} />
              <Route path="/lembretes" element={<Placeholder title="Lembretes" description="SMS, WhatsApp e email com mock providers (Fase 6)." />} />
              <Route path="/configuracoes" element={<Placeholder title="Configurações" description="Especialidades, salas, utilizadores e permissões." />} />
              <Route path="/marcacoes" element={<Placeholder title="As minhas marcações" />} />
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
