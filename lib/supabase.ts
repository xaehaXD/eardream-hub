import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the posts table
export type PostCategory = "teamup" | "test";
export type PostStatus = "open" | "closed" | "expired";

export interface Post {
  id: string;
  category: PostCategory;
  title: string;
  description: string;
  tags: string[];
  author: string;
  contact_type: string;
  contact_value: string;
  external_link: string | null;
  status: PostStatus;
  created_at: string;
  // New fields (nullable for backward compatibility with existing posts)
  edit_password_hash: string | null;
  deadline: string | null; // YYYY-MM-DD format
  updated_at: string | null;
  closed_at: string | null;
}

// Label mappings for UI display
export const categoryLabels: Record<PostCategory, string> = {
  teamup: "같이할래",
  test: "써봐줘",
};

export const statusLabels: Record<PostStatus, string> = {
  open: "진행중",
  closed: "마감",
  expired: "기한 지남",
};

// Helper functions for deadline display
export function getDeadlineDisplay(deadline: string | null): {
  label: string;
  isExpired: boolean;
  daysLeft: number | null;
} {
  if (!deadline) {
    return { label: "", isExpired: false, daysLeft: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "마감됨", isExpired: true, daysLeft: diffDays };
  } else if (diffDays === 0) {
    return { label: "D-DAY", isExpired: false, daysLeft: 0 };
  } else {
    return { label: `D-${diffDays}`, isExpired: false, daysLeft: diffDays };
  }
}

// Parse date string in YYYYMMDD format to YYYY-MM-DD
export function parseDateInput(input: string): string | null {
  const cleaned = input.replace(/[^0-9]/g, "");

  if (cleaned.length !== 8) {
    return null;
  }

  const year = parseInt(cleaned.substring(0, 4), 10);
  const month = parseInt(cleaned.substring(4, 6), 10);
  const day = parseInt(cleaned.substring(6, 8), 10);

  // Basic validation
  if (year < 2020 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Check if date is valid
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Format date for display
export function formatDeadlineDate(deadline: string): string {
  const date = new Date(deadline);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Simple hash function using Web Crypto API (for client-side)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify password against hash
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// Check if post has edit password (to determine if it's a new or legacy post)
export function canEditPost(post: Post): boolean {
  return post.edit_password_hash !== null;
}

// Check if post is effectively closed (either manually closed or deadline expired)
export function isPostClosed(post: Post): boolean {
  if (post.status === "closed") return true;

  if (post.deadline) {
    const { isExpired } = getDeadlineDisplay(post.deadline);
    if (isExpired) return true;
  }

  return false;
}

// Get effective status considering deadline
export function getEffectiveStatus(post: Post): PostStatus {
  if (post.status === "closed") return "closed";

  if (post.deadline) {
    const { isExpired } = getDeadlineDisplay(post.deadline);
    if (isExpired) return "expired";
  }

  return "open";
}

// Mock data for development/demo (when Supabase is not connected)
export const mockPosts: Post[] = [
  {
    id: "1",
    category: "teamup",
    title: "프론트엔드 개발자 구합니다",
    description:
      "React/Next.js 프로젝트 같이 하실 분 구해요. 사이드 프로젝트인데 포트폴리오용으로 좋을 것 같습니다. 주 1-2회 온라인 미팅 가능하신 분이면 좋겠어요.",
    tags: ["React", "Next.js", "TypeScript"],
    author: "김이어",
    contact_type: "카카오톡",
    contact_value: "eardream_kim",
    external_link: null,
    status: "open",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    edit_password_hash: null, // Legacy post - no password
    deadline: null,
    updated_at: null,
    closed_at: null,
  },
  {
    id: "2",
    category: "test",
    title: "할일 관리 앱 테스트 요청",
    description:
      "간단한 할일 관리 앱 만들었는데 피드백 주실 분 찾습니다. 10분 정도면 충분해요. 커피 쿠폰 드려요!",
    tags: ["앱테스트", "피드백"],
    author: "박드림",
    contact_type: "이메일",
    contact_value: "dream@test.com",
    external_link: "https://example.com/app",
    status: "open",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    edit_password_hash: "demo_hash", // New post with password
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split("T")[0], // 7 days from now
    updated_at: null,
    closed_at: null,
  },
  {
    id: "3",
    category: "teamup",
    title: "백엔드 개발자 모집",
    description:
      "Node.js 또는 Python 가능하신 백엔드 개발자 찾습니다. AI 기반 서비스 만들어보고 싶은 분 환영해요.",
    tags: ["Node.js", "Python", "AI"],
    author: "최허브",
    contact_type: "디스코드",
    contact_value: "hub#1234",
    external_link: null,
    status: "closed",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    edit_password_hash: "demo_hash",
    deadline: null,
    updated_at: null,
    closed_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "4",
    category: "test",
    title: "랜딩페이지 피드백 부탁드려요",
    description:
      "이번에 만든 SaaS 랜딩페이지 봐주실 분! 디자인이나 UX 관련 피드백 환영합니다.",
    tags: ["디자인", "UX", "랜딩페이지"],
    author: "이육기",
    contact_type: "카카오톡",
    contact_value: "yukgi_lee",
    external_link: "https://example.com/landing",
    status: "open",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    edit_password_hash: null, // Legacy post
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split("T")[0], // 2 days ago (expired)
    updated_at: null,
    closed_at: null,
  },
];
