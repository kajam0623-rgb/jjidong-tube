/**
 * client.ts
 * YouTube Data API v3 fetch 공통 함수 및 에러 처리
 * 모든 API 호출은 이 파일을 통해서만 수행
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// ─── 에러 타입 ────────────────────────────────────────────────────────────────

export class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public readonly code: YouTubeErrorCode,
    public readonly status?: number
  ) {
    super(message);
    this.name = "YouTubeAPIError";
  }
}

export type YouTubeErrorCode =
  | "INVALID_API_KEY"
  | "QUOTA_EXCEEDED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "UNKNOWN";

// ─── YouTube API 응답 타입 ────────────────────────────────────────────────────

export interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    thumbnails: {
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    channelTitle: string;
  };
}

export interface YouTubeVideoItem {
  id: string;
  contentDetails: { duration: string };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export interface YouTubeChannelItem {
  id: string;
  /** 업로드 플레이리스트 ID 포함 (기여도 계산용) */
  contentDetails?: {
    relatedPlaylists: {
      uploads: string;
    };
  };
  statistics: {
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
  };
}

/** 채널 업로드 플레이리스트 아이템 */
export interface YouTubePlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
  };
}

// ─── 공통 fetch 래퍼 ──────────────────────────────────────────────────────────

async function youtubeFetch<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T> {
  // 보안: API Key는 서버에서만 파라미터에 포함
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  Object.entries({ ...params, key: apiKey }).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: 0 }, // 캐싱 비활성화 (실시간 데이터)
    });
  } catch {
    throw new YouTubeAPIError(
      "YouTube API 네트워크 오류가 발생했습니다.",
      "NETWORK_ERROR"
    );
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const reason: string =
      errorBody?.error?.errors?.[0]?.reason ?? "unknown";
    const message: string =
      errorBody?.error?.message ?? "YouTube API 오류가 발생했습니다.";

    if (res.status === 400 || reason === "keyInvalid" || reason === "badRequest") {
      throw new YouTubeAPIError(
        "유효하지 않은 API Key입니다. 키를 확인해 주세요.",
        "INVALID_API_KEY",
        res.status
      );
    }
    if (res.status === 403) {
      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        throw new YouTubeAPIError(
          "YouTube API 일일 할당량이 초과되었습니다. 내일 다시 시도하거나 다른 API Key를 사용하세요.",
          "QUOTA_EXCEEDED",
          res.status
        );
      }
      throw new YouTubeAPIError(
        `접근 권한이 없습니다: ${message}`,
        "FORBIDDEN",
        res.status
      );
    }
    if (res.status === 404) {
      throw new YouTubeAPIError("리소스를 찾을 수 없습니다.", "NOT_FOUND", res.status);
    }

    throw new YouTubeAPIError(message, "UNKNOWN", res.status);
  }

  return res.json() as Promise<T>;
}

// ─── YouTube API 함수들 ───────────────────────────────────────────────────────

/**
 * 키워드로 한국 영상 검색 (search.list)
 * regionCode=KR, relevanceLanguage=ko 고정
 */
export async function searchVideos(params: {
  apiKey: string;
  keyword: string;
  videoDuration: "short" | "medium" | "long" | "any";
  maxResults?: number;
  /** ISO 8601 형식. 이 날짜 이후 업로드된 영상만 반환 */
  publishedAfter?: string;
  /** 다음 페이지 토큰 (페이지네이션) */
  pageToken?: string;
}): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  const searchParams: Record<string, string> = {
    part: "snippet",
    q: params.keyword,
    type: "video",
    regionCode: "KR",
    relevanceLanguage: "ko",
    videoDuration: params.videoDuration,
    maxResults: String(params.maxResults ?? 50),
    videoEmbeddable: "true",
  };
  if (params.publishedAfter) {
    searchParams.publishedAfter = params.publishedAfter;
  }
  if (params.pageToken) {
    searchParams.pageToken = params.pageToken;
  }
  const data = await youtubeFetch<{
    items?: YouTubeSearchItem[];
    nextPageToken?: string;
  }>("search", searchParams, params.apiKey);
  return { items: data.items ?? [], nextPageToken: data.nextPageToken };
}

/**
 * 영상 상세 정보 조회 (videos.list) - 조회수, 좋아요, 영상 길이
 * 최대 50개 ID 한 번에 조회 가능
 */
export async function getVideoDetails(params: {
  apiKey: string;
  videoIds: string[];
}): Promise<YouTubeVideoItem[]> {
  if (params.videoIds.length === 0) return [];

  const data = await youtubeFetch<{ items?: YouTubeVideoItem[] }>(
    "videos",
    {
      part: "contentDetails,statistics",
      id: params.videoIds.join(","),
      maxResults: "50",
    },
    params.apiKey
  );
  return data.items ?? [];
}

/**
 * 채널 상세 정보 조회 (channels.list) - 구독자 수, 총 영상 수
 * 최대 50개 ID 한 번에 조회 가능
 */
export async function getChannelDetails(params: {
  apiKey: string;
  channelIds: string[];
}): Promise<YouTubeChannelItem[]> {
  if (params.channelIds.length === 0) return [];

  // 중복 제거
  const uniqueIds = [...new Set(params.channelIds)];

  const data = await youtubeFetch<{ items?: YouTubeChannelItem[] }>(
    "channels",
    {
      // contentDetails: 업로드 플레이리스트 ID (기여도 계산에 필요)
      part: "statistics,contentDetails",
      id: uniqueIds.join(","),
      maxResults: "50",
    },
    params.apiKey
  );
  return data.items ?? [];
}

/**
 * 채널 업로드 플레이리스트 아이템 조회 (playlistItems.list)
 * 기여도 계산을 위한 채널 평균 조회수 샘플 수집용
 * 최신순 정렬 (YouTube 기본값)
 */
export async function getPlaylistItems(params: {
  apiKey: string;
  playlistId: string;
  maxResults?: number;
}): Promise<YouTubePlaylistItem[]> {
  const data = await youtubeFetch<{ items?: YouTubePlaylistItem[] }>(
    "playlistItems",
    {
      part: "snippet",
      playlistId: params.playlistId,
      maxResults: String(params.maxResults ?? 50),
    },
    params.apiKey
  );
  return data.items ?? [];
}

// TODO: 추후 채널 플레이리스트, 댓글 분석 등 추가 API 함수 확장 예정
