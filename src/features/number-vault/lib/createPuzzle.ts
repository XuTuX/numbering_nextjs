export interface NumberVaultPuzzle {
  numbers: number[];
  target: number;
  answerExpression: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
}

interface Candidate {
  target: number;
  expression: string;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function getVaultDifficulty(round: number): NumberVaultPuzzle['difficulty'] {
  if (round <= 2) return 'EASY';
  if (round <= 4) return 'NORMAL';
  return 'HARD';
}

function createCandidate(values: number[]): Candidate {
  const [a, b, c, d, e] = values;

  if (values.length === 3) {
    const templates = [
      { target: (a + b) * c, expression: `(${a} + ${b}) × ${c}` },
      { target: a * b + c, expression: `${a} × ${b} + ${c}` },
      { target: a * b - c, expression: `${a} × ${b} - ${c}` },
    ];
    return templates[randomInt(0, templates.length - 1)];
  }

  if (values.length === 4) {
    const templates = [
      { target: (a + b) * c - d, expression: `(${a} + ${b}) × ${c} - ${d}` },
      { target: a * b + c * d, expression: `${a} × ${b} + ${c} × ${d}` },
      { target: (a + b) * (c - d), expression: `(${a} + ${b}) × (${c} - ${d})` },
      { target: a * b - c + d, expression: `${a} × ${b} - ${c} + ${d}` },
    ];
    return templates[randomInt(0, templates.length - 1)];
  }

  const templates = [
    { target: (a + b) * c + d - e, expression: `(${a} + ${b}) × ${c} + ${d} - ${e}` },
    { target: a * b + c * d - e, expression: `${a} × ${b} + ${c} × ${d} - ${e}` },
    { target: (a + b) * (c + d) - e, expression: `(${a} + ${b}) × (${c} + ${d}) - ${e}` },
    { target: a * b - c + d * e, expression: `${a} × ${b} - ${c} + ${d} × ${e}` },
  ];
  return templates[randomInt(0, templates.length - 1)];
}

export function createNumberVaultPuzzle(round = 1): NumberVaultPuzzle {
  const difficulty = getVaultDifficulty(round);
  const numberCount = difficulty === 'EASY' ? 3 : difficulty === 'NORMAL' ? 4 : 5;

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const values = Array.from({ length: numberCount }, () => randomInt(2, 9));
    const candidate = createCandidate(values);
    if (Number.isInteger(candidate.target) && candidate.target >= 10 && candidate.target <= 250) {
      return {
        numbers: shuffle(values),
        target: candidate.target,
        answerExpression: candidate.expression,
        difficulty,
      };
    }
  }

  if (difficulty === 'NORMAL') {
    return { numbers: [2, 3, 4, 5], target: 29, answerExpression: '2 × 3 × 4 + 5', difficulty };
  }
  if (difficulty === 'HARD') {
    return { numbers: [2, 3, 4, 5, 6], target: 20, answerExpression: '2 × 3 + 4 × 5 - 6', difficulty };
  }
  return { numbers: [2, 3, 4], target: 20, answerExpression: '(2 + 3) × 4', difficulty };
}
