import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "찌동튜브 | 가장 빠르게 유튜브를 키우는 방법",
  description:
    "키워드로 한국 유튜브 영상을 검색하고, 구독자 대비 조회수 100% 이상인 고성과 영상을 분석합니다.",
  keywords: ["찌동튜브", "유튜브 분석", "YouTube 분석", "구독자 대비 조회수", "한국 유튜브"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
