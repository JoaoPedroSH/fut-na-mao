import { useEffect, useState } from "react";
import { useGameState } from "@/hooks/use-game-state";
import { useCreateMatch } from "@/hooks/use-matches";
import { useLocation } from "wouter";
import { TimerDisplay } from "@/components/TimerDisplay";
import { ScoreBoard } from "@/components/ScoreBoard";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PlayerCard } from "@/components/PlayerCard";
import { 
  Play, Pause, RotateCcw, Flag, Trophy, Clock, 
  ArrowRight, Users, ChevronDown, ChevronUp,
  UserPlus, UserMinus, ArrowLeftRight, Plus
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  usePlayers,
  useCreatePlayer,
  useDeletePlayer,
} from "@/hooks/use-players";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Match() {
  const sessionId = Number(localStorage.getItem("game_session"));
  const { data: dbPlayers } = usePlayers(sessionId);
  const createPlayer = useCreatePlayer(sessionId);
  const { state, setState, rotateTeams, toggleTimer, resetTimer } = useGameState();
  const [_, setLocation] = useLocation();
  const createMatch = useCreateMatch();
  
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<'A' | 'B' | null>(null);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [teamColorInput, setTeamColorInput] = useState("");

  const teamColors = [
    { name: "Verde Arena", value: "text-accent", bg: "bg-accent/10", border: "border-accent" },
    { name: "Azul Marinho", value: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500" },
    { name: "Amarelo Vibrante", value: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400" },
    { name: "Vermelho Fogo", value: "text-red-500", bg: "bg-red-500/10", border: "border-red-500" },
    { name: "Roxo Elite", value: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500" },
    { name: "Branco Neve", value: "text-slate-200", bg: "bg-slate-200/10", border: "border-slate-200" },
  ];

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.phase === 'playing' && state.timer > 0) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.serverTimer?.isRunning && prev.serverTimer.startTime) {
            const elapsed = Math.floor((Date.now() - prev.serverTimer.startTime) / 1000);
            const remaining = Math.max(0, prev.serverTimer.durationAtStart - elapsed);
            if (remaining === 0 && prev.phase === 'playing') {
              return { ...prev, timer: 0, phase: 'paused' };
            }
            return { ...prev, timer: remaining };
          }
          if (prev.timer <= 1) {
            return { ...prev, timer: 0, phase: 'paused' };
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.phase, setState]);

  const handleAddPlayerMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    createPlayer.mutate(
      { name: newPlayerName, isActive: true, isGoalkeeper: isGoalkeeper },
      {
        onSuccess: (player) => {
          setState(prev => ({
            ...prev,
            queue: [...prev.queue, player]
          }));
          setNewPlayerName("");
          setIsGoalkeeper(false);
          setIsAddPlayerOpen(false);
        }
      }
    );
  };

  const removePlayerFromGame = (playerId: number) => {
    setState(prev => ({
      ...prev,
      teamA: prev.teamA.filter(p => p.id !== playerId),
      teamB: prev.teamB.filter(p => p.id !== playerId),
      queue: prev.queue.filter(p => p.id !== playerId),
      goalieQueue: prev.goalieQueue.filter(p => p.id !== playerId),
    }));
  };

  const moveFromQueueToTeam = (player: any, team: 'A' | 'B') => {
    setState(prev => {
      const newQueue = prev.queue.filter(p => p.id !== player.id);
      if (team === 'A') {
        return { ...prev, teamA: [...prev.teamA, player], queue: newQueue };
      } else {
        return { ...prev, teamB: [...prev.teamB, player], queue: newQueue };
      }
    });
  };

  const swapPlayers = (teamPlayer: any, queuePlayer: any, team: 'A' | 'B') => {
    setState(prev => {
      // Find the index of the player in the team to maintain position
      if (team === 'A') {
        const index = prev.teamA.findIndex(p => p.id === teamPlayer.id);
        const newTeamA = [...prev.teamA];
        newTeamA[index] = queuePlayer;
        const newQueue = prev.queue.map(p => p.id === queuePlayer.id ? teamPlayer : p);
        return { ...prev, teamA: newTeamA, queue: newQueue };
      } else {
        const index = prev.teamB.findIndex(p => p.id === teamPlayer.id);
        const newTeamB = [...prev.teamB];
        newTeamB[index] = queuePlayer;
        const newQueue = prev.queue.map(p => p.id === queuePlayer.id ? teamPlayer : p);
        return { ...prev, teamB: newTeamB, queue: newQueue };
      }
    });
  };

  const updateTeamName = () => {
    if (!editingTeam) return;
    setState(prev => ({
      ...prev,
      [editingTeam === 'A' ? 'teamAName' : 'teamBName']: teamNameInput,
      [editingTeam === 'A' ? 'teamAColor' : 'teamBColor']: teamColorInput
    }));
    setEditingTeam(null);
  };

  const handleFinishMatch = (winner: 'A' | 'B' | 'DRAW') => {
    // 1. Log match to DB
    createMatch.mutate({
      teamA: state.teamA.map(p => p.name),
      teamB: state.teamB.map(p => p.name),
      scoreA: state.scoreA,
      scoreB: state.scoreB,
      durationSeconds: (state.settings.matchDurationMins * 60) - state.timer,
      winner
    });

    // 2. Rotate teams
    rotateTeams(winner);
    setIsFinishDialogOpen(false);
    
    // 3. Reset UI state for next match
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPeladaName = localStorage.getItem("game_session_name") || "FUT SHAMPIONS";
  const currentPeladaCode = localStorage.getItem("game_session_code") || "";

  if (state.teamA.length === 0) {
    // Redirect if state is lost/empty
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header / Timer Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[100px] md:max-w-none">
              {currentPeladaName}
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-accent font-bold">{currentPeladaCode}</span>
              <ShinyButton 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setState(prev => ({ ...prev, phase: 'setup' }));
                  setLocation("/");
                }}
                className="text-muted-foreground h-6 px-2 text-[10px]"
              >
                SAIR
              </ShinyButton>
            </div>
          </div>

          <TimerDisplay 
            seconds={state.timer} 
            className="text-4xl md:text-5xl"
            variant={state.timer < 60 ? "danger" : state.timer < 180 ? "warning" : "default"}
          />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={resetTimer}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <ShinyButton 
              size="sm" 
              onClick={toggleTimer}
              variant={state.phase === 'playing' ? 'secondary' : 'primary'}
              className="w-24"
            >
              {state.phase === 'playing' ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </ShinyButton>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Scoreboard Area */}
        <div className="grid grid-cols-2 gap-4 md:gap-12 items-start relative">
          
          <div className="flex flex-col gap-6">
            <div className="relative group/teamname">
              <ScoreBoard 
                teamName={state.teamAName || "TIME A"}
                score={state.scoreA}
                onIncrement={() => {
                  setState(p => ({ ...p, scoreA: p.scoreA + 1 }));
                }}
                onDecrement={() => {
                  setState(p => ({ ...p, scoreA: Math.max(0, p.scoreA - 1) }));
                }}
                colorClass={state.teamAColor || "text-accent"}
              />
              <button 
                onClick={() => {
                  setEditingTeam('A');
                  setTeamNameInput(state.teamAName || "TIME A");
                  setTeamColorInput(state.teamAColor || "text-accent");
                }}
                className="absolute -top-2 -right-2 p-1 bg-background border rounded-full opacity-0 group-hover/teamname:opacity-100 transition-opacity"
              >
                <Plus className="w-3 h-3 rotate-45" />
              </button>
            </div>
            
            <div className="bg-card/50 rounded-xl p-4 border border-border/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Escalação</h4>
                <div className="flex gap-1">
                  {state.queue.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className={`p-1 hover:bg-opacity-20 rounded ${state.teamAColor || "text-accent"}`} title="Adicionar da fila">
                          <UserPlus className="w-3 h-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar da fila ao {state.teamAName || "TIME A"}</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {state.queue.map(p => (
                            <button key={p.id} onClick={() => moveFromQueueToTeam(p, 'A')} className={`p-2 border rounded hover:opacity-80 text-sm text-left truncate ${state.teamAColor || "border-accent text-accent"}`}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {state.teamA.map(p => (
                  <div key={p.id} className="font-medium text-sm flex items-center justify-between group/player">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${state.teamAColor?.replace('text-', 'bg-') || "bg-accent"}`} />
                      {p.name}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity">
                      {state.queue.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded text-muted-foreground" title="Trocar">
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Trocar {p.name} por:</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              {state.queue.map(qp => (
                                <button key={qp.id} onClick={() => swapPlayers(p, qp, 'A')} className="p-2 border rounded hover:bg-accent text-sm text-left truncate">
                                  {qp.name}
                                </button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <button onClick={() => removePlayerFromGame(p.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive" title="Remover">
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="absolute left-1/2 top-24 -translate-x-1/2 text-muted-foreground/20 font-black text-6xl italic select-none">
            VS
          </div>

          {/* Team B */}
          <div className="flex flex-col gap-6">
            <div className="relative group/teamname">
              <ScoreBoard 
                teamName={state.teamBName || "TIME B"}
                score={state.scoreB}
                onIncrement={() => {
                  setState(p => ({ ...p, scoreB: p.scoreB + 1 }));
                }}
                onDecrement={() => {
                  setState(p => ({ ...p, scoreB: Math.max(0, p.scoreB - 1) }));
                }}
                colorClass={state.teamBColor || "text-secondary-foreground dark:text-secondary"}
              />
              <button 
                onClick={() => {
                  setEditingTeam('B');
                  setTeamNameInput(state.teamBName || "TIME B");
                  setTeamColorInput(state.teamBColor || "text-secondary-foreground dark:text-secondary");
                }}
                className="absolute -top-2 -right-2 p-1 bg-background border rounded-full opacity-0 group-hover/teamname:opacity-100 transition-opacity"
              >
                <Plus className="w-3 h-3 rotate-45" />
              </button>
            </div>

            <div className="bg-card/50 rounded-xl p-4 border border-border/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Escalação</h4>
                <div className="flex gap-1">
                  {state.queue.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className={`p-1 hover:bg-opacity-20 rounded ${state.teamBColor || "text-secondary-foreground dark:text-secondary"}`} title="Adicionar da fila">
                          <UserPlus className="w-3 h-3" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar da fila ao {state.teamBName || "TIME B"}</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {state.queue.map(p => (
                            <button key={p.id} onClick={() => moveFromQueueToTeam(p, 'B')} className={`p-2 border rounded hover:opacity-80 text-sm text-left truncate ${state.teamBColor || "border-secondary text-secondary-foreground dark:text-secondary"}`}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {state.teamB.map(p => (
                  <div key={p.id} className="font-medium text-sm flex items-center justify-between group/player">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${state.teamBColor?.replace('text-', 'bg-') || "bg-secondary"}`} />
                      {p.name}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity">
                      {state.queue.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded text-muted-foreground" title="Trocar">
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Trocar {p.name} por:</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              {state.queue.map(qp => (
                                <button key={qp.id} onClick={() => swapPlayers(p, qp, 'B')} className="p-2 border rounded hover:bg-secondary text-sm text-left truncate">
                                  {qp.name}
                                </button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <button onClick={() => removePlayerFromGame(p.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive" title="Remover">
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Finish Button */}
        <div className="flex justify-center py-4">
          <ShinyButton 
            size="lg" 
            variant="danger" 
            onClick={() => setIsFinishDialogOpen(true)}
            className="w-full max-w-sm"
          >
            FINALIZAR <Flag className="w-5 h-5 ml-2" />
          </ShinyButton>
        </div>

        {/* Queue Section */}
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className="flex items-center gap-2 text-xl font-bold uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-6 h-6" /> Próximos da fila
              {showQueue ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
              <DialogTrigger asChild>
                <ShinyButton size="sm" variant="ghost" className="h-8">
                  <UserPlus className="w-4 h-4 mr-2" /> Novo na Fila
                </ShinyButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar novo jogador à fila</DialogTitle></DialogHeader>
                <form onSubmit={handleAddPlayerMatch} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome do jogador</Label>
                    <Input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="match-is-goalie" checked={isGoalkeeper} onCheckedChange={c => setIsGoalkeeper(!!c)} />
                    <Label htmlFor="match-is-goalie">Goleiro Fixo</Label>
                  </div>
                  <ShinyButton type="submit" className="w-full" disabled={createPlayer.isPending || !newPlayerName}>
                    ADICIONAR
                  </ShinyButton>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {showQueue && (
            <div className="bg-muted/30 rounded-2xl p-6 min-h-[120px]">
              {state.queue.length === 0 ? (
                <div className="text-center text-muted-foreground italic">
                  A fila está vazia. Todo mundo está jogando!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {state.queue.map((p, i) => (
                    <div key={p.id} className="bg-background rounded-lg p-3 border border-border flex items-center gap-3 shadow-sm relative group">
                      <span className="absolute right-0 top-0 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground rounded-bl">
                        #{i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-medium truncate mr-6">{p.name}</span>
                      <button 
                        onClick={() => removePlayerFromGame(p.id)}
                        className="absolute right-1 bottom-1 p-1 hover:bg-destructive/10 rounded text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Finish Dialog */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl uppercase">Partida encerrada</DialogTitle>
            <DialogDescription>
              Quem venceu a partida? Isso determinará a rotação das equipes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => handleFinishMatch('A')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-accent/10 border-2 border-accent hover:bg-accent/20 transition-colors"
            >
              <Trophy className="w-8 h-8 text-accent" />
              <span className="font-bold text-lg">{state.teamAName || "TIME A"}</span>
              <span className="text-2xl font-display">{state.scoreA}</span>
            </button>

            <button
              onClick={() => handleFinishMatch('B')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-secondary/10 border-2 border-secondary hover:bg-secondary/20 transition-colors"
            >
              <Trophy className="w-8 h-8 text-secondary" />
              <span className="font-bold text-lg">{state.teamBName || "TIME B"}</span>
              <span className="text-2xl font-display">{state.scoreB}</span>
            </button>
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <button 
              onClick={() => handleFinishMatch('DRAW')}
              className="text-muted-foreground hover:text-foreground text-sm font-medium py-2 uppercase tracking-wide"
            >
              Foi um empate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Name Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar Time</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Nome do time</Label>
              <Input 
                value={teamNameInput} 
                onChange={e => setTeamNameInput(e.target.value)} 
                placeholder="Nome do time..." 
              />
            </div>
            
            <div className="space-y-3">
              <Label>Cor do time</Label>
              <div className="grid grid-cols-3 gap-2">
                {teamColors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setTeamColorInput(color.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${teamColorInput === color.value ? color.border + ' ' + color.bg : 'border-transparent bg-muted/50'}`}
                  >
                    <div className={`w-6 h-6 rounded-full ${color.value.replace('text-', 'bg-')}`} />
                    <span className="text-[10px] font-bold uppercase truncate w-full text-center">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <ShinyButton onClick={updateTeamName} className="w-full">
              SALVAR ALTERAÇÕES
            </ShinyButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
