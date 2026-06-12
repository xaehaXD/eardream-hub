"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [shareOpen, setShareOpen] = useState(false);

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
      toast("이미 추천했어요.");
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
          toast("이미 추천했어요.");
        } else {
          setHasUpvoted(false);
          setUpvoteCount((c) => Math.max(0, c - 1));
          toast.error("추천 저장에 실패했어요.");
        }
      } else {
        toast.success("추천했어요.");
      }
    } catch {
      setHasUpvoted(false);
      setUpvoteCount((c) => Math.max(0, c - 1));
      toast.error("추천 저장에 실패했어요.");
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
      toast.success("내용과 링크를 복사했어요.");
      logShare("copy");
    } catch {
      toast.error("복사에 실패했어요. 링크를 직접 복사해주세요.");
    } finally {
      setShareOpen(false);
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
      setShareOpen(false);
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
        <div className="flex flex-wrap items-stretch gap-2">
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            disabled={submitting}
            aria-pressed={hasUpvoted}
            aria-label="추천"
            className={`inline-flex h-11 items-center justify-center gap-1.5 px-4 text-sm font-bold border-2 transition-colors active:scale-95 ${
              hasUpvoted
                ? "bg-amber-200 border-amber-500 text-amber-900"
                : "bg-paper border-foreground/40 text-foreground hover:bg-amber-50 hover:border-amber-400"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              &#128077;
            </span>
            {upvoteCount > 0 && (
              <span className="leading-none tabular-nums">{upvoteCount}</span>
            )}
          </button>

          {/* Share */}
          <Popover open={shareOpen} onOpenChange={setShareOpen}>
            <PopoverTrigger asChild>
              <button
                aria-label="공유하기"
                className="inline-flex h-11 items-center justify-center px-4 text-sm font-bold bg-paper border-2 border-foreground/40 text-foreground hover:bg-foreground/5 active:scale-95 transition-colors"
              >
                공유하기
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 p-3 border-2 border-foreground/30 bg-paper"
            >
              <p className="text-sm font-bold text-foreground mb-2">공유하기</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleKakaoShare}
                  className="inline-flex h-10 items-center justify-center px-3 text-sm font-bold bg-[#FEE500] text-[#3C1E1E] border border-yellow-500/60 hover:brightness-95 active:scale-95 transition-all"
                >
                  카톡 공유
                </button>
                <button
                  onClick={copyShareText}
                  className="inline-flex h-10 items-center justify-center px-3 text-sm font-bold bg-background text-foreground border border-foreground/40 hover:bg-foreground/5 active:scale-95 transition-all"
                >
                  내용포함 복사
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}
