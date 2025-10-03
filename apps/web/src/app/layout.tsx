import React from 'react'
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/shared/providers/AuthProvider";

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
    <html lang="ja">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
