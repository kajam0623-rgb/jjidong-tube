/**
 * videoType.ts
 * Shorts / Long-form 구분 로직 및 검색 파라미터 변환 담당
 */

export type VideoType = "shorts" | "longform";

export interface VideoTypeSearchParams {
  /** YouTube search.list videoDuration 파라미터 값들 */
  videoDurations: Array<"short" | "medium" | "long" | "any">;
}

/**
 * VideoType에 따른 YouTube search.list videoDuration 파라미터 반환
 * - shorts: 'short' (4분 미만) → 코드에서 60초 이하로 추가 필터링
 * - longform: 'medium'(4-20분) + 'long'(20분 초과) → 두 번 호출 후 병합
 */
export function getVideoTypeSearchParams(
  videoType: VideoType
): VideoTypeSearchParams {
  if (videoType === "shorts") {
    return { videoDurations: ["short"] };
  }
  return { videoDurations: ["medium", "long"] };
}

/**
 * ISO 8601 duration 문자열을 초 단위로 변환
 * 예: "PT1M30S" → 90
 */
export function parseDurationToSeconds(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0");
  const minutes = parseInt(match[2] ?? "0");
  const seconds = parseInt(match[3] ?? "0");
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * duration이 VideoType에 해당하는지 검증
 * - shorts: 180초(3분) 이하 — 2024.10부터 YouTube Shorts 최대 길이 3분으로 확장
 * - longform: 180초 초과
 */
export function matchesVideoType(
  durationISO: string,
  videoType: VideoType
): boolean {
  const totalSeconds = parseDurationToSeconds(durationISO);
  if (videoType === "shorts") {
    return totalSeconds > 0 && totalSeconds <= 180;
  }
  return totalSeconds > 180;
}

// TODO: 추후 YouTube Reels API 또는 Shorts 전용 엔드포인트 지원 시
//       isOfficialShorts(videoId) 함수 추가 예정
