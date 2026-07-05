import { GeneratedPuzzle, PuzzleDifficulty, OperatorToken } from './puzzleTypes';

// Keep track of the last 20 generated puzzles to avoid repetition
const historyQueue: string[] = [];
const HISTORY_LIMIT = 20;

function addToHistory(digitString: string) {
  historyQueue.push(digitString);
  if (historyQueue.length > HISTORY_LIMIT) {
    historyQueue.shift();
  }
}

function isDuplicate(digitString: string): boolean {
  return historyQueue.includes(digitString);
}

// Helpers
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateLength(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + String(curr).length, 0);
}

function getUsedOperators(expr: string): OperatorToken[] {
  const opSet = new Set<OperatorToken>();
  for (const char of expr) {
    if (['+', '-', '×', '÷', '=', '(', ')'].includes(char)) {
      opSet.add(char as OperatorToken);
    }
  }
  return Array.from(opSet);
}

// Generate EASY
function generateEasy(): { expr: string; digits: string } | null {
  // A + B = C or A - B = C
  // Length: 5~7 digits
  const isAdd = Math.random() < 0.5;
  const A = getRandomInt(1, 400);
  const B = getRandomInt(1, 400);
  
  if (isAdd) {
    const C = A + B;
    if (C > 999) return null;
    const len = calculateLength([A, B, C]);
    if (len >= 5 && len <= 7) {
      return { expr: `${A} + ${B} = ${C}`, digits: `${A}${B}${C}` };
    }
  } else {
    if (A <= B) return null; // No negative or zero
    const C = A - B;
    const len = calculateLength([A, B, C]);
    if (len >= 5 && len <= 7) {
      return { expr: `${A} - ${B} = ${C}`, digits: `${A}${B}${C}` };
    }
  }
  return null;
}

