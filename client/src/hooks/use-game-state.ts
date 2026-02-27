import { useState, useCallback, useEffect, useRef } from 'react';
import type { Player } from '@shared/schema';
import { io, Socket } from "socket.io-client";

export type Team = Player[];
export type GamePhase = 'setup' | 'playing' | 'paused' | 'finished';

interface GameState {
  teamA: Team;
  teamB: Team;
  queue: Team;
  goalieQueue: Team;
  scoreA: number;
  scoreB: number;
  teamAName?: string;
  teamBName?: string;
  teamAColor?: string;
  teamBColor?: string;
  phase: GamePhase;
  timer: number;
  history?: string[]; // Stack of serialized states
  serverTimer?: {
    startTime: number | null;
    durationAtStart: number;
    isRunning: boolean;
  };
  settings: {
    playersPerTeam: number;
    matchDurationMins: number;
    winCondition: 'time' | 'goals';
    goalsToWin: number;
  };
}

const STORAGE_KEY = 'pelada-manager-state-v2';

const defaultState: GameState = {
  teamA: [],
  teamB: [],
  queue: [],
  goalieQueue: [],
  scoreA: 0,
  scoreB: 0,
  phase: 'setup',
  timer: 600,
  settings: {
    playersPerTeam: 5,
    matchDurationMins: 10,
    winCondition: 'time',
    goalsToWin: 2,
  },
};

let globalState: GameState = (() => {
  if (typeof window === 'undefined') return defaultState;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultState;
    }
  }
  return defaultState;
})();

const listeners: Set<(state: GameState) => void> = new Set();
let socket: Socket | null = null;

function notify(skipSocket = false, isUndo = false) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
    
    const sessionCode = localStorage.getItem("game_session_code");
    if (!skipSocket && socket?.connected && sessionCode) {
      socket.emit("update-state", { sessionCode, state: globalState, isUndo });
    }
  }
  listeners.forEach(l => l({ ...globalState }));
}

