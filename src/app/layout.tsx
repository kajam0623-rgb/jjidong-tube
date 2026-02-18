import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
