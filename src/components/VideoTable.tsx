"use client";

/**
 * VideoTable.tsx
 * 테이블 뷰 렌더링 전담 컴포넌트
 * 책임: 영상 목록을 테이블 형태로 표시, 컬럼 클릭으로 정렬
 */

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { VideoResult, ScoreInfo } from "@/lib/youtube/analysis";
import { formatKoreanNumber, formatDate } from "@/lib/youtube/analysis";

interface VideoTableProps {
  videos: VideoResult[];
}

type SortKey =
  | "viewCount"
  | "subscriberCount"
  | "totalVideoCount"
  | "contributionScore"
  | "performanceScore"
  | "publishedAt";
type SortDir = "asc" | "desc";

// ─── 정렬 유틸 ────────────────────────────────────────────────────────────────

function getSortValue(video: VideoResult, key: SortKey): number {
  switch (key) {
    case "viewCount":        return video.viewCount;
    case "subscriberCount":  return video.subscriberCount;
    case "totalVideoCount":  return video.totalVideoCount;
    case "contributionScore":return video.contributionScore?.score ?? -1;
    case "performanceScore": return video.performanceScore.score;
    case "publishedAt":      return new Date(video.publishedAt).getTime();
  }
}

// ─── 애니메이션 ───────────────────────────────────────────────────────────────

const tableVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.03 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function VideoTable({ videos }: VideoTableProps) {
  // 기본 정렬: 성과도 내림차순 (서버 정렬과 동일)
  const [sortKey, setSortKey] = useState<SortKey>("performanceScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(
    () =>
      [...videos].sort((a, b) => {
        const av = getSortValue(a, sortKey);
        const bv = getSortValue(b, sortKey);
        return sortDir === "desc" ? bv - av : av - bv;
      }),
    [videos, sortKey, sortDir]
  );

  const SORTABLE_COLS: { label: string; key: SortKey }[] = [
    { label: "조회수",    key: "viewCount" },
    { label: "구독자 수", key: "subscriberCount" },
    { label: "총 영상 수",key: "totalVideoCount" },
    { label: "기여도",    key: "contributionScore" },
    { label: "성과도",    key: "performanceScore" },
    { label: "게시일",    key: "publishedAt" },
  ];

  return (
    <motion.div
      className="table-container"
      variants={tableVariants}
      initial="hidden"
      animate="visible"
    >
      <table className="w-full text-sm border-collapse">
        {/* ── 헤더 ── */}
        <thead>
          <tr
            style={{
              backgroundColor: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* 정렬 불가 컬럼 */}
            {["썸네일", "제목"].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                style={{ color: "var(--text-secondary)" }}
              >
                {col}
              </th>
            ))}

            {/* 정렬 가능 컬럼 */}
            {SORTABLE_COLS.map(({ label, key }) => (
              <SortableHeader
                key={key}
                label={label}
                sortKey={key}
                activeSortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
            ))}
          </tr>
        </thead>

        {/* ── 바디 ── */}
        <tbody>
          {sorted.map((video, idx) => (
            <motion.tr
              key={video.id}
              variants={rowVariants}
              className="group"
              style={{
                borderBottom: "1px solid var(--border)",
                backgroundColor:
                  idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
              }}
              whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.08)" }}
            >
              {/* 썸네일 */}
              <td className="px-4 py-3">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-opacity group-hover:opacity-80"
                    />
                  </div>
                </a>
              </td>

              {/* 제목 + 채널명 */}
              <td className="px-4 py-3 max-w-xs">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium line-clamp-2 hover:underline transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  {video.title}
                </a>
                <p
                  className="mt-1 text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {video.channelTitle}
                </p>
              </td>

              {/* 조회수 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatKoreanNumber(video.viewCount)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--accent-light)" }}>
                  x{video.viewToSubscriberRatio.toFixed(1)}
                </div>
              </td>

              {/* 구독자 수 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span style={{ color: "var(--text-primary)" }}>
                  {formatKoreanNumber(video.subscriberCount)}
                </span>
              </td>

              {/* 총 영상 수 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span style={{ color: "var(--text-secondary)" }}>
                  {formatKoreanNumber(video.totalVideoCount)}
                </span>
              </td>

              {/* 기여도 */}
              <td className="px-4 py-3 whitespace-nowrap">
                {video.contributionScore ? (
                  <ScoreBadge info={video.contributionScore} />
                ) : (
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    —
                  </span>
                )}
              </td>

              {/* 성과도 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <ScoreBadge info={video.performanceScore} />
              </td>

              {/* 게시일 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {formatDate(video.publishedAt)}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

// ─── 서브 컴포넌트들 ──────────────────────────────────────────────────────────

/** 정렬 가능한 헤더 셀 */
function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;

  return (
    <th className="px-4 py-3 text-left whitespace-nowrap">
      <button
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-semibold transition-colors select-none"
        style={{
          color: isActive ? "var(--accent-light)" : "var(--text-secondary)",
        }}
      >
        {label}
        <SortIcon active={isActive} dir={sortDir} />
      </button>
    </th>
  );
}

/** 오름차순/내림차순 방향 아이콘 */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="inline-flex flex-col gap-[2px] ml-0.5 flex-shrink-0">
      {/* 위 화살표 (오름차순) */}
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path
          d="M1 4.5L4 1.5L7 4.5"
          stroke={active && dir === "asc" ? "var(--accent-light)" : "var(--text-secondary)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={active && dir === "asc" ? 1 : 0.35}
        />
      </svg>
      {/* 아래 화살표 (내림차순) */}
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path
          d="M1 1L4 4L7 1"
          stroke={active && dir === "desc" ? "var(--accent-light)" : "var(--text-secondary)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={active && dir === "desc" ? 1 : 0.35}
        />
      </svg>
    </span>
  );
}

/** 성과도 / 기여도 점수 배지 */
function ScoreBadge({ info }: { info: ScoreInfo }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
      style={{
        color: info.color,
        backgroundColor: `${info.color}18`,
        border: `1px solid ${info.color}40`,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: info.color }}
      />
      {info.score}점 · {info.label}
    </span>
  );
}
