import { connection } from 'next/server';
import NumberVaultGame from '@/features/number-vault/components/NumberVaultGame';
import { createNumberVaultPuzzle } from '@/features/number-vault/lib/createPuzzle';

export default async function NumberVaultSoloPage() {
  await connection();

  return <NumberVaultGame initialPuzzle={createNumberVaultPuzzle()} />;
}
