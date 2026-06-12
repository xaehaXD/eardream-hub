"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import {
  supabase,
  Post,
  getVisitorId,
  buildShareText,
} from "@/lib/supabase";

declare global {
  interface Window {
    Kakao?: any;
  }
}

interface PostEngagementProps {
  post: Post;
}

export function PostEngagement({ post }: PostEngagementProps) {
  const [visitorId, setVisitorId] = useState("");
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

  // Resolve the anonymous visitor id once on mount.
  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  // Load current upvote count + whether this visitor already upvoted.
  useEffect(() => {
    if (!post.id) return;
    fetchUpvotes(post.id, visitorId);
  }, [post.id, visitorId]);

  async function fetchUpvotes(postId: string, fingerprint: string) {
    try {
      const { count } = await supabase
        .from("post_reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .eq("reaction_type", "upvote");
      setUpvoteCount(count ?? 0);

      if (fingerprint) {
        const { data } = await supabase
          .from("post_reactions")
          .select("id")
          .eq("post_id", postId)
          .eq("reaction_type", "upvote")
          .eq("fingerprint", fingerprint)
          .maybeSingle();
        setHasUpvoted(!!data);
      }
    } catch {
      // Table may not exist yet (migration pending) - fail quietly.
      console.log("[v0] Failed to fetch upvotes");
    }
  }

  async function handleUpvote() {
    if (submitting) return;
    if (hasUpvoted) {
      toast("이미 찍었어요.");
      return;
    }
    setSubmitting(true);
    // Optimistic UI
    setHasUpvoted(true);
    setUpvoteCount((c) => c + 1);
    try {
      const { error } = await supabase.from("post_reactions").insert({
        post_id: post.id,
        reaction_type: "upvote",
        fingerprint: visitorId,
      });

      if (error) {
        // Unique violation -> already upvoted (de-dup). Anything else: revert.
        if (error.code === "23505") {
          toast("이미 찍었어요.");
        } else {
          setHasUpvoted(false);
          setUpvoteCount((c) => Math.max(0, c - 1));
          toast.error("따봉 저장에 실패했어요.");
        }
      } else {
        toast.success("따봉 찍혔어요.");
      }
    } catch {
      setHasUpvoted(false);
      setUpvoteCount((c) => Math.max(0, c - 1));
      toast.error("따봉 저장에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  function logShare(target: "kakao" | "copy") {
    // Fire-and-forget analytics log (no public count exposure).
    supabase
      .from("post_share_events")
      .insert({
        post_id: post.id,
        share_target: target,
        fingerprint: visitorId || null,
      })
      .then(undefined, () => {
        console.log("[v0] Failed to log share event");
      });
  }

  function getCurrentUrl() {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  async function copyShareText() {
    const text = buildShareText(post, getCurrentUrl());
    try {
      await navigator.clipboard.writeText(text);
      toast.success("링크 포함해서 복사됐어요.");
      logShare("copy");
    } catch {
      toast.error("복사에 실패했어요. 링크를 직접 복사해주세요.");
    }
  }

  function handleKakaoShare() {
    const url = getCurrentUrl();
    const kakao = window.Kakao;

    // Initialize SDK once if needed.
    if (kakao && kakaoKey && !kakao.isInitialized?.()) {
      try {
        kakao.init(kakaoKey);
      } catch {
        // ignore - will fallback below
      }
    }

    const canUseKakao =
      kakao && kakaoKey && kakao.isInitialized?.() && kakao.Share;

    if (!canUseKakao) {
      // Fallback to link copy when SDK unavailable / not configured.
      copyShareText();
      return;
    }

    try {
      const excerpt = post.description.slice(0, 100);
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: post.title,
          description: `벽보 한 장 뜯어왔어요 👀\n${excerpt}`,
          imageUrl:
            post.image_url ||
            `${window.location.origin}/og-default.png`,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: "벽보 보러가기",
            link: { mobileWebUrl: url, webUrl: url },
          },
        ],
      });
      logShare("kakao");
    } catch {
      // Any runtime failure -> fallback to copy.
      copyShareText();
    }
  }

  return (
    <>
      {kakaoKey && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          crossOrigin="anonymous"
          onLoad={() => {
            try {
              if (window.Kakao && !window.Kakao.isInitialized?.()) {
                window.Kakao.init(kakaoKey);
              }
            } catch {
              // ignore - share will fallback to copy
            }
          }}
        />
      )}

      <div className="my-6 border-t-2 border-dashed border-foreground/30 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Upvote stamp */}
          <button
            onClick={handleUpvote}
            disabled={submitting}
            aria-pressed={hasUpvoted}
            aria-label="따봉"
            className={`relative shrink-0 flex flex-col items-center justify-center w-16 h-16 -rotate-3 border-2 transition-all active:scale-95 ${
              hasUpvoted
                ? "bg-amber-200 border-amber-500 text-amber-900 shadow-inner"
                : "bg-paper border-foreground/40 text-foreground hover:bg-amber-50 hover:border-amber-400 shadow-sm"
            }`}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              &#128077;
            </span>
            {upvoteCount > 0 && (
              <span className="text-xs font-bold leading-none mt-0.5">
                {upvoteCount}
              </span>
            )}
          </button>

          {/* Share scraps */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleKakaoShare}
              className="px-4 py-2 text-sm font-bold rotate-1 bg-[#FEE500] text-[#3C1E1E] border border-yellow-500/60 shadow-sm hover:brightness-95 active:scale-95 transition-all"
            >
              카톡으로
            </button>
            <button
              onClick={copyShareText}
              className="px-4 py-2 text-sm font-bold -rotate-1 bg-paper text-foreground border border-foreground/40 shadow-sm hover:bg-foreground/5 active:scale-95 transition-all"
            >
              링크포함
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
