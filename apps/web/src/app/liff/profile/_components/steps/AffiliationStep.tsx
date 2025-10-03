import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { AFFILIATION_TYPES } from '../constants'
import type { ProfileFormData } from '../types'

interface AffiliationStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

export function AffiliationStep({ formData, onUpdate }: AffiliationStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>現在の所属形態</Label>
        <div className="space-y-2">
          {AFFILIATION_TYPES.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              onClick={() => onUpdate('affiliationType', option.value)}
              className={`w-full justify-between h-auto py-3 px-4 text-left ${formData.affiliationType === option.value ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' : ''}`}
            >
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs opacity-80 mt-1">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agency">事務所名（任意）</Label>
        <Input
          id="agency"
          placeholder="例: 株式会社キャスト"
          value={formData.agency}
          onChange={(e) => onUpdate('agency', e.target.value)}
        />
      </div>
    </div>
  )
}
