import GameModeCard from '@/components/home/GameModeCard';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-gray-200">
      <main className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-[#111111] mb-6">
          NUMBERING
        </h1>
        <p className="text-lg md:text-xl text-[#8A8A8A] mb-16 text-center font-light">
          오늘은 어떤 숫자 게임을 해볼까요?
        </p>

        <div className="flex flex-col md:flex-row md:flex-wrap gap-6 md:gap-8 w-full max-w-5xl justify-center items-stretch">
          <GameModeCard
            label="GAME 01"
            title="수식 공방"
            description="주어진 숫자 사이에 기호를 조립해 완벽한 수식을 만들어 보세요."
            href="/games/formula-workshop"
          />
          <GameModeCard
            label="GAME 02"
            title="수열 탐정"
            description="마지막 숫자를 단서로 수열을 거슬러 올라가 첫 두 숫자를 찾아내세요."
            href="/games/sequence-detective"
          />
          <GameModeCard
            label="GAME 03"
            title="숫자 금고"
            description="숫자 카드를 원하는 순서로 조합해 금고의 목표 숫자를 만들어 보세요."
            href="/games/number-vault"
          />
        </div>
      </main>
    </div>
  );
}
