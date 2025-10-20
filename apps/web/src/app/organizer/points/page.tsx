/**
 * 主催者向けポイント管理ページ
 * 
 * 設計原則: [SF][CA][UX]
 * - ポイント残高表示
 * - 取引履歴表示
 * - プラン選択画面へのリンク
 */

'use client'

import { useState } from 'react'
import { usePointsAccount, usePointsTransactions } from '@/shared/hooks/usePoints'
import { formatDateTime } from '@/shared/lib/date'
import Link from 'next/link'

export default function OrganizerPointsPage() {
  const { account, balance, loading: accountLoading, error: accountError, refetch: refetchAccount } = usePointsAccount()
  const [page, setPage] = useState(0)
  const limit = 20
  const { transactions, total, loading: txLoading, error: txError } = usePointsTransactions(limit, page * limit)

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ポイント管理</h1>
        <Link
          href="/organizer/points/purchase"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ポイント購入
        </Link>
      </div>

      {/* ポイント残高カード */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-2">現在の残高</p>
            {accountLoading ? (
              <div className="h-12 w-48 bg-blue-400/50 rounded animate-pulse" />
            ) : accountError ? (
              <p className="text-red-200 text-sm">エラー: {accountError}</p>
            ) : (
              <>
                <p className="text-5xl font-bold mb-1">{balance.toLocaleString()}</p>
                <p className="text-blue-100 text-sm">ポイント</p>
              </>
            )}
          </div>
          <div className="text-right space-y-2">
            {account && (
              <>
                <div>
                  <p className="text-blue-100 text-xs">累計購入</p>
                  <p className="text-xl font-semibold">{account.total_purchased.toLocaleString()} pt</p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs">累計消費</p>
                  <p className="text-xl font-semibold">{account.total_consumed.toLocaleString()} pt</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 取引履歴 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">取引履歴</h2>
          <p className="text-sm text-gray-600 mt-1">
            全 {total.toLocaleString()} 件
          </p>
        </div>

        {txLoading && page === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : txError ? (
          <div className="p-6 text-center text-red-600">
            エラー: {txError}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">まだ取引履歴がありません</p>
            <p className="text-sm">ポイントを購入すると、ここに履歴が表示されます</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <span className="text-sm text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface TransactionRowProps {
  transaction: any
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const isPositive = transaction.amount > 0
  const typeLabel = getTransactionTypeLabel(transaction.transaction_type)
  const icon = getTransactionIcon(transaction.transaction_type)

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center ${
            isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium">{typeLabel}</p>
              {transaction.notes && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {transaction.notes}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {formatDateTime(transaction.created_at)}
            </p>
            {transaction.expires_at && (
              <p className="text-xs text-orange-600 mt-1">
                有効期限: {formatDateTime(transaction.expires_at)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{transaction.amount.toLocaleString()} pt
          </p>
          <p className="text-xs text-gray-500 mt-1">
            残高: {transaction.balance_after.toLocaleString()} pt
          </p>
        </div>
      </div>
    </div>
  )
}

function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    purchase: 'ポイント購入',
    consumption: '閲覧ポイント消費',
    admin_grant: 'ポイント付与',
    admin_deduct: 'ポイント減算',
    monthly_bonus: '月次ボーナス',
    welcome_bonus: '新規登録ボーナス',
  }
  return labels[type] || type
}

function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    purchase: '💳',
    consumption: '👁️',
    admin_grant: '🎁',
    admin_deduct: '📉',
    monthly_bonus: '🎉',
    welcome_bonus: '✨',
  }
  return icons[type] || '📝'
}
