import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-bookmarks-v2.vercel.app'),
  title: {
    default: "AI 工具评测 - 拒绝云评测，实测才是真",
    template: "%s | AI 工具评测"
  },
  description: "每日 AI 工具深度评测，帮助程序员发现、收藏、评测 AI 编程工具。涵盖 Claude Code、Cursor、GitHub Copilot 等热门工具的真实使用体验。",
  keywords: ["AI工具", "AI评测", "Claude Code", "Cursor", "GitHub Copilot", "AI编程", "程序员工具"],
  authors: [{ name: "AI Bookmarks" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "AI 工具评测",
    title: "AI 工具评测 - 拒绝云评测，实测才是真",
    description: "每日 AI 工具深度评测，帮助程序员发现、收藏、评测 AI 编程工具",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 工具评测",
    description: "拒绝云评测，实测才是真",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
