import { connection } from 'next/server';
import SequenceDetectiveGame from '@/components/SequenceDetectiveGame';
import { createSequencePuzzle } from '@/lib/sequencePuzzle';

export default async function SequenceDetectivePage() {
  await connection();

  return <SequenceDetectiveGame initialPuzzle={createSequencePuzzle()} />;
}
