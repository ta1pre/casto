"use client"

import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error boundary caught:", error)
  }, [error])

  return (
    <html lang="ja">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#0d47a1",
          color: "#fff",
          padding: "2rem"
        }}
      >
        <main style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>エラーが発生しました</h1>
          <p style={{ marginBottom: "2rem", lineHeight: 1.6 }}>
            しばらく時間をおいて再度アクセスしてください。問題が解消しない場合は管理者までご連絡ください。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#fff",
              color: "#0d47a1",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            再読み込み
          </button>
        </main>
      </body>
    </html>
  )
}

export const metadata = {
  title: "Casto | エラーが発生しました",
  description:
    "予期しないエラーが発生しました。再読み込みしても解消しない場合は管理者までご連絡ください。"
}
