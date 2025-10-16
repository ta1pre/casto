'use client'

/**
 * LIFFオーディション一覧ページです
 * [SF][CA] 公開中オーディションの表示（メインビジュアル対応）
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Calendar } from 'lucide-react'
import { apiFetch } from '@/shared/lib/api'
import type { Audition } from '@casto/shared'

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<Audition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAuditions()
  }, [])

  async function fetchAuditions() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ auditions: Audition[] }>('/api/v1/talent/auditions')
      setAuditions(data.auditions || [])
    } catch (err) {
      console.error('Failed to fetch auditions:', err)
      setError(err instanceof Error ? err.message : '読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const filteredAuditions = searchQuery
    ? auditions.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : auditions

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">オーディションを探す</h1>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <input
          type="text"
          placeholder="キーワードで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {/* ローディング */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* オーディションリスト */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredAuditions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? '検索結果がありません' : '現在公開中のオーディションはありません'}
            </div>
          ) : (
            filteredAuditions.map((audition) => (
              <Link
                key={audition.id}
                href={`/liff/auditions/${audition.id}`}
                className="block"
              >
                <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* メインビジュアル */}
                  {audition.mainVisualUrl && (
                    <div className="w-full aspect-square bg-gray-100">
                      {audition.mainVisualType === 'video' ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={audition.mainVisualUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={audition.mainVisualUrl}
                          alt={audition.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* コンテンツ */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 text-lg">
                      {audition.title}
                    </h3>
                    
                    {audition.shortDescription && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {audition.shortDescription}
                      </p>
                    )}

                    {/* ジャンル */}
                    {audition.genres && audition.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {audition.genres.map((genre) => (
                          <span
                            key={genre.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {genre.displayName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 締切日 */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        締切: {new Date(audition.applicationEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
