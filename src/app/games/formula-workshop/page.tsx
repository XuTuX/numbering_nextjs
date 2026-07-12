import PlayModeSelection from '@/components/game/PlayModeSelection';

export default function FormulaWorkshopPage() {
  return (
    <PlayModeSelection
      gameNumber="GAME 01"
      title="수식 공방"
      description="플레이 방식을 선택하세요."
      soloHref="/solo"
      multiHref="/multi?mode=formula-workshop"
    />
  );
}
