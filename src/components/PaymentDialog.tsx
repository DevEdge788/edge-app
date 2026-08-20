import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/format";

const METHODS: { value: string; label: string }[] = [
  { value: "numerario", label: "Numerário" },
  { value: "multibanco", label: "Multibanco" },
  { value: "mbway", label: "MB Way" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "seguro", label: "Seguro" },
  { value: "outro", label: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: any | null;
  paid: number;
  onSaved: () => void;
}

export function PaymentDialog({ open, onOpenChange, invoice, paid, onSaved }: Props) {
  const outstanding = invoice ? Number(invoice.total) - paid : 0;
  const [amount, setAmount] = useState("0");
  const [method, setMethod] = useState("numerario");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(outstanding > 0 ? outstanding.toFixed(2) : "0");
      setMethod("numerario");
      setNotes("");
    }
  }, [open, invoice?.id]);

  async function save() {
    if (!invoice) return;
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return toast.error("Indique um valor válido");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      amount: value,
      method: method as any,
      notes: notes || null,
      received_by: userData.user?.id ?? null,
    });
    if (error) {
      setSaving(false);
      return toast.error("Não foi possível registar o pagamento", { description: error.message });
    }
    if (paid + value >= Number(invoice.total) - 0.001) {
      await supabase.from("invoices").update({ status: "paga" }).eq("id", invoice.id);
    }
    setSaving(false);
    toast.success("Pagamento registado");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Registar pagamento</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Fatura</span><span className="font-medium">{invoice.number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="tabular-nums">{fmtMoney(invoice.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Em falta</span><span className="tabular-nums font-medium">{fmtMoney(Math.max(outstanding, 0))}</span></div>
            </div>

            <div className="grid gap-2">
              <Label>Valor (€)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Método de pagamento</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Notas</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-gradient-primary" onClick={save} disabled={saving}>Registar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const paymentMethodLabels: Record<string, string> = Object.fromEntries(METHODS.map((m) => [m.value, m.label]));
