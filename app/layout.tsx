import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "투표",
  description: "우리 조직의 투표와 결과 확인",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto w-full max-w-md px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
