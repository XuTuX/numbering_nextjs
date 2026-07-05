import Link from 'next/link';

export default function MultiGamePage() {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 md:px-8 py-8 font-sans selection:bg-gray-200">
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-[#8A8A8A] hover:text-[#111111] transition-colors text-sm font-medium">
          ← Back
        </Link>
      </div>

      <div className="w-full max-w-md flex flex-col items-center bg-white p-10 rounded-3xl border border-[#EAEAEA] shadow-sm">
        <h1 className="text-4xl font-medium text-[#111111] tracking-wide mb-3">MULTI</h1>
        <p className="text-[#8A8A8A] text-center mb-10 leading-relaxed">
          친구들과 숫자를 만들고 수식을 완성하세요.
        </p>

        <div className="w-full flex flex-col gap-4">
          <button className="w-full py-4 rounded-2xl bg-[#111111] text-white font-medium hover:bg-[#222222] transition-colors shadow-md">
            방 만들기
          </button>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-[#EAEAEA]"></div>
            <span className="flex-shrink-0 mx-4 text-[#8A8A8A] text-sm">또는</span>
            <div className="flex-grow border-t border-[#EAEAEA]"></div>
          </div>

          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="ROOM CODE" 
              className="w-full px-5 py-4 rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] text-[#111111] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all text-center tracking-widest font-mono uppercase"
            />
            <button className="w-full py-4 rounded-2xl bg-white text-[#111111] border border-[#EAEAEA] font-medium hover:bg-[#FAFAFA] hover:shadow-sm transition-all">
              방 코드로 참가하기
            </button>
          </div>
        </div>

        <p className="text-xs text-[#A0A0A0] mt-8">
          ※ 멀티플레이 기능은 준비 중입니다.
        </p>
      </div>
    </div>
  );
}
