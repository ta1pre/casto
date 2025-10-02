import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { GENDERS, PREFECTURES } from '../constants'
import type { ProfileFormData } from '../types'

interface BasicInfoStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

export function BasicInfoStep({ formData, onUpdate }: BasicInfoStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stageName">芸名・活動名 *</Label>
        <Input
          id="stageName"
          placeholder="例: メグ"
          value={formData.stageName}
          onChange={(e) => onUpdate('stageName', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>性別 *</Label>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <Button
              key={g.value}
              type="button"
              variant="outline"
              onClick={() => onUpdate('gender', g.value)}
              className={formData.gender === g.value ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' : ''}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate">生年月日 *</Label>
        <Input
          id="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={(e) => onUpdate('birthdate', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefecture">都道府県 *</Label>
        <select
          id="prefecture"
          value={formData.prefecture}
          onChange={(e) => onUpdate('prefecture', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="">選択</option>
          {PREFECTURES.map((pref) => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">職業（任意）</Label>
        <Input
          id="occupation"
          placeholder="例: 学生、会社員"
          value={formData.occupation}
          onChange={(e) => onUpdate('occupation', e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  )
}
