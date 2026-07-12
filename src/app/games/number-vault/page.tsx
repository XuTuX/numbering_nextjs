import { connection } from 'next/server';
import NumberVaultGame from '@/components/NumberVaultGame';
import { createNumberVaultPuzzle } from '@/lib/numberVaultPuzzle';

export default async function NumberVaultPage() {
  await connection();

  return <NumberVaultGame initialPuzzle={createNumberVaultPuzzle()} />;
}
