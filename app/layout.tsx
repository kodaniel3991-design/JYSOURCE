import type { Metadata } from "next";
import { Sora, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Procurement Hub | B2B Purchase Management",
  description: "Modern procurement and purchase order management for automotive parts manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${sora.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
