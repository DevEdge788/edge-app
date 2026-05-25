import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientId?: string | null;
  onSaved?: () => void;
}

const empty = {
  full_name: "", tax_number: "", email: "", phone: "", birth_date: "",
  gender: "nao_especificado", address: "", postal_code: "", city: "", clinical_notes: "",
};

export function PatientDialog({ open, onOpenChange, patientId, onSaved }: Props) {
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (patientId) {
      supabase.from("patients").select("*").eq("id", patientId).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...data, birth_date: data.birth_date ?? "" });
      });
    } else {
      setForm(empty);
    }
  }, [open, patientId]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.full_name?.trim()) { toast.error("Nome do paciente é obrigatório."); return; }
    setLoading(true);
    const payload = { ...form, birth_date: form.birth_date || null };
    const { error } = patientId
      ? await supabase.from("patients").update(payload).eq("id", patientId)
      : await supabase.from("patients").insert(payload);
    setLoading(false);
    if (error) return toast.error("Não foi possível guardar", { description: error.message });
    toast.success(patientId ? "Paciente atualizado" : "Paciente criado");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{patientId ? "Editar paciente" : "Novo paciente"}</DialogTitle>
          <DialogDescription>Ficha clínica e contactos</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome completo *</Label>
            <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-2"><Label>NIF</Label><Input value={form.tax_number ?? ""} onChange={(e) => set("tax_number", e.target.value)} /></div>
          <div className="space-y-2"><Label>Data de nascimento</Label><Input type="date" value={form.birth_date ?? ""} onChange={(e) => set("birth_date", e.target.value)} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Género</Label>
            <Select value={form.gender ?? "nao_especificado"} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
                <SelectItem value="nao_especificado">Não especificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Código postal</Label><Input value={form.postal_code ?? ""} onChange={(e) => set("postal_code", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Morada</Label><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Localidade</Label><Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notas clínicas</Label>
            <Textarea rows={3} value={form.clinical_notes ?? ""} onChange={(e) => set("clinical_notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={loading} className="bg-gradient-primary">{loading ? "A guardar..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
