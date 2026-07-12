import { OperatorSlot, ParenthesisRange } from '@/lib/equation/types';

export function createOperatorSlots(itemCount: number): OperatorSlot[] {
  return Array.from({ length: Math.max(0, itemCount - 1) }, (_, index) => ({
    index,
    operator: null,
  }));
}

export type ParenthesisRangeResult =
  | { valid: true; range: ParenthesisRange }
  | { valid: false; message: string };

export function createParenthesisRange(
  firstIndex: number,
  secondIndex: number,
  existingRanges: ParenthesisRange[],
): ParenthesisRangeResult {
  if (firstIndex === secondIndex) {
    return { valid: false, message: '두 개 이상의 숫자를 선택해야 합니다.' };
  }

  const startDigitIndex = Math.min(firstIndex, secondIndex);
  const endDigitIndex = Math.max(firstIndex, secondIndex);
  const duplicate = existingRanges.some(
    (range) =>
      range.startDigitIndex === startDigitIndex && range.endDigitIndex === endDigitIndex,
  );
  if (duplicate) {
    return { valid: false, message: '이미 동일한 범위가 괄호로 묶여 있습니다.' };
  }

  const crossing = existingRanges.some((range) => {
    const rangeStart = range.startDigitIndex;
    const rangeEnd = range.endDigitIndex;
    return (
      (startDigitIndex < rangeStart && rangeStart < endDigitIndex && endDigitIndex < rangeEnd) ||
      (rangeStart < startDigitIndex && startDigitIndex < rangeEnd && rangeEnd < endDigitIndex)
    );
  });
  if (crossing) {
    return { valid: false, message: '괄호 범위가 서로 교차할 수 없습니다.' };
  }

  return {
    valid: true,
    range: {
      id: Math.random().toString(36).slice(2, 9),
      startDigitIndex,
      endDigitIndex,
    },
  };
}
