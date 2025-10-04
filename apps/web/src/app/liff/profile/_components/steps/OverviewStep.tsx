import { Button } from '@/shared/ui/button'
import { Edit } from 'lucide-react'
import { OVERVIEW_SECTIONS, AFFILIATION_TYPES } from '../constants'
import type { ProfileFormData } from '../types'

interface OverviewStepProps {
  formData: ProfileFormData
  onStepClick: (step: number) => void
  isBasicInfoValid: boolean
}

export function OverviewStep({ formData, onStepClick, isBasicInfoValid }: OverviewStepProps) {
  const getSectionContent = (step: number): string => {
    switch (step) {
      case 2: // 基本情報
        const basicItems = [
          formData.stageName && `芸名: ${formData.stageName}`,
          formData.gender && `性別: ${formData.gender === 'male' ? '男性' : formData.gender === 'female' ? '女性' : 'その他'}`,
          formData.birthdate && `生年月日: ${formData.birthdate}`,
          formData.prefecture && `都道府県: ${formData.prefecture}`,
          formData.occupation && `職業: ${formData.occupation}`
        ].filter(Boolean)
        return basicItems.length > 0 ? basicItems.join(' / ') : '未入力'

      case 3: // 写真
        return '未実装'

      case 4: // 詳細情報
        const detailItems = [
          formData.height && `身長: ${formData.height}cm`,
          formData.weight && `体重: ${formData.weight}kg`,
          formData.bust && `B: ${formData.bust}`,
          formData.waist && `W: ${formData.waist}`,
          formData.hip && `H: ${formData.hip}`,
          formData.achievements && '自己PR入力済み'
        ].filter(Boolean)
        return detailItems.length > 0 ? detailItems.join(' / ') : '未入力'

      case 5: // 所属
        const affiliationType = AFFILIATION_TYPES.find(t => t.value === formData.affiliationType)
        const affiliationItems = [
          affiliationType && `所属: ${affiliationType.label}`,
          formData.agency && `事務所: ${formData.agency}`
        ].filter(Boolean)
        return affiliationItems.length > 0 ? affiliationItems.join(' / ') : '未入力'

      case 6: // SNS
        const snsItems = [
          formData.twitter && `X: @${formData.twitter}`,
          formData.instagram && `Instagram: @${formData.instagram}`,
          formData.tiktok && `TikTok: @${formData.tiktok}`,
          formData.youtube && 'YouTube登録済み',
          formData.followers && `フォロワー: ${formData.followers}`
        ].filter(Boolean)
        return snsItems.length > 0 ? snsItems.join(' / ') : '未入力'

      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        各セクションの入力状況を確認できます。「編集」をタップしてセクションに移動してください。
      </p>
      
      <div className="space-y-3">
        {OVERVIEW_SECTIONS.map((section) => {
          const canEdit = section.step === 2 || isBasicInfoValid
          const content = getSectionContent(section.step)
          
          return (
            <div
              key={section.step}
              className={`border rounded-lg p-4 ${!canEdit ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1">{section.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">{section.desc}</div>
                  <div className="text-sm text-foreground/80 break-words">
                    {content}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onStepClick(section.step)}
                  disabled={!canEdit}
                  className="shrink-0"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  編集
                </Button>
              </div>
              {!canEdit && section.step !== 2 && (
                <p className="text-xs text-destructive mt-2">
                  ※ 基本情報を入力してください
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
