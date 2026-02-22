"use client";

/**
 * page.tsx
 * 랜딩 페이지 - 서비스 소개 및 CTA
 */

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import LoginModal from "@/components/LoginModal";

// ─── 애니메이션 helpers ───────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f5f5f7", color: "#111827" }}
    >
      {/* ── 헤더 ── */}
      <header
        className="sticky top-0 z-20"
        style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          {/* 로고 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="#6366f1" />
              <path d="M11 9.5L20 14L11 18.5V9.5Z" fill="white" />
            </svg>
            <span className="font-bold text-lg" style={{ color: "#111827" }}>
              찌동튜브
            </span>
          </div>

          {/* 가운데 내비게이션 */}
          <nav className="flex-1 hidden sm:flex items-center justify-center gap-8">
            {["요금제", "사용내역"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-medium transition-colors hover:opacity-60"
                style={{ color: "#374151" }}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* 우측: 시작하기 버튼 */}
          <Link href="/analyzer" className="ml-auto sm:ml-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
              }}
            >
              시작하기
            </motion.button>
          </Link>
        </div>
      </header>

      {/* ── 메인 ── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 py-16 sm:py-28">
          {/* 제목 + "유튜브" 배지 */}
          <motion.div {...fadeUp(0)} className="relative inline-block">
            <h1
              className="font-black tracking-tight leading-none"
              style={{ fontSize: "clamp(3.5rem, 9vw, 7rem)", color: "#111827" }}
            >
              찌동튜브
            </h1>

            {/* 우측 상단, 30도 우측 기울기 배지 */}
            <span
              aria-label="YouTube 기반 서비스"
              className="hidden sm:block"
              style={{
                position: "absolute",
                top: "-10px",
                right: "-58px",
                transform: "rotate(30deg)",
                transformOrigin: "left center",
                backgroundColor: "#FF0000",
                color: "white",
                padding: "4px 11px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(255,0,0,0.35)",
                lineHeight: "1.4",
              }}
            >
              유튜브
            </span>
          </motion.div>

          {/* 부제 */}
          <motion.p
            {...fadeUp(0.12)}
            className="text-xl font-medium"
            style={{ color: "#6b7280", maxWidth: "26rem" }}
          >
            가장 빠르게 유튜브를 키우는 방법
          </motion.p>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center gap-5 pb-16 sm:pb-32">
          <motion.p
            {...fadeUp(0.22)}
            className="text-lg font-semibold"
            style={{ color: "#374151" }}
          >
            지금 바로 시작해보세요
          </motion.p>

          <motion.div {...fadeUp(0.32)}>
            <motion.button
              onClick={() => setShowLogin(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-2xl text-base font-bold"
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                boxShadow: "0 6px 28px rgba(99,102,241,0.45)",
                letterSpacing: "-0.01em",
              }}
            >
              바로 시작하기 →
            </motion.button>
          </motion.div>
        </section>
      </main>

      {/* ── 푸터 ── */}
      <footer
        className="mt-auto"
        style={{ backgroundColor: "white", borderTop: "1px solid #e5e7eb" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row justify-between gap-8">
          {/* 좌측: 회사 기본 정보 */}
          <address
            className="not-italic flex flex-col gap-1"
            style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.75" }}
          >
            {[
              ["상호명", "찌동튜브 주식회사"],
              ["대표", "홍길동"],
              ["사업자등록번호", "000-00-00000"],
              ["통신판매업신고", "제2025-서울강남-0000호"],
              ["주소", "서울특별시 강남구 테헤란로 123, 7층"],
              ["이메일", "contact@찌동튜브.kr"],
            ].map(([label, value]) => (
              <p key={label}>
                <span className="font-semibold" style={{ color: "#374151" }}>
                  {label}
                </span>{" "}
                {value}
              </p>
            ))}
          </address>

          {/* 우측: 약관 링크 + 저작권 */}
          <div className="flex flex-col items-start sm:items-end justify-between gap-4">
            <div className="flex gap-5">
              {["이용 약관", "개인정보 처리 방침"].map((text) => (
                <a
                  key={text}
                  href="#"
                  className="text-sm font-medium hover:opacity-60 transition-opacity"
                  style={{ color: "#374151" }}
                >
                  {text}
                </a>
              ))}
            </div>
            <p style={{ color: "#9ca3af", fontSize: "12px" }}>
              © 2025 찌동튜브. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── 로그인 모달 ── */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
