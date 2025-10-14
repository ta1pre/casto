'use client'

/**
 * ロゴ位置調整エディター
 * [SF][CA] ドラッグで画像位置を調整
 */

import { useState, useRef, useEffect } from 'react'
import { X, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface LogoPositionEditorProps {
  imageUrl: string
  initialX?: number
  initialY?: number
  initialScale?: number
  onSave: (x: number, y: number, scale: number) => void
  onCancel: () => void
}

export function LogoPositionEditor({
  imageUrl,
  initialX = 0,
  initialY = 0,
  initialScale = 1,
  onSave,
  onCancel,
}: LogoPositionEditorProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [scale, setScale] = useState(initialScale)
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
    if (!isDragging) return

    // 新しい位置を計算
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    setPosition({ x: newX, y: newY })
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
    if (!isDragging) return

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    setPosition({ x: newX, y: newY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleSave = () => {
    onSave(Math.round(position.x), Math.round(position.y), scale)
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
          画像をドラッグして位置を調整、マウスホイールまたはボタンでズーム
        </p>

        {/* プレビューエリア */}
        <div className="relative w-full mb-4">
          <div
            ref={containerRef}
            className="relative w-64 h-64 mx-auto bg-gray-300 overflow-hidden cursor-move"
            style={{ borderRadius: '50%' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="ロゴ"
              className="absolute top-1/2 left-1/2 select-none"
              style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                cursor: isDragging ? 'grabbing' : 'grab',
                maxWidth: 'none',
                width: '100%',
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              draggable={false}
            />
          </div>
        </div>

        {/* ズームコントロール */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
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
