import { useState, useEffect } from "react";
import {
  usePlayers,
  useCreatePlayer,
  useDeletePlayer,
} from "@/hooks/use-players";
import { PlayerCard } from "@/components/PlayerCard";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Timer, Trophy, Play, Plus, Loader2, LogOut, Trash2, Copy, Check, Share2 } from "lucide-react";
import { useGameState } from "@/hooks/use-game-state";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function Lobby() {
  const sessionId = Number(localStorage.getItem("game_session"));
  const { data: players, isLoading } = usePlayers(sessionId);
  const createPlayer = useCreatePlayer(sessionId);
  const deletePlayer = useDeletePlayer(sessionId);
  const { state, updateSettings, startGame } = useGameState();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [newPlayerName, setNewPlayerName] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch session details to show name and code
  const { data: session } = useQuery({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      // We don't have a direct get by ID in api object, but we can find it by code or add it.
      // For now, let's assume we can get it or just use the code from local storage if we stored it.
      const savedCode = localStorage.getItem("game_session_code");
      if (!savedCode) return null;
      const res = await fetch(buildUrl(api.sessions.get.path, { code: savedCode }));
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!sessionId
  });

  const deleteSession = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildUrl(api.sessions.delete.path, { id: sessionId }), {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete pelada");
    },
    onSuccess: () => {
      handleLogout();
      toast({ title: "Pelada deletada com sucesso" });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("game_session");
    localStorage.removeItem("game_session_code");
    setLocation("/landing");
  };

  const copyLink = () => {
    if (!session?.code) return;
    const url = `${window.location.origin}/join/${session.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copiado!", description: "Envie para seus amigos." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    if (
      players?.some((p) => p.name.toLowerCase() === newPlayerName.toLowerCase())
    ) {
      toast({
        title: "Jogador já existe",
        description: "Este nome já está na lista.",
        variant: "destructive",
      });
      return;
    }

    createPlayer.mutate(
      { name: newPlayerName, isActive: true, isGoalkeeper: false },
      {
        onSuccess: () => setNewPlayerName(""),
      },
    );
  };

  const handleStartGame = () => {
    if (!players || players.length < 2) {
      toast({
        title: "Jogadores insuficientes",
        description: "Você precisa de pelo menos 2 jogadores para começar.",
        variant: "destructive",
      });
      return;
    }
    startGame(players);
    setLocation("/match");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!sessionId) {
    setLocation("/landing");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter">
            {session?.name || "FUT SHAMPIONS"}
          </h1>
          <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código:</span>
            <code className="font-mono font-bold text-lg text-accent">{session?.code}</code>
            <button 
              onClick={copyLink}
              className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
              title="Copiar link de convite"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <ShinyButton 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-muted-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </ShinyButton>
          <ShinyButton 
            variant="danger" 
            size="sm" 
            onClick={() => {
              if (confirm("Tem certeza que deseja deletar esta pelada? Todos os dados serão perdidos.")) {
                deleteSession.mutate();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Deletar
          </ShinyButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 space-y-6">
            <h2 className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-secondary" />
              Regras do jogo
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playersPerTeam">Jogadores por equipe</Label>
                <div className="flex items-center gap-4">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="playersPerTeam"
                    type="number"
                    min={1}
                    max={11}
                    value={state.settings.playersPerTeam}
                    onChange={(e) =>
                      updateSettings({
                        playersPerTeam: parseInt(e.target.value) || 1,
                      })
                    }
                    className="font-mono text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração da partida (minutos)</Label>
                <div className="flex items-center gap-4">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={90}
                    value={state.settings.matchDurationMins}
                    onChange={(e) =>
                      updateSettings({
                        matchDurationMins: parseInt(e.target.value) || 10,
                      })
                    }
                    className="font-mono text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condição de vitória</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateSettings({ winCondition: "time" })}
                    className={`p-3 rounded-xl border-2 font-bold transition-all ${
                      state.settings.winCondition === "time"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Apenas por tempo
                  </button>
                  <button
                    onClick={() => updateSettings({ winCondition: "goals" })}
                    className={`p-3 rounded-xl border-2 font-bold transition-all ${
                      state.settings.winCondition === "goals"
                        ? "border-secondary bg-secondary/10 text-secondary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Quantidade de gols
                  </button>
                </div>
              </div>

              {state.settings.winCondition === "goals" && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="goalsToWin">Gols para vitória</Label>
                  <Input
                    id="goalsToWin"
                    type="number"
                    min={1}
                    value={state.settings.goalsToWin}
                    onChange={(e) =>
                      updateSettings({
                        goalsToWin: parseInt(e.target.value) || 2,
                      })
                    }
                    className="font-mono text-lg border-secondary"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Roster */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 flex flex-col h-full min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="flex items-center gap-2 text-2xl">
                <Users className="w-6 h-6 text-accent" />
                Lista{" "}
                <span className="text-muted-foreground text-lg ml-2">
                  ({players?.length || 0})
                </span>
              </h2>
            </div>

            <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6">
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Adicionar nome do jogador..."
                className="flex-1"
                autoFocus
              />
              <ShinyButton
                type="submit"
                size="sm"
                disabled={createPlayer.isPending || !newPlayerName}
              >
                <Plus className="w-5 h-5" />
              </ShinyButton>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2">
              {players?.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onRemove={() => deletePlayer.mutate(player.id)}
                />
              ))}
              {players?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-border/50">
                  <Users className="w-12 h-12 mb-2 opacity-20" />
                  <p>Nenhum jogador adicionado ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50">
        <ShinyButton
          size="lg"
          onClick={handleStartGame}
          disabled={!players || players.length < 2}
          className="w-full max-w-md shadow-2xl shadow-primary/40 text-xl"
        >
          INICIAR PARTIDA <Play className="w-6 h-6 ml-2 fill-current" />
        </ShinyButton>
      </div>
    </div>
  );
}
