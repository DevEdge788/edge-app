import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, ClipboardList,
  Wallet, BarChart3, Settings, Bell, MessageSquare, FileHeart, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { EdgeLogo } from "@/components/EdgeLogo";
import { useAuth, usePrimaryRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navByRole: Record<string, { label: string; items: { title: string; url: string; icon: any }[] }[]> = {
  admin: [
    { label: "Operação", items: [
      { title: "Painel", url: "/", icon: LayoutDashboard },
      { title: "Agenda", url: "/agenda", icon: Calendar },
      { title: "Pacientes", url: "/pacientes", icon: Users },
      { title: "Profissionais", url: "/profissionais", icon: Stethoscope },
    ]},
    { label: "Gestão", items: [
      { title: "Caixa & Faturação", url: "/caixa", icon: Wallet },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "Catálogo Clínico", url: "/catalogo", icon: ClipboardList },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ]},
  ],
  rececionista: [
    { label: "Receção", items: [
      { title: "Painel", url: "/", icon: LayoutDashboard },
      { title: "Agenda", url: "/agenda", icon: Calendar },
      { title: "Pacientes", url: "/pacientes", icon: Users },
      { title: "Caixa", url: "/caixa", icon: Wallet },
      { title: "Lembretes", url: "/lembretes", icon: Bell },
    ]},
  ],
  medico: [
    { label: "Clínica", items: [
      { title: "Painel", url: "/", icon: LayoutDashboard },
      { title: "Minha Agenda", url: "/agenda", icon: Calendar },
      { title: "Meus Pacientes", url: "/pacientes", icon: Users },
      { title: "Consulta", url: "/consulta", icon: FileHeart },
    ]},
  ],
  paciente: [
    { label: "Área Pessoal", items: [
      { title: "Painel", url: "/", icon: LayoutDashboard },
      { title: "Marcações", url: "/marcacoes", icon: Calendar },
      { title: "Mensagens", url: "/mensagens", icon: MessageSquare },
      { title: "Ficha Clínica", url: "/ficha", icon: FileHeart },
    ]},
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const role = usePrimaryRole();
  const sections = navByRole[role];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/40 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/10 p-1.5">
            <EdgeLogo className="h-7 w-auto brightness-0 invert" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-base font-semibold text-sidebar-foreground">EDGE+</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Clínica Integrada</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase tracking-wider text-[10px]">{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink to={item.url} end className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-3">
        {!collapsed && user && (
          <div className="px-2 pb-2 text-xs text-sidebar-foreground/70 truncate">{user.email}</div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={signOut}
          className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
