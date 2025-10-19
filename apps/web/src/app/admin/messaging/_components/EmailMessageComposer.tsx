'use client'

/**
 * メール送信フォーム
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useState } from 'react'

interface EmailMessageComposerProps {
  onSendSuccess?: () => void
}

export function EmailMessageComposer({ onSendSuccess }: EmailMessageComposerProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!to.trim()) {
      alert('送信先メールアドレスを入力してください')
      return
    }

    if (!subject.trim()) {
      alert('件名を入力してください')
      return
    }

    if (!body.trim()) {
      alert('本文を入力してください')
      return
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      alert('有効なメールアドレスを入力してください')
      return
    }

    if (!confirm('メールを送信しますか？')) {
      return
    }

    try {
      setSending(true)
      const res = await fetch('/api/v1/admin/messaging/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to, subject, body }),
      })

      if (res.ok) {
        alert('メール送信完了')
        setTo('')
        setSubject('')
        setBody('')
        onSendSuccess?.()
      } else {
        const error = await res.json()
        alert(`送信失敗: ${error.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('送信エラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-6 h-6 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">メール送信</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">主催者向け通知用</p>
            <p className="text-xs text-blue-700 mt-1">
              新規応募通知、締切リマインダーなど、主催者への通知に使用します
            </p>
          </div>
        </div>
      </div>

      {/* 送信先 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          送信先メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="example@example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 件名 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          件名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="メールの件名"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 本文 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          本文 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="メール本文を入力してください"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          {body.length} 文字
        </p>
      </div>

      {/* 送信ボタン */}
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            送信中...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            メールを送信
          </>
        )}
      </button>
    </div>
  )
}
