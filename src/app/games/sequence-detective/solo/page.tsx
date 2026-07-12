import { connection } from 'next/server';
import SequenceDetectiveGame from '@/features/sequence-detective/components/SequenceDetectiveGame';
import { createSequencePuzzle } from '@/features/sequence-detective/lib/createPuzzle';

export default async function SequenceDetectiveSoloPage() {
  await connection();

  return <SequenceDetectiveGame initialPuzzle={createSequencePuzzle()} />;
}
