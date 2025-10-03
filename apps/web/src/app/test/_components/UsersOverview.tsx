import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { UsersStats } from "@casto/shared"

interface UsersOverviewProps {
  stats: UsersStats | null
  lastFetchedAt: string | null
  loading: boolean
  onRefresh: () => void
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '未取得'
  }

  try {
    return new Date(value).toLocaleString('ja-JP')
  } catch (error) {
    console.warn('Failed to format datetime:', error)
    return value
  }
}

const renderStatsList = (items?: Record<string, number>) => {
  const entries = items ? Object.entries(items).sort((a, b) => b[1] - a[1]) : []

  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">データなし</p>
  }

  return (
    <ul className="space-y-1 text-xs">
      {entries.map(([key, value]) => (
        <li key={key} className="flex items-center justify-between font-mono">
          <span>{key}</span>
          <span className="text-muted-foreground">{value}</span>
        </li>
      ))}
    </ul>
  )
}

export function UsersOverview({ stats, lastFetchedAt, loading, onRefresh }: UsersOverviewProps) {
  const total = stats?.total ?? 0
  const active = stats?.active ?? 0
  const inactive = stats?.inactive ?? 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Badge variant="outline">users</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : total}</div>
            <p className="text-xs text-muted-foreground">最新取得: {formatDateTime(lastFetchedAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ / 非アクティブ</CardTitle>
            <Badge variant="outline">status</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '…' : `${active} / ${inactive}`}</div>
            <p className="text-xs text-muted-foreground">`is_active` フラグを元に集計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">再取得</CardTitle>
            <Badge variant="outline">refresh</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={onRefresh} disabled={loading} className="w-full" variant="outline">
              {loading ? '取得中…' : '最新状態を取得'}
            </Button>
            <p className="text-xs text-muted-foreground">Supabase `users` テーブルを直接読み込みます。</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">プロバイダ別内訳</CardTitle>
            <CardDescription>`auth_provider` の値を集計しています。</CardDescription>
          </CardHeader>
          <CardContent>{renderStatsList(stats?.byProvider)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">ロール別内訳</CardTitle>
            <CardDescription>`role` カラムの値を集計しています。</CardDescription>
          </CardHeader>
          <CardContent>{renderStatsList(stats?.byRole)}</CardContent>
        </Card>
      </div>
    </div>
  )
}
