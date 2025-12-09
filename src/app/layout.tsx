import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeSec - Security Scanner for AI-Generated Apps",
  description: "Don't let your Vibe Code leak your data. One-click security scanning for apps built with Bolt.new, Lovable, v0, and Claude Code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
