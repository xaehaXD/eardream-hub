"use client";

import Link from "next/link";

interface PlaceholderCardProps {
  variant: number;
  rotation?: number;
}

const placeholderContent = [
  {
    title: "광고주 찾습니다",
    description:
      "여기는 아직 비어있습니다. 팀원 찾거나 써봐달라고 할 게 있으면 한 장 붙여두세요.",
  },
  {
    title: "이 자리 비어있음",
    description: "가격: 무료. 조건: 뭔가 만들고 있거나 누군가 필요할 것.",
  },
  {
    title: "단톡에 흘리지 말고",
    description: "여기에 붙이면 적어도 사라지진 않습니다.",
  },
];

export function PlaceholderCard({ variant, rotation = 0 }: PlaceholderCardProps) {
  const content = placeholderContent[variant % placeholderContent.length];

  const tapeVariants = [
    { left: "45%", rotate: -2 },
    { left: "40%", rotate: 3 },
    { left: "50%", rotate: -1 },
  ];
  const tape = tapeVariants[variant % tapeVariants.length];

  return (
    <Link href="/posters/new" className="block group">
      <article
        className="relative bg-paper/60 p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow duration-200 border-2 border-dashed border-foreground/20"
        style={{
          transform: `rotate(${rotation}deg)`,
          boxShadow: "3px 3px 8px rgba(0,0,0,0.1), 1px 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Tape piece */}
        <div
          className="absolute -top-2 w-12 h-5 bg-amber-100/60 shadow-sm z-10"
          style={{
            left: tape.left,
            transform: `translateX(-50%) rotate(${tape.rotate}deg)`,
          }}
        />

        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Empty badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-xs font-medium bg-foreground/5 text-muted-foreground">
              빈자리
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-foreground/70 mb-2 group-hover:text-accent transition-colors">
            {content.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground/80 mb-4 leading-relaxed">
            {content.description}
          </p>

          {/* CTA */}
          <div className="pt-2 border-t border-foreground/10">
            <span className="text-xs text-accent font-medium group-hover:underline">
              벽보 붙이러 가기 &rarr;
            </span>
          </div>
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
      </article>
    </Link>
  );
}
