import { useState } from "react";
import {
  usePlayers,
  useCreatePlayer,
  useDeletePlayer,
} from "@/hooks/use-players";
import { PlayerCard } from "@/components/PlayerCard";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Timer, Trophy, Play, Plus, Loader2 } from "lucide-react";
import { useGameState } from "@/hooks/use-game-state";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function Lobby() {
  const { data: players, isLoading } = usePlayers();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const { state, updateSettings, startGame } = useGameState();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    // Check dupe
    if (
      players?.some((p) => p.name.toLowerCase() === newPlayerName.toLowerCase())
    ) {
      toast({
        title: "Player exists",
        description: "That name is already in the list.",
        variant: "destructive",
      });
      return;
    }

    createPlayer.mutate(
      { name: newPlayerName, isActive: true },
      {
        onSuccess: () => setNewPlayerName(""),
      },
    );
  };

  const handleStartGame = () => {
    if (!players || players.length < 2) {
      toast({
        title: "Not enough players",
        description: "You need at least 2 players to start.",
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter">
          Match Setup
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure as regras e a lista de jogadores para a sua partida.
        </p>
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
                    Limite de tempo
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
                placeholder="Add player name..."
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
