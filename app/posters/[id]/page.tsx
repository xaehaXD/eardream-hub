"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  supabase,
  Post,
  Feedback,
  categoryLabels,
  statusLabels,
  mockPosts,
  canEditPost,
  getEffectiveStatus,
  getDeadlineDisplay,
  formatDeadlineDate,
  verifyPassword,
  getPostVisualProps,
  paperTypeLabels,
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

  // Contact tear-off popup state (local only)
  const [showTornPaper, setShowTornPaper] = useState(false);
  const [tornPaperAnimation, setTornPaperAnimation] = useState(false);

  // Feedback state for "써봐줘" posts
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackNickname, setFeedbackNickname] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Mock view count for demo (in real implementation, fetch from DB)
  const [hasRecentViews] = useState(() => {
    // Simulate: ~60% of posts have recent views (for demo)
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return hash % 10 < 6;
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (post?.category === "test") {
      fetchFeedbacks();
    }
  }, [post?.id, post?.category]);

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

  async function fetchFeedbacks() {
    if (!post?.id) return;
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFeedbacks(data);
      }
    } catch {
      console.log("[v0] Failed to fetch feedbacks");
    }
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !feedbackNickname.trim() || !feedbackContent.trim()) return;

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.from("feedbacks").insert({
        post_id: post.id,
        nickname: feedbackNickname.trim(),
        content: feedbackContent.trim(),
      });

      if (error) {
        toast.error("피드백 저장 실패: " + error.message);
      } else {
        toast.success("피드백이 등록되었습니다");
        setFeedbackNickname("");
        setFeedbackContent("");
        setShowFeedbackForm(false);
        fetchFeedbacks();
      }
    } catch {
      toast.error("연결 오류가 발생했습니다");
    } finally {
      setSubmittingFeedback(false);
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
        router.push(`/posters/${post.id}/edit?verified=true`);
      } else {
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
      fetchPost();
    } catch {
      toast.error("연결 오류가 발생했습니다");
      setVerifying(false);
    }
  }

  function handleTearContact() {
    if (!post) return;
    // Copy contact to clipboard
    navigator.clipboard.writeText(post.contact_value);
    // Show torn paper popup with animation
    setTornPaperAnimation(true);
    setShowTornPaper(true);
    // Auto-dismiss after 1 second
    setTimeout(() => {
      setTornPaperAnimation(false);
      setTimeout(() => {
        setShowTornPaper(false);
        toast.success("연락처가 복사되었습니다");
      }, 200);
    }, 800);
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
  const { paperType, paperColor } = getPostVisualProps(post);

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
            className={`relative p-6 sm:p-10 shadow-2xl rotate-[0.3deg] ${
              isClosed ? "opacity-75" : ""
            }`}
            style={{
              backgroundColor: paperColor,
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

              {/* Attached image */}
              {post.image_url && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground mb-3">
                    첨부 이미지
                  </h2>
                  <div className="bg-foreground/5 p-2 rounded-lg">
                    <img
                      src={post.image_url}
                      alt="첨부 이미지"
                      className="w-full max-w-full h-auto rounded"
                      style={{ maxHeight: "24rem", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}

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

              {/* Contact section - simple "연락처 복사" button */}
              {!isClosed && (
                <div className="mb-6">
                  <div className="border-t-2 border-dashed border-foreground/30 pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      연락처
                    </h3>
                    <p className="text-sm text-foreground/70 mb-3">
                      {post.contact_type}
                    </p>
                    <button
                      onClick={handleTearContact}
                      className="w-full py-3 px-4 bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground font-medium"
                    >
                      연락처 복사
                    </button>
                  </div>
                </div>
              )}

              {/* Closed notice */}
              {isClosed && (
                <div className="mb-6 bg-gray-100 p-4 text-center">
                  <p className="text-gray-600 font-medium">
                    마감된 게시물입니다
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="my-6 h-px bg-foreground/20" />

              {/* Interest indicator - only show if recent views */}
              {hasRecentViews && !isClosed && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>&#128064;</span>
                  <span>최근 누군가 이 벽보를 살펴봤어요</span>
                </div>
              )}

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
                  {post.status === "open" && post.category === "teamup" && (
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

        {/* Feedback section for "써봐줘" posts */}
        {post.category === "test" && !isClosed && (
          <section className="mt-8">
            <div className="bg-paper/90 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  공개 피드백 ({feedbacks.length})
                </h2>
                {!showFeedbackForm && (
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors flex items-center gap-2"
                  >
                    <span>&#128172;</span> 공개 피드백 남기기
                  </button>
                )}
              </div>

              {/* Feedback form */}
              {showFeedbackForm && (
                <form onSubmit={handleSubmitFeedback} className="mb-6 p-4 bg-foreground/5">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={feedbackNickname}
                      onChange={(e) => setFeedbackNickname(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
                      maxLength={30}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      피드백 내용
                    </label>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="피드백을 작성해주세요"
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="px-4 py-2 text-sm font-medium bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={submittingFeedback || !feedbackNickname.trim() || !feedbackContent.trim()}
                      className="px-4 py-2 text-sm font-medium bg-foreground text-primary-foreground hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {submittingFeedback ? "등록 중..." : "피드백 등록"}
                    </button>
                  </div>
                </form>
              )}

              {/* Feedback list */}
              {feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="p-3 bg-white/50 border border-foreground/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground text-sm">
                          {feedback.nickname}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {feedback.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 피드백이 없습니다. 첫 피드백을 남겨보세요!
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                작성자에게 직접 연락하고 싶다면 위의 &quot;연락처 복사&quot; 버튼을 이용해주세요.
              </p>
            </div>
          </section>
        )}

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

      {/* Torn Paper Popup (연락처 뜯어가기) */}
      {showTornPaper && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={`bg-paper p-6 shadow-2xl transform transition-all duration-300 pointer-events-auto ${
              tornPaperAnimation
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-4"
            }`}
            style={{
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              transform: tornPaperAnimation ? "rotate(-2deg)" : "rotate(-2deg) scale(0.95)",
            }}
          >
            {/* Torn edge effect at top */}
            <div
              className="absolute top-0 left-0 right-0 h-3 bg-paper"
              style={{
                clipPath: "polygon(0 100%, 5% 60%, 10% 100%, 15% 50%, 20% 100%, 25% 70%, 30% 100%, 35% 55%, 40% 100%, 45% 65%, 50% 100%, 55% 50%, 60% 100%, 65% 70%, 70% 100%, 75% 55%, 80% 100%, 85% 65%, 90% 100%, 95% 50%, 100% 100%)",
                transform: "translateY(-100%)",
              }}
            />
            
            <div className="text-center min-w-[200px]">
              <div className="text-3xl mb-3">&#128196;</div>
              <p className="text-sm text-muted-foreground mb-1">{post?.contact_type}</p>
              <p className="text-lg font-bold text-foreground break-all">
                {post?.contact_value}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
