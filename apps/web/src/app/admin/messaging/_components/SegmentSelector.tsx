/**
 * セグメント選択UI
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

interface SegmentOption {
  value: string
  label: string
  description: string
  icon: React.ReactNode
}

interface SegmentSelectorProps {
  selectedSegment: string
  onSegmentChange: (segment: string) => void
}

const SEGMENTS: SegmentOption[] = [
  {
    value: 'all',
    label: '全員',
    description: 'すべてのユーザーに配信',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    value: 'friends',
    label: '友だち追加済み',
    description: 'LINE公式アカウントを友だち追加しているユーザーのみ',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
    ),
  },
  {
    value: 'applicants',
    label: '応募者',
    description: 'オーディションに応募したことがあるユーザー',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    value: 'accepted',
    label: '合格者',
    description: 'オーディションに合格したことがあるユーザー',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

export function SegmentSelector({ selectedSegment, onSegmentChange }: SegmentSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        配信対象セグメント
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SEGMENTS.map((segment) => (
          <button
            key={segment.value}
            type="button"
            onClick={() => onSegmentChange(segment.value)}
            className={`relative flex items-start p-4 border-2 rounded-lg transition-all text-left ${
              selectedSegment === segment.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedSegment === segment.value
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {segment.icon}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-medium ${
                    selectedSegment === segment.value ? 'text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {segment.label}
                </p>
                {selectedSegment === segment.value && (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
