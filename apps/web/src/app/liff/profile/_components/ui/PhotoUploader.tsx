'use client'

/**
 * 写真アップロードコンポーネント
 * 
 * [SF] スマホファースト、シンプルなボタンクリック形式
 */

import { Upload, X, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'
import { PHOTO_CONFIG } from '../constants'

interface PhotoUploaderProps {
  index: number
  label: string
  photoUrl?: string
  onUpload: (index: number, file: File) => Promise<void>
  onDelete: (index: number) => Promise<void>
  disabled?: boolean
}

export function PhotoUploader({
  index,
  label,
  photoUrl,
  onUpload,
  onDelete,
  disabled = false
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // ファイル形式チェック
    if (!PHOTO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      setError('JPEG、PNG、WebPのいずれかを選択してください')
      return
    }

    // ファイルサイズチェック
    if (file.size > PHOTO_CONFIG.MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setError(`ファイルサイズが大きすぎます（${sizeMB}MB、上限: ${PHOTO_CONFIG.MAX_SIZE_MB}MB）`)
      return
    }

    try {
      setUploading(true)
      await onUpload(index, file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
      // inputをリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('この写真を削除しますか？')) return

    try {
      setDeleting(true)
      setError(null)
      await onDelete(index)
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const handleClick = () => {
    if (!disabled && !uploading && !deleting) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {index === 0 && <span className="text-red-500 ml-1">*</span>}
          {index === 1 && <span className="text-red-500 ml-1">*</span>}
        </label>
        {photoUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled || deleting}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                削除中...
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                削除
              </>
            )}
          </button>
        )}
      </div>

      {/* 写真プレビューまたはアップロードボタン */}
      <div
        onClick={photoUrl ? undefined : handleClick}
        className={`relative border-2 border-dashed rounded-lg overflow-hidden ${
          photoUrl
            ? 'border-gray-300'
            : 'border-gray-300 hover:border-blue-400 cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ aspectRatio: '1 / 1' }}
      >
        {photoUrl ? (
          // 既存の写真を表示
          <img
            src={photoUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          // アップロードプロンプト
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm">アップロード中...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">タップして選択</span>
                <span className="text-xs mt-1">
                  {PHOTO_CONFIG.MAX_SIZE_MB}MB以下
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 隠しinput */}
      <input
        ref={fileInputRef}
        type="file"
        accept={PHOTO_CONFIG.ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading || deleting}
      />

      {/* エラーメッセージ */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
