import Link from 'next/link';

interface GameHeaderProps {
  mode: string;
  stage: string;
  timer: string;
  backHref?: string;
}

export default function GameHeader({
  mode,
  stage,
  timer,
  backHref = '/games/formula-workshop',
}: GameHeaderProps) {
  return (
    <header className="flex justify-between items-center w-full mb-12">
      <div className="w-20">
        <Link href={backHref} className="text-[#8A8A8A] hover:text-[#111111] transition-colors text-sm font-medium">
          ← Back
        </Link>
      </div>
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-semibold text-[#111111] tracking-wide">{mode}</h1>
        <span className="text-xs text-[#8A8A8A] mt-1">{stage}</span>
      </div>
      <div className="w-20 text-right">
        <span className="text-lg font-medium text-[#111111] font-mono">{timer}</span>
      </div>
    </header>
  );
}
