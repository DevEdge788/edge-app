import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

type Row = { user_id: string; clock_in: string; clock_out: string | null };

const round2 = (n: number) => Math.round(n * 100) / 100;

const isoWeek = (d: Date) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((x.getTime() - y0.getTime()) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-S${String(w).padStart(2, "0")}`;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const timeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Exports time entries for the month containing `day` (so weekly/monthly totals are complete). */
export async function exportPontoExcel(day: Date) {
  const from = new Date(day.getFullYear(), day.getMonth(), 1);
  const to = new Date(day.getFullYear(), day.getMonth() + 1, 1);

  const { data, error } = await supabase
    .from("time_entries")
    .select("user_id, clock_in, clock_out")
    .gte("clock_in", from.toISOString())
    .lt("clock_in", to.toISOString())
    .order("clock_in");
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
    profs?.forEach((p) => names.set(p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || p.id));
  }
  const nameOf = (id: string) => names.get(id) ?? id;

  const now = new Date();
  const detail = rows.map((r) => {
    const ci = new Date(r.clock_in);
    const co = r.clock_out ? new Date(r.clock_out) : null;
    const hours = round2(((co ?? now).getTime() - ci.getTime()) / 3600000);
    return {
      Profissional: nameOf(r.user_id),
      Data: dateKey(ci),
      Semana: isoWeek(ci),
      Mês: monthKey(ci),
      Entrada: timeStr(ci),
      Saída: co ? timeStr(co) : "em aberto",
      Horas: hours,
    };
  });

  const agg = (key: (d: (typeof detail)[number]) => string, label: string) => {
    const m = new Map<string, { Profissional: string; [k: string]: string | number }>();
    for (const d of detail) {
      const k = `${d.Profissional}|${key(d)}`;
      const cur = m.get(k) ?? { Profissional: d.Profissional, [label]: key(d), Registos: 0, Horas: 0 };
      cur.Registos = (cur.Registos as number) + 1;
      cur.Horas = round2((cur.Horas as number) + d.Horas);
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) =>
      a.Profissional.localeCompare(b.Profissional) || String(a[label]).localeCompare(String(b[label])),
    );
  };

  const wb = XLSX.utils.book_new();
  const sheet = (name: string, json: object[], widths: number[]) => {
    const ws = XLSX.utils.json_to_sheet(json);
    ws["!cols"] = widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  const todayKey = dateKey(day);
  sheet("Hoje", detail.filter((d) => d.Data === todayKey), [28, 12, 10, 9, 9, 10, 8]);
  sheet("Registos", detail, [28, 12, 10, 9, 9, 10, 8]);
  sheet("Diário", agg((d) => d.Data, "Data"), [28, 12, 10, 8]);
  sheet("Semanal", agg((d) => d.Semana, "Semana"), [28, 12, 10, 8]);
  sheet("Mensal", agg((d) => d.Mês, "Mês"), [28, 12, 10, 8]);

  XLSX.writeFile(wb, `ponto_${monthKey(day)}.xlsx`);
  return detail.length;
}
