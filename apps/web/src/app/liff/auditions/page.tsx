'use client'

/**
 * LIFFオーディション一覧ページです
 * [SF][CA] 公開中オーディションの表示（メインビジュアル対応）
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Calendar, CheckCircle } from 'lucide-react'
import { apiFetch } from '@/shared/lib/api'
import { formatDateJa } from '@/shared/lib/date'
import type { Audition, AuditionApplication } from '@casto/shared'
import { VideoThumbnail } from '@/shared/components/VideoThumbnail'

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<Audition[]>([])
  const [appliedAuditionIds, setAppliedAuditionIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  /**
   * オーディション一覧と応募済み情報を取得 [SF][DRY]
   */
  async function fetchData() {
    try {
      setLoading(true)
      setError(null)
      
      // オーディション一覧と応募一覧を並行取得
      const [auditionsData, applicationsData] = await Promise.all([
        apiFetch<{ auditions: Audition[] }>('/api/v1/talent/auditions'),
        apiFetch<{ applications: AuditionApplication[] }>('/api/v1/talent/audition-applications')
          .catch(() => ({ applications: [] })) // 認証エラー時は空配列
      ])
      
      setAuditions(auditionsData.auditions || [])
      
      // 応募済みオーディションIDのSetを作成
      const appliedIds = new Set(
        applicationsData.applications.map(app => app.auditionId)
      )
      setAppliedAuditionIds(appliedIds)
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
                        <VideoThumbnail
                          src={audition.mainVisualUrl}
                          alt={audition.title}
                          className="w-full h-full object-cover"
                          posterOnly
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
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg flex-1">
                        {audition.title}
                      </h3>
                      
                      {/* 応募済みバッジ */}
                      {appliedAuditionIds.has(audition.id) && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                          <CheckCircle className="h-3 w-3" />
                          応募済み
                        </span>
                      )}
                    </div>
                    
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
                        締切: {formatDateJa(audition.applicationEndDate)}
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
