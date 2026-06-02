"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  supabase,
  Post,
  categoryLabels,
  statusLabels,
  mockPosts,
  canEditPost,
  getEffectiveStatus,
  getDeadlineDisplay,
  formatDeadlineDate,
  verifyPassword,
} from "@/lib/supabase";

export default function PosterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "close">("edit");
  const [passwordInput, setPasswordInput] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  function handleEditClick() {
    if (!post) return;
    if (!canEditPost(post)) {
      toast.error("기존 게시물은 직접 수정할 수 없습니다");
      return;
    }
    setModalMode("edit");
    setPasswordInput("");
    setShowPasswordModal(true);
  }

  function handleCloseClick() {
    if (!post) return;
    if (!canEditPost(post)) {
      toast.error("기존 게시물은 직접 마감 처리할 수 없습니다");
      return;
    }
    setModalMode("close");
    setPasswordInput("");
    setShowPasswordModal(true);
  }

  async function handlePasswordSubmit() {
    if (!post || !passwordInput.trim()) return;

    setVerifying(true);

    try {
      const isValid = await verifyPassword(
        passwordInput,
        post.edit_password_hash!
      );

      if (!isValid) {
        toast.error("비밀번호가 일치하지 않습니다");
        setVerifying(false);
        return;
      }

      if (modalMode === "edit") {
        // Navigate to edit page with verified state
        router.push(`/posters/${post.id}/edit?verified=true`);
      } else {
        // Close the post
        await closePost();
      }
    } catch {
      toast.error("오류가 발생했습니다");
      setVerifying(false);
    }
  }

  async function closePost() {
    if (!post) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (error) {
        console.log("[v0] Close error:", error.message);
        toast.error("마감 처리 실패: " + error.message);
        setVerifying(false);
        return;
      }

      toast.success("모집이 마감되었습니다", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
        },
      });

      setShowPasswordModal(false);
      setPasswordInput("");
      setVerifying(false);

      // Refresh the post
      fetchPost();
    } catch {
      toast.error("연결 오류가 발생했습니다");
      setVerifying(false);
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
            href="/"
            className="text-paper underline underline-offset-2 hover:text-paper/80 transition-colors"
          >
            벽보판으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const effectiveStatus = getEffectiveStatus(post);
  const isClosed = effectiveStatus === "closed" || effectiveStatus === "expired";
  const hasEditPassword = canEditPost(post);
  const deadlineInfo = post.deadline ? getDeadlineDisplay(post.deadline) : null;

  const formattedDate = new Date(post.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = post.updated_at
    ? new Date(post.updated_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
            href="/"
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
            className={`relative bg-paper p-6 sm:p-10 shadow-2xl rotate-[0.3deg] ${
              isClosed ? "opacity-75" : ""
            }`}
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
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                  className={`px-3 py-1 text-sm font-bold ${
                    effectiveStatus === "open"
                      ? "bg-green-100 text-green-800"
                      : effectiveStatus === "closed"
                        ? "bg-gray-200 text-gray-600"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {effectiveStatus === "expired"
                    ? "기한 지남"
                    : statusLabels[post.status]}
                </span>
                <span className="px-3 py-1 text-sm font-medium bg-foreground/10 text-foreground">
                  {categoryLabels[post.category]}
                </span>
                {isClosed && (
                  <span className="px-3 py-1 text-sm font-bold bg-gray-800 text-white">
                    [모집 마감]
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-foreground mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Deadline display */}
              {deadlineInfo && (
                <div
                  className={`mb-6 p-3 ${
                    deadlineInfo.isExpired
                      ? "bg-red-50 border border-red-200"
                      : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 3
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">&#9200;</span>
                    <span
                      className={`font-bold ${
                        deadlineInfo.isExpired
                          ? "text-red-700"
                          : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 3
                            ? "text-amber-700"
                            : "text-blue-700"
                      }`}
                    >
                      {deadlineInfo.isExpired
                        ? "마감됨"
                        : `마감까지 ${deadlineInfo.label}`}
                    </span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {formatDeadlineDate(post.deadline!)}
                    </span>
                  </div>
                </div>
              )}

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
                {isClosed ? (
                  <div className="bg-gray-100 p-4 text-center">
                    <p className="text-gray-600 font-medium">
                      마감된 게시물입니다
                    </p>
                  </div>
                ) : (
                  <div className="bg-foreground/5 p-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="font-medium">{post.contact_type}:</span>
                      <span className="text-accent font-bold">
                        {post.contact_value}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* External link */}
              {post.external_link && !isClosed && (
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
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground mb-6">
                <span>작성자: {post.author}</span>
                <div className="text-right">
                  <span>{formattedDate}</span>
                  {updatedDate && (
                    <span className="block text-xs">수정: {updatedDate}</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {hasEditPassword ? (
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 text-sm font-medium bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
                  >
                    수정하기
                  </button>
                  {post.status === "open" && (
                    <button
                      onClick={handleCloseClick}
                      className="px-4 py-2 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      모집 마감하기
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    기존 게시물은 직접 수정/마감이 불가합니다.
                    <br />
                    수정이나 삭제가 필요하면 관리자에게 요청해주세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Paper corner effect */}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-wall rotate-45 translate-x-1 translate-y-1" />
        </article>

        {/* Back button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {modalMode === "edit" ? "수정하기" : "모집 마감하기"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {modalMode === "edit"
                ? "벽보를 수정하려면 비밀번호를 입력해주세요."
                : "모집을 마감하려면 비밀번호를 입력해주세요."}
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-4 py-3 bg-white border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePasswordSubmit();
              }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput("");
                }}
                className="flex-1 px-4 py-2 text-sm font-medium bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
                disabled={verifying}
              >
                취소
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={verifying || !passwordInput.trim()}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  modalMode === "edit"
                    ? "bg-foreground text-primary-foreground hover:bg-foreground/90"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {verifying
                  ? "확인 중..."
                  : modalMode === "edit"
                    ? "수정하기"
                    : "마감하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
