import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import type { UserResponse } from '@casto/shared'

type User = UserResponse

interface UsersTableProps {
  users: User[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export function UsersTable({ users, loading, error, onRefresh }: UsersTableProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>📊 Users テーブル一覧</CardTitle>
            <CardDescription>Workers API経由で取得したユーザーデータ</CardDescription>
          </div>
          <Button 
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                読込中...
              </>
            ) : (
              '🔄 再読込'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">データを取得中...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>
              {error}
              <br />
              <span className="text-xs mt-2 block">
                環境変数 NEXT_PUBLIC_API_BASE_URL を確認してください。
              </span>
            </AlertDescription>
          </Alert>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>📭 usersテーブルにデータがありません</p>
            <p className="text-sm mt-2">下記のフォームから新規ユーザーを作成できます</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">ID</th>
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">LINE ID</th>
                  <th className="text-left p-2 font-medium">表示名</th>
                  <th className="text-left p-2 font-medium">状態</th>
                  <th className="text-left p-2 font-medium">作成日時</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                    <td className="p-2">{user.email || '-'}</td>
                    <td className="p-2">{user.lineUserId || '-'}</td>
                    <td className="p-2">{user.displayName || '-'}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isActive ? '✓ 有効' : '✗ 無効'}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {user.createdAt && new Date(user.createdAt).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-muted-foreground">
              合計: {users.length} 件
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
