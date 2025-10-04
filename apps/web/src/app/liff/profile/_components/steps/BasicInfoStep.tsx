import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { HelpHint } from '@/shared/ui/help-hint'
import { GENDERS, PREFECTURES } from '../constants'
import type { ProfileFormData } from '../types'

interface BasicInfoStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

export function BasicInfoStep({ formData, onUpdate }: BasicInfoStepProps) {
  const parseBirthdate = (birthdate: string) => {
    if (!birthdate) {
      return { year: '', month: '', day: '' }
    }

    const parts = birthdate.split('-')
    while (parts.length < 3) {
      parts.push('')
    }

    return {
      year: parts[0] || '',
      month: parts[1] || '',
      day: parts[2] || ''
    }
  }

  const { year: birthYear, month: birthMonth, day: birthDay } = parseBirthdate(formData.birthdate || '')

  const updateBirthdate = (year: string, month: string, day: string) => {
    // 年が未入力の場合は空文字列
    if (!year) {
      onUpdate('birthdate', '')
      return
    }

    // 年のみ入力
    if (!month) {
      onUpdate('birthdate', year)
      return
    }

    // 年月のみ入力
    const paddedMonth = month.padStart(2, '0')
    if (!day) {
      onUpdate('birthdate', `${year}-${paddedMonth}`)
      return
    }

    // 完全な日付（YYYY-MM-DD）
    const paddedDay = day.padStart(2, '0')
    onUpdate('birthdate', `${year}-${paddedMonth}-${paddedDay}`)
  }

  // 必須項目のバリデーション [REH]
  const stageNameError = !formData.stageName || formData.stageName.trim() === ''
  const genderError = !formData.gender
  const prefectureError = !formData.prefecture

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stageName">芸名・活動名 *</Label>
        <Input
          id="stageName"
          placeholder="例: はらせつこ"
          value={formData.stageName}
          onChange={(e) => onUpdate('stageName', e.target.value)}
          required
          className={stageNameError && formData.stageName !== '' ? 'border-red-500' : ''}
        />
        {stageNameError && formData.stageName === '' && (
          <p className="text-xs text-red-500 mt-1">芸名・活動名を入力してください</p>
        )}
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
        {genderError && (
          <p className="text-xs text-red-500 mt-1">性別を選択してください</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>生年月日 (任意)</Label>
          <HelpHint
            description="18歳未満の方はオーディション時に親の承諾書が必要です。"
            placement="top"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={birthYear}
            onChange={(e) => {
              const year = e.target.value
              updateBirthdate(year, birthMonth, birthDay)
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">-</option>
            {Array.from({ length: 75 }, (_, i) => 2010 - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={birthMonth}
            onChange={(e) => {
              const month = e.target.value
              updateBirthdate(birthYear, month, birthDay)
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={!birthYear}
          >
            <option value="">-</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={String(month).padStart(2, '0')}>{month}</option>
            ))}
          </select>
          <select
            value={birthDay}
            onChange={(e) => {
              const day = e.target.value
              updateBirthdate(birthYear, birthMonth, day)
            }}
            disabled={!birthYear || !birthMonth}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">-</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={String(day).padStart(2, '0')}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefecture">都道府県 *</Label>
        <select
          id="prefecture"
          value={formData.prefecture}
          onChange={(e) => onUpdate('prefecture', e.target.value)}
          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${prefectureError ? 'border-red-500' : 'border-input'}`}
          required
        >
          <option value="">選択</option>
          {PREFECTURES.map((pref) => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>
        {prefectureError && (
          <p className="text-xs text-red-500 mt-1">都道府県を選択してください</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">職業</Label>
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
