"use client";

/**
 * page.tsx
 * 메인 페이지 - 전체 상태 관리 (입력, 결과, 뷰 전환, 필터)
 * 책임: UI 조합 및 API 요청 트리거
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoTable from "@/components/VideoTable";
import VideoCards from "@/components/VideoCards";
import type { VideoResult } from "@/lib/youtube/analysis";
import type { VideoType } from "@/lib/youtube/videoType";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const GOOGLE_API_CONSOLE_URL = "https://console.cloud.google.com/apis/credentials";
const LOCAL_STORAGE_KEY = "yt_analyzer_api_key";

type ViewMode = "table" | "card";
type UploadPeriod = "all" | "1month" | "3months" | "6months" | "1year";

const PERIOD_OPTIONS: { label: string; value: UploadPeriod }[] = [
  { label: "전체", value: "all" },
  { label: "1달", value: "1month" },
  { label: "3달", value: "3months" },
  { label: "6개월", value: "6months" },
  { label: "1년", value: "1year" },
];

const SUBSCRIBER_OPTIONS: { label: string; value: number | null }[] = [
  { label: "전체", value: null },
  { label: "1만", value: 10_000 },
  { label: "5만", value: 50_000 },
  { label: "10만", value: 100_000 },
  { label: "20만", value: 200_000 },
  { label: "30만", value: 300_000 },
  { label: "40만", value: 400_000 },
  { label: "50만", value: 500_000 },
  { label: "100만", value: 1_000_000 },
];

interface SearchState {
  status: "idle" | "loading" | "success" | "error";
  videos: VideoResult[];
  error: string | null;
  total: number;
  keyword: string;
  videoType: VideoType;
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function Page() {
  // ── 기본 입력 ────────────────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // ── 필터 상태 ────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [videoType, setVideoType] = useState<VideoType>("longform");
  const [uploadPeriod, setUploadPeriod] = useState<UploadPeriod>("all");
  const [minViewCountInput, setMinViewCountInput] = useState("");
  const [maxSubscriberCount, setMaxSubscriberCount] = useState<number | null>(null);

  const [search, setSearch] = useState<SearchState>({
    status: "idle",
    videos: [],
    error: null,
    total: 0,
    keyword: "",
    videoType: "longform",
  });

  // 비기본값 필터 개수 (배지용)
  const activeFilterCount = [
    videoType !== "longform",
    uploadPeriod !== "all",
    minViewCountInput.trim() !== "",
    maxSubscriberCount !== null,
  ].filter(Boolean).length;

  // API Key 복원
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) setApiKey(stored);
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (val.trim()) localStorage.setItem(LOCAL_STORAGE_KEY, val.trim());
    else localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // ── 검색 실행 ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!apiKey.trim()) {
      setSearch((s) => ({
        ...s,
        status: "error",
        error: "YouTube API Key를 입력해 주세요.",
      }));
      return;
    }
    if (!keyword.trim()) {
      setSearch((s) => ({
        ...s,
        status: "error",
        error: "검색할 키워드를 입력해 주세요.",
      }));
      return;
    }

    setSearch({
      status: "loading",
      videos: [],
      error: null,
      total: 0,
      keyword: keyword.trim(),
      videoType,
    });

    const parsedMinViews = minViewCountInput.trim()
      ? parseInt(minViewCountInput.replace(/,/g, ""), 10)
      : undefined;

    try {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          keyword: keyword.trim(),
          videoType,
          uploadPeriod,
          minViewCount:
            parsedMinViews && !isNaN(parsedMinViews) ? parsedMinViews : undefined,
          maxSubscriberCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSearch((s) => ({
          ...s,
          status: "error",
          error: data.error ?? "알 수 없는 오류가 발생했습니다.",
        }));
        return;
      }

      setSearch({
        status: "success",
        videos: data.videos ?? [],
        error: null,
        total: data.total ?? 0,
        keyword: keyword.trim(),
        videoType,
      });
    } catch {
      setSearch((s) => ({
        ...s,
        status: "error",
        error: "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.",
      }));
    }
  }, [apiKey, keyword, videoType, uploadPeriod, minViewCountInput, maxSubscriberCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── 렌더링 ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* ── 헤더 ── */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3"
        style={{
          backgroundColor: "rgba(15,17,23,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="#6366f1" />
            <path d="M11 9.5L20 14L11 18.5V9.5Z" fill="white" />
          </svg>
          <span className="font-bold text-lg gradient-text">찌동튜브</span>
        </div>
        <span
          className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "var(--accent-light)",
            border: "1px solid var(--border)",
          }}
        >
          KR 한정 분석
        </span>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col gap-5 sm:gap-8">
        {/* ── 입력 패널 ── */}
        <motion.section
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              구독자 대비 고성과 영상 찾기
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              키워드로 한국 유튜브를 검색하고, 조회수가 구독자 수 이상인 영상을 추출합니다.
            </p>
          </div>

          {/* ── 입력 그리드 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                YouTube API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="AIza..."
                    className="w-full px-4 py-2.5 pr-16 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showApiKey ? "숨기기" : "보기"}
                  </button>
                </div>
                <a
                  href={GOOGLE_API_CONSOLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--accent-light)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M2 7H12M8 3L12 7L8 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>발급받기</span>
                </a>
              </div>
            </div>

            {/* 키워드 + 필터 버튼 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                검색 키워드
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="예: 주식 투자, 다이어트, 영어 공부"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />

                {/* 톱니 모양 필터 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className="relative flex items-center justify-center w-[42px] h-[42px] rounded-xl transition-all flex-shrink-0"
                  style={{
                    backgroundColor: showFilters
                      ? "var(--accent)"
                      : activeFilterCount > 0
                      ? "rgba(99,102,241,0.15)"
                      : "var(--surface-2)",
                    border: `1px solid ${
                      showFilters || activeFilterCount > 0
                        ? "var(--accent)"
                        : "var(--border)"
                    }`,
                    color: showFilters
                      ? "#fff"
                      : activeFilterCount > 0
                      ? "var(--accent-light)"
                      : "var(--text-secondary)",
                  }}
                  title="상세 필터 설정"
                  aria-label="필터 설정"
                >
                  {/* 톱니(기어) 아이콘 */}
                  <motion.svg
                    width="17"
                    height="17"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                    animate={{ rotate: showFilters ? 45 : 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <path
                      d="M9 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      fill="none"
                    />
                    <path
                      d="M14.7 11.1a1.2 1.2 0 0 0 .24 1.32l.04.04a1.46 1.46 0 0 1-2.06 2.06l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1V15.5a1.46 1.46 0 0 1-2.91 0v-.07a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.46 1.46 0 0 1-2.06-2.06l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73H2.5a1.46 1.46 0 0 1 0-2.91h.07a1.2 1.2 0 0 0 1.1-.79 1.2 1.2 0 0 0-.24-1.32l-.04-.04a1.46 1.46 0 0 1 2.06-2.06l.04.04a1.2 1.2 0 0 0 1.32.24h.06A1.2 1.2 0 0 0 7.5 2.5V2.5a1.46 1.46 0 0 1 2.91 0v.07a1.2 1.2 0 0 0 .73 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.46 1.46 0 0 1 2.06 2.06l-.04.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.73h.07a1.46 1.46 0 0 1 0 2.91h-.07a1.2 1.2 0 0 0-1.1.73z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      fill="none"
                    />
                  </motion.svg>

                  {/* 활성 필터 배지 */}
                  {activeFilterCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold leading-none"
                      style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── 필터 패널 (접기/펼치기) ── */}
          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                key="filter-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-xl p-4 flex flex-col gap-4"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* 1. 영상 유형 */}
                  <FilterRow label="영상 유형">
                    {(
                      [
                        { value: "longform", label: "롱폼", sub: "3분+" },
                        { value: "shorts", label: "숏폼", sub: "3분↓" },
                      ] as const
                    ).map(({ value, label, sub }) => (
                      <OptionButton
                        key={value}
                        active={videoType === value}
                        onClick={() => setVideoType(value)}
                      >
                        {label} <span style={{ opacity: 0.6, fontSize: "11px" }}>{sub}</span>
                      </OptionButton>
                    ))}
                  </FilterRow>

                  {/* 2. 업로드일자 */}
                  <FilterRow label="업로드일자">
                    {PERIOD_OPTIONS.map((opt) => (
                      <OptionButton
                        key={opt.value}
                        active={uploadPeriod === opt.value}
                        onClick={() => setUploadPeriod(opt.value)}
                      >
                        {opt.label}
                      </OptionButton>
                    ))}
                  </FilterRow>

                  {/* 3. 최소 조회수 */}
                  <FilterRow label="최소 조회수">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={minViewCountInput}
                        onChange={(e) =>
                          setMinViewCountInput(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="제한 없음 (예: 100000)"
                        className="px-3 py-1.5 rounded-lg text-sm outline-none transition-all w-full sm:w-[200px]"
                        style={{
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                      />
                      {minViewCountInput && (
                        <button
                          onClick={() => setMinViewCountInput("")}
                          className="text-xs transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          초기화
                        </button>
                      )}
                    </div>
                  </FilterRow>

                  {/* 4. 채널 구독자 상한 */}
                  <FilterRow label="구독자 상한">
                    <div className="flex flex-wrap gap-1.5">
                      {SUBSCRIBER_OPTIONS.map((opt) => (
                        <OptionButton
                          key={String(opt.value)}
                          active={maxSubscriberCount === opt.value}
                          onClick={() => setMaxSubscriberCount(opt.value)}
                        >
                          {opt.label}
                        </OptionButton>
                      ))}
                    </div>
                  </FilterRow>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 검색 버튼 행 ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {activeFilterCount > 0 ? (
                <span style={{ color: "var(--accent-light)" }}>
                  필터 {activeFilterCount}개 적용 중
                </span>
              ) : (
                "⚙ 버튼으로 영상유형·날짜·조회수·구독자를 설정하세요"
              )}
            </p>
            <motion.button
              onClick={handleSearch}
              disabled={search.status === "loading"}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              {search.status === "loading" ? (
                <>
                  <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  검색 중...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  검색하기
                </>
              )}
            </motion.button>
          </div>
        </motion.section>

        {/* ── 결과 영역 ── */}
        <AnimatePresence mode="wait">
          {/* 로딩 */}
          {search.status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <svg className="spinner w-10 h-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="17" stroke="var(--border)" strokeWidth="3" />
                <path
                  d="M20 3a17 17 0 0 1 17 17"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                YouTube 데이터를 불러오는 중입니다…
              </p>
            </motion.div>
          )}

          {/* 에러 */}
          {search.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-6 flex items-start gap-4"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M10 6v5M10 14h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#ef4444" }}>
                  오류 발생
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {search.error}
                </p>
              </div>
            </motion.div>
          )}

          {/* 결과 0건 */}
          {search.status === "success" && search.videos.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-3"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="22" stroke="var(--border)" strokeWidth="2" />
                <path
                  d="M16 32l16-16M16 16l16 16"
                  stroke="var(--text-secondary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                조건에 맞는 영상이 없습니다
              </p>
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                &apos;{search.keyword}&apos; 키워드 검색 결과 중<br />
                설정한 필터 조건을 만족하는 영상을 찾지 못했습니다.
                <br />
                키워드나 필터 조건을 변경해 보세요.
              </p>
            </motion.div>
          )}

          {/* 성공: 결과 표시 */}
          {search.status === "success" && search.videos.length > 0 && (
            <motion.section
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              {/* 결과 헤더 + 뷰 전환 */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    분석 결과
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    &apos;{search.keyword}&apos; ·{" "}
                    {search.videoType === "shorts" ? "숏츠" : "롱폼"} ·{" "}
                    <span style={{ color: "var(--accent-light)" }}>{search.total}개</span> 발견
                    (최대 30개)
                  </p>
                </div>

                {/* 테이블/카드 뷰 전환 */}
                <div
                  className="flex rounded-xl p-1 gap-1"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <ViewToggleButton
                    active={viewMode === "card"}
                    onClick={() => setViewMode("card")}
                    label="카드"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    }
                  />
                  <ViewToggleButton
                    active={viewMode === "table"}
                    onClick={() => setViewMode("table")}
                    label="테이블"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <rect x="1" y="1" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="1" y="6" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="1" y="11" width="12" height="2" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* 뷰 전환 애니메이션 */}
              <AnimatePresence mode="wait">
                {viewMode === "card" ? (
                  <motion.div
                    key="card-view"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                  >
                    <VideoCards videos={search.videos} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="table-view"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                  >
                    <VideoTable videos={search.videos} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ── 푸터 ── */}
      <footer
        className="mt-16 py-6 text-center text-xs"
        style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}
      >
        YouTube 채널 분석기 · YouTube Data API v3 기반 · 데이터는 실시간으로 조회됩니다
      </footer>
    </div>
  );
}

// ─── 서브 컴포넌트들 ──────────────────────────────────────────────────────────

/** 필터 행: 레이블 + 옵션 */
function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span
        className="text-xs font-semibold flex-shrink-0 sm:w-24"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/** 옵션 선택 버튼 */
function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
      style={{
        backgroundColor: active ? "var(--accent)" : "var(--surface)",
        color: active ? "#fff" : "var(--text-secondary)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      {children}
    </button>
  );
}

/** 카드/테이블 뷰 전환 버튼 */
function ViewToggleButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        backgroundColor: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
