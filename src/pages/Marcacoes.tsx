import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarClock } from "lucide-react";
import { fmtDate, fmtTime, statusColors, statusLabels } from "@/lib/format";
import { toast } from "sonner";

export default function Marcacoes() {
  const { user } = useAuth();
  const [appts, setAppts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [specs, setSpecs] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [form, setForm] = useState({ specialty_id: "", professional_id: "", date: "", time: "09:00", notes: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "As minhas marcações · EDGE+"; }, []);

  async function load() {
    if (!user) return;
    const { data: pat } = await supabase.from("patients").select("*").eq("user_id", user.id).maybeSingle();
    setPatient(pat);
    const { data } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, notes, specialties(name, color), professionals(full_name)")
      .order("starts_at", { ascending: false });
    setAppts(data ?? []);

    const [s, p] = await Promise.all([
      supabase.from("specialties").select("id, name").eq("is_active", true).order("display_order"),
      supabase.from("professionals").select("id, full_name, specialty_id").eq("is_active", true).order("full_name"),
    ]);
    setSpecs(s.data ?? []); setProfs(p.data ?? []);
  }
  useEffect(() => { load(); }, [user]);

  const future = appts.filter((a) => new Date(a.starts_at) >= new Date());
  const past = appts.filter((a) => new Date(a.starts_at) < new Date());

  async function request() {
    if (!patient) return toast.error("Ficha de paciente não encontrada. Contacte a receção.");
    if (!form.professional_id || !form.date) return toast.error("Selecione profissional e data.");
    setLoading(true);
    const starts = new Date(`${form.date}T${form.time}:00`);
    const ends = new Date(starts.getTime() + 30 * 60000);
    const { error } = await supabase.from("appointments").insert({
      patient_id: patient.id,
      professional_id: form.professional_id,
      specialty_id: form.specialty_id || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      status: "agendada",
      channel: "online",
      notes: form.notes || null,
    });
    setLoading(false);
    if (error) return toast.error("Não foi possível pedir marcação", { description: error.message });
    toast.success("Pedido enviado", { description: "A receção entrará em contacto para confirmação." });
    setOpen(false); load();
  }

  const filteredProfs = form.specialty_id ? profs.filter((p) => p.specialty_id === form.specialty_id) : profs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">As minhas marcações</h1>
          <p className="text-muted-foreground">Consulte e peça novas marcações na Clínica EDGE+</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-primary gap-2">
          <Plus className="h-4 w-4" /> Pedir marcação
        </Button>
      </div>

      {!patient && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm">
            A sua ficha clínica ainda não está associada a este utilizador. Contacte a receção para ativar a marcação online.
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Próximas</CardTitle>
          <CardDescription>{future.length} marcação(ões) futura(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {future.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem marcações futuras.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {future.map((a) => <ApptRow key={a.id} a={a} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {past.slice(0, 20).map((a) => <ApptRow key={a.id} a={a} />)}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Pedir marcação</DialogTitle>
            <DialogDescription>O pedido será confirmado pela receção da clínica.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select value={form.specialty_id || undefined} onValueChange={(v) => setForm({ ...form, specialty_id: v, professional_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{specs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select value={form.professional_id || undefined} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{filteredProfs.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Data preferencial</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hora preferencial</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notas (opcional)</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Motivo da consulta..." /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={request} disabled={loading || !patient} className="bg-gradient-primary">
              {loading ? "A enviar..." : "Enviar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApptRow({ a }: { a: any }) {
  return (
    <div className="py-3 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
        <CalendarClock className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium capitalize">{fmtDate(a.starts_at)} · {fmtTime(a.starts_at)}</div>
        <div className="text-sm text-muted-foreground truncate">
          {a.specialties?.name ?? "—"} · {a.professionals?.full_name ?? "—"}
        </div>
      </div>
      <Badge variant="outline" className={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
    </div>
  );
}
