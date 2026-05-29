"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function Page() {
  const [showBookmarkHelp, setShowBookmarkHelp] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("주소가 복사되었습니다", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
        },
      });
    } catch {
      toast.error("복사에 실패했습니다");
    }
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
      
      {/* Subtle stains/marks on wall */}
      <div className="absolute top-[15%] left-[10%] w-32 h-32 bg-black/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[15%] w-40 h-24 bg-black/4 rounded-full blur-2xl" />
      
      {/* Main content area */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        
        {/* The Paper Notice */}
        <article className="relative max-w-lg w-full">
          
          {/* Tape pieces */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-amber-100/80 rotate-[-2deg] shadow-sm z-20" />
          <div className="absolute -top-2 left-[15%] w-10 h-5 bg-amber-50/70 rotate-[8deg] shadow-sm z-20 hidden sm:block" />
          <div className="absolute -top-2 right-[18%] w-12 h-5 bg-amber-100/60 rotate-[-5deg] shadow-sm z-20 hidden sm:block" />
          
          {/* Paper with shadow and slight rotation */}
          <div 
            className="relative bg-paper p-6 sm:p-10 shadow-2xl rotate-[0.5deg]"
            style={{
              boxShadow: "8px 8px 20px rgba(0,0,0,0.3), 2px 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {/* Paper texture */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Rough paper edge effect on right side */}
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-wall/20 to-transparent" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Main headline - stacked like a real notice */}
              <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-tight tracking-tight">
                  <span className="text-accent">프론트 구함.</span>
                  <br />
                  <span className="text-accent">백엔드 구함.</span>
                  <br />
                  <span className="text-accent">써봐줄 사람 구함.</span>
                </h1>
              </header>
              
              {/* Body copy */}
              <div className="space-y-6 text-foreground">
                <p className="text-base sm:text-lg leading-relaxed">
                  단톡에 흘러가던 것들,
                  <br />
                  여기다 붙여놓을 예정입니다.
                </p>
                
                <div className="py-4 border-t border-b border-foreground/20">
                <p className="text-xl sm:text-2xl font-bold">
                  이어드림 허브, 열렸습니다.
                </p>
                </div>
                
                <p className="text-base sm:text-lg font-medium">
                  필요할 것 같으면
                  <br />
                  즐겨찾기 해두세요.
                </p>
              </div>
              
              {/* Divider line */}
              <div className="my-8 h-px bg-foreground/30" />
              
              {/* Sub copy - smaller, muted */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                6기 안에서 팀원 찾고,
                <br />
                만든 서비스 테스트받고,
                <br />
                피드백 요청하는 작은 협업 게시판.
              </p>
              
              {/* CTA Area */}
              <div className="space-y-3">
                <Link
                  href="/posters"
                  className="block w-full bg-foreground text-primary-foreground py-3 px-6 text-base font-bold text-center hover:bg-foreground/90 transition-colors active:scale-[0.98]"
                >
                  벽보 보러가기
                </Link>

                <Link
                  href="/posters/new"
                  className="block w-full bg-accent text-accent-foreground py-3 px-6 text-base font-bold text-center hover:bg-accent/90 transition-colors active:scale-[0.98]"
                >
                  벽보 붙이기
                </Link>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={copyUrl}
                    className="flex-1 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    주소 복사
                  </button>
                  <button
                    onClick={() => setShowBookmarkHelp(!showBookmarkHelp)}
                    className="flex-1 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    즐겨찾기
                  </button>
                </div>
                
                {showBookmarkHelp && (
                  <p className="text-xs text-muted-foreground text-center pt-2 animate-in fade-in duration-200">
                    PC는 Ctrl + D, 모바일은 브라우저 메뉴에서 북마크 추가
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Slight torn/worn corner effect */}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-wall rotate-45 translate-x-1 translate-y-1" />
        </article>
        
        {/* Footer text - outside the paper */}
        <footer className="mt-8 text-xs text-paper/60 tracking-wide">
          6기 내부용
        </footer>
      </div>
    </main>
  );
}
