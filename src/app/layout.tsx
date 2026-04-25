import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创秒 - 一键内容工坊",
  description: "输入主题，AI 同时生成公众号长文、微博文案、小红书文案，一键复制",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {children}
      </body>
    </html>
  );
}
