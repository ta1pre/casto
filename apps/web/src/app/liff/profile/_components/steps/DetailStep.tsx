import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { ProfileFormData } from '../types'

interface DetailStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

export function DetailStep({ formData, onUpdate }: DetailStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="height">身長（cm）</Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            value={formData.height}
            onChange={(e) => onUpdate('height', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">体重（kg）</Label>
          <Input
            id="weight"
            type="number"
            placeholder="60"
            value={formData.weight}
            onChange={(e) => onUpdate('weight', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="bust">バスト(cm)</Label>
          <Input
            id="bust"
            type="number"
            placeholder="85"
            value={formData.bust}
            onChange={(e) => onUpdate('bust', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waist">ウエスト(cm)</Label>
          <Input
            id="waist"
            type="number"
            placeholder="65"
            value={formData.waist}
            onChange={(e) => onUpdate('waist', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hip">ヒップ(cm)</Label>
          <Input
            id="hip"
            type="number"
            placeholder="90"
            value={formData.hip}
            onChange={(e) => onUpdate('hip', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievements">自己PR（趣味・特技・実績等）</Label>
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
