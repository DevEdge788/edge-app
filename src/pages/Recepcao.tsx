import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LogIn, Play, Check, UserX, Receipt, Clock } from "lucide-react";
import { fmtTime, fmtMoney, statusColors, statusLabels } from "@/lib/format";
import { useNavigate } from "react-router-dom";

type Appt = any;

export default function Recepcao() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Appt[]>([]);
  const [toBill, setToBill] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Receção · EDGE+"; }, []);

  async function load() {
    setLoading(true);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);

    const { data: appts } = await supabase
      .from("appointments")
      .select("*, patients(full_name, phone), professionals(full_name), specialties(name, color)")
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .order("starts_at");

    setQueue((appts ?? []).filter((a: any) => !["cancelada"].includes(a.status)));

    // por cobrar: marcações concluídas sem fatura
    const { data: done } = await supabase
      .from("appointments")
      .select("*, patients(full_name), professionals(full_name), procedures(id, amount, status, tooth, procedure_catalog(name))")
      .eq("status", "concluida")
      .order("starts_at", { ascending: false })
      .limit(100);

    const { data: invs } = await supabase.from("invoices").select("appointment_id").not("appointment_id", "is", null);
    const billed = new Set((invs ?? []).map((i: any) => i.appointment_id));

    setToBill((done ?? []).filter((a: any) => !billed.has(a.id)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(a: Appt, status: string, checkIn = false) {
    const payload: any = { status };
    if (checkIn) payload.checked_in_at = new Date().toISOString();
    const { error } = await supabase.from("appointments").update(payload).eq("id", a.id);
    if (error) return toast.error("Não foi possível atualizar", { description: error.message });
    toast.success("Marcação atualizada");
    load();
  }

  async function criarFatura(a: any) {
    const procs = (a.procedures ?? []).filter((p: any) => p.status !== "cancelado");
    const subtotal = procs.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

    const { data: inv, error } = await supabase
      .from("invoices")
      .insert({
        patient_id: a.patient_id,
        appointment_id: a.id,
        status: "emitida",
        subtotal,
        discount: 0,
        total: subtotal,
      })
      .select("id, number")
      .single();

    if (error || !inv) return toast.error("Não foi possível emitir a fatura", { description: error?.message });

    if (procs.length) {
      await supabase.from("invoice_items").insert(
        procs.map((p: any) => ({
          invoice_id: inv.id,
          procedure_id: p.id,
          description: `${p.procedure_catalog?.name ?? "Ato clínico"}${p.tooth ? ` · dente ${p.tooth}` : ""}`,
          quantity: 1,
          unit_price: Number(p.amount || 0),
          total: Number(p.amount || 0),
        })),
      );
      await supabase.from("procedures").update({ status: "faturado" }).in("id", procs.map((p: any) => p.id));
    }

    toast.success(`Fatura ${inv.number} emitida`);
    navigate("/caixa");
  }

  const esperaCount = queue.filter((a) => a.checked_in_at && a.status !== "concluida" && a.status !== "em_curso").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Receção</h1>
        <p className="text-muted-foreground">Fila de espera de hoje e atos por cobrar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Marcações hoje</div>
            <div className="font-display text-3xl">{queue.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Em sala de espera</div>
            <div className="font-display text-3xl text-accent">{esperaCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Por cobrar</div>
            <div className="font-display text-3xl">{toBill.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Fila de espera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Profissional</TableHead>
                  <TableHead className="hidden lg:table-cell">Chegada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">A carregar…</TableCell></TableRow>
                ) : queue.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sem marcações para hoje.</TableCell></TableRow>
                ) : queue.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="tabular-nums font-medium">{fmtTime(a.starts_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{a.patients?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.specialties?.name ?? "—"}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{a.professionals?.full_name}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm tabular-nums">{a.checked_in_at ? fmtTime(a.checked_in_at) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[a.status]}>{statusLabels[a.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {!a.checked_in_at && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(a, "confirmada", true)}>
                            <LogIn className="h-3.5 w-3.5" /> Chegou
                          </Button>
                        )}
                        {a.status !== "em_curso" && a.status !== "concluida" && (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(a, "em_curso")}><Play className="h-3.5 w-3.5" /></Button>
                        )}
                        {a.status !== "concluida" && (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(a, "concluida")}><Check className="h-3.5 w-3.5" /></Button>
                        )}
                        {a.status !== "faltou" && (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(a, "faltou")}><UserX className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl flex items-center gap-2"><Receipt className="h-5 w-5 text-accent" /> Por cobrar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Profissional</TableHead>
                  <TableHead className="hidden lg:table-cell">Atos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toBill.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nada por cobrar.</TableCell></TableRow>
                ) : toBill.map((a) => {
                  const procs = (a.procedures ?? []).filter((p: any) => p.status !== "cancelado");
                  const total = procs.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{a.patients?.full_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{a.professionals?.full_name}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{procs.length} ato(s)</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmtMoney(total)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-gradient-primary gap-1" onClick={() => criarFatura(a)}>
                          <Receipt className="h-3.5 w-3.5" /> Emitir fatura
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
