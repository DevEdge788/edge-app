import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{title}</h1>
      <Card className="border-dashed border-2 border-border/80 bg-muted/30">
        <CardContent className="p-12 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <Construction className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl">Em construção</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {description ?? "Este módulo estará disponível numa fase seguinte do projeto. A fundação está pronta."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
