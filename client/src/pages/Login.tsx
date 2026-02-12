import { useState } from "react";
import { useLocation } from "wouter";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, LogIn, HandCoins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const generatedCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: generatedCode }),
      });
      if (!res.ok) throw new Error("Erro ao criar evento");
      const data = await res.json();
      localStorage.setItem("game_session", JSON.stringify(data));
      setLocation("/");
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a pelada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${code.toUpperCase()}`);
      if (!res.ok) throw new Error("Fut não encontrado");
      const data = await res.json();
      localStorage.setItem("game_session", JSON.stringify(data));
      setLocation("/");
    } catch (err) {
      toast({
        title: "Ops! Algo está errado.",
        description: "Código inválido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl">
        <div className="text-center space-y-2">
          <HandCoins className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">
            FUT NA MÃO
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu futebol de forma simples e prática.
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Já tem um código?</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="Ex: AB12CD"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="uppercase font-mono"
                />
                <ShinyButton type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                </ShinyButton>
              </div>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou crie uma nova
              </span>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Pelada</Label>
              <Input
                id="name"
                placeholder="Ex: Pelada dos Amigos"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <ShinyButton type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              CRIAR NOVO FUT
            </ShinyButton>
          </form>
        </div>
      </div>
    </div>
  );
}