// Generate NORMAL
function generateNormal(): { expr: string; digits: string } | null {
  // Length: 6~9 digits
  // 1 or 2 operators
  const templates = [
    () => { // A × B = C
      const A = getRandomInt(2, 50);
      const B = getRandomInt(2, 50);
      const C = A * B;
      return { expr: `${A} × ${B} = ${C}`, vars: [A, B, C], d: C };
    },
    () => { // A ÷ B = C
      const B = getRandomInt(2, 50);
      const C = getRandomInt(2, 50);
      const A = B * C;
      return { expr: `${A} ÷ ${B} = ${C}`, vars: [A, B, C], d: C };
    },
    () => { // A + B × C = D
      const A = getRandomInt(1, 200);
      const B = getRandomInt(2, 30);
      const C = getRandomInt(2, 30);
      const D = A + B * C;
      return { expr: `${A} + ${B} × ${C} = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // A × B - C = D
      const A = getRandomInt(2, 30);
      const B = getRandomInt(2, 30);
      const C = getRandomInt(1, Math.max(1, A * B - 1));
      const D = A * B - C;
      return { expr: `${A} × ${B} - ${C} = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // A ÷ B + C = D
      const B = getRandomInt(2, 30);
      const temp = getRandomInt(2, 30);
      const A = B * temp;
      const C = getRandomInt(1, 100);
      const D = temp + C;
      return { expr: `${A} ÷ ${B} + ${C} = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // A + B - C = D
      const A = getRandomInt(10, 300);
      const B = getRandomInt(10, 300);
      const C = getRandomInt(1, A + B - 1);
      const D = A + B - C;
      return { expr: `${A} + ${B} - ${C} = ${D}`, vars: [A, B, C, D], d: D };
    }
  ];

  const t = templates[getRandomInt(0, templates.length - 1)]();
  if (t.d > 999 || t.d < 0) return null;
  const len = calculateLength(t.vars);
  if (len >= 6 && len <= 9) {
    return { expr: t.expr, digits: t.vars.join('') };
  }
  return null;
}

// Generate HARD
function generateHard(): { expr: string; digits: string } | null {
  // Length: 6~12 digits
  // 2+ operators, parens
  const templates = [
    () => { // (A + B) × C = D
      const A = getRandomInt(1, 100);
      const B = getRandomInt(1, 100);
      const C = getRandomInt(2, 20);
      const D = (A + B) * C;
      return { expr: `(${A} + ${B}) × ${C} = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // A × (B - C) = D
      const A = getRandomInt(2, 20);
      const B = getRandomInt(10, 100);
      const C = getRandomInt(1, B - 1);
      const D = A * (B - C);
      return { expr: `${A} × (${B} - ${C}) = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // (A - B) ÷ C = D
      const C = getRandomInt(2, 20);
      const D = getRandomInt(2, 20);
      const temp = C * D;
      const B = getRandomInt(1, 100);
      const A = temp + B;
      return { expr: `(${A} - ${B}) ÷ ${C} = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // (A + B) ÷ C = D
      const C = getRandomInt(2, 20);
      const D = getRandomInt(2, 20);
      const temp = C * D;
      const A = getRandomInt(1, temp - 1);
      const B = temp - A;
      return { expr: `(${A} + ${B}) ÷ ${C} = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // A × (B + C) = D
      const A = getRandomInt(2, 20);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(1, 50);
      const D = A * (B + C);
      return { expr: `${A} × (${B} + ${C}) = ${D}`, vars: [A, B, C, D], d: D };
    },
    () => { // (A + B) × C - D = E
      const A = getRandomInt(1, 50);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(2, 10);
      const D = getRandomInt(1, (A + B) * C - 1);
      const E = (A + B) * C - D;
      return { expr: `(${A} + ${B}) × ${C} - ${D} = ${E}`, vars: [A, B, C, D, E], d: E };
    },
    () => { // A × (B + C) ÷ D = E
      const A = getRandomInt(2, 20);
      const D = getRandomInt(2, 20);
      const E = getRandomInt(2, 50);
      // Ensure A * (B + C) = D * E
      // and A * (B + C) is divisible by D -> easiest is pick B+C such that it cancels out
      // Just pick (B+C) randomly such that A * (B+C) % D === 0
      const attempts = 10;
      for (let i = 0; i < attempts; i++) {
         const BC = getRandomInt(2, 100);
         if ((A * BC) % D === 0) {
            const B = getRandomInt(1, BC - 1);
            const C = BC - B;
            const resE = (A * BC) / D;
            if (resE <= 999 && resE > 0) {
              return { expr: `${A} × (${B} + ${C}) ÷ ${D} = ${resE}`, vars: [A, B, C, D, resE], d: resE };
            }
         }
      }
      return { d: -1, expr: '', vars: [] }; // failed
    }
  ];

  const t = templates[getRandomInt(0, templates.length - 1)]();
  if (t.d > 999 || t.d < 0) return null;
  const len = calculateLength(t.vars);
  if (len >= 6 && len <= 12) {
    return { expr: t.expr, digits: t.vars.join('') };
  }
  return null;
}

export function generatePuzzle(difficulty: PuzzleDifficulty): GeneratedPuzzle {
  const MAX_ATTEMPTS = 500;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let result: { expr: string; digits: string } | null = null;
    
    if (difficulty === 'EASY') result = generateEasy();
    else if (difficulty === 'NORMAL') result = generateNormal();
    else if (difficulty === 'HARD') result = generateHard();

    if (result) {
      if (isDuplicate(result.digits)) continue;
      
      addToHistory(result.digits);
      
      const digitArr = result.digits.split('');
      
      return {
        id: Math.random().toString(36).substring(2, 9),
        difficulty,
        digits: digitArr,
        digitString: result.digits,
        answerExpression: result.expr,
        usedOperators: getUsedOperators(result.expr)
      };
    }
  }

  // Fallback if we somehow fail 500 times
  const fb = difficulty === 'EASY' 
    ? { expr: "37 + 14 = 51", d: "371451" }
    : difficulty === 'NORMAL'
      ? { expr: "12 × 4 = 48", d: "12448" }
      : { expr: "(12 + 3) × 4 = 60", d: "123460" };
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    difficulty,
    digits: fb.d.split(''),
    digitString: fb.d,
    answerExpression: fb.expr,
    usedOperators: getUsedOperators(fb.expr)
  };
}
