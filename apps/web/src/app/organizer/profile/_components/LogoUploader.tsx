'use client'

/**
 * ロゴアップロードコンポーネント
 * [SF][CA] 既存のPhotoUploaderパターンを踏襲
 */

import { Upload, X, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'

interface LogoUploaderProps {
  logoUrl?: string | null
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
  disabled?: boolean
}

const LOGO_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
}

export function LogoUploader({
  logoUrl,
  onUpload,
  onDelete,
  disabled = false
}: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // ファイル形式チェック
    if (!LOGO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      setError('JPEG、PNG、WebPのいずれかを選択してください')
      return
    }

    // ファイルサイズチェック
    if (file.size > LOGO_CONFIG.MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setError(`ファイルサイズが大きすぎます（${sizeMB}MB、上限: ${LOGO_CONFIG.MAX_SIZE_MB}MB）`)
      return
    }

    try {
      setUploading(true)
      await onUpload(file)
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
    if (!window.confirm('このロゴを削除しますか？')) return

    try {
      setDeleting(true)
      setError(null)
      await onDelete()
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
        <label className="text-sm font-medium text-gray-700">
          ロゴ画像
        </label>
        {logoUrl && (
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

      {/* ロゴプレビューまたはアップロードボタン */}
      <div
        onClick={logoUrl ? undefined : handleClick}
        className={`relative border-2 border-dashed rounded-lg overflow-hidden ${
          logoUrl
            ? 'border-gray-300'
            : 'border-gray-300 hover:border-purple-400 cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ aspectRatio: '1 / 1', maxWidth: '200px' }}
      >
        {logoUrl ? (
          // 既存のロゴを表示
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="ロゴ"
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
                <span className="text-sm">クリックして選択</span>
                <span className="text-xs mt-1">
                  {LOGO_CONFIG.MAX_SIZE_MB}MB以下
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
        accept={LOGO_CONFIG.ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading || deleting}
      />

      {/* エラーメッセージ */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* ヒント */}
      <p className="text-xs text-gray-500 mt-1">
        正方形の画像を推奨します
      </p>
    </div>
  )
}
