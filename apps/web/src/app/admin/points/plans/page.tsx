/**
 * Admin - ポイントプラン管理ページ
 * 
 * 設計原則: [SF][CA][UX]
 */

'use client'

import { useState } from 'react'
import {
  useAdminPointsPlans,
  useCreatePointsPlan,
  useUpdatePointsPlan,
  useDeletePointsPlan,
} from '@/shared/hooks/useAdminPoints'
import Link from 'next/link'
import type { PointsPlan } from '@casto/shared'

export default function AdminPointsPlansPage() {
  const { plans, loading, error, refetch } = useAdminPointsPlans()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PointsPlan | null>(null)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/points"
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 mb-2"
          >
            <span>←</span>
            <span>ポイント管理に戻る</span>
          </Link>
          <h1 className="text-3xl font-bold">プラン管理</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 新規プラン作成
        </button>
      </div>

      {/* プラン一覧 */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">エラー: {error}</div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            プランがまだありません
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                onEdit={() => setEditingPlan(plan)}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* 新規作成モーダル */}
      {showCreateModal && (
        <PlanFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}

      {/* 編集モーダル */}
      {editingPlan && (
        <PlanFormModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={() => {
            setEditingPlan(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}

interface PlanRowProps {
  plan: PointsPlan
  onEdit: () => void
  onRefetch: () => void
}

function PlanRow({ plan, onEdit, onRefetch }: PlanRowProps) {
  const { updatePlan, loading: updating } = useUpdatePointsPlan()
  const { deletePlan, loading: deleting } = useDeletePointsPlan()

  const bonusPoints = plan.bonus_points ?? 0
  const totalPoints = plan.points + bonusPoints
  const pricePerPoint = totalPoints > 0 ? plan.price_jpy / totalPoints : 0

  const handleToggleActive = async () => {
    const success = await updatePlan(plan.id, { is_active: !plan.is_active })
    if (success) onRefetch()
  }

  const handleDelete = async () => {
    if (!confirm('このプランを削除しますか？')) return
    const success = await deletePlan(plan.id)
    if (success) onRefetch()
  }

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              plan.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {plan.is_active ? '有効' : '無効'}
            </span>
            {plan.bonus_points && plan.bonus_points > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                +{plan.bonus_points} pt おまけ
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              {plan.points.toLocaleString()} pt
              {bonusPoints > 0 && (
                <span className="text-green-600 font-semibold ml-1">
                  (+{bonusPoints.toLocaleString()} pt)
                </span>
              )}
            </span>
            {bonusPoints > 0 && (
              <span className="text-green-700 font-semibold">
                = 合計 {totalPoints.toLocaleString()} pt
              </span>
            )}
            <span>¥{plan.price_jpy.toLocaleString()}</span>
            <span className="text-blue-600">
              1ptあたり ¥{pricePerPoint.toFixed(2)}
            </span>
            <span>表示順: {plan.display_order}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleActive}
            disabled={updating || deleting}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {plan.is_active ? '無効化' : '有効化'}
          </button>
          <button
            onClick={onEdit}
            disabled={updating || deleting}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            disabled={updating || deleting}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}

interface PlanFormModalProps {
  plan?: PointsPlan
  onClose: () => void
  onSuccess: () => void
}

function PlanFormModal({ plan, onClose, onSuccess }: PlanFormModalProps) {
  const { createPlan, loading: creating } = useCreatePointsPlan()
  const { updatePlan, loading: updating } = useUpdatePointsPlan()
  
  const [name, setName] = useState(plan?.name || '')
  const [points, setPoints] = useState(plan?.points.toString() || '')
  const [priceJpy, setPriceJpy] = useState(plan?.price_jpy.toString() || '')
  const [bonusPoints, setBonusPoints] = useState(plan?.bonus_points?.toString() || '0')
  const [displayOrder, setDisplayOrder] = useState(plan?.display_order?.toString() || '0')

  const loading = creating || updating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      name,
      points: parseInt(points, 10),
      price_jpy: parseInt(priceJpy, 10),
      bonus_points: bonusPoints ? parseInt(bonusPoints, 10) : 0,
      display_order: parseInt(displayOrder, 10),
    }

    if (plan) {
      const success = await updatePlan(plan.id, data)
      if (success) onSuccess()
    } else {
      const result = await createPlan(data)
      if (result) onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          {plan ? 'プラン編集' : '新規プラン作成'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">プラン名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ポイント数</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">価格（円）</label>
              <input
                type="number"
                value={priceJpy}
                onChange={(e) => setPriceJpy(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">おまけポイント（任意）</label>
              <input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
                min="0"
                className="w-full border rounded px-3 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">表示順</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '処理中...' : plan ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
