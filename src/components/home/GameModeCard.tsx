import Link from 'next/link';

interface GameModeCardProps {
  title: string;
  description: string;
  href: string;
  label?: string;
  wide?: boolean;
}

export default function GameModeCard({ title, description, href, label, wide = false }: GameModeCardProps) {
  return (
    <Link 
      href={href}
      className={`group flex rounded-2xl border border-[#EAEAEA] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        wide
          ? 'w-full flex-col md:min-h-0 md:flex-row md:items-center md:gap-8'
          : 'min-h-56 w-full flex-col sm:w-80'
      }`}
    >
      {label && (
        <span className={`text-xs font-semibold tracking-[0.18em] text-[#8A8A8A] ${wide ? 'mb-5 md:mb-0 md:w-32 md:shrink-0' : 'mb-5'}`}>
          {label}
        </span>
      )}
      <h2 className={`text-3xl font-medium text-[#111111] ${wide ? 'mb-4 md:mb-0 md:w-40 md:shrink-0' : 'mb-4'}`}>{title}</h2>
      <p className={`text-lg leading-relaxed text-[#8A8A8A] ${wide ? 'md:flex-1' : ''}`}>{description}</p>
      <span className={`text-sm font-medium text-[#111111] ${wide ? 'mt-8 md:mt-0 md:shrink-0' : 'mt-auto pt-8'}`}>
        선택하기 <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
