import Link from 'next/link';
import GameModeCard from '@/components/home/GameModeCard';

interface PlayModeSelectionProps {
  gameNumber: string;
  title: string;
  description: string;
  soloHref: string;
  multiHref: string;
}

export default function PlayModeSelection({
  gameNumber,
  title,
  description,
  soloHref,
  multiHref,
}: PlayModeSelectionProps) {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-gray-200">
      <div className="absolute left-1/2 top-8 z-20 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 md:top-12 md:w-[calc(100%-4rem)]">
        <Link href="/" className="text-[#8A8A8A] hover:text-[#111111] transition-colors text-sm font-medium">
          ← 게임 모드
        </Link>
      </div>

      <main className="w-full max-w-5xl flex flex-col items-center">
        <span className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#8A8A8A]">
          {gameNumber}
        </span>
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-[#111111] mb-5 text-center">
          {title}
        </h1>
        <p className="text-lg text-[#8A8A8A] mb-14 text-center font-light">{description}</p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-3xl justify-center items-stretch">
          <GameModeCard label="PLAY SOLO" title="혼자 하기" description="바로 시작하고 라운드를 거듭하며 난이도를 높여보세요." href={soloHref} />
          <GameModeCard label="PLAY TOGETHER" title="함께 하기" description="친구와 같은 문제를 풀며 점수를 겨뤄보세요." href={multiHref} />
        </div>
      </main>
    </div>
  );
}
