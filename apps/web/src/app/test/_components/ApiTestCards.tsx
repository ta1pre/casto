import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface ApiTestCardsProps {
  loading: boolean
  onHealthCheck: () => void
  onGetUsers: () => void
  onReset?: () => void
}

export function ApiTestCards({ loading, onHealthCheck, onGetUsers, onReset }: ApiTestCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>ヘルスチェック</CardTitle>
          <CardDescription>Workers API が起動・応答しているかを確認します。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={onHealthCheck} disabled={loading} className="w-full" variant="outline">
            {loading ? '実行中…' : 'ヘルスチェックを実行'}
          </Button>
          <p className="text-sm text-muted-foreground leading-relaxed">
            期待されるレスポンス:
            <br />
            <span className="font-mono text-xs">&#123; &quot;status&quot;: &quot;ok&quot; &#125;</span>
          </p>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>ユーザー取得</CardTitle>
          <CardDescription>共通型 `UsersListResponse` に準拠したレスポンスを確認します。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={onGetUsers} disabled={loading} className="w-full" variant="outline">
            {loading ? '取得中…' : 'ユーザー一覧を取得'}
          </Button>
          <p className="text-sm text-muted-foreground leading-relaxed">
            `users`, `stats`, `fetchedAt` などの項目が返却されることを確認します。
          </p>
        </CardContent>
      </Card>

      <Card className="h-full border-dashed">
        <CardHeader>
          <CardTitle>ステートリセット</CardTitle>
          <CardDescription>画面上のテスト結果やユーザー一覧を初期化します。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={onReset}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            テスト結果をクリア
          </Button>
          <p className="text-sm text-muted-foreground leading-relaxed">
            `useUsersData` で保持されている状態をリセットし、再取得テストを行う際に利用します。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
