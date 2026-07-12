import Link from 'next/link';

interface GameModeCardProps {
  title: string;
  description: string;
  href: string;
  label?: string;
}

export default function GameModeCard({ title, description, href, label }: GameModeCardProps) {
  return (
    <Link 
      href={href}
      className="group flex min-h-56 flex-col p-8 rounded-2xl border border-[#EAEAEA] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full sm:w-80"
    >
      {label && (
        <span className="mb-5 text-xs font-semibold tracking-[0.18em] text-[#8A8A8A]">
          {label}
        </span>
      )}
      <h2 className="text-3xl font-medium text-[#111111] mb-4">{title}</h2>
      <p className="text-[#8A8A8A] text-lg leading-relaxed">{description}</p>
      <span className="mt-auto pt-8 text-sm font-medium text-[#111111]">
        선택하기 <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
