"use client";

/**
 * VideoCards.tsx
 * 카드 뷰 렌더링 전담 컴포넌트
 * 책임: 영상 목록을 카드 그리드 형태로 표시
 */

import Image from "next/image";
import { motion } from "framer-motion";
import type { VideoResult } from "@/lib/youtube/analysis";
import {
  formatKoreanNumber,
  formatDate,
  formatRatio,
} from "@/lib/youtube/analysis";

interface VideoCardsProps {
  videos: VideoResult[];
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function VideoCards({ videos }: VideoCardsProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      variants={gridVariants}
      initial="hidden"
      animate="visible"
    >
      {videos.map((video) => (
        <motion.div key={video.id} variants={cardVariants}>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="video-card block rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* ── 썸네일 ── */}
            <div className="relative w-full aspect-video overflow-hidden">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
              {/* 조회수/구독자 배율 배지 */}
              <div
                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.9)",
                  color: "#fff",
                  backdropFilter: "blur(4px)",
                }}
              >
                조회 x{video.viewToSubscriberRatio.toFixed(1)}
              </div>
            </div>

            {/* ── 콘텐츠 영역 ── */}
            <div className="p-4 flex flex-col gap-3">
              {/* 제목 */}
              <h3
                className="font-semibold text-sm leading-snug line-clamp-2"
                style={{ color: "var(--text-primary)" }}
              >
                {video.title}
              </h3>

              {/* 채널명 */}
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {video.channelTitle}
              </p>

              {/* ── 스탯 그리드 ── */}
              <div
                className="grid grid-cols-2 gap-2 pt-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {/* 구독자 대비 조회수 */}
                <StatItem
                  label="조회 / 구독자"
                  value={`${formatRatio(video.viewToSubscriberRatio)}`}
                  highlight
                />

                {/* 구독자 대비 좋아요 */}
                <StatItem
                  label="좋아요 / 구독자"
                  value={
                    video.likeToSubscriberRatio !== null
                      ? `${formatRatio(video.likeToSubscriberRatio)}`
                      : "비공개"
                  }
                />

                {/* 채널 구독자 수 */}
                <StatItem
                  label="채널 구독자"
                  value={formatKoreanNumber(video.subscriberCount)}
                />

                {/* 업로드 날짜 */}
                <StatItem
                  label="업로드"
                  value={formatDate(video.publishedAt)}
                />
              </div>
            </div>
          </a>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── 스탯 아이템 서브컴포넌트 ──────────────────────────────────────────────────

interface StatItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatItem({ label, value, highlight = false }: StatItemProps) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ backgroundColor: "var(--surface-2)" }}
    >
      <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{ color: highlight ? "var(--accent-light)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
