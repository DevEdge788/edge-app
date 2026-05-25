import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import { addDays, startOfDay, fmtWeekday, statusColors, statusLabels } from "@/lib/format";
import { usePrimaryRole, useAuth } from "@/hooks/useAuth";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 08:00 → 19:00
const SLOT_PX = 56; // 1h height

export default function Agenda() {
  const role = usePrimaryRole();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(new Date());

  useEffect(() => { document.title = "Agenda · EDGE+"; }, []);

  async function load() {
    const dayEnd = addDays(date, 1);
    let profQuery = supabase.from("professionals").select("id, full_name, agenda_color, user_id").eq("is_active", true).order("full_name");
    if (role === "medico") profQuery = profQuery.eq("user_id", user?.id ?? "");
    const { data: prof } = await profQuery;
    setProfessionals(prof ?? []);

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, notes, professional_id, patient_id, specialty_id, patients(full_name), specialties(name, color)")
      .gte("starts_at", date.toISOString())
      .lt("starts_at", dayEnd.toISOString())
      .order("starts_at");
    setAppointments(appts ?? []);
  }

  useEffect(() => { load(); }, [date, role, user]);

  const byProf = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const a of appointments) {
      (m[a.professional_id] ||= []).push(a);
    }
    return m;
  }, [appointments]);

  const isToday = startOfDay(new Date()).getTime() === date.getTime();
  const canEdit = role === "admin" || role === "rececionista";

  function openNew(d?: Date) {
    setEditingId(null);
    setInitialDate(d ?? date);
    setDialogOpen(true);
  }
  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Agenda</h1>
          <p className="text-muted-foreground capitalize">
            {fmtWeekday(date)}, {date.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant={isToday ? "default" : "outline"} onClick={() => setDate(startOfDay(new Date()))} className="gap-2">
            <CalendarDays className="h-4 w-4" /> Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
          {canEdit && (
            <Button onClick={() => openNew()} className="bg-gradient-primary gap-2">
              <Plus className="h-4 w-4" /> Nova marcação
            </Button>
          )}
        </div>
      </div>

      {professionals.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Sem profissionais ativos.</Card>
      ) : (
        <Card className="overflow-hidden shadow-card border-border/60">
          <div className="overflow-x-auto">
            <div className="flex min-w-fit">
              {/* Time column */}
              <div className="w-16 shrink-0 border-r border-border/60 bg-muted/30">
                <div className="h-12 border-b border-border/60" />
                {HOURS.map((h) => (
                  <div key={h} className="border-b border-border/40 text-[10px] text-muted-foreground px-2 pt-1 tabular-nums"
                       style={{ height: SLOT_PX }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Pro columns */}
              {professionals.map((p) => (
                <div key={p.id} className="flex-1 min-w-[200px] border-r border-border/60 last:border-r-0 relative">
                  <div className="h-12 border-b border-border/60 px-3 flex items-center gap-2 bg-muted/30">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.agenda_color ?? "#003B7A" }} />
                    <span className="text-sm font-medium truncate">{p.full_name}</span>
                  </div>
                  <div className="relative" style={{ height: HOURS.length * SLOT_PX }}>
                    {HOURS.map((h) => (
                      <div key={h}
                           onClick={() => {
                             if (!canEdit) return;
                             const d = new Date(date); d.setHours(h, 0, 0, 0);
                             openNew(d);
                           }}
                           className={`border-b border-border/30 ${canEdit ? "hover:bg-accent/5 cursor-pointer" : ""}`}
                           style={{ height: SLOT_PX }} />
                    ))}
                    {(byProf[p.id] ?? []).map((a) => {
                      const s = new Date(a.starts_at);
                      const e = new Date(a.ends_at);
                      const startMin = s.getHours() * 60 + s.getMinutes() - HOURS[0] * 60;
                      const dur = Math.max(15, (e.getTime() - s.getTime()) / 60000);
                      const top = (startMin / 60) * SLOT_PX;
                      const height = (dur / 60) * SLOT_PX - 2;
                      const color = a.specialties?.color ?? p.agenda_color ?? "#003B7A";
                      return (
                        <button
                          key={a.id}
                          onClick={() => openEdit(a.id)}
                          className="absolute left-1 right-1 rounded-md text-left p-2 shadow-sm border bg-card hover:shadow-elegant transition-shadow overflow-hidden"
                          style={{ top, height, borderLeftWidth: 3, borderLeftColor: color }}
                        >
                          <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                            {s.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-xs font-medium truncate">{a.patients?.full_name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{a.specialties?.name}</div>
                          <Badge variant="outline" className={`mt-1 text-[9px] px-1 py-0 h-4 ${statusColors[a.status]}`}>
                            {statusLabels[a.status]}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={initialDate}
        appointmentId={editingId}
        onSaved={load}
      />
    </div>
  );
}
