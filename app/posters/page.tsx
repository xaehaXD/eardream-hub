"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PosterCard } from "@/components/poster-card";
import {
  supabase,
  Post,
  PostCategory,
  PostStatus,
  categoryLabels,
  statusLabels,
  mockPosts,
} from "@/lib/supabase";

type CategoryFilter = "all" | PostCategory;
type StatusFilter = "all" | PostStatus;

export default function PostersPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  const filteredPosts = posts.filter((post) => {
    if (categoryFilter !== "all" && post.category !== categoryFilter)
      return false;
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    return true;
  });

  // Generate pseudo-random rotations for cards based on their ID
  const getRotation = (id: string) => {
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return ((hash % 5) - 2) * 0.8; // -1.6 to 1.6 degrees
  };

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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-paper/80 hover:text-paper text-sm transition-colors"
            >
              &larr; 메인으로
            </Link>
            <Link
              href="/posters/new"
              className="bg-paper text-foreground px-4 py-2 text-sm font-bold hover:bg-paper/90 transition-colors shadow-md"
            >
              벽보 붙이기
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-paper mb-2">
            벽보판
          </h1>
          <p className="text-paper/70 text-sm">
            팀원 찾고, 만든 서비스 테스트받고, 피드백 요청하는 곳
          </p>
          {usingMockData && (
            <p className="text-amber-200/80 text-xs mt-2">
              * 데모 모드로 표시 중 (Supabase 연결 필요)
            </p>
          )}
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            >
              전체
            </FilterButton>
            <FilterButton
              active={categoryFilter === "teamup"}
              onClick={() => setCategoryFilter("teamup")}
            >
              {categoryLabels.teamup}
            </FilterButton>
            <FilterButton
              active={categoryFilter === "test"}
              onClick={() => setCategoryFilter("test")}
            >
              {categoryLabels.test}
            </FilterButton>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              variant="secondary"
            >
              전체
            </FilterButton>
            <FilterButton
              active={statusFilter === "open"}
              onClick={() => setStatusFilter("open")}
              variant="secondary"
            >
              {statusLabels.open}
            </FilterButton>
            <FilterButton
              active={statusFilter === "closed"}
              onClick={() => setStatusFilter("closed")}
              variant="secondary"
            >
              {statusLabels.closed}
            </FilterButton>
          </div>
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-paper/60">벽보 불러오는 중...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-paper/60 mb-4">아직 붙여진 벽보가 없어요</p>
            <Link
              href="/posters/new"
              className="text-paper underline underline-offset-2 hover:text-paper/80 transition-colors"
            >
              첫 번째 벽보를 붙여보세요
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPosts.map((post) => (
              <PosterCard
                key={post.id}
                post={post}
                rotation={getRotation(post.id)}
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
  variant?: "primary" | "secondary";
}

function FilterButton({
  active,
  onClick,
  children,
  variant = "primary",
}: FilterButtonProps) {
  const baseClasses = "px-3 py-1.5 text-sm font-medium transition-colors";
  const activeClasses =
    variant === "primary"
      ? "bg-paper text-foreground"
      : "bg-paper/80 text-foreground";
  const inactiveClasses =
    variant === "primary"
      ? "bg-paper/20 text-paper hover:bg-paper/30"
      : "bg-paper/10 text-paper/70 hover:bg-paper/20";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
}
