import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface TestResult {
  success: boolean
  data?: unknown
  error?: string
  type: string
  requestDetails?: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
  }
  responseDetails?: {
    status: number
    statusText: string
    headers: Record<string, string>
    url: string
  }
}

interface TestResultDisplayProps {
  result: TestResult | null
}

export function TestResultDisplay({ result }: TestResultDisplayProps) {
  if (!result) return null

  return (
    <div className="space-y-4">
      <Alert variant={result.success ? 'default' : 'destructive'}>
        {result.success ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>操作が正常に完了しました</AlertDescription>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>エラーが発生しました</AlertDescription>
          </>
        )}
      </Alert>

      {result.requestDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">📤 リクエスト詳細</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">URL:</p>
              <p className="text-sm text-muted-foreground break-all">{result.requestDetails.url}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Method:</p>
              <p className="text-sm text-muted-foreground">{result.requestDetails.method}</p>
            </div>
            {result.requestDetails.headers && (
              <div>
                <p className="text-sm font-medium mb-1">Headers:</p>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                  {JSON.stringify(result.requestDetails.headers, null, 2)}
                </pre>
              </div>
            )}
            {result.requestDetails.body && (
              <div>
                <p className="text-sm font-medium mb-1">Body:</p>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                  {result.requestDetails.body}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result.responseDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-secondary">📡 レスポンス詳細</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Status:</p>
              <p className="text-sm text-muted-foreground">
                {result.responseDetails.status} {result.responseDetails.statusText}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">URL:</p>
              <p className="text-sm text-muted-foreground break-all">{result.responseDetails.url}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Headers:</p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                {JSON.stringify(result.responseDetails.headers, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📄 レスポンスデータ ({result.type})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className={`p-4 rounded-md text-sm overflow-auto max-h-96 ${
            result.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
          }`}>
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
