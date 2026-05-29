import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the posts table
export type PostCategory = "teamup" | "test";
export type PostStatus = "open" | "closed";

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
}

// Label mappings for UI display
export const categoryLabels: Record<PostCategory, string> = {
  teamup: "같이할래",
  test: "써봐줘",
};

export const statusLabels: Record<PostStatus, string> = {
  open: "진행중",
  closed: "마감",
};

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
  },
];
