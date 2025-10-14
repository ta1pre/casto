'use client'

/**
 * ロゴアップロードコンポーネント
 * [SF][CA] 円形表示 + ドラッグ&ドロップ対応
 */

import { Upload, X, Loader2, Move } from 'lucide-react'
import { useState, useRef } from 'react'
import { LogoPositionEditor } from './LogoPositionEditor'

interface LogoUploaderProps {
  logoUrl?: string | null
  logoPositionX?: number
  logoPositionY?: number
  logoScale?: number
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
  onPositionChange?: (x: number, y: number, scale: number) => void
  disabled?: boolean
}

const LOGO_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
}

export function LogoUploader({
  logoUrl,
  logoPositionX = 0,
  logoPositionY = 0,
  logoScale = 1,
  onUpload,
  onDelete,
  onPositionChange,
  disabled = false
}: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPositionEditor, setShowPositionEditor] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndUpload = async (file: File) => {
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
      // アップロード成功後、位置調整モードを表示
      setShowPositionEditor(true)
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

  const handlePositionSave = (x: number, y: number, scale: number) => {
    if (onPositionChange) {
      onPositionChange(x, y, scale)
    }
    setShowPositionEditor(false)
  }

  const handlePositionCancel = () => {
    setShowPositionEditor(false)
  }

  const handleEditPosition = () => {
    setShowPositionEditor(true)
  }

  return (
    <div className="space-y-2">
      {/* 位置調整エディター */}
      {showPositionEditor && logoUrl && (
        <LogoPositionEditor
          imageUrl={logoUrl}
          initialX={logoPositionX}
          initialY={logoPositionY}
          initialScale={logoScale}
          onSave={handlePositionSave}
          onCancel={handlePositionCancel}
        />
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          ロゴ画像
        </label>
        <div className="flex gap-2">
          {logoUrl && onPositionChange && (
            <button
              type="button"
              onClick={handleEditPosition}
              disabled={disabled}
              className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Move className="w-3 h-3" />
              位置調整
            </button>
          )}
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
      </div>

      {/* ロゴプレビューまたはアップロードボタン */}
      <div
        onClick={logoUrl ? undefined : handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-full overflow-hidden transition-all ${
          logoUrl
            ? 'border-gray-300'
            : isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 cursor-pointer'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ width: '200px', height: '200px' }}
      >
        {logoUrl ? (
          // 既存のロゴを表示（円形）
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="ロゴ"
            className="absolute top-1/2 left-1/2 select-none"
            style={{
              transform: `translate(calc(-50% + ${logoPositionX}px), calc(-50% + ${logoPositionY}px)) scale(${logoScale})`,
              maxWidth: 'none',
              width: '100%',
            }}
          />
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
                <span className="text-xs mt-2 text-center">
                  {LOGO_CONFIG.MAX_SIZE_MB}MB以下
                </span>
                <div className="mt-2 text-xs text-center text-gray-500">
                  円形で表示されます
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
        💡 正方形の画像を推奨します（円形表示）
      </p>
    </div>
  )
}
