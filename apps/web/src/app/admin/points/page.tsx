/**
 * Admin向けポイント管理ページ
 * 
 * 設計原則: [SF][CA][UX]
 */

'use client'

import { useState } from 'react'
import { useAdminPointsAccounts, useGrantPoints } from '@/shared/hooks/useAdminPoints'
import { useAuditionTypes, useUpdateAuditionType } from '@/shared/hooks/useAuditionTypes'
import { formatDateTime } from '@/shared/lib/date'
import Link from 'next/link'
import type { AuditionType } from '@casto/shared'

export default function AdminPointsPage() {
  const [page, setPage] = useState(0)
  const limit = 20
  const { accounts, total, loading, error, refetch } = useAdminPointsAccounts(limit, page * limit)
  const { grantPoints, loading: granting } = useGrantPoints()
  const { types, loading: typesLoading, refetch: refetchTypes } = useAuditionTypes()

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [editingType, setEditingType] = useState<AuditionType | null>(null)

  const totalPages = Math.ceil(total / limit)

  const handleGrantClick = (userId: string) => {
    setSelectedUserId(userId)
    setShowGrantModal(true)
  }

  const handleGrant = async (amount: number, reason: string) => {
    if (!selectedUserId) return

    const success = await grantPoints({
      userId: selectedUserId,
      amount,
      reason,
      transactionType: amount > 0 ? 'admin_grant' : 'admin_deduct',
    })

    if (success) {
      setShowGrantModal(false)
      setSelectedUserId(null)
      refetch()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">ポイント管理</h1>
          <p className="text-gray-600 mt-1">全 {total.toLocaleString()} アカウント</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/admin/points/plans"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            プラン管理
          </Link>
          <Link
            href="/admin/points/settings"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            設定
          </Link>
        </div>
      </div>

      {/* オーディション種別設定 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">オーディション種別設定</h2>
          <p className="text-sm text-gray-600 mt-1">各種別の基本ポイントを設定します</p>
        </div>
        {typesLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {types.map((type) => (
              <div key={type.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium">{type.displayName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      type.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {type.isActive ? '有効' : '無効'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    種別コード: <span className="font-mono">{type.typeCode}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    無料閲覧枠: {type.freeViewCount.toLocaleString()} 人
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {type.basePoints.toLocaleString()} pt
                    </p>
                    <p className="text-xs text-gray-500">基本ポイント</p>
                  </div>
                  <button
                    onClick={() => setEditingType(type)}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
                  >
                    編集
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アカウント一覧 */}
      <div className="bg-white rounded-lg shadow">
        {loading && page === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">エラー: {error}</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            アカウントがありません
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      タイプ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      残高
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      累計購入
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      累計消費
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      作成日時
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {account.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.account_type === 'organizer'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {account.account_type === 'organizer' ? '主催者' : 'キャスト'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">
                        {account.balance.toLocaleString()} pt
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {account.total_purchased.toLocaleString()} pt
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {account.total_consumed.toLocaleString()} pt
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(account.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleGrantClick(account.user_id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          付与/減算
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  前へ
                </button>
                <span className="text-sm text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ポイント付与/減算モーダル */}
      {showGrantModal && (
        <GrantModal
          onClose={() => {
            setShowGrantModal(false)
            setSelectedUserId(null)
          }}
          onGrant={handleGrant}
          loading={granting}
        />
      )}

      {/* 種別編集モーダル */}
      {editingType && (
        <AuditionTypeEditModal
          type={editingType}
          onClose={() => setEditingType(null)}
          onSuccess={() => {
            setEditingType(null)
            refetchTypes()
          }}
        />
      )}
    </div>
  )
}

interface GrantModalProps {
  onClose: () => void
  onGrant: (amount: number, reason: string) => void
  loading: boolean
}

function GrantModal({ onClose, onGrant, loading }: GrantModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseInt(amount, 10)
    if (isNaN(numAmount) || numAmount === 0) {
      alert('正しい数値を入力してください')
      return
    }
    if (!reason.trim()) {
      alert('理由を入力してください')
      return
    }
    onGrant(numAmount, reason)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">ポイント付与/減算</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              ポイント数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例: 1000 または -500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-1">
              正の数で付与、負の数で減算
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: キャンペーンボーナス"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={loading}
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '処理中...' : '実行'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AuditionTypeEditModalProps {
  type: AuditionType
  onClose: () => void
  onSuccess: () => void
}

function AuditionTypeEditModal({ type, onClose, onSuccess }: AuditionTypeEditModalProps) {
  const { updateType, loading } = useUpdateAuditionType()
  const [displayName, setDisplayName] = useState(type.displayName)
  const [description, setDescription] = useState(type.description || '')
  const [basePoints, setBasePoints] = useState(type.basePoints.toString())
  const [freeViewCount, setFreeViewCount] = useState(type.freeViewCount.toString())
  const [isActive, setIsActive] = useState(type.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const points = parseInt(basePoints, 10)
    if (isNaN(points) || points < 0) {
      alert('正しいポイント数を入力してください（0以上）')
      return
    }

    const freeQuota = parseInt(freeViewCount, 10)
    if (isNaN(freeQuota) || freeQuota < 0) {
      alert('無料閲覧枠には0以上の整数を入力してください')
      return
    }

    const success = await updateType(type.id, {
      displayName,
      description: description || undefined,
      basePoints: points,
      freeViewCount: freeQuota,
      isActive,
    })

    if (success) {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">種別設定の編集</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              種別コード
            </label>
            <input
              type="text"
              value={type.typeCode}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">変更できません</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              基本ポイント <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={basePoints}
              onChange={(e) => setBasePoints(e.target.value)}
              required
              min="0"
              step="100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              この種別のオーディション作成時に消費されるポイント
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              無料閲覧枠 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={freeViewCount}
              onChange={(e) => setFreeViewCount(e.target.value)}
              required
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              最初の N 人まで無料で応募者プロフィールを閲覧できます（0 = 無料枠なし）
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              有効化
            </label>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
