'use client'

/**
 * ロゴ位置調整エディター
 * [SF][CA] ドラッグで画像位置を調整
 */

import { useState, useRef, useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'

interface LogoPositionEditorProps {
  imageUrl: string
  initialX?: number
  initialY?: number
  onSave: (x: number, y: number) => void
  onCancel: () => void
}

export function LogoPositionEditor({
  imageUrl,
  initialX = 0,
  initialY = 0,
  onSave,
  onCancel,
}: LogoPositionEditorProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()

    // 新しい位置を計算
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // 画像がコンテナからはみ出さないように制限
    const maxX = 0
    const minX = containerRect.width - imageRect.width
    const maxY = 0
    const minY = containerRect.height - imageRect.height

    const clampedX = Math.max(minX, Math.min(maxX, newX))
    const clampedY = Math.max(minY, Math.min(maxY, newY))

    setPosition({ x: clampedX, y: clampedY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // タッチイベント対応
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return

    const touch = e.touches[0]
    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()

    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    const maxX = 0
    const minX = containerRect.width - imageRect.width
    const maxY = 0
    const minY = containerRect.height - imageRect.height

    const clampedX = Math.max(minX, Math.min(maxX, newX))
    const clampedY = Math.max(minY, Math.min(maxY, newY))

    setPosition({ x: clampedX, y: clampedY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setPosition({ x: 0, y: 0 })
  }

  const handleSave = () => {
    if (!containerRef.current || !imageRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()

    // パーセンテージに変換（-100 ~ 100）
    const percentX = (position.x / (containerRect.width - imageRect.width)) * 100
    const percentY = (position.y / (containerRect.height - imageRect.height)) * 100

    onSave(Math.round(percentX) || 0, Math.round(percentY) || 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">ロゴ位置を調整</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 説明 */}
        <p className="text-sm text-gray-600 mb-4">
          画像をドラッグして、円形エリアに表示したい部分を調整してください
        </p>

        {/* プレビューエリア */}
        <div
          ref={containerRef}
          className="relative w-full h-64 bg-gray-100 rounded-full overflow-hidden mb-4 cursor-move"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="ロゴ"
            className="absolute min-w-full min-h-full object-cover select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            draggable={false}
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            リセット
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
