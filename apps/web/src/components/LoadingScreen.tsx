export function LoadingScreen({ message = '読み込み中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  )
}
