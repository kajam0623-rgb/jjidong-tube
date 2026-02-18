"use client";

/**
 * LoginModal.tsx
 * 화면 중앙 로그인 팝업 — 배경 클릭 또는 X 버튼으로 닫기
 */

import { motion, AnimatePresence } from "framer-motion";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── 어두운 배경 오버레이 ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          />

          {/* ── 모달 카드 ── */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col gap-6 pointer-events-auto"
              style={{
                backgroundColor: "white",
                boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* X 닫기 버튼 */}
              <button
                onClick={onClose}
                aria-label="닫기"
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                style={{ color: "#9ca3af" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1L13 13M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* 헤더 텍스트 */}
              <div className="text-center flex flex-col gap-2">
                <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
                  로그인 / 회원가입
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                  벤치마킹 영상을 찾고싶으시다면 로그인하세요
                </p>
              </div>

              {/* 구분선 */}
              <div style={{ height: "1px", backgroundColor: "#f3f4f6" }} />

              {/* ── 소셜 로그인 버튼들 ── */}
              <div className="flex flex-col gap-3">
                {/* 구글로 계속하기 */}
                <button
                  className="relative w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98]"
                  style={{
                    backgroundColor: "white",
                    border: "1.5px solid #e5e7eb",
                    color: "#374151",
                  }}
                >
                  {/* 로고 — 절대 위치 */}
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <GoogleLogo />
                  </span>
                  {/* 텍스트 — 버튼 전체 너비 기준 가운데 정렬 */}
                  구글로 계속하기
                </button>

                {/* 카카오로 계속하기 */}
                <button
                  className="relative w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
                  style={{
                    backgroundColor: "#FEE500",
                    border: "1.5px solid #FEE500",
                    color: "#191919",
                  }}
                >
                  {/* 로고 — 절대 위치 */}
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <KakaoLogo />
                  </span>
                  {/* 텍스트 — 버튼 전체 너비 기준 가운데 정렬 */}
                  카카오로 계속하기
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── 브랜드 로고 SVG ──────────────────────────────────────────────────────────

/** Google 공식 G 로고 (4색) */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** KakaoTalk 공식 말풍선 로고 */
function KakaoLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.69 2 11.25c0 2.93 1.8 5.5 4.54 7.06L5.4 22.1a.37.37 0 0 0 .56.4l4.97-3.29c.35.04.71.06 1.07.06 5.52 0 10-3.69 10-8.22S17.52 3 12 3z"
      />
    </svg>
  );
}
