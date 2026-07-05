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

export type RangeSelection = {
  startDigitIndex: number | null;
  endDigitIndex: number | null;
};

export type NumberRangeSelection = RangeSelection;

export type EditorSelection =
  | {
      type: 'none';
    }
  | {
      type: 'range';
      startDigitIndex: number;
      endDigitIndex: number | null;
    }
  | {
      type: 'slot';
      slotIndex: number;
    }
  | {
      type: 'operator';
      slotIndex: number;
    };

export type SoloEditorState = {
  digits: string[];
  operatorSlots: OperatorSlot[];
  parentheses: ParenthesisRange[];
  selection: EditorSelection;
};
