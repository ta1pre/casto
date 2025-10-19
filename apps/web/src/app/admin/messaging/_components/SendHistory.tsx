'use client'

/**
 * 送信履歴テーブル
 * [SF][RP] シンプル、可読性優先
 */

interface SendHistoryItem {
  id: string
  message_type: string
  recipient_count: number
  success_count: number
  failed_count: number
  sent_at: string
}

interface SendHistoryProps {
  history: SendHistoryItem[]
  loading: boolean
}

export function SendHistory({ history, loading }: SendHistoryProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">送信履歴</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">送信履歴</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">送信日時</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">成功</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">失敗</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  送信履歴がありません
                </td>
              </tr>
            ) : (
              history.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.sent_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.message_type === 'weekly_summary' ? '週次まとめ' : 
                     log.message_type === 'audition_announcement' ? 'オーディション告知' : 
                     'カスタム'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.recipient_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {log.success_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {log.failed_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
