"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PosterCard } from "@/components/poster-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import {
  supabase,
  Post,
  PostCategory,
  PostStatus,
  categoryLabels,
  statusLabels,
  mockPosts,
  getEffectiveStatus,
} from "@/lib/supabase";

type FilterType = "all" | PostCategory | PostStatus;

export default function Page() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("[v0] Supabase error, using mock data:", error.message);
        setPosts(mockPosts);
        setUsingMockData(true);
      } else {
        setPosts(data || []);
        setUsingMockData(false);
      }
    } catch {
      console.log("[v0] Connection error, using mock data");
      setPosts(mockPosts);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = posts
    .filter((post) => {
      if (filter === "all") return true;
      if (filter === "teamup" || filter === "test") return post.category === filter;
      if (filter === "open" || filter === "closed") {
        const effectiveStatus = getEffectiveStatus(post);
        if (filter === "open") return effectiveStatus === "open";
        if (filter === "closed") return effectiveStatus === "closed" || effectiveStatus === "expired";
      }
      return true;
    })
    // Sort: open posts first, then closed/expired
    .sort((a, b) => {
      const aStatus = getEffectiveStatus(a);
      const bStatus = getEffectiveStatus(b);
      const aIsClosed = aStatus === "closed" || aStatus === "expired";
      const bIsClosed = bStatus === "closed" || bStatus === "expired";
      if (aIsClosed && !bIsClosed) return 1;
      if (!aIsClosed && bIsClosed) return -1;
      return 0;
    });

  // Generate pseudo-random rotations for cards based on their ID
  const getRotation = (id: string, index: number) => {
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return ((hash + index) % 5 - 2) * 0.7; // -1.4 to 1.4 degrees
  };

  // Calculate how many placeholders to show
  const minCardsToShow = 6;
  const placeholderCount = Math.max(0, minCardsToShow - filteredPosts.length);

  return (
    <main className="min-h-screen bg-wall relative overflow-hidden">
      {/* Wall texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle wall marks */}
      <div className="absolute top-[10%] left-[5%] w-24 h-24 bg-black/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[15%] right-[10%] w-32 h-20 bg-black/4 rounded-full blur-2xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-paper mb-1">
                이어드림 허브
              </h1>
              <p className="text-paper/70 text-sm sm:text-base leading-relaxed">
                단톡에 흘러가는 팀원 모집, 테스트 요청, 피드백 요청을
                <br className="hidden sm:block" />
                여기다 벽보처럼 붙여두세요.
              </p>
            </div>
            <Link
              href="/posters/new"
              className="bg-paper text-foreground px-5 py-3 text-base font-bold hover:bg-paper/90 transition-colors shadow-lg active:scale-[0.98] text-center sm:text-left"
            >
              벽보 붙이기
            </Link>
          </div>

          {usingMockData && (
            <p className="text-amber-200/80 text-xs">
              * 데모 모드로 표시 중 (Supabase 연결 필요)
            </p>
          )}
        </header>

        {/* Filters - single row, scrollable on mobile */}
        <div className="mb-6 sm:mb-8 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              전체
            </FilterButton>
            <FilterButton active={filter === "teamup"} onClick={() => setFilter("teamup")}>
              {categoryLabels.teamup}
            </FilterButton>
            <FilterButton active={filter === "test"} onClick={() => setFilter("test")}>
              {categoryLabels.test}
            </FilterButton>
            <div className="w-px bg-paper/20 mx-1" />
            <FilterButton active={filter === "open"} onClick={() => setFilter("open")}>
              {statusLabels.open}
            </FilterButton>
            <FilterButton active={filter === "closed"} onClick={() => setFilter("closed")}>
              {statusLabels.closed}
            </FilterButton>
          </div>
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-paper/60">벽보 불러오는 중...</p>
          </div>
        ) : (
          <div
            className="grid gap-5 sm:gap-6"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {filteredPosts.map((post, index) => (
              <PosterCard
                key={post.id}
                post={post}
                rotation={getRotation(post.id, index)}
              />
            ))}
            {/* Placeholder cards */}
            {placeholderCount > 0 &&
              Array.from({ length: placeholderCount }).map((_, index) => (
                <PlaceholderCard
                  key={`placeholder-${index}`}
                  variant={index}
                  rotation={((index * 2) % 5 - 2) * 0.5}
                />
              ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-paper/50">6기 내부용</p>
        </footer>
      </div>
    </main>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-paper text-foreground"
          : "bg-paper/20 text-paper hover:bg-paper/30"
      }`}
    >
      {children}
    </button>
  );
}
