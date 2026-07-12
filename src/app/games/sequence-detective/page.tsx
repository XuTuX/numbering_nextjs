import PlayModeSelection from '@/components/game/PlayModeSelection';

export default function SequenceDetectivePage() {
  return (
    <PlayModeSelection
      gameNumber="GAME 02"
      title="수열 탐정"
      description="플레이 방식을 선택하세요."
      soloHref="/games/sequence-detective/solo"
      multiHref="/multi?mode=sequence-detective"
    />
  );
}
