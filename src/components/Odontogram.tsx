import { cn } from "@/lib/utils";

// FDI numbering
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

export type ToothState = {
  count: number;
  status?: "planeado" | "em_execucao" | "concluido" | "cancelado";
};

interface OdontogramProps {
  selectedTooth?: string | null;
  onSelect: (tooth: string) => void;
  states?: Record<string, ToothState>;
}

const statusFill: Record<string, string> = {
  planeado: "fill-warning/30 stroke-warning",
  em_execucao: "fill-accent/30 stroke-accent",
  concluido: "fill-success/30 stroke-success",
  cancelado: "fill-destructive/20 stroke-destructive",
};

function Tooth({
  num,
  selected,
  state,
  onClick,
}: {
  num: number;
  selected: boolean;
  state?: ToothState;
  onClick: () => void;
}) {
  const fill = state?.status ? statusFill[state.status] : "fill-background stroke-border";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-1 rounded-md px-1 py-1 transition",
        selected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted",
      )}
      title={`Dente ${num}${state?.count ? ` — ${state.count} ato(s)` : ""}`}
    >
      <svg width="22" height="28" viewBox="0 0 22 28" className={cn("transition", fill)} strokeWidth={1.2}>
        <path d="M4 4 C4 1, 8 1, 11 2 C14 1, 18 1, 18 4 L18 16 C18 22, 15 26, 11 26 C7 26, 4 22, 4 16 Z" />
      </svg>
      <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground">{num}</span>
      {state?.count ? (
        <span className="absolute mt-7 ml-5 text-[9px] font-bold text-primary">{state.count}</span>
      ) : null}
    </button>
  );
}

export function Odontogram({ selectedTooth, onSelect, states = {} }: OdontogramProps) {
  const render = (nums: number[]) =>
    nums.map((n) => (
      <Tooth
        key={n}
        num={n}
        selected={selectedTooth === String(n)}
        state={states[String(n)]}
        onClick={() => onSelect(String(n))}
      />
    ));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between border-b pb-2 mb-3">
        <h3 className="font-display text-sm font-semibold">Odontograma</h3>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-warning/60" />Planeado</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent/60" />Em curso</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-success/60" />Concluído</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="flex justify-end gap-0.5">{render(UPPER_RIGHT)}</div>
          <div className="h-12 w-px bg-border" />
          <div className="flex gap-0.5">{render(UPPER_LEFT)}</div>
        </div>
        <div className="h-px bg-border" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <div className="flex justify-end gap-0.5">{render(LOWER_RIGHT)}</div>
          <div className="h-12 w-px bg-border" />
          <div className="flex gap-0.5">{render(LOWER_LEFT)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Maxilar Superior</span>
        <span>Maxilar Inferior</span>
      </div>
    </div>
  );
}
