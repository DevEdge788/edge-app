import { useEffect, useMemo, useState } from "react";
import { Clock, FileSpreadsheet, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usePrimaryRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { fmtDateShort, fmtTime, startOfDay } from "@/lib/format";
import { exportPontoExcel } from "@/lib/exportPonto";

type Entry = { id: string; clock_in: string; clock_out: string | null };

const MIN_MS = 5 * 60 * 1000;

const fmtDuration = (ms: number) => {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
};

export default function RelogioPonto() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("time_entries")
      .select("id, clock_in, clock_out")
      .eq("user_id", user.id)
      .gte("clock_in", startOfDay(new Date()).toISOString())
      .order("clock_in", { ascending: false });
    setEntries((data ?? []) as Entry[]);
  }
  useEffect(() => { load(); }, [user?.id]);

  const open = entries.find((e) => !e.clock_out);
  const lastOut = entries.filter((e) => e.clock_out).map((e) => new Date(e.clock_out!).getTime()).sort((a, b) => b - a)[0];

  const waitMs = useMemo(() => {
    if (open) return Math.max(0, new Date(open.clock_in).getTime() + MIN_MS - now.getTime());
    if (lastOut) return Math.max(0, lastOut + MIN_MS - now.getTime());
    return 0;
  }, [open, lastOut, now]);

  const totalMs = entries.reduce((acc, e) => {
    const end = e.clock_out ? new Date(e.clock_out).getTime() : now.getTime();
    return acc + (end - new Date(e.clock_in).getTime());
  }, 0);

  async function clockIn() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("time_entries").insert({ user_id: user.id });
    setBusy(false);
    if (error) return toast({ title: "Não foi possível registar a entrada", description: error.message, variant: "destructive" });
    toast({ title: "Entrada registada", description: fmtTime(new Date()) });
    load();
  }

  async function clockOut() {
    if (!open) return;
    setBusy(true);
    const { error } = await supabase.from("time_entries").update({ clock_out: new Date().toISOString() }).eq("id", open.id);
    setBusy(false);
    if (error) return toast({ title: "Não foi possível registar a saída", description: error.message, variant: "destructive" });
    toast({ title: "Saída registada", description: fmtTime(new Date()) });
    load();
  }

  async function exportExcel() {
    setExporting(true);
    try {
      const n = await exportPontoExcel(new Date());
      toast({ title: "Excel exportado", description: `${n} registos do mês incluídos.` });
    } catch (e: any) {
      toast({ title: "Não foi possível exportar", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Relógio de Ponto</h1>
          <p className="text-sm text-muted-foreground">{fmtDateShort(now)} · registos de hoje</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={exportExcel} disabled={exporting}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {exporting ? "A exportar..." : "Exportar Excel"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="flex items-center gap-3 text-primary">
              <Clock className="h-8 w-8" />
              <span className="font-display text-5xl font-semibold tabular-nums">
                {now.toLocaleTimeString("pt-PT")}
              </span>
            </div>
            <Badge variant={open ? "default" : "secondary"} className="text-sm">
              {open ? `Em serviço desde ${fmtTime(open.clock_in)}` : "Fora de serviço"}
            </Badge>
            {open ? (
              <Button size="lg" variant="destructive" onClick={clockOut} disabled={busy || waitMs > 0} className="min-w-52">
                <LogOut className="mr-2 h-5 w-5" /> Registar saída
              </Button>
            ) : (
              <Button size="lg" onClick={clockIn} disabled={busy || waitMs > 0} className="min-w-52">
                <LogIn className="mr-2 h-5 w-5" /> Registar entrada
              </Button>
            )}
            {waitMs > 0 && (
              <p className="text-xs text-muted-foreground">
                Intervalo mínimo de 5 minutos — disponível em {Math.ceil(waitMs / 1000)}s
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumo do dia</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Registos</span><span className="font-medium">{entries.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tempo total</span><span className="font-medium tabular-nums">{fmtDuration(totalMs)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Entradas e saídas</CardTitle></CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem registos hoje.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2 font-medium">Entrada</th><th className="py-2 font-medium">Saída</th><th className="py-2 font-medium text-right">Duração</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="py-2">{fmtTime(e.clock_in)}</td>
                    <td className="py-2">{e.clock_out ? fmtTime(e.clock_out) : <Badge variant="outline">em aberto</Badge>}</td>
                    <td className="py-2 text-right tabular-nums">
                      {fmtDuration((e.clock_out ? new Date(e.clock_out).getTime() : now.getTime()) - new Date(e.clock_in).getTime())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
