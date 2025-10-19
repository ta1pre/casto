'use client'

/**
 * 配信アクションボタン
 * [SF][RP] シンプル、可読性優先
 */

interface BroadcastActionsProps {
  sending: boolean
  onSendWeeklySummary: () => Promise<void>
}

export function BroadcastActions({ sending, onSendWeeklySummary }: BroadcastActionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">配信アクション</h2>
      <div className="space-y-3">
        <button
          onClick={onSendWeeklySummary}
          disabled={sending}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {sending ? '配信中...' : '📮 週次まとめを配信'}
        </button>
        <p className="text-sm text-gray-500">
          ※ 過去7日間の新着オーディションを友だち追加済みユーザー全員に配信します
        </p>
      </div>
    </div>
  )
}
