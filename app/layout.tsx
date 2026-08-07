import type { Metadata } from "next";
import {
  Alexandria,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-athar-body",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const alexandria = Alexandria({
  variable: "--font-athar-heading",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "أثر | Athar AI",
    template: "%s | أثر",
  },
  description:
    "منصة ذكاء اصطناعي للبحث والتحليل الأكاديمي في العلوم الإنسانية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexArabic.variable} ${alexandria.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}