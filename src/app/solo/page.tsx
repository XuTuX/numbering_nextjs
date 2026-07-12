import { connection } from 'next/server';
import FormulaWorkshopGame from '@/features/formula-workshop/components/FormulaWorkshopGame';
import { generatePuzzle } from '@/features/formula-workshop/lib/generatePuzzle';

export default async function SoloGamePage() {
  await connection();
  return <FormulaWorkshopGame initialPuzzle={generatePuzzle('EASY')} />;
}
