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
