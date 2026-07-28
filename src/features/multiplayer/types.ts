export interface Player {
  socketId: string;
  username: string;
  score: number;
  connected: boolean;
}

export const PUZZLE_GAME_MODES = [
  'formula-workshop',
  'sequence-detective',
  'number-vault',
] as const;

export type PuzzleGameMode = (typeof PUZZLE_GAME_MODES)[number];
export type GameMode = PuzzleGameMode | 'mixed';
export const MULTIPLAYER_ROUNDS = 3;

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  'formula-workshop': '수식 공방',
  'sequence-detective': '수열 탐정',
  'number-vault': '숫자 금고',
  mixed: '랜덤 3종 대전',
};

export function normalizeGameMode(value?: string): GameMode {
  if (value === 'sequence-detective' || value === 'number-vault' || value === 'mixed') return value;
  return 'formula-workshop';
}

export type RoomFormat = 'classic' | 'duel';
export const DUEL_TIME = 300;
export const DUEL_MAX_PLAYERS = 2;
export const CLASSIC_MAX_PLAYERS = 5;

export const ROOM_FORMAT_LABELS: Record<RoomFormat, string> = {
  classic: '친선전',
  duel: '1:1 대결',
};

export function normalizeRoomFormat(value?: string): RoomFormat {
  return value === 'duel' ? 'duel' : 'classic';
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
  format: RoomFormat;
  round: number;
  timer: number;
  puzzle: MultiplayerPuzzle | null;
  puzzleSeq: number;
}

export type RoomResponse =
  | { success: true; room: RoomSnapshot; roomId?: string }
  | { success: false; message: string };

export interface RoundStartedPayload {
  status: RoomStatus;
  round: number;
  timer: number;
  puzzle: MultiplayerPuzzle;
  puzzleSeq: number;
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
