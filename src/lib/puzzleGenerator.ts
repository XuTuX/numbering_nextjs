import { GeneratedPuzzle, PuzzleDifficulty, OperatorToken } from './puzzleTypes';
import { validateEquation } from './expressionValidator';

type PuzzleCandidate = {
  expr: string;
  vars: number[];
  value: number;
};

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

function buildPuzzleFromCandidate(
  candidate: PuzzleCandidate | null,
  minLength: number,
  maxLength: number
): { expr: string; digits: string } | null {
  if (!candidate) return null;
  if (candidate.value <= 0 || candidate.value > 999) return null;
  if (!candidate.vars.every((value) => Number.isInteger(value) && value > 0)) return null;

  const len = calculateLength(candidate.vars);
  if (len < minLength || len > maxLength) return null;

  const digits = candidate.vars.join('');
  const validation = validateEquation(candidate.expr, digits);
  if (!validation.valid || !validation.isCorrect) return null;

  return { expr: candidate.expr, digits };
}

// Generate EASY
function generateEasy(): { expr: string; digits: string } | null {
  // Length: 5 digits
  const templates: Array<() => PuzzleCandidate | null> = [
    () => { // A + B = C
      const A = getRandomInt(1, 400);
      const B = getRandomInt(1, 400);
      const C = A + B;
      return { expr: `${A} + ${B} = ${C}`, vars: [A, B, C], value: C };
    },
    () => { // A - B = C
      const A = getRandomInt(2, 800);
      const B = getRandomInt(1, A - 1);
      const C = A - B;
      return { expr: `${A} - ${B} = ${C}`, vars: [A, B, C], value: C };
    },
    () => { // C = A + B
      const A = getRandomInt(1, 400);
      const B = getRandomInt(1, 400);
      const C = A + B;
      return { expr: `${C} = ${A} + ${B}`, vars: [C, A, B], value: C };
    },
    () => { // C = A - B
      const A = getRandomInt(2, 800);
      const B = getRandomInt(1, A - 1);
      const C = A - B;
      return { expr: `${C} = ${A} - ${B}`, vars: [C, A, B], value: C };
    },
  ];

  const candidate = templates[getRandomInt(0, templates.length - 1)]();
  return buildPuzzleFromCandidate(candidate, 5, 5);
}

