"use client";

import Link from "next/link";
import {
  Post,
  categoryLabels,
  statusLabels,
  getEffectiveStatus,
  getDeadlineDisplay,
} from "@/lib/supabase";

interface PosterCardProps {
  post: Post;
  rotation?: number;
}

export function PosterCard({ post, rotation = 0 }: PosterCardProps) {
  const effectiveStatus = getEffectiveStatus(post);
  const isClosed = effectiveStatus === "closed" || effectiveStatus === "expired";
  const timeAgo = getTimeAgo(post.created_at);
  const deadlineInfo = post.deadline ? getDeadlineDisplay(post.deadline) : null;

  // Random tape positions for variety
  const tapeVariants = [
    { left: "45%", rotate: -2 },
    { left: "40%", rotate: 3 },
    { left: "50%", rotate: -1 },
  ];
  const tapeIndex = Math.abs(Math.round(rotation * 10)) % tapeVariants.length;
  const tape = tapeVariants[tapeIndex];

  return (
    <Link href={`/posters/${post.id}`} className="block group">
      <article
        className={`relative bg-paper p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-200 ${
          isClosed ? "opacity-60" : ""
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          boxShadow:
            "4px 4px 12px rgba(0,0,0,0.2), 1px 1px 4px rgba(0,0,0,0.15)",
        }}
      >
        {/* Tape piece */}
        <div
          className="absolute -top-2 w-12 h-5 bg-amber-100/80 shadow-sm z-10"
          style={{
            left: tape.left,
            transform: `translateX(-50%) rotate(${tape.rotate}deg)`,
          }}
        />

        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Status & Category badges */}
        <div className="relative z-10 flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`px-2 py-0.5 text-xs font-bold ${
              effectiveStatus === "open"
                ? "bg-green-100 text-green-800"
                : effectiveStatus === "closed"
                  ? "bg-gray-200 text-gray-600 line-through"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {effectiveStatus === "expired"
              ? "기한 지남"
              : statusLabels[post.status]}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-foreground/10 text-foreground">
            {categoryLabels[post.category]}
          </span>
          {isClosed && (
            <span className="px-2 py-0.5 text-xs font-bold bg-gray-800 text-white">
              마감
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`relative z-10 text-base sm:text-lg font-bold mb-2 line-clamp-2 ${
            isClosed
              ? "text-foreground/60"
              : "text-foreground group-hover:text-accent transition-colors"
          }`}
        >
          {post.title}
        </h3>

        {/* Deadline badge (if exists and not closed manually) */}
        {deadlineInfo && deadlineInfo.label && (
          <div
            className={`relative z-10 inline-block mb-2 px-2 py-1 text-xs font-bold ${
              deadlineInfo.isExpired
                ? "bg-red-100 text-red-700"
                : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 3
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {deadlineInfo.isExpired ? "마감됨" : deadlineInfo.label}
          </div>
        )}

        {/* Description preview */}
        <p className="relative z-10 text-sm text-muted-foreground mb-3 line-clamp-2">
          {post.description}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-foreground/5 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-foreground/10">
          <span className="text-xs text-muted-foreground">{post.author}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Hover effect - slight lift */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-200" />
      </article>
    </Link>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
