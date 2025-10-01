import React from 'react'
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/shared/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Casto - オーディション管理アプリ",
  description: "集める→選ぶ→見せる→売るを1つのIDで全部できるオーディション管理アプリ",
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
