"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  supabase,
  PostCategory,
  PaperType,
  categoryLabels,
  paperTypeLabels,
  paperColorPalettes,
  hashPassword,
  parseDateInput,
  getRandomPaperColor,
  getRandomAttachmentType,
  getRandomRotation,
} from "@/lib/supabase";

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

  // New fields
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState("");

  // Paper selection
  const [paperType, setPaperType] = useState<PaperType>("a4");

  // Image attachment
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Generate random color when paper type changes
  const previewColor = useMemo(() => {
    return getRandomPaperColor(paperType);
  }, [paperType]);

  // Handle image selection with strict validation
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. MIME type 검증 (허용: jpg, jpeg, png, webp)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("jpg, jpeg, png, webp 파일만 업로드 가능합니다");
      return;
    }

    // 2. 확장자 검증 (금지: svg, gif, pdf, html, js)
    const fileName = file.name.toLowerCase();
    const ext = fileName.split(".").pop() || "";
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const forbiddenExtensions = ["svg", "gif", "pdf", "html", "js", "htm", "exe"];
    
    if (!allowedExtensions.includes(ext)) {
      toast.error("jpg, jpeg, png, webp 확장자만 허용됩니다");
      return;
    }
    
    if (forbiddenExtensions.includes(ext)) {
      toast.error("허용되지 않는 파일 형식입니다");
      return;
    }

    // 3. 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("이미지 파일은 5MB 이하만 가능합니다");
      return;
    }

    setImageFile(file);
    // Create preview URL (blob URL - only for preview, not stored in DB)
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  // Convert image to webp format using canvas
  async function convertToWebp(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image"));
            }
          },
          "image/webp",
          0.85 // quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  }

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

    if (!editPassword.trim()) {
      toast.error("수정/삭제용 비밀번호를 입력해주세요");
      return;
    }

    if (editPassword.length < 4) {
      toast.error("비밀번호는 4자 이상이어야 합니다");
      return;
    }

    if (editPassword !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    // Validate deadline if provided
    let deadline: string | null = null;
    if (hasDeadline && deadlineInput.trim()) {
      deadline = parseDateInput(deadlineInput);
      if (!deadline) {
        toast.error("마감일 형식이 올바르지 않습니다 (예: 20260711)");
        return;
      }

      // Check if deadline is not in the past
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        toast.error("마감일은 오늘 이후여야 합니다");
        return;
      }
    }

    setSubmitting(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      // Hash the password
      const passwordHash = await hashPassword(editPassword);

      // Generate visual properties
      const paperColor = getRandomPaperColor(paperType);
      const attachmentType = getRandomAttachmentType();
      const rotationDeg = getRandomRotation();

      // Upload image to Supabase Storage if provided
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        setUploadingImage(true);
        
        try {
          // Convert to webp format
          const webpBlob = await convertToWebp(imageFile);
          
          // Generate unique filename (timestamp + random string, always .webp)
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
          const filePath = `poster-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(filePath, webpBlob, {
              cacheControl: "3600",
              upsert: false,
              contentType: "image/webp",
            });

          if (uploadError) {
            toast.error("이미지 업로드 실패: " + uploadError.message);
            setSubmitting(false);
            setUploadingImage(false);
            return;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("posts")
            .getPublicUrl(filePath);

          uploadedImageUrl = urlData.publicUrl;
        } catch (convertError) {
          toast.error("이미지 변환 실패");
          setSubmitting(false);
          setUploadingImage(false);
          return;
        }
        
        setUploadingImage(false);
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          category,
          title: title.trim(),
          description: description.trim(),
          tags,
          author: author.trim(),
          contact_type: contactType.trim(),
          contact_value: contactValue.trim(),
          external_link: externalLink.trim() || null,
          status: "open",
          edit_password_hash: passwordHash,
          deadline,
          // Visual properties
          paper_type: paperType,
          paper_color: paperColor,
          attachment_type: attachmentType,
          rotation_deg: rotationDeg,
          // Image URL from Supabase Storage (not blob URL)
          image_url: uploadedImageUrl,
        })
        .select()
        .single();

      if (error) {
        console.log("[v0] Insert error:", error.message);
        toast.error("벽보 붙이기 실패: " + error.message);
        setSubmitting(false);
        return;
      }

      // Send Discord notification (fire and forget)
      if (data) {
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category,
            author: author.trim(),
            contactType: contactType.trim(),
            contactValue: contactValue.trim(),
            deadline,
            postId: data.id,
          }),
        }).catch((err) => {
          console.log("[v0] Discord notification failed:", err);
        });
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
                <div className="flex flex-wrap gap-3">
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
                  <CategoryButton
                    active={category === "share"}
                    onClick={() => setCategory("share")}
                  >
                    {categoryLabels.share}
                  </CategoryButton>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  같이할래: 팀원, 협업자, 도움 줄 사람을 찾을 때
                  <br />
                  써봐줘: 만든 서비스나 프로젝트를 테스트받고 싶을 때
                  <br />
                  공유할래: 자료, 팁, 노하우, 경험을 나누고 싶을 때
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

              {/* Image attachment */}
              <div className="pt-4 border-t border-foreground/10">
                <p className="text-sm font-bold text-foreground mb-2">
                  이미지 첨부 (선택)
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  서비스 화면, 결과물, 참고 이미지를 1장까지 첨부할 수 있어요.
                  <br />
                  최대 5MB까지 업로드 가능합니다.
                </p>

                {!imagePreview ? (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-foreground/20 p-6 text-center hover:border-foreground/40 transition-colors">
                      <div className="text-3xl mb-2">&#128247;</div>
                      <p className="text-sm text-muted-foreground">
                        클릭하여 이미지 선택
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        jpg, jpeg, png, webp
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="w-full max-h-64 object-contain bg-foreground/5"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      &times;
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {imageFile?.name} ({((imageFile?.size || 0) / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Deadline section */}
              <div className="pt-4 border-t border-foreground/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDeadline}
                    onChange={(e) => setHasDeadline(e.target.checked)}
                    className="w-4 h-4 accent-foreground"
                  />
                  <span className="text-sm font-bold text-foreground">
                    마감 기한이 있나요?
                  </span>
                </label>

                {hasDeadline && (
                  <div className="mt-3">
                    <label
                      htmlFor="deadline"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      마감일 (YYYYMMDD)
                    </label>
                    <input
                      id="deadline"
                      type="text"
                      value={deadlineInput}
                      onChange={(e) => setDeadlineInput(e.target.value)}
                      placeholder="20260711"
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                      maxLength={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      예: 20260711 (2026년 7월 11일)
                    </p>
                  </div>
                )}
              </div>

              {/* Paper type selection */}
              <div className="pt-4 border-t border-foreground/10">
                <p className="text-sm font-bold text-foreground mb-3">
                  벽보 용지 선택
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(Object.keys(paperTypeLabels) as PaperType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaperType(type)}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        paperType === type
                          ? "bg-foreground text-primary-foreground"
                          : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                      }`}
                    >
                      {paperTypeLabels[type]}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 bg-wall/30 rounded">
                  <p className="text-xs text-foreground/70 mb-3 text-center">
                    내 벽보는 이렇게 붙어요
                  </p>
                  <div className="flex justify-center">
                    <div
                      className="relative p-4 shadow-lg max-w-[200px]"
                      style={{
                        backgroundColor: previewColor,
                        transform: "rotate(-1deg)",
                        boxShadow: "3px 3px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      {/* Tape */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-amber-100/80 shadow-sm z-10" />
                      
                      {/* Paper texture */}
                      <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
                        }}
                      />

                      <div className="relative z-10">
                        <div className="text-xs font-bold text-foreground/80 mb-1 truncate">
                          {title || "제목이 들어갑니다"}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-2">
                          {description || "내용이 여기에 표시됩니다..."}
                        </div>
                        
                        {/* Tear-off bottom (for contact) */}
                        <div className="mt-3 pt-2 border-t border-dashed border-foreground/20">
                          <div className="flex justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="w-3 h-4 border border-foreground/20 text-[6px] flex items-end justify-center pb-0.5 text-foreground/40"
                              >
                                연락
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/50 mt-3 text-center">
                    색상은 {paperTypeLabels[paperType]} 팔레트에서 자동 배정
                  </p>
                </div>
              </div>

              {/* Password section */}
              <div className="pt-4 border-t border-foreground/10">
                <p className="text-sm font-bold text-foreground mb-3">
                  수정/삭제용 비밀번호 *
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  나중에 벽보를 수정하거나 마감 처리할 때 필요해요
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="editPassword"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      비밀번호 (4자 이상)
                    </label>
                    <input
                      id="editPassword"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="****"
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs text-muted-foreground mb-1"
                    >
                      비밀번호 확인
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="****"
                      className="w-full px-3 py-2 bg-white border border-foreground/20 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-primary-foreground py-3 px-6 text-base font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {submitting ? (uploadingImage ? "이미지 업로드 중..." : "붙이는 중...") : "벽보 붙이기"}
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
