import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, usePrimaryRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Stethoscope, Wallet, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats { patients: number; appointments: number; professionals: number; specialties: number; }

export default function Dashboard() {
  const { user } = useAuth();
  const role = usePrimaryRole();
  const [stats, setStats] = useState<Stats>({ patients: 0, appointments: 0, professionals: 0, specialties: 0 });
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    document.title = "Painel · EDGE+ Clínica";
    (async () => {
      if (user) {
        const { data: p } = await supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
        if (p?.first_name) setFirstName(p.first_name);
      }
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

      const [pc, ac, prc, sc, todays] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("professionals").select("id", { count: "exact", head: true }),
        supabase.from("specialties").select("id", { count: "exact", head: true }),
        supabase.from("appointments")
          .select("id, starts_at, status, patients(full_name), professionals(full_name), specialties(name,color)")
          .gte("starts_at", today.toISOString())
          .lt("starts_at", tomorrow.toISOString())
          .order("starts_at").limit(8),
      ]);
      setStats({
        patients: pc.count ?? 0,
        appointments: ac.count ?? 0,
        professionals: prc.count ?? 0,
        specialties: sc.count ?? 0,
      });
      setTodayAppts(todays.data ?? []);
    })();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
  };

  const roleSubtitle: Record<string, string> = {
    admin: "Visão completa da clínica e operação.",
    rececionista: "Marcações de hoje e fluxo de receção.",
    medico: "A sua agenda clínica e pacientes do dia.",
    paciente: "As suas marcações e ficha clínica EDGE+.",
  };

  const cards = [
    { label: "Pacientes", value: stats.patients, icon: Users, color: "from-primary to-primary-glow" },
    { label: "Marcações", value: stats.appointments, icon: Calendar, color: "from-accent to-secondary" },
    { label: "Profissionais", value: stats.professionals, icon: Stethoscope, color: "from-secondary to-primary" },
    { label: "Especialidades", value: stats.specialties, icon: Activity, color: "from-primary to-accent" },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-4xl text-foreground">
          {greeting()}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-muted-foreground">{roleSubtitle[role]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-card border-border/60 overflow-hidden relative group hover:shadow-elegant transition-shadow">
            <div className={`absolute inset-0 opacity-[0.04] bg-gradient-to-br ${c.color}`} />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <p className="font-display text-3xl mt-2">{c.value}</p>
                </div>
                <div className="rounded-lg bg-primary/5 p-2.5 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-2xl">Agenda de hoje</CardTitle>
              <CardDescription>Marcações previstas para as próximas horas</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1.5"><Clock className="h-3 w-3" /> {todayAppts.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {todayAppts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Sem marcações para hoje.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {todayAppts.map((a) => (
                <div key={a.id} className="py-3 flex items-center gap-4">
                  <div className="font-mono text-sm tabular-nums text-foreground/80 w-16">
                    {new Date(a.starts_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div
                    className="h-9 w-1 rounded-full"
                    style={{ backgroundColor: a.specialties?.color ?? "#11B8B5" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.patients?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.specialties?.name} · {a.professionals?.full_name}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{String(a.status).replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-primary text-primary-foreground border-0 shadow-elegant">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <h3 className="font-display text-2xl">A identidade que reflete cuidado, confiança e excelência.</h3>
            <p className="text-primary-foreground/80 text-sm mt-1">Clínica EDGE+ · Massamá – Queluz · 911 001 909</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
