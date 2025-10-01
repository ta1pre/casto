import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

interface UserFormData {
  provider: string
  handle: string
  role: string
}

interface UserCreateFormProps {
  formData: UserFormData
  loading: boolean
  onFormChange: (data: UserFormData) => void
  onSubmit: () => void
}

export function UserCreateForm({ formData, loading, onFormChange, onSubmit }: UserCreateFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>3. Create User</CardTitle>
        <CardDescription>新規ユーザー作成テスト</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => onFormChange({ ...formData, provider: value })}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="line">LINE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={formData.handle}
              onChange={(e) => onFormChange({ ...formData, handle: e.target.value })}
              placeholder="test@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => onFormChange({ ...formData, role: value })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applicant">Applicant</SelectItem>
                <SelectItem value="fan">Fan</SelectItem>
                <SelectItem value="organizer">Organizer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={onSubmit}
          disabled={loading || !formData.handle}
          className="w-full"
        >
          {loading ? '実行中...' : 'ユーザー作成'}
        </Button>
      </CardContent>
    </Card>
  )
}
