import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { ProfileFormData } from '../types'
import { validateNumberField } from '@casto/shared'

interface DetailStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

/**
 * 数値フィールドのバリデーションとエラーメッセージ取得 [REH]
 */
function getFieldError(value: string, min: number, max: number, fieldName: string): string | null {
  if (!value || value.trim() === '') return null
  const num = parseFloat(value)
  if (isNaN(num)) return `${fieldName}は数値で入力してください`
  return validateNumberField(num, min, max, fieldName)
}

export function DetailStep({ formData, onUpdate }: DetailStepProps) {
  const heightError = getFieldError(formData.height, 100, 250, '身長')
  const weightError = getFieldError(formData.weight, 30, 200, '体重')
  const bustError = getFieldError(formData.bust, 50, 150, 'バスト')
  const waistError = getFieldError(formData.waist, 40, 120, 'ウエスト')
  const hipError = getFieldError(formData.hip, 50, 150, 'ヒップ')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="text-base">身長（cm）</Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            value={formData.height}
            onChange={(e) => onUpdate('height', e.target.value)}
            className={heightError ? 'border-red-500' : ''}
          />
          {heightError && (
            <p className="text-xs text-red-500 mt-1">{heightError}</p>
          )}
          {!heightError && formData.height && (
            <p className="text-xs text-muted-foreground mt-1">100〜250cmの範囲</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-base">体重（kg）</Label>
          <Input
            id="weight"
            type="number"
            placeholder="60"
            value={formData.weight}
            onChange={(e) => onUpdate('weight', e.target.value)}
            className={weightError ? 'border-red-500' : ''}
          />
          {weightError && (
            <p className="text-xs text-red-500 mt-1">{weightError}</p>
          )}
          {!weightError && formData.weight && (
            <p className="text-xs text-muted-foreground mt-1">30〜200kgの範囲</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="bust" className="text-base">バスト（cm）</Label>
          <Input
            id="bust"
            type="number"
            placeholder="85"
            value={formData.bust}
            onChange={(e) => onUpdate('bust', e.target.value)}
            className={bustError ? 'border-red-500' : ''}
          />
          {bustError && (
            <p className="text-xs text-red-500 mt-1">{bustError}</p>
          )}
          {!bustError && formData.bust && (
            <p className="text-xs text-muted-foreground mt-1">50〜150cm</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="waist" className="text-base">ウエスト（cm）</Label>
          <Input
            id="waist"
            type="number"
            placeholder="65"
            value={formData.waist}
            onChange={(e) => onUpdate('waist', e.target.value)}
            className={waistError ? 'border-red-500' : ''}
          />
          {waistError && (
            <p className="text-xs text-red-500 mt-1">{waistError}</p>
          )}
          {!waistError && formData.waist && (
            <p className="text-xs text-muted-foreground mt-1">40〜120cm</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="hip" className="text-base">ヒップ（cm）</Label>
          <Input
            id="hip"
            type="number"
            placeholder="90"
            value={formData.hip}
            onChange={(e) => onUpdate('hip', e.target.value)}
            className={hipError ? 'border-red-500' : ''}
          />
          {hipError && (
            <p className="text-xs text-red-500 mt-1">{hipError}</p>
          )}
          {!hipError && formData.hip && (
            <p className="text-xs text-muted-foreground mt-1">50〜150cm</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievements" className="text-base font-semibold">自己PR（趣味・特技・実績等）</Label>
        <textarea
          id="achievements"
          placeholder="趣味や特技、これまでの活動経験、これから挑戦したいことなど自由にアピールしてください"
          value={formData.achievements}
          onChange={(e) => onUpdate('achievements', e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-base bg-background min-h-[100px]"
        />
      </div>
    </div>
  )
}
