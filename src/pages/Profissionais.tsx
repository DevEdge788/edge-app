import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { usePrimaryRole } from "@/hooks/useAuth";
import { toast } from "sonner";

const empty = { full_name: "", specialty_id: "", email: "", phone: "", license_number: "", commission_pct: 40, agenda_color: "#003B7A" };

export default function Profissionais() {
  const role = usePrimaryRole();
  const isAdmin = role === "admin";
  const [list, setList] = useState<any[]>([]);
  const [specs, setSpecs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Profissionais · EDGE+"; }, []);

  async function load() {
    const [p, s] = await Promise.all([
      supabase.from("professionals").select("*, specialties(name, color)").order("full_name"),
      supabase.from("specialties").select("id, name").order("display_order"),
    ]);
    setList(p.data ?? []); setSpecs(s.data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function openEdit(id: string | null) {
    setEditId(id);
    if (id) {
      const { data } = await supabase.from("professionals").select("*").eq("id", id).maybeSingle();
      if (data) setForm({ ...empty, ...data, specialty_id: data.specialty_id ?? "" });
    } else setForm(empty);
    setOpen(true);
  }

  async function save() {
    if (!form.full_name?.trim()) return toast.error("Nome é obrigatório.");
    setLoading(true);
    const payload = { ...form, specialty_id: form.specialty_id || null, commission_pct: Number(form.commission_pct) || 0 };
    const { error } = editId
      ? await supabase.from("professionals").update(payload).eq("id", editId)
      : await supabase.from("professionals").insert(payload);
    setLoading(false);
    if (error) return toast.error("Erro ao guardar", { description: error.message });
    toast.success("Guardado");
    setOpen(false); load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Profissionais</h1>
          <p className="text-muted-foreground">Equipa clínica EDGE+</p>
        </div>
        {isAdmin && (
          <Button onClick={() => openEdit(null)} className="bg-gradient-primary gap-2">
            <Plus className="h-4 w-4" /> Novo profissional
          </Button>
        )}
      </div>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-4">
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.agenda_color }} />
                        <span className="font-medium">{p.full_name}</span>
                      </div>
                      {p.license_number && <div className="text-xs text-muted-foreground ml-4">Cédula {p.license_number}</div>}
                    </TableCell>
                    <TableCell>
                      {p.specialties?.name && (
                        <Badge variant="outline" style={{ borderColor: p.specialties.color, color: p.specialties.color }}>
                          {p.specialties.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{p.email ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{p.phone ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.commission_pct}%</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "outline" : "secondary"} className={p.is_active ? "border-accent/30 text-accent" : ""}>
                        {p.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editId ? "Editar profissional" : "Novo profissional"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Nome *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select value={form.specialty_id || undefined} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{specs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cédula</Label><Input value={form.license_number ?? ""} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" min={0} max={100} value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} /></div>
            <div className="space-y-2"><Label>Cor de agenda</Label><Input type="color" value={form.agenda_color} onChange={(e) => setForm({ ...form, agenda_color: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading} className="bg-gradient-primary">{loading ? "A guardar..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
