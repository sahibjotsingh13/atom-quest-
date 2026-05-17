// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
});
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "AtomQuest - Goal Setting Portal",
  description: "Enterprise Goal Setting & Tracking System",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", notoSansSC.variable, notoSerifSC.variable)}>
      <body className={cn(notoSansSC.className, "bg-[#050a0f] text-[#ede8e4]")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}