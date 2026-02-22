import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, buildUrl } from "@shared/routes";
import { 
  Trophy, Users, LogIn, Plus, HandCoins, HelpCircle, 
  Settings, UserPlus, Play, RotateCw, Trash2 
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const steps = [
    {
      icon: <Plus className="w-6 h-6 text-accent" />,
      title: "1. Crie ou Entre",
      description: "Comece criando uma nova pelada ou entre em uma existente usando o código de 6 dígitos compartilhado pelos amigos."
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "2. Adicione Jogadores",
      description: "Cadastre todos os jogadores. Você pode marcar quem é 'Goleiro Fixo' para que o sistema gerencie a rotação corretamente."
    },
    {
      icon: <Settings className="w-6 h-6 text-secondary" />,
      title: "3. Configure a Partida",
      description: "Defina o tempo de jogo, jogadores por time e condição de vitória (tempo ou gols)."
    },
    {
      icon: <Play className="w-6 h-6 text-green-500" />,
      title: "4. Sorteie e Jogue",
      description: "O sistema sorteia os times automaticamente. Durante o jogo, controle o placar e o cronômetro em tempo real."
    },
    {
      icon: <RotateCw className="w-6 h-6 text-orange-500" />,
      title: "5. Rotação Automática",
      description: "Ao finalizar, o sistema remove quem perdeu (ou empatou) e coloca os próximos da fila, mantendo o jogo fluindo!"
    },
    {
      icon: <UserPlus className="w-6 h-6 text-blue-500" />,
      title: "6. Gestão em Tempo Real",
      description: "Adicione pessoas no meio da pelada, faça substituições diretas ou troque nomes e cores dos times a qualquer momento."
    }
  ];

  const createSession = useMutation({
// ... (rest of the file content until the return statement)
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
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2"><HandCoins className="w-12 h-12" /></div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-primary">FUT NA MÃO</h1>
          <p className="text-muted-foreground">Gerencie suas peladas de forma fácil e prática</p>
          
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest mt-2">
                <HelpCircle className="w-4 h-4" /> Como funciona?
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tight">Guia do Fut na Mão</DialogTitle>
              </DialogHeader>
              <div className="grid sm:grid-cols-2 gap-6 py-6">
                {steps.map((step, i) => (
                  <div key={i} className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="p-2 w-fit rounded-lg bg-background border shadow-sm">
                      {step.icon}
                    </div>
                    <h3 className="font-bold text-lg">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4" /> Dica de Ouro
                </h4>
                <p className="text-xs text-muted-foreground">
                  O sistema é <strong>sincronizado em tempo real</strong>. Se você abrir o link em um tablet para o placar e no celular para gerenciar a fila, tudo será atualizado instantaneamente em ambas as telas!
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-accent" /> Criar novo </h2>
            <div className="space-y-2">
              <Label>Nome</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pelada dos Amigos" />
                <ShinyButton onClick={() => createSession.mutate(name)} disabled={createSession.isPending || !name} size="sm"><Plus className="w-4 h-4" /></ShinyButton>
              </div>
            </div>
          </div>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground italic">ou</span></div></div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><LogIn className="w-5 h-5 text-secondary" /> Acessar </h2>
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
