"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  supabase,
  Post,
  categoryLabels,
  statusLabels,
  mockPosts,
} from "@/lib/supabase";

export default function PosterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  async function fetchPost() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log("[v0] Supabase error, trying mock data:", error.message);
        // Try to find in mock data
        const mockPost = mockPosts.find((p) => p.id === id);
        if (mockPost) {
          setPost(mockPost);
          setUsingMockData(true);
        } else {
          setNotFound(true);
        }
      } else if (data) {
        setPost(data);
        setUsingMockData(false);
      } else {
        setNotFound(true);
      }
    } catch {
      console.log("[v0] Connection error, trying mock data");
      const mockPost = mockPosts.find((p) => p.id === id);
      if (mockPost) {
        setPost(mockPost);
        setUsingMockData(true);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-wall relative flex items-center justify-center">
        <p className="text-paper/60">벽보 불러오는 중...</p>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen bg-wall relative flex items-center justify-center">
        <div className="text-center">
          <p className="text-paper/60 mb-4">벽보를 찾을 수 없어요</p>
          <Link
            href="/posters"
            className="text-paper underline underline-offset-2 hover:text-paper/80 transition-colors"
          >
            벽보판으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const isOpen = post.status === "open";
  const formattedDate = new Date(post.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-wall relative overflow-hidden">
      {/* Wall texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Wall marks */}
      <div className="absolute top-[25%] left-[8%] w-28 h-28 bg-black/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[10%] right-[5%] w-24 h-16 bg-black/4 rounded-full blur-2xl" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-6">
          <Link
            href="/posters"
            className="text-paper/80 hover:text-paper text-sm transition-colors"
          >
            &larr; 벽보판으로
          </Link>
          {usingMockData && (
            <p className="text-amber-200/80 text-xs mt-2">
              * 데모 모드로 표시 중
            </p>
          )}
        </header>

        {/* The Paper Notice */}
        <article className="relative">
          {/* Tape pieces */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/80 rotate-[-1deg] shadow-sm z-20" />
          <div className="absolute -top-2 left-[10%] w-14 h-5 bg-amber-50/70 rotate-[7deg] shadow-sm z-20 hidden sm:block" />
          <div className="absolute -top-2 right-[12%] w-16 h-5 bg-amber-100/60 rotate-[-3deg] shadow-sm z-20 hidden sm:block" />

          <div
            className="relative bg-paper p-6 sm:p-10 shadow-2xl rotate-[0.3deg]"
            style={{
              boxShadow:
                "8px 8px 20px rgba(0,0,0,0.3), 2px 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {/* Paper texture */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Rough edge effect */}
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-wall/20 to-transparent" />

            {/* Content */}
            <div className="relative z-10">
              {/* Status & Category */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 text-sm font-bold ${
                    isOpen
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {statusLabels[post.status]}
                </span>
                <span className="px-3 py-1 text-sm font-medium bg-foreground/10 text-foreground">
                  {categoryLabels[post.category]}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-foreground mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Description */}
              <div className="mb-6">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm bg-foreground/5 text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="my-6 h-px bg-foreground/20" />

              {/* Contact section */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground mb-3">
                  찔러보기
                </h2>
                <div className="bg-foreground/5 p-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="font-medium">{post.contact_type}:</span>
                    <span className="text-accent font-bold">
                      {post.contact_value}
                    </span>
                  </div>
                </div>
              </div>

              {/* External link */}
              {post.external_link && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground mb-3">
                    외부 링크
                  </h2>
                  <a
                    href={post.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline underline-offset-2 break-all"
                  >
                    {post.external_link}
                    <span className="text-xs">&nearr;</span>
                  </a>
                </div>
              )}

              {/* Divider */}
              <div className="my-6 h-px bg-foreground/20" />

              {/* Meta info */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>작성자: {post.author}</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Paper corner effect */}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-wall rotate-45 translate-x-1 translate-y-1" />
        </article>

        {/* Back button */}
        <div className="mt-8 text-center">
          <Link
            href="/posters"
            className="inline-block bg-paper/20 text-paper px-6 py-2 text-sm font-medium hover:bg-paper/30 transition-colors"
          >
            다른 벽보 보기
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-paper/50">6기 내부용</p>
        </footer>
      </div>
    </main>
  );
}
