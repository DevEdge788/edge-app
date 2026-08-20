import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export type QuickCreateEntity = "patient" | "professional" | "specialty" | "room";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity: QuickCreateEntity;
  onCreated?: (id: string) => void;
}

const titles: Record<QuickCreateEntity, string> = {
  patient: "Novo paciente",
  professional: "Novo profissional",
  specialty: "Nova especialidade",
  room: "Novo gabinete",
};

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function QuickCreateDialog({ open, onOpenChange, entity, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!open) return;
    setForm({ color: "#11B8B5", capacity: 1, commission_pct: 0 });
    if (entity === "professional") {
      supabase.from("specialties").select("id, name").eq("is_active", true).order("display_order")
        .then(({ data }) => setSpecialties(data ?? []));
    }
  }, [open, entity]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.name && !form.full_name) {
      toast.error("Indique o nome.");
      return;
    }
    setLoading(true);
    let res: any;
    if (entity === "patient") {
      res = await supabase.from("patients").insert({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
      }).select("id").single();
    } else if (entity === "professional") {
      res = await supabase.from("professionals").insert({
        full_name: form.full_name,
        specialty_id: form.specialty_id || null,
        email: form.email || null,
        phone: form.phone || null,
        commission_pct: Number(form.commission_pct) || 0,
      }).select("id").single();
    } else if (entity === "specialty") {
      res = await supabase.from("specialties").insert({
        name: form.name,
        slug: slugify(form.name),
        color: form.color || "#11B8B5",
      }).select("id").single();
    } else {
      res = await supabase.from("rooms").insert({
        name: form.name,
        room_type: form.room_type || null,
        capacity: Number(form.capacity) || 1,
      }).select("id").single();
    }
    setLoading(false);
    if (res.error) {
      toast.error("Não foi possível criar", { description: res.error.message });
      return;
    }
    toast.success("Criado com sucesso");
    onOpenChange(false);
    onCreated?.(res.data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{titles[entity]}</DialogTitle>
          <DialogDescription>Criação rápida — pode completar os restantes dados mais tarde.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {(entity === "patient" || entity === "professional") && (
            <>
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telemóvel</Label>
                <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </>
          )}
          {entity === "professional" && (
            <>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={form.specialty_id ?? ""} onValueChange={(v) => set("specialty_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{specialties.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input type="number" min={0} max={100} value={form.commission_pct ?? 0} onChange={(e) => set("commission_pct", e.target.value)} />
              </div>
            </>
          )}
          {entity === "specialty" && (
            <>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" className="h-10 w-20 p-1" value={form.color ?? "#11B8B5"} onChange={(e) => set("color", e.target.value)} />
              </div>
            </>
          )}
          {entity === "room" && (
            <>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input value={form.room_type ?? ""} onChange={(e) => set("room_type", e.target.value)} placeholder="Ex.: Consultório" />
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input type="number" min={1} value={form.capacity ?? 1} onChange={(e) => set("capacity", e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={loading} className="bg-gradient-primary">
            {loading ? "A guardar..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
