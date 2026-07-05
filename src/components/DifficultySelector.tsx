import { PuzzleDifficulty } from '@/lib/puzzleTypes';

interface Props {
  onSelect: (difficulty: PuzzleDifficulty) => void;
}

export default function DifficultySelector({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-grow space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111111]">난이도 선택</h2>
        <p className="text-[#8A8A8A] text-sm md:text-base">원하는 난이도를 선택해 퍼즐을 시작하세요</p>
      </div>
      
      <div className="flex flex-col w-full max-w-xs space-y-4">
        <button 
          onClick={() => onSelect('EASY')} 
          className="group relative flex items-center justify-between px-6 py-5 rounded-2xl bg-white border border-[#EAEAEA] hover:border-[#111111] hover:shadow-md transition-all text-left"
        >
          <div>
            <div className="text-lg font-bold text-[#111111] tracking-wide">EASY</div>
            <div className="text-xs text-[#8A8A8A] mt-1">+ - = 기호만 사용</div>
          </div>
          <span className="text-[#EAEAEA] group-hover:text-[#111111] transition-colors">→</span>
        </button>

        <button 
          onClick={() => onSelect('NORMAL')} 
          className="group relative flex items-center justify-between px-6 py-5 rounded-2xl bg-white border border-[#EAEAEA] hover:border-[#111111] hover:shadow-md transition-all text-left"
        >
          <div>
            <div className="text-lg font-bold text-[#111111] tracking-wide">NORMAL</div>
            <div className="text-xs text-[#8A8A8A] mt-1">사칙연산 모두 사용</div>
          </div>
          <span className="text-[#EAEAEA] group-hover:text-[#111111] transition-colors">→</span>
        </button>

        <button 
          onClick={() => onSelect('HARD')} 
          className="group relative flex items-center justify-between px-6 py-5 rounded-2xl bg-white border border-[#EAEAEA] hover:border-[#111111] hover:shadow-md transition-all text-left"
        >
          <div>
            <div className="text-lg font-bold text-[#111111] tracking-wide">HARD</div>
            <div className="text-xs text-[#8A8A8A] mt-1">괄호 포함 모든 기호 사용</div>
          </div>
          <span className="text-[#EAEAEA] group-hover:text-[#111111] transition-colors">→</span>
        </button>
      </div>
    </div>
  );
}
