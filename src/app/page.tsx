import HomeModeCard from '@/components/HomeModeCard';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12 font-sans selection:bg-gray-200">
      <main className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-[#111111] mb-6">
          NUMBERING
        </h1>
        <p className="text-lg md:text-xl text-[#8A8A8A] mb-16 text-center font-light">
          숫자 사이에 기호를 넣어 수식을 완성하세요.
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-3xl justify-center items-stretch">
          <HomeModeCard 
            title="SOLO" 
            description="혼자 퍼즐을 풀고 기록에 도전하세요." 
            href="/solo" 
          />
          <HomeModeCard 
            title="MULTI" 
            description="친구들과 숫자를 만들고 함께 수식을 완성하세요." 
            href="/multi" 
          />
        </div>
      </main>
    </div>
  );
}
