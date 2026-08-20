import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Send, MessageSquare, Mail, Smartphone, Check, X, RefreshCw } from "lucide-react";
import { fmtDateShort, fmtTime } from "@/lib/format";

const channelIcon: Record<string, any> = { sms: Smartphone, whatsapp: MessageSquare, email: Mail };
const channelLabel: Record<string, string> = { sms: "SMS", whatsapp: "WhatsApp", email: "Email" };

const confColors: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground border-border",
  confirmada: "bg-success/10 text-success border-success/30",
  recusada: "bg-destructive/10 text-destructive border-destructive/30",
  reagendar: "bg-warning/10 text-warning-foreground border-warning/40",
};
const confLabels: Record<string, string> = {
  pendente: "Pendente", confirmada: "Confirmada", recusada: "Recusada", reagendar: "Remarcar",
};
const logColors: Record<string, string> = {
  simulado: "bg-accent/10 text-accent border-accent/30",
  enviado: "bg-success/10 text-success border-success/30",
  falhado: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Lembretes() {
  const [logs, setLogs] = useState<any[]>([]);
  const [confs, setConfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState("todos");
  const [status, setStatus] = useState("todos");

  useEffect(() => { document.title = "Lembretes e confirmações · EDGE+"; }, []);

  async function load() {
    setLoading(true);
    const [l, c] = await Promise.all([
      supabase.from("notification_logs")
        .select("*, patients(full_name), appointments(starts_at)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("appointment_confirmations")
        .select("*, appointments(starts_at, status, patients(full_name), professionals(full_name))")
        .order("sent_at", { ascending: false })
        .limit(100),
    ]);
    setLogs(l.data ?? []);
    setConfs(c.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function enviarLembretes(daysAhead: number) {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-appointment-reminders", {
      body: { days_ahead: daysAhead },
    });
    setSending(false);
    if (error) return toast.error("Não foi possível enviar", { description: error.message });
    toast.success(`${data?.sent ?? 0} mensagens simuladas`, {
      description: `${data?.appointments ?? 0} marcação(ões) para ${data?.target_date ?? ""}`,
    });
    load();
  }

  async function responder(c: any, resposta: string) {
    const { error } = await supabase
      .from("appointment_confirmations")
      .update({ status: resposta as any, responded_at: new Date().toISOString(), response_source: "recepcao" })
      .eq("id", c.id);
    if (error) return toast.error("Não foi possível registar", { description: error.message });

    if (resposta === "confirmada") await supabase.from("appointments").update({ status: "confirmada" }).eq("id", c.appointment_id);
    if (resposta === "recusada") await supabase.from("appointments").update({ status: "cancelada" }).eq("id", c.appointment_id);
    toast.success("Resposta registada");
    load();
  }

  const filtered = useMemo(() => logs.filter((l) =>
    (channel === "todos" || l.channel === channel) && (status === "todos" || l.status === status)
  ), [logs, channel, status]);

  const pendentes = confs.filter((c) => c.status === "pendente").length;
  const confirmadas = confs.filter((c) => c.status === "confirmada").length;
  const taxa = confs.length ? Math.round((confirmadas / confs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Lembretes e confirmações</h1>
          <p className="text-muted-foreground">Envios automáticos no dia anterior às 09:00 · providers em modo simulado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          <Button onClick={() => enviarLembretes(1)} disabled={sending} className="bg-gradient-primary gap-2">
            <Send className="h-4 w-4" /> {sending ? "A enviar…" : "Enviar lembretes de amanhã"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Confirmações pendentes", value: pendentes, cls: "text-warning-foreground" },
          { label: "Confirmadas", value: confirmadas, cls: "text-success" },
          { label: "Taxa de confirmação", value: `${taxa}%`, cls: "text-accent" },
          { label: "Mensagens registadas", value: logs.length, cls: "" },
        ].map((s) => (
          <Card key={s.label} className="shadow-card border-border/60">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`font-display text-3xl ${s.cls}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl flex items-center gap-2"><Bell className="h-5 w-5 text-accent" /> Confirmações de consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Consulta</TableHead>
                  <TableHead className="hidden lg:table-cell">Profissional</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Registar resposta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">A carregar…</TableCell></TableRow>
                ) : confs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Ainda não foram enviados lembretes.</TableCell></TableRow>
                ) : confs.map((c) => {
                  const Icon = channelIcon[c.channel] ?? Bell;
                  const a = c.appointments;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{a?.patients?.full_name ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm tabular-nums">
                        {a?.starts_at ? `${fmtDateShort(a.starts_at)} · ${fmtTime(a.starts_at)}` : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{a?.professionals?.full_name ?? "—"}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1.5 text-sm"><Icon className="h-3.5 w-3.5 text-accent" />{channelLabel[c.channel]}</span></TableCell>
                      <TableCell><Badge variant="outline" className={confColors[c.status]}>{confLabels[c.status]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Confirmada" onClick={() => responder(c, "confirmada")}><Check className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" title="Recusada" onClick={() => responder(c, "recusada")}><X className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" title="Remarcar" onClick={() => responder(c, "reagendar")}><RefreshCw className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2 flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="font-display text-xl">Registo de envios</CardTitle>
          <div className="flex gap-2">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os canais</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="simulado">Simulado</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="falhado">Falhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Data/hora</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="hidden md:table-cell">Destinatário</TableHead>
                  <TableHead className="hidden lg:table-cell">Provider</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden xl:table-cell">Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sem registos.</TableCell></TableRow>
                ) : filtered.map((l) => {
                  const Icon = channelIcon[l.channel] ?? Bell;
                  return (
                    <TableRow key={l.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm tabular-nums">{fmtDateShort(l.created_at)} · {fmtTime(l.created_at)}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1.5 text-sm"><Icon className="h-3.5 w-3.5 text-accent" />{channelLabel[l.channel]}</span></TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{l.recipient ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{l.provider}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={logColors[l.status]}>{l.status}</Badge>
                        {l.error_message && <div className="text-xs text-destructive mt-1">{l.error_message}</div>}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell max-w-md truncate text-xs text-muted-foreground">{l.content ?? "—"}</TableCell>
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
