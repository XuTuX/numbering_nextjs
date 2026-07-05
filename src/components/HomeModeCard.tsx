import Link from 'next/link';

interface HomeModeCardProps {
  title: string;
  description: string;
  href: string;
}

export default function HomeModeCard({ title, description, href }: HomeModeCardProps) {
  return (
    <Link 
      href={href}
      className="group flex flex-col p-8 rounded-2xl border border-[#EAEAEA] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full sm:w-80"
    >
      <h2 className="text-3xl font-medium text-[#111111] mb-4">{title}</h2>
      <p className="text-[#8A8A8A] text-lg leading-relaxed">{description}</p>
    </Link>
  );
}
