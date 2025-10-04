/**
 * デバッグパネル用のUI共通コンポーネント
 */

export function StatusItem({
  label,
  value,
  text,
  spinner = false,
  isError = false
}: {
  label: string
  value?: boolean
  text?: string
  spinner?: boolean
  isError?: boolean
}) {
  return (
    <div className="flex flex-col bg-gray-100 rounded p-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        {spinner && value ? (
          <span className="inline-block h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : null}
        {typeof value === 'boolean' ? (value ? '✅' : '❌') : null}
        {text && (
          <span className={isError ? 'text-red-600' : 'text-gray-800'}>{text}</span>
        )}
      </span>
    </div>
  )
}

export function TimelineItem({ 
  label, 
  value, 
  note 
}: { 
  label: string
  value: string | null
  note?: string | null
}) {
  return (
    <div className="flex flex-col border-l-2 border-gray-300 pl-3 mb-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-mono text-gray-900">{value ?? '—'}</span>
      {note ? <span className="text-xs text-gray-600">理由: {note}</span> : null}
    </div>
  )
}

export function KeyValue({ 
  label, 
  value 
}: { 
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-gray-200 py-1">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-900 break-all">{value ?? '—'}</span>
    </div>
  )
}
