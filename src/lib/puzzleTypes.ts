import { OperatorSlot, ParenthesisRange, NumberRangeSelection, InlineMenuState } from '@/types/game';

export type OperatorToken = '+' | '-' | '×' | '÷' | '=' | '(' | ')';

export type PuzzleDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface GeneratedPuzzle {
  id: string;
  difficulty: PuzzleDifficulty;
  digits: string[];
  digitString: string;
  answerExpression: string;
  usedOperators: OperatorToken[];
}

export interface SlotState {
  index: number; // 0 to digits.length (inclusive)
  tokens: OperatorToken[];
}

export interface SoloGameState {
  puzzle: GeneratedPuzzle | null;
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selectedRange: NumberRangeSelection;
  inlineMenu: InlineMenuState;
  hintCount: number;
  startedAt: number;
  status: 'playing' | 'correct' | 'wrong' | 'idle';
  difficulty: PuzzleDifficulty;
}

export type ValidationResult =
  | {
      valid: true;
      leftValue: number;
      rightValue: number;
      isCorrect: boolean;
    }
  | {
      valid: false;
      message: string;
    };
