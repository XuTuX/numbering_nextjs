export type Operator = '+' | '-' | '×' | '÷' | '=' | '(' | ')' | null;

export type GameStatus = 'playing' | 'correct' | 'wrong';

export interface GameState {
  numbers: number[];
  selectedSlotIndex: number;
  operators: Operator[];
  expressionPreview: string;
  timer: number;
  gameStatus: GameStatus;
  hintCount: number;
}

export type InlineOperator = '+' | '-' | '×' | '÷' | '=';

export type OperatorSlot = {
  index: number;
  operator: InlineOperator | null;
};

export type ParenthesisRange = {
  id: string;
  startDigitIndex: number;
  endDigitIndex: number;
};

export type NumberRangeSelection = {
  startDigitIndex: number | null;
  endDigitIndex: number | null;
};

export type InlineMenuState = {
  openSlotIndex: number | null;
};

export type SoloEditorState = {
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selectedRange: NumberRangeSelection;
  inlineMenu: InlineMenuState;
};
