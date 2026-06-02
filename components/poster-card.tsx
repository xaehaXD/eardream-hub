"use client";

import Link from "next/link";
import {
  Post,
  PaperType,
  AttachmentType,
  categoryLabels,
  statusLabels,
  getEffectiveStatus,
  getDeadlineDisplay,
  getPostVisualProps,
} from "@/lib/supabase";

interface PosterCardProps {
  post: Post;
}

export function PosterCard({ post }: PosterCardProps) {
  const effectiveStatus = getEffectiveStatus(post);
  const isClosed = effectiveStatus === "closed" || effectiveStatus === "expired";
  const timeAgo = getTimeAgo(post.created_at);
  const deadlineInfo = post.deadline ? getDeadlineDisplay(post.deadline) : null;

  // Get visual properties (uses stored values or deterministic defaults)
  const { paperType, paperColor, attachmentType, rotationDeg } = getPostVisualProps(post);

  // Mobile-adjusted rotation (-1 to +1)
  const mobileRotation = rotationDeg * 0.5;

  return (
    <Link href={`/posters/${post.id}`} className="block group">
      <article
        className={`relative p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-200 ${
          isClosed ? "opacity-60" : ""
        }`}
        style={{
          backgroundColor: paperColor,
          transform: `rotate(${rotationDeg}deg)`,
          boxShadow:
            "4px 4px 12px rgba(0,0,0,0.2), 1px 1px 4px rgba(0,0,0,0.15)",
        }}
      >
        {/* Attachment decoration */}
        <AttachmentDecoration type={attachmentType} />

        {/* Paper texture overlay - varies by paper type */}
        <PaperTexture type={paperType} />

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
          <div className="flex items-center gap-2">
            {post.image_url && (
              <span className="text-xs text-blue-600" title="이미지 첨부됨">
                &#128247;
              </span>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>

        {/* Hover effect - slight lift */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-200" />
      </article>
    </Link>
  );
}

// Attachment decoration component
function AttachmentDecoration({ type }: { type: AttachmentType }) {
  switch (type) {
    case "thumbtack":
      return (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-md" 
               style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)" }} />
        </div>
      );
    case "masking_tape":
      return (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-5 bg-amber-100/80 shadow-sm z-20"
          style={{ transform: "translateX(-50%) rotate(-2deg)" }}
        />
      );
    case "clear_tape":
      return (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/40 shadow-sm z-20"
          style={{ 
            transform: "translateX(-50%) rotate(1deg)",
            backdropFilter: "blur(1px)"
          }}
        />
      );
    case "stapler":
      return (
        <div className="absolute top-2 left-3 z-20">
          <div className="w-3 h-1 bg-gray-400 rounded-sm" 
               style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
        </div>
      );
    case "clip":
      return (
        <div className="absolute -top-3 right-4 z-20">
          <div className="w-6 h-8 border-2 border-gray-400 rounded-sm bg-transparent"
               style={{ borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }} />
        </div>
      );
    case "glue":
      return (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-yellow-100/30 to-transparent z-20" />
      );
    default:
      return null;
  }
}

// Paper texture component
function PaperTexture({ type }: { type: PaperType }) {
  // Different texture intensities based on paper type
  const textureOpacity = {
    a4: 0.08,
    memo: 0.12,
    postit: 0.1,
    flyer: 0.06,
    notice: 0.18,
  }[type];

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: textureOpacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
      }}
    />
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
