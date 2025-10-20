/**
 * ポイント購入ページ
 * 
 * 設計原則: [SF][UX]
 * - プラン一覧表示
 * - 割引率の強調
 * - Stripe Checkout連携（Phase 3で実装予定）
 */

'use client'

import { usePointsPlans, usePointsAccount } from '@/shared/hooks/usePoints'
import Link from 'next/link'
import { useState } from 'react'

export default function PointsPurchasePage() {
  const { plans, loading, error } = usePointsPlans()
  const { balance } = usePointsAccount()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const handlePurchase = async (_planId: string) => {
    // Phase 3: Stripe Checkout連携を実装予定
    // TODO: planIdを使用してStripe Checkout Sessionを作成
    alert('ポイント購入機能は準備中です。\n\nStripe連携（Phase 3）で実装予定です。')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link
          href="/organizer/points"
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 mb-4"
        >
          <span>←</span>
          <span>ポイント管理に戻る</span>
        </Link>
        <h1 className="text-3xl font-bold">ポイント購入</h1>
        <p className="text-gray-600 mt-2">
          ご希望のプランを選択してください
        </p>
      </div>

      {/* 現在の残高 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">現在の残高</p>
            <p className="text-2xl font-bold text-blue-600">{balance.toLocaleString()} pt</p>
          </div>
          <div className="text-sm text-gray-600">
            <p>💡 応募者の詳細情報を閲覧する際にポイントを消費します</p>
          </div>
        </div>
      </div>

      {/* プラン一覧 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium mb-2">エラーが発生しました</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">現在、購入可能なプランがありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isPopular = index === 1 // 真ん中のプランを人気プランに
            const isSelected = selectedPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* 人気バッジ */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    🔥 人気
                  </div>
                )}

                {/* 割引率バッジ */}
                {plan.discount_rate && plan.discount_rate > 0 && (
                  <div className="absolute top-4 left-0 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-r-lg">
                    {plan.discount_rate}% OFF
                  </div>
                )}

                <div className="p-6">
                  {/* プラン名 */}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

                  {/* ポイント数 */}
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-blue-600">
                      {plan.points.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">ポイント</p>
                  </div>

                  {/* 価格 */}
                  <div className="mb-6">
                    <p className="text-3xl font-bold">
                      ¥{plan.price_jpy.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      1ptあたり ¥{(plan.price_jpy / plan.points).toFixed(2)}
                    </p>
                  </div>

                  {/* 特典（ボーナスポイント等） */}
                  {plan.discount_rate && plan.discount_rate > 0 && (
                    <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        🎁 通常より {plan.discount_rate}% お得！
                      </p>
                    </div>
                  )}

                  {/* 購入ボタン */}
                  <button
                    onClick={() => {
                      setSelectedPlanId(plan.id)
                      handlePurchase(plan.id)
                    }}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isPopular
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    このプランを購入
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 注意事項 */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">ご利用ガイド</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>ポイントは応募者の詳細プロフィールを閲覧する際に消費されます</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>閲覧単価はオーディションの種類やジャンルによって異なります</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>一度閲覧した応募者は、再度ポイントを消費せずに閲覧できます</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>購入後のキャンセル・返金は原則として受け付けておりません</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
