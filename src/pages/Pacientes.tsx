import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Phone, Mail } from "lucide-react";
import { PatientDialog } from "@/components/PatientDialog";
import { usePrimaryRole } from "@/hooks/useAuth";
import { fmtDateShort } from "@/lib/format";

export default function Pacientes() {
  const role = usePrimaryRole();
  const canEdit = role === "admin" || role === "rececionista";
  const [list, setList] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { document.title = "Pacientes · EDGE+"; }, []);

  async function load() {
    let q = supabase.from("patients").select("*").order("full_name").limit(200);
    if (query.trim()) q = q.ilike("full_name", `%${query.trim()}%`);
    const { data } = await q;
    setList(data ?? []);
  }
  useEffect(() => { load(); }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Pacientes</h1>
          <p className="text-muted-foreground">Ficha clínica e contactos</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditId(null); setOpen(true); }} className="bg-gradient-primary gap-2">
            <Plus className="h-4 w-4" /> Novo paciente
          </Button>
        )}
      </div>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar por nome..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Contactos</TableHead>
                  <TableHead className="hidden lg:table-cell">Nascimento</TableHead>
                  <TableHead className="hidden lg:table-cell">Localidade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sem pacientes.</TableCell></TableRow>
                ) : list.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium">{p.full_name}</div>
                      {p.tax_number && <div className="text-xs text-muted-foreground">NIF {p.tax_number}</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {p.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{p.phone}</div>}
                      {p.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{p.email}</div>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm tabular-nums">{p.birth_date ? fmtDateShort(p.birth_date) : "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{p.city ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "outline" : "secondary"} className={p.is_active ? "border-accent/30 text-accent" : ""}>
                        {p.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={() => { setEditId(p.id); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PatientDialog open={open} onOpenChange={setOpen} patientId={editId} onSaved={load} />
    </div>
  );
}
