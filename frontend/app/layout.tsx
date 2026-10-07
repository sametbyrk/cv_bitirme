import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vitascor - AI-Assisted Resume Builder & ATS Optimization Platform",
    template: "%s | Vitascor",
  },
  description: "AI-powered structured resume builder with live preview, job-specific Auto-Tailor rewriting, and ATS optimization.",
  applicationName: "Vitascor",
  keywords: ["Vitascor", "Resume", "CV", "ATS", "Auto-Tailor", "AI Resume Builder", "Resume Optimization"],
  authors: [{ name: "Samet Bayrak" }],
  creator: "Samet Bayrak",
  openGraph: {
    title: "Vitascor - AI-Assisted Resume Builder & ATS Optimization Platform",
    description: "AI-powered structured resume builder with live preview, job-specific Auto-Tailor rewriting, and ATS optimization.",
    siteName: "Vitascor",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitascor - AI-Assisted Resume Builder & ATS Optimization Platform",
    description: "AI-powered structured resume builder with live preview, job-specific Auto-Tailor rewriting, and ATS optimization.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
