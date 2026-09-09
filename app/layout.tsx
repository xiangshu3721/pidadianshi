import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "屁大点事",
  description: "每天花 1–3 分钟把破事倒给 AI，AI 帮你分类、看透、调回来。",
  applicationName: "屁大点事",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f1e8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="app-shell">{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
