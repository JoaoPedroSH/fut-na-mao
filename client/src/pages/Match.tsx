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
  ArrowRight, Users, ChevronDown, ChevronUp 
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Match() {
  const { state, setState, rotateTeams, toggleTimer, resetTimer } = useGameState();
  const [_, setLocation] = useLocation();
  const createMatch = useCreateMatch();
  
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [showQueue, setShowQueue] = useState(true);

  // Timer logic (only run on one client or handle synchronization)
  // For simplicity in this peer-to-peer like sync, we'll let all clients run the timer
  // but they will fight over the "source of truth". A better way would be server-side timer.
  // However, to satisfy "real time" quickly, we'll keep it and let the last update win.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.phase === 'playing' && state.timer > 0) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timer <= 1) {
            return { ...prev, timer: 0, phase: 'paused' };
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.phase, setState]);

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
                onClick={() => setLocation("/")}
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
          
          {/* Team A */}
          <div className="flex flex-col gap-6">
            <ScoreBoard 
              teamName="TIME A"
              score={state.scoreA}
              onIncrement={() => setState(p => ({ ...p, scoreA: p.scoreA + 1 }))}
              onDecrement={() => setState(p => ({ ...p, scoreA: Math.max(0, p.scoreA - 1) }))}
              colorClass="text-accent"
            />
            
            <div className="bg-card/50 rounded-xl p-4 border border-border/50">
              <h4 className="text-xs text-muted-foreground uppercase mb-3 font-bold tracking-wider">Escalação</h4>
              <div className="space-y-2">
                {state.teamA.map(p => (
                  <div key={p.id} className="font-medium text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {p.name}
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
            <ScoreBoard 
              teamName="TIME B"
              score={state.scoreB}
              onIncrement={() => setState(p => ({ ...p, scoreB: p.scoreB + 1 }))}
              onDecrement={() => setState(p => ({ ...p, scoreB: Math.max(0, p.scoreB - 1) }))}
              colorClass="text-secondary-foreground dark:text-secondary"
            />

            <div className="bg-card/50 rounded-xl p-4 border border-border/50">
              <h4 className="text-xs text-muted-foreground uppercase mb-3 font-bold tracking-wider">Escalação</h4>
              <div className="space-y-2">
                {state.teamB.map(p => (
                  <div key={p.id} className="font-medium text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    {p.name}
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
          <button 
            onClick={() => setShowQueue(!showQueue)}
            className="flex items-center gap-2 text-xl font-bold uppercase mb-4 text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <Users className="w-6 h-6" /> Próximos da fila
            {showQueue ? <ChevronUp className="w-5 h-5 ml-auto" /> : <ChevronDown className="w-5 h-5 ml-auto" />}
          </button>
          
          {showQueue && (
            <div className="bg-muted/30 rounded-2xl p-6 min-h-[120px]">
              {state.queue.length === 0 ? (
                <div className="text-center text-muted-foreground italic">
                  A fila está vazia. Todo mundo está jogando!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {state.queue.map((p, i) => (
                    <div key={p.id} className="bg-background rounded-lg p-3 border border-border flex items-center gap-3 shadow-sm relative overflow-hidden">
                      <span className="absolute right-0 top-0 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground rounded-bl">
                        #{i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-medium truncate">{p.name}</span>
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
              <span className="font-bold text-lg">TIME A</span>
              <span className="text-2xl font-display">{state.scoreA}</span>
            </button>

            <button
              onClick={() => handleFinishMatch('B')}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-secondary/10 border-2 border-secondary hover:bg-secondary/20 transition-colors"
            >
              <Trophy className="w-8 h-8 text-secondary" />
              <span className="font-bold text-lg">TIME B</span>
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
    </div>
  );
}
