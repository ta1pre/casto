import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { ProfileFormData } from '../types'

interface SnsStepProps {
  formData: ProfileFormData
  onUpdate: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void
}

export function SnsStep({ formData, onUpdate }: SnsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="twitter" className="text-base">X（旧Twitter）</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">@</span>
          <Input
            id="twitter"
            placeholder="username"
            value={formData.twitter}
            onChange={(e) => onUpdate('twitter', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram" className="text-base">Instagram</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">@</span>
          <Input
            id="instagram"
            placeholder="username"
            value={formData.instagram}
            onChange={(e) => onUpdate('instagram', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tiktok" className="text-base">TikTok</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">@</span>
          <Input
            id="tiktok"
            placeholder="username"
            value={formData.tiktok}
            onChange={(e) => onUpdate('tiktok', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtube" className="text-base">YouTube</Label>
        <Input
          id="youtube"
          placeholder="チャンネルURL"
          value={formData.youtube}
          onChange={(e) => onUpdate('youtube', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="followers" className="text-base">合計フォロワー数</Label>
        <Input
          id="followers"
          type="number"
          placeholder="10000"
          value={formData.followers}
          onChange={(e) => onUpdate('followers', e.target.value)}
        />
      </div>
    </div>
  )
}
