import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateExpression } from '@/lib/equation/evaluateExpression';
import { validateEquation } from '@/lib/equation/validateEquation';

test('음수 리터럴로 이루어진 등식을 인정한다', () => {
  assert.deepEqual(validateEquation('-3 = -3', '33'), {
    valid: true,
    leftValue: -3,
    rightValue: -3,
    isCorrect: true,
  });
});

test('빼기 결과가 음수인 등식을 인정한다', () => {
  assert.deepEqual(validateEquation('1 - 4 = 2 - 5', '1425'), {
    valid: true,
    leftValue: -3,
    rightValue: -3,
    isCorrect: true,
  });
});

test('단항 부호는 곱셈과 나눗셈보다 먼저 계산한다', () => {
  assert.deepEqual(evaluateExpression('-3 × 2'), { valid: true, value: -6 });
  assert.deepEqual(evaluateExpression('8 ÷ -2'), { valid: true, value: -4 });
  assert.deepEqual(evaluateExpression('-(2 + 1)'), { valid: true, value: -3 });
});

test('기존 정수 나눗셈 규칙을 유지한다', () => {
  assert.deepEqual(evaluateExpression('-3 ÷ 2'), {
    valid: false,
    message: '나눗셈 결과가 정수가 아닙니다.',
  });
});
