import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth, usePrimaryRole } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  admin: "Administração",
  rececionista: "Receção",
  medico: "Profissional Clínico",
  paciente: "Paciente",
};

export default function AppLayout() {
  const { user, loading } = useAuth();
  const role = usePrimaryRole();

  if (loading) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 backdrop-blur px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="hidden sm:block">
                <span className="font-display text-lg">Clínica EDGE+</span>
                <span className="ml-2 text-xs text-muted-foreground">Massamá – Queluz</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
              {roleLabels[role]}
            </Badge>
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
