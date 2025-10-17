'use client'

/**
 * 動画サムネイル表示コンポーネント
 * [SF][RP] 動画の最初のフレームを自動キャプチャしてサムネイル表示
 */

import { useEffect, useRef, useState } from 'react'

interface VideoThumbnailProps {
  src: string
  alt?: string
  className?: string
  /** 一覧表示など、インタラクションが不要な場合はtrue */
  posterOnly?: boolean
}

export function VideoThumbnail({ 
  src, 
  alt = '', 
  className = '',
  posterOnly = false 
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [poster, setPoster] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePoster = () => {
    const video = videoRef.current
    if (!video || isGenerating) return
    
    // 動画の準備ができるまで待つ
    if (video.readyState < 2) return // HAVE_CURRENT_DATA以上が必要
    
    setIsGenerating(true)
    
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const context = canvas.getContext('2d')
      if (!context) return
      
      // 最初のフレームを描画
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setPoster(dataUrl)
    } catch (err) {
      console.error('Failed to create video poster:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // URLが変わったらサムネイルをリセット
  useEffect(() => {
    setPoster(null)
    setIsGenerating(false)
  }, [src])

  if (posterOnly && poster) {
    // サムネイル画像のみ表示（一覧用）
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt={alt}
          className={className}
        />
        {/* 非表示でvideoを保持してサムネイル生成 */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={src}
          className="hidden"
          preload="metadata"
          muted
          playsInline
          onLoadedData={generatePoster}
        />
      </>
    )
  }

  // 動画プレーヤー表示（詳細ページ用）
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={videoRef}
      src={src}
      className={className}
      preload="auto"
      poster={poster ?? undefined}
      onLoadedData={generatePoster}
      onSeeked={generatePoster}
      controls={!posterOnly}
      muted={posterOnly}
      playsInline
    />
  )
}
