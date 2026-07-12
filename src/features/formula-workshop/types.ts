import { EditorSelection, OperatorSlot, ParenthesisRange } from '@/lib/equation/types';

export type OperatorToken = '+' | '-' | '×' | '÷' | '=' | '(' | ')';

export type PuzzleDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export function getDifficultyForRound(round: number): PuzzleDifficulty {
  if (round <= 2) return 'EASY';
  if (round <= 4) return 'NORMAL';
  return 'HARD';
}

export interface GeneratedPuzzle {
  id: string;
  difficulty: PuzzleDifficulty;
  digits: string[];
  digitString: string;
  answerExpression: string;
  usedOperators: OperatorToken[];
}

export interface SoloGameState {
  puzzle: GeneratedPuzzle | null;
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selection: EditorSelection;
  hintCount: number;
  startedAt: number;
  status: 'playing' | 'correct' | 'wrong' | 'idle';
  difficulty: PuzzleDifficulty;
}
