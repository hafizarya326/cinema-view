import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Cinema View",
  description: "Pilih kursi bioskop dan lihat pemandangan dari kursimu sebelum memesan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
