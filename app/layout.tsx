import "./globals.css";
import "reactflow/dist/style.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أثر",
  description: "AI Historian Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
  lang="ar"
  dir="rtl"
  data-scroll-behavior="smooth"
>
      <body>{children}</body>
    </html>
  );
}