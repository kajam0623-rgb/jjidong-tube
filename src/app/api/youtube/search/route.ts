/**
 * app/api/youtube/search/route.ts
 * YouTube 영상 검색 Route Handler
 *
 * - 모든 YouTube API 호출은 여기서만 수행 (브라우저 직접 호출 금지)
 * - API Key는 서버 로그에 절대 노출하지 않음
 * - 요청마다 즉시 사용 후 메모리에서 소멸 (영구 저장 없음)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchVideos,
  getVideoDetails,
  getChannelDetails,
  getPlaylistItems,
  YouTubeAPIError,
} from "@/lib/youtube/client";
import { getVideoTypeSearchParams, type VideoType } from "@/lib/youtube/videoType";
import {
  buildAndFilterResults,
  calcChannelAvgViews,
  type BuildFilterOptions,
} from "@/lib/youtube/analysis";

// ─── 요청/응답 타입 ────────────────────────────────────────────────────────────

type UploadPeriod = "all" | "1month" | "3months" | "6months" | "1year";

interface SearchRequestBody {
  apiKey: string;
  keyword: string;
  videoType: VideoType;
  uploadPeriod?: UploadPeriod;
  minViewCount?: number;
  maxSubscriberCount?: number | null;
}

/** 업로드 기간 키를 ISO 8601 날짜 문자열로 변환 */
function calcPublishedAfter(period?: UploadPeriod): string | undefined {
  if (!period || period === "all") return undefined;
  const now = new Date();
  if (period === "1month") now.setMonth(now.getMonth() - 1);
  else if (period === "3months") now.setMonth(now.getMonth() - 3);
  else if (period === "6months") now.setMonth(now.getMonth() - 6);
  else if (period === "1year") now.setFullYear(now.getFullYear() - 1);
  else return undefined;
  return now.toISOString();
}

// ─── POST 핸들러 ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Partial<SearchRequestBody>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const { apiKey, keyword, videoType, uploadPeriod, minViewCount, maxSubscriberCount } = body;

  // ── 입력 유효성 검사 ─────────────────────────────────────────────────────
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    return NextResponse.json(
      { error: "API Key를 입력해 주세요." },
      { status: 400 }
    );
  }
  if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
    return NextResponse.json(
      { error: "검색 키워드를 입력해 주세요." },
      { status: 400 }
    );
  }
  if (videoType !== "shorts" && videoType !== "longform") {
    return NextResponse.json(
      { error: "videoType은 'shorts' 또는 'longform'이어야 합니다." },
      { status: 400 }
    );
  }

  // 보안: API Key 값을 절대 로그에 출력하지 않음
  console.log(
    `[YouTube Search] keyword="${keyword}" type=${videoType} period=${uploadPeriod ?? "all"}`
  );

  try {
    const { videoDurations } = getVideoTypeSearchParams(videoType);
    const publishedAfter = calcPublishedAfter(uploadPeriod);

    // ── 1단계: 영상 검색 (videoDuration별 병렬 호출, 최대 2페이지) ──────
    const searchResultArrays = await Promise.all(
      videoDurations.map(async (dur) => {
        const baseParams = {
          apiKey,
          keyword: keyword.trim(),
          videoDuration: dur,
          maxResults: 50,
          publishedAfter,
        };
        // 1페이지
        const page1 = await searchVideos(baseParams);
        const collected = [...page1.items];
        // 2페이지 (nextPageToken 있을 때만)
        if (page1.nextPageToken) {
          const page2 = await searchVideos({
            ...baseParams,
            pageToken: page1.nextPageToken,
          });
          collected.push(...page2.items);
        }
        return collected;
      })
    );

    // 중복 제거를 위해 videoId 기준으로 병합
    const searchItemMap = new Map(
      searchResultArrays.flat().map((item) => [item.id.videoId, item])
    );
    const allSearchItems = [...searchItemMap.values()];

    if (allSearchItems.length === 0) {
      return NextResponse.json({ videos: [], total: 0 });
    }

    const videoIds = allSearchItems.map((item) => item.id.videoId);
    const channelIds = [...new Set(allSearchItems.map((item) => item.snippet.channelId))];

    // ── 2단계: 영상 상세 + 채널 정보 병렬 조회 ──────────────────────────
    // YouTube API는 한 번에 최대 50개 → 50개 초과 시 청크 분할
    const [videoItems, channelItems] = await Promise.all([
      fetchInChunks(videoIds, 50, (chunk) =>
        getVideoDetails({ apiKey, videoIds: chunk })
      ),
      fetchInChunks(channelIds, 50, (chunk) =>
        getChannelDetails({ apiKey, channelIds: chunk })
      ),
    ]);

    // ── 3단계: 채널 평균 조회수 계산 (기여도 점수용) ─────────────────────
    // 각 채널의 업로드 플레이리스트에서 샘플 영상을 수집하여 평균 산정
    // playlistItems.list(1 unit) + videos.list(1 unit) per channel
    const channelAvgMap = new Map<string, number>();
    await Promise.all(
      channelItems
        .filter((c) => c.contentDetails?.relatedPlaylists?.uploads)
        .map(async (channel) => {
          try {
            // 최신 50개 영상 ID 수집
            const playlistItems = await getPlaylistItems({
              apiKey,
              playlistId: channel.contentDetails!.relatedPlaylists.uploads,
              maxResults: 50,
            });

            const sampleIds = playlistItems
              .map((p) => p.snippet?.resourceId?.videoId)
              .filter((id): id is string => Boolean(id));

            if (sampleIds.length === 0) return;

            // 샘플 영상의 길이 + 조회수 조회
            const sampleVideos = await getVideoDetails({
              apiKey,
              videoIds: sampleIds,
            });

            // videoType에 맞는 영상만 필터링하여 평균 계산
            const avg = calcChannelAvgViews(sampleVideos, videoType);
            if (avg > 0) channelAvgMap.set(channel.id, avg);
          } catch {
            // 채널 평균 조회 실패 시 해당 채널의 기여도는 null 처리
          }
        })
    );

    // ── 4단계: 필터링 및 결과 구성 ──────────────────────────────────────
    const filters: BuildFilterOptions = {
      minViewCount: minViewCount && minViewCount > 0 ? minViewCount : undefined,
      maxSubscriberCount: maxSubscriberCount ?? undefined,
    };

    const results = buildAndFilterResults(
      allSearchItems,
      videoItems,
      channelItems,
      videoType,
      channelAvgMap,
      filters,
      100
    );

    console.log(
      `[YouTube Search] found=${allSearchItems.length} filtered=${results.length} channelsWithAvg=${channelAvgMap.size}`
    );

    return NextResponse.json({ videos: results, total: results.length });
  } catch (err) {
    if (err instanceof YouTubeAPIError) {
      const statusMap: Record<string, number> = {
        INVALID_API_KEY: 401,
        QUOTA_EXCEEDED: 429,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        NETWORK_ERROR: 503,
        UNKNOWN: 500,
      };
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: statusMap[err.code] ?? 500 }
      );
    }

    console.error("[YouTube Search] Unexpected error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

// ─── 청크 분할 유틸리티 ───────────────────────────────────────────────────────

async function fetchInChunks<T>(
  ids: string[],
  chunkSize: number,
  fetcher: (chunk: string[]) => Promise<T[]>
): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }
  const results = await Promise.all(chunks.map(fetcher));
  return results.flat();
}
