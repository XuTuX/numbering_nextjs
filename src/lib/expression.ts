import { OperatorSlot, ParenthesisRange } from '@/types/game';

export function buildExpression(
  digits: string[],
  operatorSlots: OperatorSlot[],
  parentheses: ParenthesisRange[]
): string {
  let expr = '';
  for (let i = 0; i < digits.length; i++) {
    // Find all open parentheses starting at i
    const opens = parentheses.filter((p) => p.startDigitIndex === i);
    expr += '('.repeat(opens.length);

    expr += digits[i];

    // Find all close parentheses ending at i
    const closes = parentheses.filter((p) => p.endDigitIndex === i);
    expr += ')'.repeat(closes.length);

    if (i < digits.length - 1) {
      const slot = operatorSlots.find((s) => s.index === i);
      if (slot && slot.operator) {
        expr += ` ${slot.operator} `;
      }
      // If no operator, we just concatenate directly, naturally joining the digits (e.g., 3 and 7 becomes 37)
    }
  }
  return expr;
}

export function checkDemoAnswer(expression: string): boolean {
  return expression.trim() === '37 + 14 = 51';
}
