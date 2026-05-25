import logo from "@/assets/logo-edge.png";

interface Props { className?: string; showWordmark?: boolean }

export function EdgeLogo({ className = "h-10 w-auto", showWordmark = false }: Props) {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="EDGE+ Clínica Dentária" className={className} />
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display text-xl font-semibold tracking-tight">EDGE+</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Clínica Integrada</div>
        </div>
      )}
    </div>
  );
}
