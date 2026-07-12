import PlayModeSelection from '@/components/game/PlayModeSelection';

export default function NumberVaultPage() {
  return (
    <PlayModeSelection
      gameNumber="GAME 03"
      title="숫자 금고"
      description="플레이 방식을 선택하세요."
      soloHref="/games/number-vault/solo"
      multiHref="/multi?mode=number-vault"
    />
  );
}
