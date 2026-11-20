import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Cinema View",
    template: "%s",
  },
  description: "Pilih kursi bioskop dan lihat pemandangan dari kursimu sebelum memesan.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Cinema View",
    title: "Cinema View",
    description: "Pilih kursi bioskop dan lihat pemandangan dari kursimu sebelum memesan.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background"
        >
          Lewati ke konten
        </a>
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
