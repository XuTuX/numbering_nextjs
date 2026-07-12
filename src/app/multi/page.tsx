import MultiplayerLobby from '@/features/multiplayer/components/MultiplayerLobby';
import { normalizeGameMode } from '@/features/multiplayer/types';

export default async function MultiGamePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return <MultiplayerLobby gameMode={normalizeGameMode(mode)} />;
}
