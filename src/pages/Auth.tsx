import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EdgeLogo } from "@/components/EdgeLogo";

export default function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    document.title = "Entrar · EDGE+ Clínica";
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/", { replace: true });
    });
  }, [nav]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Não foi possível entrar", { description: error.message });
    toast.success("Bem-vindo de volta à EDGE+");
    nav("/", { replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    setLoading(false);
    if (error) return toast.error("Não foi possível registar", { description: error.message });
    toast.success("Conta criada", { description: "Já pode iniciar sessão." });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-primary text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <EdgeLogo className="h-16 w-auto brightness-0 invert" />
        <div className="relative z-10 space-y-4 max-w-md">
          <h1 className="font-display text-5xl leading-tight">A identidade que reflete cuidado, confiança e excelência.</h1>
          <p className="text-primary-foreground/80 text-lg">
            Plataforma integrada da Clínica EDGE+ para gestão de pacientes, agenda, atos clínicos e faturação.
          </p>
        </div>
        <p className="relative z-10 text-sm text-primary-foreground/70">
          Rua Direita de Massamá 106 B · Massamá – Queluz · 911 001 909
        </p>
      </div>

      <div className="flex items-center justify-center p-6 bg-gradient-surface">
        <Card className="w-full max-w-md shadow-elegant border-border/60">
          <CardHeader className="space-y-3 text-center">
            <div className="flex lg:hidden justify-center"><EdgeLogo className="h-14 w-auto" /></div>
            <CardTitle className="font-display text-3xl">Aceder à plataforma</CardTitle>
            <CardDescription>Use as suas credenciais EDGE+</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="le">Email</Label>
                    <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp">Palavra-passe</Label>
                    <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95" disabled={loading}>
                    {loading ? "A entrar..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="fn">Nome</Label>
                      <Input id="fn" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ln">Apelido</Label>
                      <Input id="ln" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="se">Email</Label>
                    <Input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp">Palavra-passe</Label>
                    <Input id="sp" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95" disabled={loading}>
                    {loading ? "A registar..." : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Ao registar-se concorda com as políticas de privacidade da Clínica EDGE+.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
