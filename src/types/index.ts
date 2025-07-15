export interface Player {
  id: string;
  name: string;
}

export interface GameRound {
  roundNumber: number;
  clueMasterId: string;
  secretWord: string;
  clues: string[];
  selectedClues: string[];
  options: string[];
  guess: string | null;
  isCorrect: boolean | null;
  startTime: number;
  timeLimit: number; // in seconds
}

export type GameStatus = "waiting" | "starting" | "clue_master_turn" | "code_breaker_turn" | "round_over" | "finished";

export interface Game {
  id: string;
  players: Player[];
  status: GameStatus;
  currentRound: number;
  maxRounds: number;
  score: number;
  roundData?: GameRound;
}
