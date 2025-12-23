import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://securesitescan.com";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SecureSiteScan.com - Security Scanner for AI-Generated Apps",
    template: "%s | SecureSiteScan.com",
  },
  description: "Protect your AI-generated apps from security vulnerabilities. One-click security scanning for apps built with Bolt.new, Lovable, v0, and Claude Code. Find and fix security issues in seconds.",
  keywords: [
    "security scanner",
    "AI code security",
    "Bolt.new security",
    "Lovable security",
    "v0 security",
    "Claude Code security",
    "vulnerability scanner",
    "code security",
    "RLS security",
    "API security",
    "vibe coding security",
  ],
  authors: [{ name: "SecureSiteScan" }],
  creator: "SecureSiteScan",
  publisher: "SecureSiteScan",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'SecureSiteScan.com',
    title: 'SecureSiteScan.com - Security Scanner for AI-Generated Apps',
    description: 'Protect your AI-generated apps from security vulnerabilities. One-click security scanning for apps built with Bolt.new, Lovable, v0, and Claude Code.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SecureSiteScan - AI Code Security Scanner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecureSiteScan.com - Security Scanner for AI-Generated Apps',
    description: 'Protect your AI-generated apps from security vulnerabilities. One-click security scanning.',
    images: ['/og-image.png'],
    creator: '@securesitescan',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: siteUrl,
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
