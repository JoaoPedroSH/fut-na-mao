import { useState, useCallback, useEffect } from 'react';
import type { Player } from '@shared/schema';

// Local state management for the active game session
// Using a simple event emitter or storage listener for cross-tab/cross-component sync
// In a real app, this would be a Context Provider.

export type Team = Player[];
export type GamePhase = 'setup' | 'playing' | 'paused' | 'finished';

interface GameState {
  teamA: Team;
  teamB: Team;
  queue: Team;
  scoreA: number;
  scoreB: number;
  phase: GamePhase;
  timer: number; // in seconds
  settings: {
    playersPerTeam: number;
    matchDurationMins: number;
    winCondition: 'time' | 'goals';
    goalsToWin: number;
  };
}

const STORAGE_KEY = 'pelada-manager-state';

const defaultState: GameState = {
  teamA: [],
  teamB: [],
  queue: [],
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

// Global state for simple sync without adding complex context if we want to keep it small
let globalState: GameState = (() => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
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

function notify() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  listeners.forEach(l => l(globalState));
}

export function useGameState() {
  const [state, setStateInternal] = useState<GameState>(globalState);

  useEffect(() => {
    listeners.add(setStateInternal);
    return () => {
      listeners.delete(setStateInternal);
    };
  }, []);

  const setState = useCallback((updater: GameState | ((prev: GameState) => GameState)) => {
    if (typeof updater === 'function') {
      globalState = updater(globalState);
    } else {
      globalState = updater;
    }
    notify();
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
      const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
      const teamSize = prev.settings.playersPerTeam;
      
      const teamA = shuffled.slice(0, teamSize);
      const teamB = shuffled.slice(teamSize, teamSize * 2);
      const queue = shuffled.slice(teamSize * 2);
      
      return {
        ...prev,
        teamA,
        teamB,
        queue,
        phase: 'paused',
        scoreA: 0,
        scoreB: 0,
        timer: prev.settings.matchDurationMins * 60
      };
    });
  }, [setState]);

  const rotateTeams = useCallback((winner: 'A' | 'B' | 'DRAW') => {
    setState(prev => {
      const teamSize = prev.settings.playersPerTeam;
      let newTeamA: Player[] = [];
      let newTeamB: Player[] = [];
      let newQueue: Player[] = [];

      let winningTeam: Player[];
      let losingTeam: Player[];

      if (winner === 'B') {
        winningTeam = [...prev.teamB];
        losingTeam = [...prev.teamA];
      } else {
        winningTeam = [...prev.teamA];
        losingTeam = [...prev.teamB];
      }

      newTeamA = winningTeam;
      const playersNeeded = teamSize;
      const fromQueue = prev.queue.slice(0, playersNeeded);
      let newChallengers = [...fromQueue];
      
      if (newChallengers.length < playersNeeded) {
        const needed = playersNeeded - newChallengers.length;
        const fromLosers = losingTeam.slice(0, needed);
        newChallengers = [...newChallengers, ...fromLosers];
        losingTeam = losingTeam.slice(needed);
      }
      
      newTeamB = newChallengers;
      newQueue = [...prev.queue.slice(fromQueue.length), ...losingTeam];

      return {
        ...prev,
        teamA: newTeamA,
        teamB: newTeamB,
        queue: newQueue,
        scoreA: 0,
        scoreB: 0,
        timer: prev.settings.matchDurationMins * 60,
        phase: 'paused'
      };
    });
  }, [setState]);

  return {
    state,
    setState,
    updateSettings,
    startGame,
    rotateTeams
  };
}