export function useGameState() {
  const [state, setStateInternal] = useState<GameState>(globalState);
  const sessionCode = typeof window !== 'undefined' ? localStorage.getItem("game_session_code") : null;

  useEffect(() => {
    listeners.add(setStateInternal);

    if (typeof window !== 'undefined' && sessionCode) {
      if (!socket) {
        socket = io({
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000
        });
      }

      const onConnect = () => {
        socket?.emit("join-session", sessionCode);
      };

      const onStateUpdated = (newState: GameState) => {
        // Deep compare or versioning could be better, but for now simple check
        if (JSON.stringify(newState) === JSON.stringify(globalState)) return;
        globalState = newState;
        notify(true); // Don't emit back
      };

      const onTimerSync = (serverTimer: any) => {
        setStateInternal(prev => {
          const newState = { ...prev, serverTimer };
          if (serverTimer.isRunning && serverTimer.startTime) {
            const elapsed = Math.floor((Date.now() - serverTimer.startTime) / 1000);
            newState.timer = Math.max(0, serverTimer.durationAtStart - elapsed);
          } else {
            newState.timer = serverTimer.durationAtStart;
          }
          globalState = newState;
          return newState;
        });
      };

      socket.on("connect", onConnect);
      socket.on("state-updated", onStateUpdated);
      socket.on("timer-sync", onTimerSync);

      if (socket.connected) {
        onConnect();
      }

      return () => {
        socket?.off("connect", onConnect);
        socket?.off("state-updated", onStateUpdated);
        socket?.off("timer-sync", onTimerSync);
        listeners.delete(setStateInternal);
      };
    }

    return () => {
      listeners.delete(setStateInternal);
    };
  }, [sessionCode]);

  const setState = useCallback((updater: GameState | ((prev: GameState) => GameState), saveHistory = false) => {
    const prevState = { ...globalState };
    if (typeof updater === 'function') {
      globalState = updater(globalState);
    } else {
      globalState = updater;
    }
    
    if (saveHistory) {
      const history = globalState.history || [];
      // Keep only last 10 steps to avoid massive state
      const newHistory = [JSON.stringify(prevState), ...history].slice(0, 10);
      globalState = { ...globalState, history: newHistory };
    }
    
    notify();
  }, []);

  const undo = useCallback(() => {
    if (!globalState.history || globalState.history.length === 0) return;
    const history = [...globalState.history];
    const lastStateStr = history.shift();
    if (lastStateStr) {
      globalState = { ...JSON.parse(lastStateStr), history };
      notify(false, true);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GameState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
      timer: (newSettings.matchDurationMins || prev.settings.matchDurationMins) * 60
    }));
  }, [setState]);

  const startGame = useCallback((allPlayers: Player[]) => {
    setState(prev => {
      const teamSize = prev.settings.playersPerTeam;
      
      const fixedGoalies = allPlayers.filter(p => p.isGoalkeeper);
      const outfielders = allPlayers.filter(p => !p.isGoalkeeper);
      
      const shuffledOutfielders = [...outfielders].sort(() => Math.random() - 0.5);
      const shuffledGoalies = [...fixedGoalies].sort(() => Math.random() - 0.5);
      
      let teamA: Player[] = [];
      let teamB: Player[] = [];
      let goalieQueue: Player[] = [];
      let queue: Player[] = [];

      if (shuffledGoalies.length >= 2) {
        teamA.push(shuffledGoalies[0]);
        teamB.push(shuffledGoalies[1]);
        goalieQueue = shuffledGoalies.slice(2);
      } else if (shuffledGoalies.length === 1) {
        teamA.push(shuffledGoalies[0]);
      }

      const playersPerTeam = prev.settings.playersPerTeam;
      
      while (teamA.length < playersPerTeam && shuffledOutfielders.length > 0) {
        teamA.push(shuffledOutfielders.shift()!);
      }
      
      while (teamB.length < playersPerTeam && shuffledOutfielders.length > 0) {
        teamB.push(shuffledOutfielders.shift()!);
      }
      
      queue = shuffledOutfielders;

      const initialTimer = prev.settings.matchDurationMins * 60;

      return {
        ...prev,
        teamA,
        teamB,
        queue,
        goalieQueue,
        phase: 'paused',
        scoreA: 0,
        scoreB: 0,
        timer: initialTimer,
        serverTimer: {
          startTime: null,
          durationAtStart: initialTimer,
          isRunning: false
        }
      };
    });
  }, [setState]);

  const rotateTeams = useCallback((winner: 'A' | 'B' | 'DRAW') => {
    setState(prev => {
      const teamSize = prev.settings.playersPerTeam;
      
      let winningTeam = winner === 'B' ? [...prev.teamB] : [...prev.teamA];
      let losingTeam = winner === 'B' ? [...prev.teamA] : [...prev.teamB];

      // Separate goalie and outfielders from losing team
      const losingGoalie = losingTeam.find(p => p.isGoalkeeper);
      const losingOutfielders = losingTeam.filter(p => !p.isGoalkeeper);

      // Winners stay
      let newTeamA = winningTeam;
      
      // Form new Team B
      let newTeamB: Player[] = [];
      let newGoalieQueue = [...prev.goalieQueue];
      let newQueue = [...prev.queue];

      // 1. Get Goalie for Team B
      if (losingGoalie) {
        if (newGoalieQueue.length > 0) {
          newTeamB.push(newGoalieQueue.shift()!);
          newGoalieQueue.push(losingGoalie);
        } else {
          newTeamB.push(losingGoalie); // No one to swap with
        }
      }

      // 2. Fill rest of Team B from queue
      const needed = teamSize - newTeamB.length;
      const fromQueue = newQueue.slice(0, needed);
      newTeamB = [...newTeamB, ...fromQueue];
      newQueue = newQueue.slice(needed);

      // 3. If Team B still not full, take from losing outfielders
      if (newTeamB.length < teamSize) {
        const stillNeeded = teamSize - newTeamB.length;
        const fromLosers = losingOutfielders.slice(0, stillNeeded);
        newTeamB = [...newTeamB, ...fromLosers];
        newQueue = [...newQueue, ...losingOutfielders.slice(stillNeeded)];
      } else {
        newQueue = [...newQueue, ...losingOutfielders];
      }

      return {
        ...prev,
        teamA: newTeamA,
        teamB: newTeamB,
        queue: newQueue,
        goalieQueue: newGoalieQueue,
        scoreA: 0,
        scoreB: 0,
        timer: prev.settings.matchDurationMins * 60,
        phase: 'paused'
      };
    });
  }, [setState]);

  const toggleTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: prev.phase === 'playing' ? 'paused' : 'playing'
    }));
  }, [setState]);

  const resetTimer = useCallback(() => {
    setState(prev => {
      const initialTimer = prev.settings.matchDurationMins * 60;
      return {
        ...prev,
        timer: initialTimer,
        phase: 'paused',
        serverTimer: {
          startTime: null,
          durationAtStart: initialTimer,
          isRunning: false
        }
      };
    });
  }, [setState]);

  return {
    state,
    setState,
    undo,
    updateSettings,
    startGame,
    rotateTeams,
    toggleTimer,
    resetTimer
  };
}
