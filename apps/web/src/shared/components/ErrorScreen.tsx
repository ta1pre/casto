export function ErrorScreen({ 
  message = 'エラーが発生しました',
  onRetry
}: { 
  message?: string
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">エラー</h2>
      <p className="text-gray-600 text-center mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          再試行
        </button>
      )}
    </div>
  )
}
