'use client'

/**
 * LINE個別/セグメント送信フォーム
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useState } from 'react'
import { SegmentSelector } from './SegmentSelector'

interface LineMessageComposerProps {
  onSendSuccess?: () => void
}

export function LineMessageComposer({ onSendSuccess }: LineMessageComposerProps) {
  const [mode, setMode] = useState<'segment' | 'individual'>('segment')
  const [segment, setSegment] = useState('all')
  const [userId, setUserId] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) {
      alert('メッセージを入力してください')
      return
    }

    if (mode === 'individual' && !userId.trim()) {
      alert('ユーザーIDを入力してください')
      return
    }

    const endpoint = mode === 'individual' 
      ? '/api/v1/admin/messaging/line/individual'
      : '/api/v1/admin/messaging/line/segment'

    const body = mode === 'individual'
      ? { userId, message }
      : { segment, message }

    if (!confirm(`${mode === 'individual' ? '個別' : 'セグメント'}配信を実行しますか？`)) {
      return
    }

    try {
      setSending(true)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const result = await res.json()
        alert(`配信完了: ${result.sent || 1}件送信`)
        setMessage('')
        setUserId('')
        onSendSuccess?.()
      } else {
        const error = await res.json()
        alert(`配信失敗: ${error.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('配信エラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">LINE配信</h3>

      {/* モード切り替え */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('segment')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'segment'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          セグメント配信
        </button>
        <button
          type="button"
          onClick={() => setMode('individual')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'individual'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          個別配信
        </button>
      </div>

      {/* セグメント選択 */}
      {mode === 'segment' && (
        <div className="mb-6">
          <SegmentSelector
            selectedSegment={segment}
            onSegmentChange={setSegment}
          />
        </div>
      )}

      {/* 個別配信：ユーザーID入力 */}
      {mode === 'individual' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ユーザーID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="U1234567890abcdef..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            送信先ユーザーのIDを入力してください
          </p>
        </div>
      )}

      {/* メッセージ入力 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メッセージ
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="配信するメッセージを入力してください"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {message.length} / 500文字
          </p>
          {message.length > 500 && (
            <p className="text-xs text-red-600">文字数制限を超えています</p>
          )}
        </div>
      </div>

      {/* 送信ボタン */}
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !message.trim() || message.length > 500}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
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
          </span>
        ) : (
          '配信する'
        )}
      </button>
    </div>
  )
}
