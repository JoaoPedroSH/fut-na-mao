import { useState, useCallback, useEffect } from 'react';
import type { Player } from '@shared/schema';

// Local state management for the active game session
// This doesn't persist to DB until a match is finished

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

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    // Try to restore from local storage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved game state", e);
      }
    }
    // Default initial state
    return {
      teamA: [],
      teamB: [],
      queue: [],
      scoreA: 0,
      scoreB: 0,
      phase: 'setup',
      timer: 600, // 10 mins default
      settings: {
        playersPerTeam: 5,
        matchDurationMins: 10,
        winCondition: 'time',
        goalsToWin: 2,
      },
    };
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateSettings = useCallback((newSettings: Partial<GameState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
      timer: (newSettings.matchDurationMins || prev.settings.matchDurationMins) * 60
    }));
  }, []);

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
        phase: 'paused', // Ready to start timer
        scoreA: 0,
        scoreB: 0,
        timer: prev.settings.matchDurationMins * 60
      };
    });
  }, []);

  const rotateTeams = useCallback((winner: 'A' | 'B' | 'DRAW') => {
    setState(prev => {
      const teamSize = prev.settings.playersPerTeam;
      let newTeamA: Player[] = [];
      let newTeamB: Player[] = [];
      let newQueue: Player[] = [];

      // Logic: Winner stays (as Team A usually), Loser goes to queue
      // If Draw, maybe both leave? Let's implement Winner Stays for now as it's standard.
      // If Draw, we can just pick Team A to stay or random. Let's say Team A stays on draw.

      let winningTeam: Player[];
      let losingTeam: Player[];

      if (winner === 'B') {
        winningTeam = [...prev.teamB];
        losingTeam = [...prev.teamA];
      } else {
        // A wins or Draw
        winningTeam = [...prev.teamA];
        losingTeam = [...prev.teamB];
      }

      // 1. Winning team stays as Team A (or keeps position)
      newTeamA = winningTeam;

      // 2. Form new Team B from Queue
      // We need 'teamSize' players.
      const playersNeeded = teamSize;
      
      // Take as many as possible from queue
      const fromQueue = prev.queue.slice(0, playersNeeded);
      let newChallengers = [...fromQueue];
      
      // If queue didn't have enough, take from losing team (who just left)
      if (newChallengers.length < playersNeeded) {
        const needed = playersNeeded - newChallengers.length;
        const fromLosers = losingTeam.slice(0, needed);
        newChallengers = [...newChallengers, ...fromLosers];
        
        // Remove those taken from the losing team group that goes to queue
        losingTeam = losingTeam.slice(needed);
      }
      
      newTeamB = newChallengers;
      
      // 3. Remaining queue + Remaining losers form new queue
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
  }, []);

  return {
    state,
    setState,
    updateSettings,
    startGame,
    rotateTeams
  };
}
