/**
 * デバッグエラーパネル
 * 
 * LIFF内でエラー詳細を確認するためのUI
 */

'use client'

import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface DebugErrorPanelProps {
  error: unknown
  context?: string
}

export function DebugErrorPanel({ error, context }: DebugErrorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!error) return null

  // 型ガード: errorをErrorまたはApiError型として扱う
  const errorObj = error as {
    message?: string
    status?: number
    statusText?: string
    body?: unknown
    stack?: string
  }

  const errorInfo = {
    context: context || 'Unknown',
    message: errorObj.message || 'Unknown error',
    status: errorObj.status,
    statusText: errorObj.statusText,
    body: errorObj.body,
    stack: errorObj.stack,
    timestamp: new Date().toISOString()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-50 border-t-2 border-red-500 shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="font-semibold text-red-700">
            エラーが発生しました
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-red-500" />
        ) : (
          <ChevronUp className="w-5 h-5 text-red-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 max-h-96 overflow-auto">
          <div className="bg-white rounded-lg p-4 shadow-inner">
            <h3 className="font-bold text-sm mb-2 text-red-700">エラー詳細</h3>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold">Context:</span> {errorInfo.context}
              </div>
              <div>
                <span className="font-semibold">Message:</span> {errorInfo.message}
              </div>
              {errorInfo.status && (
                <div>
                  <span className="font-semibold">Status:</span> {errorInfo.status} {errorInfo.statusText}
                </div>
              )}
              <div>
                <span className="font-semibold">Time:</span> {errorInfo.timestamp}
              </div>
            </div>

            {errorInfo.body !== undefined && errorInfo.body !== null && (
              <div className="mt-3">
                <div className="font-semibold text-xs mb-1">Response Body:</div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(errorInfo.body, null, 2)}
                </pre>
              </div>
            )}

            {errorInfo.stack && (
              <div className="mt-3">
                <div className="font-semibold text-xs mb-1">Stack Trace:</div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {errorInfo.stack}
                </pre>
              </div>
            )}

            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
                alert('エラー情報をコピーしました')
              }}
              className="mt-3 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              エラー情報をコピー
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
