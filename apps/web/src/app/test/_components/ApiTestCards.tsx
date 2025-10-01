import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface ApiTestCardsProps {
  loading: boolean
  onHealthCheck: () => void
  onGetUsers: () => void
}

export function ApiTestCards({ loading, onHealthCheck, onGetUsers }: ApiTestCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Health Check</CardTitle>
          <CardDescription>API基本動作確認</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onHealthCheck}
            disabled={loading}
            className="w-full"
          >
            {loading ? '実行中...' : 'Health Check'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Get Users</CardTitle>
          <CardDescription>Workers APIからユーザー一覧取得</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onGetUsers}
            disabled={loading}
            className="w-full"
          >
            {loading ? '実行中...' : 'ユーザー取得'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
