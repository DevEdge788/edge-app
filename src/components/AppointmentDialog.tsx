import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { QuickCreateDialog, type QuickCreateEntity } from "@/components/QuickCreateDialog";
import { toast } from "sonner";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialDate?: Date;
  appointmentId?: string | null;
  onSaved?: () => void;
}

export function AppointmentDialog({ open, onOpenChange, initialDate, appointmentId, onSaved }: Props) {
  const [patients, setPatients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [roomId, setRoomId] = useState<string>("none");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState<string>("agendada");
  const [notes, setNotes] = useState("");
  const [quick, setQuick] = useState<QuickCreateEntity | null>(null);

  async function loadRefs() {
    const [p, pr, sp, rm] = await Promise.all([
      supabase.from("patients").select("id, full_name").eq("is_active", true).order("full_name"),
      supabase.from("professionals").select("id, full_name, specialty_id").eq("is_active", true).order("full_name"),
      supabase.from("specialties").select("id, name").eq("is_active", true).order("display_order"),
      supabase.from("rooms").select("id, name").eq("is_active", true).order("name"),
    ]);
    setPatients(p.data ?? []);
    setProfessionals(pr.data ?? []);
    setSpecialties(sp.data ?? []);
    setRooms(rm.data ?? []);
  }

  useEffect(() => {
    if (!open) return;
    (async () => {
      await loadRefs();

      setRooms(rm.data ?? []);

      if (appointmentId) {
        const { data } = await supabase.from("appointments").select("*").eq("id", appointmentId).maybeSingle();
        if (data) {
          setPatientId(data.patient_id);
          setProfessionalId(data.professional_id);
          setSpecialtyId(data.specialty_id ?? "");
          setRoomId(data.room_id ?? "none");
          const s = new Date(data.starts_at);
          setDate(s.toISOString().slice(0, 10));
          setTime(s.toTimeString().slice(0, 5));
          setDuration(Math.round((new Date(data.ends_at).getTime() - s.getTime()) / 60000));
          setStatus(data.status);
          setNotes(data.notes ?? "");
        }
      } else {
        const d = initialDate ?? new Date();
        setDate(d.toISOString().slice(0, 10));
        setTime(d.getHours() ? d.toTimeString().slice(0, 5) : "09:00");
        setPatientId(""); setProfessionalId(""); setSpecialtyId(""); setRoomId("none");
        setDuration(30); setStatus("agendada"); setNotes("");
      }
    })();
  }, [open, appointmentId, initialDate]);

  useEffect(() => {
    if (!professionalId) return;
    const pr = professionals.find((p) => p.id === professionalId);
    if (pr?.specialty_id && !specialtyId) setSpecialtyId(pr.specialty_id);
  }, [professionalId, professionals]);

  async function handleSave() {
    if (!patientId || !professionalId || !date || !time) {
      toast.error("Preencha paciente, profissional e horário.");
      return;
    }
    setLoading(true);
    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + duration * 60000);
    const payload = {
      patient_id: patientId,
      professional_id: professionalId,
      specialty_id: specialtyId || null,
      room_id: roomId === "none" ? null : roomId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: status as any,
      notes: notes || null,
    };
    const { error } = appointmentId
      ? await supabase.from("appointments").update(payload).eq("id", appointmentId)
      : await supabase.from("appointments").insert(payload);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível guardar", { description: error.message });
      return;
    }
    toast.success(appointmentId ? "Marcação atualizada" : "Marcação criada");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {appointmentId ? "Editar marcação" : "Nova marcação"}
          </DialogTitle>
          <DialogDescription>Agenda da Clínica EDGE+</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecionar paciente" /></SelectTrigger>
              <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select value={specialtyId} onValueChange={setSpecialtyId}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{specialties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duração (min)</Label>
            <Input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Sala</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— sem sala —</SelectItem>
                {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="em_curso">Em curso</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="faltou">Faltou</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notas</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-gradient-primary">
            {loading ? "A guardar..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
