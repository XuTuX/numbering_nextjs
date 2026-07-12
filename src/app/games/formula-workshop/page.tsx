import Link from 'next/link';
import HomeModeCard from '@/components/HomeModeCard';

export default function FormulaWorkshopPage() {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-gray-200">
      <div className="absolute top-8 left-8">
        <Link
          href="/"
          className="text-[#8A8A8A] hover:text-[#111111] transition-colors text-sm font-medium"
        >
          ← 게임 모드
        </Link>
      </div>

      <main className="w-full max-w-5xl flex flex-col items-center">
        <span className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#8A8A8A]">
          GAME 01
        </span>
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-[#111111] mb-5 text-center">
          수식 공방
        </h1>
        <p className="text-lg text-[#8A8A8A] mb-14 text-center font-light">
          플레이 방식을 선택하세요.
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-3xl justify-center items-stretch">
          <HomeModeCard
            label="PLAY SOLO"
            title="혼자 하기"
            description="퍼즐을 풀고 더 빠른 기록에 도전하세요."
            href="/solo"
          />
          <HomeModeCard
            label="PLAY TOGETHER"
            title="함께 하기"
            description="친구와 같은 숫자로 더 많은 수식을 찾아보세요."
            href="/multi"
          />
        </div>
      </main>
    </div>
  );
}
