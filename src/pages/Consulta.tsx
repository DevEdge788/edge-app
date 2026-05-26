import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Odontogram, type ToothState } from "@/components/Odontogram";
import { fmtDateShort, fmtMoney, fmtTime, statusLabels } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2, FileHeart } from "lucide-react";

type Appt = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  patient: { id: string; full_name: string } | null;
  professional: { id: string; full_name: string } | null;
  specialty: { id: string; name: string; color: string } | null;
};

type CatalogItem = {
  id: string; code: string; name: string; base_price: number; specialty_id: string | null;
};

type Procedure = {
  id: string;
  tooth: string | null;
  status: "planeado" | "em_execucao" | "concluido" | "cancelado";
  amount: number;
  notes: string | null;
  payment_method: string | null;
  catalog: { id: string; code: string; name: string } | null;
};

const statusOptions = [
  { value: "planeado", label: "Planeado" },
  { value: "em_execucao", label: "Em execução" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export default function Consulta() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const apptId = params.get("appt");

  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [appt, setAppt] = useState<Appt | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    catalog_id: "", tooth: "", status: "planeado", amount: "", notes: "",
  });

  // Load appointments list (today + future, 30 days back to allow past records)
  useEffect(() => {
    (async () => {
      const from = new Date(); from.setDate(from.getDate() - 30);
      const to = new Date(); to.setDate(to.getDate() + 7);
      const { data } = await supabase
        .from("appointments")
        .select(`id, starts_at, ends_at, status, notes,
          patient:patients!appointments_patient_id_fkey(id, full_name),
          professional:professionals!appointments_professional_id_fkey(id, full_name),
          specialty:specialties!appointments_specialty_id_fkey(id, name, color)`)
        .gte("starts_at", from.toISOString())
        .lte("starts_at", to.toISOString())
        .order("starts_at", { ascending: false });
      setAppointments((data as any) ?? []);
    })();
  }, [user]);

  // Load catalog
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("procedure_catalog")
        .select("id, code, name, base_price, specialty_id")
        .eq("is_active", true)
        .order("name");
      setCatalog((data as any) ?? []);
    })();
  }, []);

  // Load selected appointment + procedures
  useEffect(() => {
    if (!apptId) { setAppt(null); setProcedures([]); return; }
    const found = appointments.find((a) => a.id === apptId);
    if (found) setAppt(found);
    loadProcedures(apptId);
  }, [apptId, appointments]);

  async function loadProcedures(id: string) {
    const { data } = await supabase
      .from("procedures")
      .select(`id, tooth, status, amount, notes, payment_method,
        catalog:procedure_catalog!procedures_catalog_id_fkey(id, code, name)`)
      .eq("appointment_id", id)
      .order("created_at", { ascending: true });
    setProcedures((data as any) ?? []);
  }

  const toothStates = useMemo(() => {
    const map: Record<string, ToothState> = {};
    for (const p of procedures) {
      if (!p.tooth) continue;
      const cur = map[p.tooth] ?? { count: 0 };
      cur.count += 1;
      // priority: em_execucao > planeado > concluido > cancelado
      const priority = { em_execucao: 4, planeado: 3, concluido: 2, cancelado: 1 } as const;
      if (!cur.status || priority[p.status] > priority[cur.status]) cur.status = p.status;
      map[p.tooth] = cur;
    }
    return map;
  }, [procedures]);

  const total = useMemo(
    () => procedures.reduce((s, p) => s + Number(p.amount || 0), 0),
    [procedures],
  );

  function openAdd(tooth?: string) {
    setForm({
      catalog_id: "",
      tooth: tooth ?? selectedTooth ?? "",
      status: "planeado",
      amount: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function onCatalogChange(id: string) {
    const item = catalog.find((c) => c.id === id);
    setForm((f) => ({ ...f, catalog_id: id, amount: item ? String(item.base_price) : f.amount }));
  }

  async function saveProcedure() {
    if (!apptId || !form.catalog_id) {
      toast.error("Selecione um ato do catálogo");
      return;
    }
    const { error } = await supabase.from("procedures").insert({
      appointment_id: apptId,
      catalog_id: form.catalog_id,
      tooth: form.tooth || null,
      status: form.status as Procedure["status"],
      amount: Number(form.amount || 0),
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ato registado");
    setDialogOpen(false);
    loadProcedures(apptId);
  }

  async function updateStatus(id: string, status: Procedure["status"]) {
    const { error } = await supabase.from("procedures").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    loadProcedures(apptId!);
  }

  async function removeProcedure(id: string) {
    const { error } = await supabase.from("procedures").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ato removido");
    loadProcedures(apptId!);
  }

  async function saveNotes(notes: string) {
    if (!apptId) return;
    await supabase.from("appointments").update({ notes }).eq("id", apptId);
    setAppt((a) => (a ? { ...a, notes } : a));
    toast.success("Notas guardadas");
  }

  // No appointment selected → picker
  if (!appt) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Consulta Clínica</h1>
          <p className="text-sm text-muted-foreground">Selecione uma marcação para registar atos e abrir o odontograma.</p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Marcações recentes</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {appointments.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">Sem marcações nas últimas semanas.</p>
            )}
            {appointments.map((a) => (
              <button
                key={a.id}
                onClick={() => setParams({ appt: a.id })}
                className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-muted/50 px-2 rounded"
              >
                <div>
                  <div className="font-medium">{a.patient?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtDateShort(a.starts_at)} · {fmtTime(a.starts_at)} · {a.professional?.full_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.specialty && (
                    <Badge style={{ backgroundColor: a.specialty.color + "20", color: a.specialty.color, borderColor: a.specialty.color + "40" }} variant="outline">
                      {a.specialty.name}
                    </Badge>
                  )}
                  <Badge variant="outline">{statusLabels[a.status] ?? a.status}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileHeart className="h-3.5 w-3.5" /> Consulta clínica
          </div>
          <h1 className="font-display text-2xl font-semibold">{appt.patient?.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {fmtDateShort(appt.starts_at)} · {fmtTime(appt.starts_at)}–{fmtTime(appt.ends_at)} · {appt.professional?.full_name}
            {appt.specialty ? ` · ${appt.specialty.name}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => setParams({})}>Trocar marcação</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Odontogram
            selectedTooth={selectedTooth}
            onSelect={(t) => { setSelectedTooth(t); openAdd(t); }}
            states={toothStates}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notas da consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={appt.notes ?? ""}
                placeholder="Anamnese, observações clínicas, plano de tratamento..."
                rows={5}
                onBlur={(e) => {
                  if (e.target.value !== (appt.notes ?? "")) saveNotes(e.target.value);
                }}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Procedimentos ({procedures.length})</CardTitle>
            <Button size="sm" onClick={() => openAdd()}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {procedures.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sem atos registados. Clique num dente do odontograma ou em "Adicionar".
              </p>
            )}
            {procedures.map((p) => (
              <div key={p.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.catalog?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.catalog?.code}
                      {p.tooth ? ` · Dente ${p.tooth}` : ""}
                      {p.notes ? ` · ${p.notes}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmtMoney(p.amount)}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v as Procedure["status"])}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => removeProcedure(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {procedures.length > 0 && (
              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-lg font-semibold">{fmtMoney(total)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar ato clínico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Ato / procedimento</Label>
              <Select value={form.catalog_id} onValueChange={onCatalogChange}>
                <SelectTrigger><SelectValue placeholder="Selecionar do catálogo..." /></SelectTrigger>
                <SelectContent>
                  {catalog.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Dente (FDI)</Label>
                <Input value={form.tooth} onChange={(e) => setForm((f) => ({ ...f, tooth: e.target.value }))} placeholder="ex. 16" />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor (€)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveProcedure}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
