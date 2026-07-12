export interface SequencePuzzle {
  first: number;
  second: number;
  termCount: number;
  sequence: number[];
  target: number;
}

const MIN_START = 1;
const MAX_START = 9;
export function getSequenceTermCount(round: number) {
  if (round <= 2) return 5;
  if (round <= 4) return 6;
  if (round <= 6) return 7;
  return 8;
}

export function buildSequence(first: number, second: number, termCount: number) {
  const sequence = [first, second];

  while (sequence.length < termCount) {
    sequence.push(sequence.at(-2)! + sequence.at(-1)!);
  }

  return sequence;
}

function hasUniqueAnswer(target: number, termCount: number) {
  let answerCount = 0;

  for (let first = MIN_START; first <= MAX_START; first += 1) {
    for (let second = MIN_START; second <= MAX_START; second += 1) {
      const sequence = buildSequence(first, second, termCount);
      if (sequence.at(-1) === target) answerCount += 1;
    }
  }

  return answerCount === 1;
}

export function createSequencePuzzle(round = 1): SequencePuzzle {
  const candidates: SequencePuzzle[] = [];
  const termCount = getSequenceTermCount(round);

  for (let first = MIN_START; first <= MAX_START; first += 1) {
    for (let second = MIN_START; second <= MAX_START; second += 1) {
      const sequence = buildSequence(first, second, termCount);
      const target = sequence.at(-1)!;

      if (hasUniqueAnswer(target, termCount)) {
        candidates.push({ first, second, termCount, sequence, target });
      }
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
