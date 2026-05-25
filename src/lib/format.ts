export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

export const fmtDateShort = (d: Date | string) =>
  new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

export const fmtMoney = (v: number | string) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(v));

export const fmtWeekday = (d: Date) =>
  new Intl.DateTimeFormat("pt-PT", { weekday: "long" }).format(d);

export const startOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
};

export const statusColors: Record<string, string> = {
  agendada: "bg-muted text-muted-foreground border-border",
  confirmada: "bg-accent/10 text-accent border-accent/30",
  em_curso: "bg-warning/10 text-warning-foreground border-warning/40",
  concluida: "bg-success/10 text-success border-success/30",
  cancelada: "bg-destructive/10 text-destructive border-destructive/30",
  faltou: "bg-destructive/10 text-destructive border-destructive/30",
};

export const statusLabels: Record<string, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  em_curso: "Em curso",
  concluida: "Concluída",
  cancelada: "Cancelada",
  faltou: "Faltou",
};
