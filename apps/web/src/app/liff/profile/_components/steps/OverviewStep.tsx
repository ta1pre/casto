import React from 'react'
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
  const getSectionContent = (step: number): React.ReactNode => {
    switch (step) {
      case 2: // 基本情報
        const basicItems = [
          { label: '芸名', value: formData.stageName },
          { label: '性別', value: formData.gender === 'male' ? '男性' : formData.gender === 'female' ? '女性' : formData.gender === 'other' ? 'その他' : '' },
          { label: '生年月日', value: formData.birthdate },
          { label: '都道府県', value: formData.prefecture },
          { label: '職業', value: formData.occupation }
        ]
        const filledBasic = basicItems.filter(item => item.value)
        
        if (filledBasic.length === 0) {
          return <span className="text-muted-foreground italic bg-gray-100 px-2 py-1 rounded">未入力</span>
        }
        
        return (
          <div className="space-y-1">
            {basicItems.map((item, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{item.label}:</span>{' '}
                {item.value || <span className="text-muted-foreground italic bg-gray-100 px-2 py-0.5 rounded text-xs">未入力</span>}
              </div>
            ))}
          </div>
        )

      case 3: // 写真
        return <span className="text-muted-foreground italic bg-blue-50 px-2 py-1 rounded">未実装</span>

      case 4: // 詳細情報
        const detailItems = [
          { label: '身長', value: formData.height ? `${formData.height}cm` : '' },
          { label: '体重', value: formData.weight ? `${formData.weight}kg` : '' },
          { label: 'バスト', value: formData.bust ? `${formData.bust}cm` : '' },
          { label: 'ウエスト', value: formData.waist ? `${formData.waist}cm` : '' },
          { label: 'ヒップ', value: formData.hip ? `${formData.hip}cm` : '' },
          { label: '自己PR', value: formData.achievements ? '入力済み' : '' }
        ]
        const filledDetail = detailItems.filter(item => item.value)
        
        if (filledDetail.length === 0) {
          return <span className="text-muted-foreground italic bg-gray-100 px-2 py-1 rounded">未入力</span>
        }
        
        return (
          <div className="space-y-1">
            {detailItems.map((item, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{item.label}:</span>{' '}
                {item.value || <span className="text-muted-foreground italic bg-gray-100 px-2 py-0.5 rounded text-xs">未入力</span>}
              </div>
            ))}
          </div>
        )

      case 5: // 所属
        const affiliationType = AFFILIATION_TYPES.find(t => t.value === formData.affiliationType)
        const affiliationItems = [
          { label: '所属形態', value: affiliationType?.label || '' },
          { label: '事務所名', value: formData.agency }
        ]
        const filledAffiliation = affiliationItems.filter(item => item.value)
        
        if (filledAffiliation.length === 0) {
          return <span className="text-muted-foreground italic bg-gray-100 px-2 py-1 rounded">未入力</span>
        }
        
        return (
          <div className="space-y-1">
            {affiliationItems.map((item, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{item.label}:</span>{' '}
                {item.value || <span className="text-muted-foreground italic bg-gray-100 px-2 py-0.5 rounded text-xs">未入力</span>}
              </div>
            ))}
          </div>
        )

      case 6: // SNS
        const snsItems = [
          { label: 'X', value: formData.twitter ? `@${formData.twitter}` : '' },
          { label: 'Instagram', value: formData.instagram ? `@${formData.instagram}` : '' },
          { label: 'TikTok', value: formData.tiktok ? `@${formData.tiktok}` : '' },
          { label: 'YouTube', value: formData.youtube },
          { label: 'フォロワー数', value: formData.followers ? `${formData.followers}人` : '' }
        ]
        const filledSns = snsItems.filter(item => item.value)
        
        if (filledSns.length === 0) {
          return <span className="text-muted-foreground italic bg-gray-100 px-2 py-1 rounded">未入力</span>
        }
        
        return (
          <div className="space-y-1">
            {snsItems.map((item, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{item.label}:</span>{' '}
                {item.value || <span className="text-muted-foreground italic bg-gray-100 px-2 py-0.5 rounded text-xs">未入力</span>}
              </div>
            ))}
          </div>
        )

      default:
        return null
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
                  <div className="font-semibold text-base mb-3">{section.title}</div>
                  <div className="text-foreground/80">
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
