/**
 * analysis.ts
 * 조회수 >= 구독자 수 필터링, 비율 계산, 결과 데이터 포맷 통일
 * 성과도 / 기여도 점수 계산
 */

import type {
  YouTubeSearchItem,
  YouTubeVideoItem,
  YouTubeChannelItem,
} from "./client";
import { matchesVideoType, type VideoType } from "./videoType";

// ─── 점수 타입 ────────────────────────────────────────────────────────────────

export interface ScoreInfo {
  score: 1 | 2 | 3 | 4 | 5;
  label: "Excellent" | "Great" | "Good" | "Normal" | "Bad";
  /** 다크 테마 기준 배지 텍스트 색상 */
  color: string;
}

/**
 * 색상 팔레트 (다크 테마 기준)
 * - 5 Excellent : 빨간색 (#f87171 red-400)
 * - 4 Great     : 초록색 (#4ade80 green-400)
 * - 3 Good      : 파랑색 (#60a5fa blue-400)
 * - 2 Normal    : 검정색 → 다크 테마에서 neutral (#cbd5e1 slate-200)
 * - 1 Bad       : 회색   (#64748b slate-500)
 */
const SCORE_PALETTE: Record<1 | 2 | 3 | 4 | 5, string> = {
  5: "#f87171",
  4: "#4ade80",
  3: "#60a5fa",
  2: "#cbd5e1",
  1: "#64748b",
};

// ─── 성과도 계산 (구독자 대비 조회수) ────────────────────────────────────────

/**
 * 성과도: 조회수 / 구독자 수 비율로 5단계 평가
 * - 5 Excellent : 500% 이상 (ratio >= 5)
 * - 4 Great     : 300% 이상 (ratio >= 3)
 * - 3 Good      : 100% 이상 (ratio >= 1)
 * - 2 Normal    : 50%  이상 (ratio >= 0.5)
 * - 1 Bad       : 50%  미만 (ratio < 0.5)
 */
export function calcPerformanceScore(viewToSubscriberRatio: number): ScoreInfo {
  if (viewToSubscriberRatio >= 5)
    return { score: 5, label: "Excellent", color: SCORE_PALETTE[5] };
  if (viewToSubscriberRatio >= 3)
    return { score: 4, label: "Great", color: SCORE_PALETTE[4] };
  if (viewToSubscriberRatio >= 1)
    return { score: 3, label: "Good", color: SCORE_PALETTE[3] };
  if (viewToSubscriberRatio >= 0.5)
    return { score: 2, label: "Normal", color: SCORE_PALETTE[2] };
  return { score: 1, label: "Bad", color: SCORE_PALETTE[1] };
}

// ─── 기여도 계산 (채널 평균 대비 조회수) ─────────────────────────────────────

/**
 * 기여도: 해당 영상 조회수 / 채널 평균 조회수 비율로 5단계 평가
 * - 5 Excellent : 1000% 이상 (ratio >= 10)
 * - 4 Great     : 500%  이상 (ratio >= 5)
 * - 3 Good      : 100%  이상 (ratio >= 1)
 * - 2 Normal    : 100%  미만 (ratio >= 0.5)
 * - 1 Bad       : 50%   미만 (ratio < 0.5)
 *
 * @returns null - 채널 평균 조회수를 구할 수 없는 경우
 */
export function calcContributionScore(
  viewCount: number,
  channelAvgViews: number
): ScoreInfo | null {
  if (channelAvgViews <= 0) return null;
  const ratio = viewCount / channelAvgViews;
  if (ratio >= 10)
    return { score: 5, label: "Excellent", color: SCORE_PALETTE[5] };
  if (ratio >= 5)
    return { score: 4, label: "Great", color: SCORE_PALETTE[4] };
  if (ratio >= 1)
    return { score: 3, label: "Good", color: SCORE_PALETTE[3] };
  if (ratio >= 0.5)
    return { score: 2, label: "Normal", color: SCORE_PALETTE[2] };
  return { score: 1, label: "Bad", color: SCORE_PALETTE[1] };
}

/**
 * 채널 영상 샘플에서 videoType에 맞는 평균 조회수 계산
 * - longform: 60초 초과 영상만 포함
 * - shorts  : 60초 이하 영상만 포함
 *
 * @returns 0 - 해당 타입의 영상이 없는 경우
 */
export function calcChannelAvgViews(
  videoSamples: YouTubeVideoItem[],
  videoType: VideoType
): number {
  const filtered = videoSamples.filter((v) =>
    matchesVideoType(v.contentDetails.duration, videoType)
  );
  if (filtered.length === 0) return 0;
  const totalViews = filtered.reduce(
    (sum, v) => sum + parseInt(v.statistics.viewCount ?? "0"),
    0
  );
  return Math.round(totalViews / filtered.length);
}

// ─── 최종 결과 타입 (API 응답 및 UI 공통 사용) ────────────────────────────────

export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  /** YouTube 통계에서 비공개 처리된 경우 null */
  likeCount: number | null;
  subscriberCount: number;
  totalVideoCount: number;
  /** 조회수 / 구독자 수 */
  viewToSubscriberRatio: number;
  /** 좋아요 / 구독자 수 (likeCount가 없으면 null) */
  likeToSubscriberRatio: number | null;
  /** 영상 길이 (ISO 8601) */
  duration: string;
  /** 성과도: 구독자 대비 조회수 5단계 평가 */
  performanceScore: ScoreInfo;
  /** 기여도: 채널 평균 대비 조회수 5단계 평가 (채널 데이터 없으면 null) */
  contributionScore: ScoreInfo | null;
  /** 기여도 계산에 사용된 채널 평균 조회수 */
  channelAvgViews: number | null;
}

