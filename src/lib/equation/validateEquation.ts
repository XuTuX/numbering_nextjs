import { ValidationResult } from '@/lib/equation/types';
import { evaluateExpression } from '@/lib/equation/evaluateExpression';

export function validateEquation(expression: string, originalDigitsString: string): ValidationResult {
  const strippedDigits = expression.replace(/[^0-9]/g, '');
  
  if (strippedDigits !== originalDigitsString) {
    // If the stripped digits don't match the original, they changed order, missed a digit, or added digits
    if (strippedDigits.length < originalDigitsString.length) {
      return { valid: false, message: '모든 숫자를 사용해야 합니다.' };
    } else if (strippedDigits.length > originalDigitsString.length) {
      return { valid: false, message: '주어진 숫자만 사용해야 합니다.' };
    }
    return { valid: false, message: '숫자의 순서를 변경할 수 없습니다.' };
  }

  const equalsCount = (expression.match(/=/g) || []).length;
  if (equalsCount === 0) {
    return { valid: false, message: '등호가 필요합니다.' };
  }
  if (equalsCount > 1) {
    return { valid: false, message: '등호는 하나만 사용할 수 있습니다.' };
  }

  const parts = expression.split('=');
  if (parts.length !== 2) {
    return { valid: false, message: '수식이 올바르지 않습니다.' };
  }

  const leftPart = parts[0].trim();
  const rightPart = parts[1].trim();

  if (!leftPart || !rightPart) {
    return { valid: false, message: '등호 양쪽에 수식이 필요합니다.' };
  }

  const leftEval = evaluateExpression(leftPart);
  if (!leftEval.valid) {
    return { valid: false, message: leftEval.message };
  }

  const rightEval = evaluateExpression(rightPart);
  if (!rightEval.valid) {
    return { valid: false, message: rightEval.message };
  }

  const isCorrect = leftEval.value === rightEval.value;

  return {
    valid: true,
    leftValue: leftEval.value,
    rightValue: rightEval.value,
    isCorrect,
  };
}
