export interface NumberVaultPuzzle {
  numbers: number[];
  target: number;
  answerExpression: string;
}

type PuzzleTemplate = (a: number, b: number, c: number, d: number) => {
  target: number;
  expression: string;
};

const templates: PuzzleTemplate[] = [
  (a, b, c, d) => ({ target: (a + b) * c - d, expression: `(${a} + ${b}) × ${c} - ${d}` }),
  (a, b, c, d) => ({ target: a * b + c * d, expression: `${a} × ${b} + ${c} × ${d}` }),
  (a, b, c, d) => ({ target: (a + b) * (c - d), expression: `(${a} + ${b}) × (${c} - ${d})` }),
  (a, b, c, d) => ({ target: a * b - c + d, expression: `${a} × ${b} - ${c} + ${d}` }),
  (a, b, c, d) => ({ target: (a * b) / c + d, expression: `${a} × ${b} ÷ ${c} + ${d}` }),
];

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

export function createNumberVaultPuzzle(): NumberVaultPuzzle {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const values = Array.from({ length: 4 }, () => randomInt(2, 9));
    const [a, b, c, d] = values;
    const template = templates[randomInt(0, templates.length - 1)];
    const candidate = template(a, b, c, d);

    if (
      Number.isInteger(candidate.target) &&
      candidate.target >= 10 &&
      candidate.target <= 150
    ) {
      return {
        numbers: shuffle(values),
        target: candidate.target,
        answerExpression: candidate.expression,
      };
    }
  }

  return {
    numbers: [2, 3, 4, 5],
    target: 29,
    answerExpression: '2 × 3 × 4 + 5',
  };
}
