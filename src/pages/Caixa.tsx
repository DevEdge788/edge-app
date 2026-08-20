import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Euro, ChevronLeft, ChevronRight } from "lucide-react";
import { fmtMoney, fmtDate, fmtTime, addDays, startOfDay } from "@/lib/format";
import { PaymentDialog, paymentMethodLabels } from "@/components/PaymentDialog";
import { toast } from "sonner";

const invoiceStatusStyles: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground border-border",
  emitida: "bg-warning/10 text-warning-foreground border-warning/40",
  paga: "bg-success/10 text-success border-success/30",
  anulada: "bg-destructive/10 text-destructive border-destructive/30",
};
const invoiceStatusLabels: Record<string, string> = {
  rascunho: "Rascunho", emitida: "Emitida", paga: "Paga", anulada: "Anulada",
};

export default function Caixa() {
  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [invoices, setInvoices] = useState<any[]>([]);
  const [dayPayments, setDayPayments] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => { document.title = "Caixa & Faturação · EDGE+"; }, []);

  async function load() {
    const { data: inv } = await supabase
      .from("invoices")
      .select("*, patients(full_name), payments(id, amount, method, paid_at)")
      .order("issued_at", { ascending: false })
      .limit(200);
    setInvoices(inv ?? []);

    const end = addDays(day, 1);
    const { data: pays } = await supabase
      .from("payments")
      .select("*, invoices(number, patients(full_name))")
      .gte("paid_at", day.toISOString())
      .lt("paid_at", end.toISOString())
      .order("paid_at", { ascending: false });
    setDayPayments(pays ?? []);
  }

  useEffect(() => { load(); }, [day]);

  const paidOf = (inv: any) => (inv.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      (i.patients?.full_name ?? "").toLowerCase().includes(q) || i.number.toLowerCase().includes(q));
  }, [invoices, query]);

  const pendentes = filtered.filter((i) => i.status !== "paga" && i.status !== "anulada");

  const totals = useMemo(() => {
    const byMethod: Record<string, number> = {};
    let total = 0;
    for (const p of dayPayments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount || 0);
      total += Number(p.amount || 0);
    }
    return { byMethod, total };
  }, [dayPayments]);

  const emDivida = invoices
    .filter((i) => i.status !== "anulada")
    .reduce((s, i) => s + Math.max(Number(i.total) - paidOf(i), 0), 0);

  async function anular(inv: any) {
    const { error } = await supabase.from("invoices").update({ status: "anulada" }).eq("id", inv.id);
    if (error) return toast.error("Não foi possível anular", { description: error.message });
    toast.success("Fatura anulada");
    load();
  }

  function renderInvoices(list: any[]) {
    return (
      <div className="rounded-md border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="hidden md:table-cell">Emissão</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Em falta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Sem faturas.</TableCell></TableRow>
            ) : list.map((i) => {
              const paid = paidOf(i);
              const falta = Math.max(Number(i.total) - paid, 0);
              return (
                <TableRow key={i.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium tabular-nums">{i.number}</TableCell>
                  <TableCell>{i.patients?.full_name ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{fmtDate(i.issued_at)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(i.total)}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{fmtMoney(falta)}</TableCell>
                  <TableCell><Badge variant="outline" className={invoiceStatusStyles[i.status]}>{invoiceStatusLabels[i.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {i.status !== "anulada" && falta > 0 && (
                        <Button size="sm" className="bg-gradient-primary gap-1"
                          onClick={() => { setSelected({ ...i, _paid: paid }); setOpen(true); }}>
                          <Euro className="h-3.5 w-3.5" /> Pagar
                        </Button>
                      )}
                      {i.status !== "anulada" && paid === 0 && (
                        <Button size="sm" variant="ghost" onClick={() => anular(i)}>Anular</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Caixa & Faturação</h1>
          <p className="text-muted-foreground">Faturas, pagamentos e fecho de caixa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-44 text-center text-sm font-medium">{fmtDate(day)}</div>
          <Button variant="outline" size="icon" onClick={() => setDay(addDays(day, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Caixa do dia</div>
            <div className="font-display text-3xl text-accent">{fmtMoney(totals.total)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Pagamentos</div>
            <div className="font-display text-3xl">{dayPayments.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total em dívida</div>
            <div className="font-display text-3xl">{fmtMoney(emDivida)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-4 space-y-4">
          <Input className="max-w-md" placeholder="Pesquisar por paciente ou nº de fatura..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <Tabs defaultValue="pendentes">
            <TabsList>
              <TabsTrigger value="pendentes">Por cobrar ({pendentes.length})</TabsTrigger>
              <TabsTrigger value="todas">Todas ({filtered.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pendentes" className="mt-4">{renderInvoices(pendentes)}</TabsContent>
            <TabsContent value="todas" className="mt-4">{renderInvoices(filtered)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl flex items-center gap-2"><Wallet className="h-5 w-5 text-accent" /> Fecho de caixa · {fmtDate(day)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(totals.byMethod).length === 0 ? (
              <span className="text-sm text-muted-foreground">Sem movimentos neste dia.</span>
            ) : Object.entries(totals.byMethod).map(([m, v]) => (
              <div key={m} className="rounded-lg border border-border/60 px-3 py-2">
                <div className="text-xs text-muted-foreground">{paymentMethodLabels[m] ?? m}</div>
                <div className="font-medium tabular-nums">{fmtMoney(v)}</div>
              </div>
            ))}
          </div>

          {dayPayments.length > 0 && (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Hora</TableHead>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums">{fmtTime(p.paid_at)}</TableCell>
                      <TableCell className="tabular-nums">{p.invoices?.number}</TableCell>
                      <TableCell>{p.invoices?.patients?.full_name ?? "—"}</TableCell>
                      <TableCell>{paymentMethodLabels[p.method] ?? p.method}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{fmtMoney(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentDialog open={open} onOpenChange={setOpen} invoice={selected} paid={selected?._paid ?? 0} onSaved={load} />
    </div>
  );
}
