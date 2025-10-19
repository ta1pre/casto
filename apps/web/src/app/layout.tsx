import React from 'react'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "casto",
  description: "オーディション管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
