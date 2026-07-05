export type Token = string | number;

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let currentNum = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    if (char === ' ') continue;

    if (/[0-9]/.test(char)) {
      currentNum += char;
    } else {
      if (currentNum !== '') {
        tokens.push(parseInt(currentNum, 10));
        currentNum = '';
      }
      if (['+', '-', '×', '÷', '(', ')'].includes(char)) {
        tokens.push(char);
      } else {
        // Unknown chars can just be pushed to fail later or ignored, let's push to fail
        tokens.push(char);
      }
    }
  }

  if (currentNum !== '') {
    tokens.push(parseInt(currentNum, 10));
  }

  return tokens;
}

function precedence(op: string) {
  if (op === '×' || op === '÷') return 2;
  if (op === '+' || op === '-') return 1;
  return 0;
}

export function evaluateExpression(expr: string): { valid: true; value: number } | { valid: false; message: string } {
  try {
    const tokens = tokenize(expr);
    if (tokens.length === 0) return { valid: false, message: '수식이 비어 있습니다.' };

    const values: number[] = [];
    const ops: string[] = [];

    const applyOp = () => {
      const val2 = values.pop();
      const val1 = values.pop();
      const op = ops.pop();

      if (val1 === undefined || val2 === undefined || !op) {
        throw new Error('수식이 올바르지 않습니다.');
      }

      let res = 0;
      switch (op) {
        case '+': res = val1 + val2; break;
        case '-': 
          res = val1 - val2; 
          if (res < 0) throw new Error('계산 과정에서 음수가 발생했습니다.');
          break;
        case '×': res = val1 * val2; break;
        case '÷':
          if (val2 === 0) throw new Error('0으로 나눌 수 없습니다.');
          if (val1 % val2 !== 0) throw new Error('나눗셈 결과가 정수가 아닙니다.');
          res = val1 / val2;
          break;
        default:
          throw new Error(`알 수 없는 연산자입니다: ${op}`);
      }
      values.push(res);
    };

    let expectNumber = true; 
    let openParens = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (typeof token === 'number') {
        if (!expectNumber) throw new Error('연산자가 필요합니다.');
        values.push(token);
        expectNumber = false;
      } else if (token === '(') {
        if (!expectNumber) throw new Error('연산자가 필요합니다.');
        ops.push(token);
        openParens++;
        expectNumber = true;
      } else if (token === ')') {
        if (expectNumber) throw new Error('괄호 안에 내용이 부족합니다.');
        if (openParens === 0) throw new Error('여는 괄호가 없습니다.');
        openParens--;
        while (ops.length > 0 && ops[ops.length - 1] !== '(') {
          applyOp();
        }
        ops.pop(); // remove '('
        expectNumber = false;
      } else if (['+', '-', '×', '÷'].includes(token as string)) {
        if (expectNumber) throw new Error('연산자 앞에는 숫자가 필요합니다.');
        while (ops.length > 0 && precedence(ops[ops.length - 1]) >= precedence(token as string)) {
          applyOp();
        }
        ops.push(token as string);
        expectNumber = true;
      } else {
        throw new Error(`허용되지 않은 문자: ${token}`);
      }
    }
    
    if (expectNumber) {
      throw new Error('연산자 뒤에는 숫자가 필요합니다.');
    }

    if (openParens > 0) throw new Error('닫히지 않은 괄호가 있습니다.');

    while (ops.length > 0) {
      applyOp();
    }

    if (values.length !== 1) throw new Error('수식이 올바르지 않습니다.');

    return { valid: true, value: values[0] };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { valid: false, message: e.message };
    }
    return { valid: false, message: '알 수 없는 오류가 발생했습니다.' };
  }
}
