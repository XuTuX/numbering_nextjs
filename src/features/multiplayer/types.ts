export interface Player {
  socketId: string;
  username: string;
  score: number;
  connected: boolean;
}

export type GameMode = 'formula-workshop' | 'sequence-detective' | 'number-vault';
export const MULTIPLAYER_ROUNDS = 3;

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  'formula-workshop': '수식 공방',
  'sequence-detective': '수열 탐정',
  'number-vault': '숫자 금고',
};

export function normalizeGameMode(value?: string): GameMode {
  if (value === 'sequence-detective' || value === 'number-vault') return value;
  return 'formula-workshop';
}

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'ROUND_END' | 'GAME_END';

export type MultiplayerPuzzle =
  | { mode: 'formula-workshop'; digits: string[]; digitString: string }
  | { mode: 'sequence-detective'; target: number; termCount: number }
  | { mode: 'number-vault'; numbers: number[]; target: number };

export interface RoomSnapshot {
  hostId: string;
  status: RoomStatus;
  players: Record<string, Player>;
  gameMode: GameMode;
  round: number;
  timer: number;
  puzzle: MultiplayerPuzzle | null;
}

export type RoomResponse =
  | { success: true; room: RoomSnapshot; roomId?: string }
  | { success: false; message: string };

export interface RoundStartedPayload {
  status: RoomStatus;
  round: number;
  timer: number;
  puzzle: MultiplayerPuzzle;
}

export interface RoundEndedPayload {
  status: RoomStatus;
  timer: number;
  players: Record<string, Player>;
}

export interface GameEndedPayload {
  status: RoomStatus;
  players: Record<string, Player>;
}

export type SubmissionResponse =
  | { success: true }
  | { success: false; message: string };
