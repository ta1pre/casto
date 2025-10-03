import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Badge } from "@/shared/ui/badge"
import type { AuthProvider, UserRole, UserUpsertRequest } from '@casto/shared'

export type UserFormData = {
  provider: AuthProvider
  handle: string
  role: UserRole
}

interface UserCreateFormProps {
  formData: UserFormData
  loading: boolean
  onFormChange: (data: UserFormData) => void
  onSubmit: (payload: UserUpsertRequest) => void
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'applicant', label: 'Applicant' },
  { value: 'fan', label: 'Fan' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' }
]

export function UserCreateForm({ formData, loading, onFormChange, onSubmit }: UserCreateFormProps) {
  const handleSubmit = () => {
    if (!formData.handle.trim()) {
      return
    }

    const payload: UserUpsertRequest = {
      provider: formData.provider,
      handle: formData.handle.trim(),
      role: formData.role
    }

    onSubmit(payload)
  }

  const providerLabel: Record<AuthProvider, string> = {
    email: 'メールアドレスで登録 (Supabase Auth)',
    line: 'LINEユーザーとして登録'
  }

  const handlePlaceholder = formData.provider === 'email' ? 'sample@casto.app' : 'line-user-id'
  const helperText = formData.provider === 'email'
    ? 'メールユーザーの場合、handle は登録に使用するメールアドレスです'
    : 'LINEユーザーの場合、handle は LINE User ID を指定します'

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>ユーザー作成</CardTitle>
          <Badge variant="outline">POST /api/v1/users</Badge>
        </div>
        <CardDescription>
          Workers API を通じて新規ユーザーを追加するフォームです。入力内容に応じてレスポンスが `Test Result` セクションに表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider">認証プロバイダ</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => onFormChange({ ...formData, provider: value as AuthProvider })}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">メール</SelectItem>
                <SelectItem value="line">LINE</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {providerLabel[formData.provider]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">ロール</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => onFormChange({ ...formData, role: value as UserRole })}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="ロールを選択" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-relaxed">
              審査・管理に応じたロールを選択します。
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="handle">ハンドル</Label>
          <Input
            id="handle"
            value={formData.handle}
            onChange={(e) => onFormChange({ ...formData, handle: e.target.value })}
            placeholder={handlePlaceholder}
            inputMode={formData.provider === 'email' ? 'email' : 'text'}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {helperText}
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={loading || !formData.handle.trim()} className="w-full">
          {loading ? '送信中…' : 'ユーザーを作成'}
        </Button>
      </CardContent>
    </Card>
  )
}