// Generate NORMAL
function generateNormal(): { expr: string; digits: string } | null {
  // Length: 6~7 digits
  // 1 or 2 operators around either side of the equals sign
  const templates: Array<() => PuzzleCandidate | null> = [
    () => { // A × B = C
      const A = getRandomInt(2, 50);
      const B = getRandomInt(2, 50);
      const C = A * B;
      return { expr: `${A} × ${B} = ${C}`, vars: [A, B, C], value: C };
    },
    () => { // A ÷ B = C
      const B = getRandomInt(2, 50);
      const C = getRandomInt(2, 50);
      const A = B * C;
      return { expr: `${A} ÷ ${B} = ${C}`, vars: [A, B, C], value: C };
    },
    () => { // A + B × C = D
      const A = getRandomInt(1, 200);
      const B = getRandomInt(2, 30);
      const C = getRandomInt(2, 30);
      const D = A + B * C;
      return { expr: `${A} + ${B} × ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // A × B - C = D
      const A = getRandomInt(2, 30);
      const B = getRandomInt(2, 30);
      const C = getRandomInt(1, Math.max(1, A * B - 1));
      const D = A * B - C;
      return { expr: `${A} × ${B} - ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // A ÷ B + C = D
      const B = getRandomInt(2, 30);
      const temp = getRandomInt(2, 30);
      const A = B * temp;
      const C = getRandomInt(1, 100);
      const D = temp + C;
      return { expr: `${A} ÷ ${B} + ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // A + B - C = D
      const A = getRandomInt(10, 300);
      const B = getRandomInt(10, 300);
      const C = getRandomInt(1, A + B - 1);
      const D = A + B - C;
      return { expr: `${A} + ${B} - ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // D = A + B × C
      const A = getRandomInt(1, 200);
      const B = getRandomInt(2, 30);
      const C = getRandomInt(2, 30);
      const D = A + B * C;
      return { expr: `${D} = ${A} + ${B} × ${C}`, vars: [D, A, B, C], value: D };
    },
    () => { // D = A × B - C
      const A = getRandomInt(2, 30);
      const B = getRandomInt(2, 30);
      const C = getRandomInt(1, A * B - 1);
      const D = A * B - C;
      return { expr: `${D} = ${A} × ${B} - ${C}`, vars: [D, A, B, C], value: D };
    },
    () => { // D = A + B - C
      const A = getRandomInt(10, 300);
      const B = getRandomInt(10, 300);
      const C = getRandomInt(1, A + B - 1);
      const D = A + B - C;
      return { expr: `${D} = ${A} + ${B} - ${C}`, vars: [D, A, B, C], value: D };
    },
    () => { // A + B = C - D
      const A = getRandomInt(10, 200);
      const B = getRandomInt(10, 200);
      const D = getRandomInt(1, 200);
      const C = A + B + D;
      return { expr: `${A} + ${B} = ${C} - ${D}`, vars: [A, B, C, D], value: A + B };
    },
    () => { // A - B = C + D
      const C = getRandomInt(1, 120);
      const D = getRandomInt(1, 120);
      const B = getRandomInt(1, 200);
      const A = B + C + D;
      return { expr: `${A} - ${B} = ${C} + ${D}`, vars: [A, B, C, D], value: C + D };
    },
    () => { // A × B = C + D
      const A = getRandomInt(2, 30);
      const B = getRandomInt(2, 30);
      const product = A * B;
      const C = getRandomInt(1, product - 1);
      const D = product - C;
      return { expr: `${A} × ${B} = ${C} + ${D}`, vars: [A, B, C, D], value: product };
    },
  ];

  const candidate = templates[getRandomInt(0, templates.length - 1)]();
  return buildPuzzleFromCandidate(candidate, 6, 7);
}

// Generate HARD
function generateHard(): { expr: string; digits: string } | null {
  // Length: 7~10 digits
  // 2+ operators, parens, and split expressions on either side
  const templates: Array<() => PuzzleCandidate | null> = [
    () => { // (A + B) × C = D
      const A = getRandomInt(1, 100);
      const B = getRandomInt(1, 100);
      const C = getRandomInt(2, 20);
      const D = (A + B) * C;
      return { expr: `(${A} + ${B}) × ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // A × (B - C) = D
      const A = getRandomInt(2, 20);
      const B = getRandomInt(10, 100);
      const C = getRandomInt(1, B - 1);
      const D = A * (B - C);
      return { expr: `${A} × (${B} - ${C}) = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // (A - B) ÷ C = D
      const C = getRandomInt(2, 20);
      const D = getRandomInt(2, 20);
      const temp = C * D;
      const B = getRandomInt(1, 100);
      const A = temp + B;
      return { expr: `(${A} - ${B}) ÷ ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // (A + B) ÷ C = D
      const C = getRandomInt(2, 20);
      const D = getRandomInt(2, 20);
      const temp = C * D;
      const A = getRandomInt(1, temp - 1);
      const B = temp - A;
      return { expr: `(${A} + ${B}) ÷ ${C} = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // A × (B + C) = D
      const A = getRandomInt(2, 20);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(1, 50);
      const D = A * (B + C);
      return { expr: `${A} × (${B} + ${C}) = ${D}`, vars: [A, B, C, D], value: D };
    },
    () => { // (A + B) × C - D = E
      const A = getRandomInt(1, 50);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(2, 10);
      const D = getRandomInt(1, (A + B) * C - 1);
      const E = (A + B) * C - D;
      return { expr: `(${A} + ${B}) × ${C} - ${D} = ${E}`, vars: [A, B, C, D, E], value: E };
    },
    () => { // A × (B + C) ÷ D = E
      const A = getRandomInt(2, 20);
      const D = getRandomInt(2, 20);
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
              return { expr: `${A} × (${B} + ${C}) ÷ ${D} = ${resE}`, vars: [A, B, C, D, resE], value: resE };
            }
         }
      }
      return null;
    },
    () => { // E = (A + B) × C - D
      const A = getRandomInt(1, 50);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(2, 10);
      const D = getRandomInt(1, (A + B) * C - 1);
      const E = (A + B) * C - D;
      return { expr: `${E} = (${A} + ${B}) × ${C} - ${D}`, vars: [E, A, B, C, D], value: E };
    },
    () => { // E = A × (B + C) - D
      const A = getRandomInt(2, 20);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(1, 50);
      const D = getRandomInt(1, A * (B + C) - 1);
      const E = A * (B + C) - D;
      return { expr: `${E} = ${A} × (${B} + ${C}) - ${D}`, vars: [E, A, B, C, D], value: E };
    },
    () => { // E = (A - B) × C + D
      const B = getRandomInt(1, 80);
      const diff = getRandomInt(2, 30);
      const A = B + diff;
      const C = getRandomInt(2, 20);
      const D = getRandomInt(1, 100);
      const E = diff * C + D;
      return { expr: `${E} = (${A} - ${B}) × ${C} + ${D}`, vars: [E, A, B, C, D], value: E };
    },
    () => { // (A + B) × C = D + E
      const A = getRandomInt(1, 50);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(2, 10);
      const product = (A + B) * C;
      const D = getRandomInt(1, product - 1);
      const E = product - D;
      return { expr: `(${A} + ${B}) × ${C} = ${D} + ${E}`, vars: [A, B, C, D, E], value: product };
    },
    () => { // A × (B + C) = D - E
      const A = getRandomInt(2, 20);
      const B = getRandomInt(1, 50);
      const C = getRandomInt(1, 50);
      const product = A * (B + C);
      const E = getRandomInt(1, 200);
      const D = product + E;
      return { expr: `${A} × (${B} + ${C}) = ${D} - ${E}`, vars: [A, B, C, D, E], value: product };
    },
    () => { // A + B × C = D - E
      const A = getRandomInt(1, 200);
      const B = getRandomInt(2, 25);
      const C = getRandomInt(2, 25);
      const value = A + B * C;
      const E = getRandomInt(1, 200);
      const D = value + E;
      return { expr: `${A} + ${B} × ${C} = ${D} - ${E}`, vars: [A, B, C, D, E], value };
    },
  ];

  const candidate = templates[getRandomInt(0, templates.length - 1)]();
  return buildPuzzleFromCandidate(candidate, 7, 10);
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
    ? { expr: "19 = 14 + 5", d: "19145" }
    : difficulty === 'NORMAL'
      ? { expr: "45 = 12 + 33", d: "451233" }
      : { expr: "104 = (12 + 14) × 4", d: "10412144" };
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    difficulty,
    digits: fb.d.split(''),
    digitString: fb.d,
    answerExpression: fb.expr,
    usedOperators: getUsedOperators(fb.expr)
  };
}
