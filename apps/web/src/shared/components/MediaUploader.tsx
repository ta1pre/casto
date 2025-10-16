'use client'

/**
 * メディアアップロードコンポーネント
 * [SF][CA] スクエア表示 + ドラッグ&ドロップ対応（画像・動画両対応）
 */

import { Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { useState, useRef } from 'react'
import type { MediaType } from '@casto/shared/types/media'
import { MEDIA_CONFIG } from '@casto/shared/types/media'
import { validateAspectRatio } from '@casto/shared/validators/media'

interface MediaUploaderProps {
  mediaUrl?: string | null
  mediaType?: MediaType | null
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
  disabled?: boolean
}

export function MediaUploader({
  mediaUrl,
  mediaType,
  onUpload,
  onDelete,
  disabled = false
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndUpload = async (file: File) => {
    setError(null)

    // ファイル形式チェック
    const allAllowedTypes = [
      ...MEDIA_CONFIG.IMAGE.ALLOWED_TYPES,
      ...MEDIA_CONFIG.VIDEO.ALLOWED_TYPES
    ]
    if (!allAllowedTypes.includes(file.type)) {
      setError('画像（JPEG/PNG/WebP）または動画（MP4/WebM）を選択してください')
      return
    }

    // ファイルサイズチェック
    const isImage = MEDIA_CONFIG.IMAGE.ALLOWED_TYPES.includes(file.type)
    const isVideo = MEDIA_CONFIG.VIDEO.ALLOWED_TYPES.includes(file.type)
    
    if (isImage && file.size > MEDIA_CONFIG.IMAGE.MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setError(`画像サイズが大きすぎます（${sizeMB}MB、上限: ${MEDIA_CONFIG.IMAGE.MAX_SIZE_MB}MB）`)
      return
    }
    
    if (isVideo && file.size > MEDIA_CONFIG.VIDEO.MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setError(`動画サイズが大きすぎます（${sizeMB}MB、上限: ${MEDIA_CONFIG.VIDEO.MAX_SIZE_MB}MB）`)
      return
    }

    // アスペクト比チェック（1:1のみ許可）
    setUploading(true)
    const aspectRatioError = await validateAspectRatio(file)
    if (aspectRatioError) {
      setError(aspectRatioError.message)
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await validateAndUpload(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading && !deleting) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || uploading || deleting) return

    const file = e.dataTransfer.files[0]
    if (file) {
      await validateAndUpload(file)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('このメインビジュアルを削除しますか？')) return

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
          メインビジュアル
        </label>
        {mediaUrl && (
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

      {/* メディアプレビューまたはアップロードボタン */}
      <div
        onClick={mediaUrl ? undefined : handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-all ${
          mediaUrl
            ? 'border-gray-300'
            : isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}
      >
        {mediaUrl ? (
          // 既存のメディアを表示（スクエア）
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            {mediaType === 'video' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={mediaUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt="メインビジュアル"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ) : (
          // アップロードプロンプト
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm text-center">アップロード中...</span>
              </>
            ) : (
              <>
                <div className="mb-2 p-3 rounded-full bg-gray-100">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm text-center font-medium">クリックまたは</span>
                <span className="text-sm text-center font-medium">ドラッグ&ドロップ</span>
                <div className="mt-4 text-xs text-center space-y-2">
                  <div className="flex items-center justify-center gap-1 font-semibold text-purple-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>必須: 正方形（1:1）のメディアのみ</span>
                  </div>
                  <div className="text-gray-500">
                    画像: 最大{MEDIA_CONFIG.IMAGE.MAX_SIZE_MB}MB (JPG/PNG/WebP)
                  </div>
                  <div className="text-gray-500">
                    動画: 最大{MEDIA_CONFIG.VIDEO.MAX_SIZE_MB}MB (MP4/WebM)
                  </div>
                  <div className="text-purple-600 font-medium mt-2">
                    💡 推奨解像度: 1080×1080px
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 隠しinput */}
      <input
        ref={fileInputRef}
        type="file"
        accept={[
          ...MEDIA_CONFIG.IMAGE.ALLOWED_TYPES,
          ...MEDIA_CONFIG.VIDEO.ALLOWED_TYPES
        ].join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading || deleting}
      />

      {/* エラーメッセージ */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* ヒント */}
      {!error && (
        <p className="text-xs text-gray-500 mt-2">
          💡 広告素材としても使用できるよう、正方形（1:1）のメディアをご用意ください
        </p>
      )}
    </div>
  )
}
