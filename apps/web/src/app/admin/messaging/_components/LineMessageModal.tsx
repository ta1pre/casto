'use client'

/**
 * LINE個別メッセージ送信モーダル
 * [SF][RP] シンプル、可読性優先
 */

import { useState } from 'react'

interface LineMessageModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: {
    id: string
    name: string
    lineUserId: string
  }
  onSendSuccess: () => void
}

export function LineMessageModal({
  isOpen,
  onClose,
  recipient,
  onSendSuccess
}: LineMessageModalProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!message.trim()) {
      setError('メッセージを入力してください')
      return
    }

    if (message.length > 500) {
      setError('メッセージは500文字以内で入力してください')
      return
    }

    try {
      setSending(true)
      setError(null)

      const res = await fetch('/api/v1/internal/messaging/send-direct', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: recipient.lineUserId,
          message: message.trim()
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'メッセージの送信に失敗しました')
      }

      alert('メッセージを送信しました')
      setMessage('')
      onSendSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">LINEメッセージ送信</h2>
            <p className="text-sm text-gray-500 mt-1">
              送信先: {recipient.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={sending}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          {/* メッセージ入力 */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ内容
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={8}
              placeholder="送信するメッセージを入力してください&#10;&#10;例:&#10;こんにちは！&#10;オーディションの件でご連絡させていただきました。"
              disabled={sending}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {message.length} / 500文字
              </p>
              {message.length > 500 && (
                <p className="text-xs text-red-600 font-medium">
                  文字数制限を超えています
                </p>
              )}
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 注意事項 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>注意:</strong> このメッセージはLINE公式アカウントから送信されます。
              プロモーション目的の送信は避け、ユーザーからの問い合わせへの返信や重要な連絡のみに使用してください。
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={sending}
          >
            キャンセル
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || message.length > 500}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                送信中...
              </span>
            ) : (
              '送信'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
