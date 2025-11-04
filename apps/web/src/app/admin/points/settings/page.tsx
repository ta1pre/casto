/**
 * Admin - ポイント設定ページ
 * 
 * 設計原則: [SF][CA][UX]
 * - ジャンル別単価設定
 * - デフォルト単価設定
 */

'use client'

import { useState, useEffect } from 'react'
import { useGenreCosts, useUpdateGenreCost, type GenreCost } from '@/shared/hooks/useAdminPoints'
import { apiFetch } from '@/shared/lib/api'
import Link from 'next/link'

export default function AdminPointsSettingsPage() {
  const { genres, loading: genresLoading, error: genresError, refetch: refetchGenres } = useGenreCosts()
  const { updateGenreCost, loading: updating } = useUpdateGenreCost()

  const [defaultCost, setDefaultCost] = useState<string>('')
  const [defaultCostLoading, setDefaultCostLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // デフォルト単価取得
  useEffect(() => {
    const fetchDefaultCost = async () => {
      try {
        const data = await apiFetch<{ settings: { default_viewing_point_cost?: number } }>('/api/v1/admin/points/settings')
        setDefaultCost(data.settings?.default_viewing_point_cost?.toString() || '100')
      } catch (err) {
        console.error('Failed to fetch default cost:', err)
        setDefaultCost('100')
      } finally {
        setDefaultCostLoading(false)
      }
    }
    fetchDefaultCost()
  }, [])

  const handleUpdateGenreCost = async (genreId: string, cost: number | null) => {
    const success = await updateGenreCost(genreId, cost)
    if (success) {
      refetchGenres()
    }
  }

  const handleSaveDefaultCost = async () => {
    try {
      setSaving(true)
      await apiFetch('/api/v1/admin/points/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_viewing_point_cost: parseInt(defaultCost, 10),
        }),
      })
      
      alert('デフォルト単価を更新しました')
    } catch (err) {
      console.error('Failed to update default cost:', err)
      alert('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/points"
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 mb-2"
        >
          <span>←</span>
          <span>ポイント管理に戻る</span>
        </Link>
        <h1 className="text-3xl font-bold">ポイント設定</h1>
      </div>

      {/* デフォルト閲覧単価 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">デフォルト閲覧単価</h2>
        <p className="text-sm text-gray-600 mb-4">
          オーディションやジャンルに個別設定がない場合に適用される閲覧単価です
        </p>
        {defaultCostLoading ? (
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        ) : (
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={defaultCost}
                  onChange={(e) => setDefaultCost(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                />
                <span className="text-gray-600">pt / 人</span>
              </div>
            </div>
            <button
              onClick={handleSaveDefaultCost}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>

      {/* ジャンル別単価 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">ジャンル別閲覧単価</h2>
          <p className="text-sm text-gray-600 mt-1">
            各ジャンルごとに異なる閲覧単価を設定できます。設定しない場合はデフォルト単価が適用されます
          </p>
        </div>

        {genresLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : genresError ? (
          <div className="p-6 text-center text-red-600">エラー: {genresError}</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {genres.map((genre) => (
              <GenreRow
                key={genre.id}
                genre={genre}
                onUpdate={handleUpdateGenreCost}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>

      {/* 説明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 閲覧単価の適用優先順位</h3>
        <ol className="space-y-1 text-sm text-blue-800">
          <li>1. オーディションごとの個別設定（最優先）</li>
          <li>2. 種別設定（オーディション / 求人 / エキストラ募集）</li>
          <li>3. ジャンル別設定</li>
          <li>4. デフォルト設定（フォールバック）</li>
        </ol>
        <p className="text-xs text-blue-700 mt-2">
          種別設定は「ポイント管理」画面の「種別設定の編集」から変更できます。
        </p>
      </div>
    </div>
  )
}

interface GenreRowProps {
  genre: GenreCost
  onUpdate: (genreId: string, cost: number | null) => void
  updating: boolean
}

function GenreRow({ genre, onUpdate, updating }: GenreRowProps) {
  const [cost, setCost] = useState(genre.viewing_point_cost?.toString() || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    const numCost = cost.trim() === '' ? null : parseInt(cost, 10)
    onUpdate(genre.id, numCost)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setCost(genre.viewing_point_cost?.toString() || '')
    setIsEditing(false)
  }

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium">{genre.display_name}</h3>
          <p className="text-sm text-gray-600">ID: {genre.slug}</p>
        </div>

        {isEditing ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="デフォルト"
                className="w-32 border border-gray-300 rounded px-3 py-1 text-sm"
                min="0"
              />
              <span className="text-sm text-gray-600">pt</span>
            </div>
            <button
              onClick={handleSave}
              disabled={updating}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              {genre.viewing_point_cost !== null ? (
                <p className="font-semibold text-blue-600">
                  {genre.viewing_point_cost.toLocaleString()} pt
                </p>
              ) : (
                <p className="text-gray-500 text-sm">デフォルト</p>
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
            >
              編集
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
