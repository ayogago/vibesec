import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureSiteScan.com - Security Scanner for AI-Generated Apps",
  description: "Protect your AI-generated apps from security vulnerabilities. One-click security scanning for apps built with Bolt.new, Lovable, v0, and Claude Code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
