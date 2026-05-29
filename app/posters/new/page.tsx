"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase, PostCategory, categoryLabels } from "@/lib/supabase";

export default function NewPosterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<PostCategory>("teamup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [author, setAuthor] = useState("");
  const [contactType, setContactType] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [externalLink, setExternalLink] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !author.trim()) {
      toast.error("필수 항목을 모두 입력해주세요");
      return;
    }

    if (!contactType.trim() || !contactValue.trim()) {
      toast.error("찔러보기 정보를 입력해주세요");
      return;
    }

    setSubmitting(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const { error } = await supabase.from("posts").insert({
        category,
        title: title.trim(),
        description: description.trim(),
        tags,
        author: author.trim(),
        contact_type: contactType.trim(),
        contact_value: contactValue.trim(),
        external_link: externalLink.trim() || null,
        status: "open",
      });

      if (error) {
        console.log("[v0] Insert error:", error.message);
        toast.error("벽보 붙이기 실패: " + error.message);
        setSubmitting(false);
        return;
      }

      toast.success("벽보가 붙여졌습니다!", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
        },
      });
      router.push("/");
    } catch {
      toast.error("연결 오류가 발생했습니다");
      setSubmitting(false);
    }
  }

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
      <div className="absolute top-[20%] right-[8%] w-20 h-20 bg-black/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-6">
          <Link
            href="/"
            className="text-paper/80 hover:text-paper text-sm transition-colors"
          >
            &larr; 벽보판으로
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-paper mt-4 mb-2">
            벽보 붙이기
          </h1>
          <p className="text-paper/70 text-sm">
            구하는 것, 필요한 것을 적어 붙여주세요
          </p>
        </header>

        {/* Form Paper */}
        <article className="relative">
          {/* Tape pieces */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-100/80 rotate-[-1deg] shadow-sm z-20" />
          <div className="absolute -top-2 left-[12%] w-12 h-5 bg-amber-50/70 rotate-[6deg] shadow-sm z-20 hidden sm:block" />
          <div className="absolute -top-2 right-[15%] w-14 h-5 bg-amber-100/60 rotate-[-4deg] shadow-sm z-20 hidden sm:block" />

          <div
            className="relative bg-paper p-6 sm:p-8 shadow-2xl"
            style={{
              boxShadow:
                "6px 6px 16px rgba(0,0,0,0.25), 2px 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {/* Paper texture */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
              }}
            />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  어떤 벽보인가요? *
                </label>
                <div className="flex gap-3">
                  <CategoryButton
                    active={category === "teamup"}
                    onClick={() => setCategory("teamup")}
                  >
                    {categoryLabels.teamup}
                  </CategoryButton>
                  <CategoryButton
                    active={category === "test"}
                    onClick={() => setCategory("test")}
                  >
                    {categoryLabels.test}
                  </CategoryButton>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  같이할래: 팀원 모집 / 써봐줘: 테스트 요청
                </p>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  제목 *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="프론트 구해요, 앱 테스트해주실 분"
                  className="w-full px-4 py-3 bg-white border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  상세 내용 *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 프로젝트인지, 어떤 도움이 필요한지 자세히 적어주세요"
                  rows={5}
                  className="w-full px-4 py-3 bg-white border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                  maxLength={2000}
                />
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  태그
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="React, TypeScript, 앱테스트 (쉼표로 구분)"
                  className="w-full px-4 py-3 bg-white border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  쉼표(,)로 구분해서 입력
                </p>
              </div>

              {/* Author */}
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  작성자 이름 *
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 bg-white border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                  maxLength={50}
                />
              </div>

              {/* Contact section */}
              <div className="pt-4 border-t border-foreground/10">
                <p className="text-sm font-bold text-foreground mb-3">
                  찔러보기 정보 *
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  관심 있는 사람이 연락할 수단을 남겨주세요
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contactType"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      연락 수단
                    </label>
                    <input
                      id="contactType"
                      type="text"
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                      placeholder="카카오톡, 이메일, 디스코드"
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contactValue"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      아이디/주소
                    </label>
                    <input
                      id="contactValue"
                      type="text"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder="user@email.com"
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* External link */}
              <div>
                <label
                  htmlFor="externalLink"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  외부 링크 (선택)
                </label>
                <input
                  id="externalLink"
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-white border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  테스트할 서비스 링크, 노션 등
                </p>
              </div>

              {/* Notice */}
              <div className="border-l-4 border-red-600 bg-white/60 p-4 text-sm leading-relaxed text-muted-foreground">
                <p className="font-bold text-foreground mb-2">붙이기 전 확인</p>
                <p>개인정보는 최소한으로 적어주세요.</p>
                <p>전화번호보다는 Discord / 오픈채팅 / 링크를 추천합니다.</p>
                <p>삭제나 수정이 필요하면 운영자에게 알려주세요.</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-primary-foreground py-3 px-6 text-base font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {submitting ? "붙이는 중..." : "벽보 붙이기"}
              </button>
            </form>
          </div>

          {/* Paper corner effect */}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-wall rotate-45 translate-x-1 translate-y-1" />
        </article>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-paper/50">6기 내부용</p>
        </footer>
      </div>
    </main>
  );
}

interface CategoryButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function CategoryButton({ active, onClick, children }: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-foreground text-primary-foreground"
          : "bg-foreground/10 text-foreground hover:bg-foreground/20"
      }`}
    >
      {children}
    </button>
  );
}
