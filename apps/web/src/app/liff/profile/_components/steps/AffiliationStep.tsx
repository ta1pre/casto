import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { JOB_TYPES } from '../constants'
import type { ProfileFormData } from '../types'

interface AffiliationStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

export function AffiliationStep({ formData, onUpdate }: AffiliationStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>対応可能な仕事（複数選択可）</Label>
        <div className="grid grid-cols-2 gap-2">
          {JOB_TYPES.map((job) => (
            <Button
              key={job.value}
              type="button"
              variant="outline"
              onClick={() => {
                const newJobTypes = formData.jobTypes.includes(job.value)
                  ? formData.jobTypes.filter(j => j !== job.value)
                  : [...formData.jobTypes, job.value]
                onUpdate('jobTypes', newJobTypes)
              }}
              className={`h-auto py-3 ${formData.jobTypes.includes(job.value) ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' : ''}`}
            >
              {job.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agency">所属事務所名（任意）</Label>
        <Input
          id="agency"
          placeholder="事務所名を入力してください"
          value={formData.agency}
          onChange={(e) => onUpdate('agency', e.target.value)}
        />
      </div>
    </div>
  )
}