// ─── 데이터 병합 및 필터링 ────────────────────────────────────────────────────

/** 추가 필터 옵션 */
export interface BuildFilterOptions {
  /** 최소 조회수 (미설정 시 제한 없음) */
  minViewCount?: number;
  /** 채널 구독자 수 상한 (미설정 시 제한 없음) */
  maxSubscriberCount?: number | null;
}

/**
 * search, video details, channel details 데이터를 병합하여
 * 필터 조건(조회수 >= 구독자 수)을 만족하는 영상 목록 반환
 *
 * @param searchItems    search.list 결과
 * @param videoItems     videos.list 결과
 * @param channelItems   channels.list 결과
 * @param videoType      Shorts / Longform 구분
 * @param channelAvgMap  채널ID → 채널 평균 조회수 (기여도 계산용)
 * @param filters        추가 필터 옵션 (최소 조회수, 구독자 상한)
 * @param maxResults     최대 반환 수 (기본 30)
 */
export function buildAndFilterResults(
  searchItems: YouTubeSearchItem[],
  videoItems: YouTubeVideoItem[],
  channelItems: YouTubeChannelItem[],
  videoType: VideoType,
  channelAvgMap: Map<string, number>,
  filters: BuildFilterOptions = {},
  maxResults = 30
): VideoResult[] {
  const videoMap = new Map(videoItems.map((v) => [v.id, v]));
  const channelMap = new Map(channelItems.map((c) => [c.id, c]));

  const results: VideoResult[] = [];

  for (const searchItem of searchItems) {
    if (results.length >= maxResults) break;

    const videoId = searchItem.id.videoId;
    const channelId = searchItem.snippet.channelId;

    const videoDetail = videoMap.get(videoId);
    const channelDetail = channelMap.get(channelId);
    if (!videoDetail || !channelDetail) continue;

    // duration 재검증
    const duration = videoDetail.contentDetails.duration;
    if (!matchesVideoType(duration, videoType)) continue;

    const viewCount = parseInt(videoDetail.statistics.viewCount ?? "0");
    const likeCount =
      videoDetail.statistics.likeCount !== undefined
        ? parseInt(videoDetail.statistics.likeCount)
        : null;

    const subscriberCount = parseInt(
      channelDetail.statistics.subscriberCount ?? "0"
    );
    const totalVideoCount = parseInt(
      channelDetail.statistics.videoCount ?? "0"
    );

    if (subscriberCount === 0) continue;

    // ── 채널 구독자 상한 필터 ─────────────────────────────────────────
    if (
      filters.maxSubscriberCount != null &&
      subscriberCount > filters.maxSubscriberCount
    )
      continue;

    // ── 핵심 필터: 조회수 >= 구독자 수 ──────────────────────────────────
    if (viewCount < subscriberCount) continue;

    // ── 최소 조회수 필터 ──────────────────────────────────────────────
    if (filters.minViewCount != null && viewCount < filters.minViewCount) continue;

    const viewToSubscriberRatio = parseFloat(
      (viewCount / subscriberCount).toFixed(2)
    );
    const likeToSubscriberRatio =
      likeCount !== null
        ? parseFloat((likeCount / subscriberCount).toFixed(4))
        : null;

    const thumbnail =
      searchItem.snippet.thumbnails.high?.url ??
      searchItem.snippet.thumbnails.medium?.url ??
      "";

    // ── 점수 계산 ────────────────────────────────────────────────────────
    const performanceScore = calcPerformanceScore(viewToSubscriberRatio);

    const channelAvgViews = channelAvgMap.get(channelId) ?? null;
    const contributionScore =
      channelAvgViews !== null && channelAvgViews > 0
        ? calcContributionScore(viewCount, channelAvgViews)
        : null;

    results.push({
      id: videoId,
      title: searchItem.snippet.title,
      thumbnail,
      channelId,
      channelTitle: searchItem.snippet.channelTitle,
      publishedAt: searchItem.snippet.publishedAt,
      viewCount,
      likeCount,
      subscriberCount,
      totalVideoCount,
      viewToSubscriberRatio,
      likeToSubscriberRatio,
      duration,
      performanceScore,
      contributionScore,
      channelAvgViews,
    });
  }

  // 성과도 점수(5→1) 내림차순, 동점이면 조회수/구독자 비율 내림차순
  results.sort(
    (a, b) =>
      b.performanceScore.score - a.performanceScore.score ||
      b.viewToSubscriberRatio - a.viewToSubscriberRatio
  );

  return results;
}

// ─── 포맷 유틸리티 ───────────────────────────────────────────────────────────

/** 숫자를 한국어 단위로 포맷 (예: 1234567 → "123.5만") */
export function formatKoreanNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return String(n);
}

/** ISO 8601 날짜를 "YYYY.MM.DD" 형식으로 변환 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 비율을 퍼센트 문자열로 변환 (예: 1.23 → "123%") */
export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(0)}%`;
}

// TODO: 추후 카테고리별 평균 비율 비교 분석 추가 예정
