import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, buildUrl } from "@shared/routes";
import { Trophy, Users, LogIn, Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const createSession = useMutation({
    mutationFn: async (name: string) => {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const res = await fetch(api.sessions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: generatedCode })
      });
      if (!res.ok) throw new Error("Erro ao criar pelada");
      return await res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("game_session", data.id.toString());
      localStorage.setItem("game_session_code", data.code);
      localStorage.setItem("game_session_name", data.name);
      setLocation("/");
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const joinSession = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(buildUrl(api.sessions.get.path, { code: code.toUpperCase() }));
      if (!res.ok) throw new Error("Pelada não encontrada");
      return await res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("game_session", data.id.toString());
      localStorage.setItem("game_session_code", data.code);
      localStorage.setItem("game_session_name", data.name);
      setLocation("/");
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2"><Trophy className="w-12 h-12" /></div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-primary">PELADA MANAGER</h1>
          <p className="text-muted-foreground">Gerencie suas peladas de forma profissional</p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-accent" /> Criar nova Pelada</h2>
            <div className="space-y-2">
              <Label>Nome da Pelada</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pelada dos Amigos" />
                <ShinyButton onClick={() => createSession.mutate(name)} disabled={createSession.isPending || !name} size="sm"><Plus className="w-4 h-4" /></ShinyButton>
              </div>
            </div>
          </div>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground italic">ou</span></div></div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><LogIn className="w-5 h-5 text-secondary" /> Acessar Pelada</h2>
            <div className="space-y-2">
              <Label>Código de 6 dígitos</Label>
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCDEF" maxLength={6} className="uppercase font-mono text-center text-lg tracking-widest" />
                <ShinyButton onClick={() => joinSession.mutate(code)} disabled={joinSession.isPending || code.length < 6} variant="secondary" size="sm">ENTRAR</ShinyButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
