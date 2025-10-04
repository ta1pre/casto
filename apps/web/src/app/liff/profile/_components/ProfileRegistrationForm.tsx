'use client'

import { useState, useEffect } from 'react'
import { INITIAL_FORM_DATA, STEPS } from './constants'
import type { ProfileFormData } from './types'
import { StepNavigation } from './ui/StepNavigation'
import { StepCard } from './ui/StepCard'
import { FooterNavigation } from './ui/FooterNavigation'
import { OverviewStep } from './steps/OverviewStep'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { PhotoStep } from './steps/PhotoStep'
import { DetailStep } from './steps/DetailStep'
import { AffiliationStep } from './steps/AffiliationStep'
import { SnsStep } from './steps/SnsStep'
import { useProfileData } from '../_hooks/useProfileData'
import { formDataToApiInput, apiResponseToFormData } from '../_utils/profileConverter'
import { DebugErrorPanel } from './DebugErrorPanel'
import { validateTalentProfile, calculateTalentProfileCompletion } from '@casto/shared'

export function ProfileRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)
  
  const { profile, loading, error, save } = useProfileData()

  // プロフィール読み込み時にフォームデータに反映
  useEffect(() => {
    if (profile) {
      setFormData(apiResponseToFormData(profile))
    }
  }, [profile])

  const updateFormData = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isBasicInfoValid = (): boolean => {
    return !!(formData.stageName && formData.gender && formData.prefecture)
  }

  const handleNext = async () => {
    if (currentStep === 2 && !isBasicInfoValid()) return
    
    // ステップ1（概要）は保存不要、それ以外は「次へ」で自動保存
    if (currentStep > 1) {
      setSaving(true)
      setSaveError(null)
      try {
        const apiInput = formDataToApiInput(formData)
        
        // フロントエンドでバリデーション [REH]
        const validation = validateTalentProfile(apiInput)
        if (!validation.valid) {
          const errorMessages = validation.errors.map(e => e.message).join('\n')
          alert(`入力内容に誤りがあります:\n\n${errorMessages}`)
          setSaving(false)
          return
        }
        
        await save(apiInput)
        
        if (currentStep < STEPS.length) {
          setCurrentStep(currentStep + 1)
        }
      } catch (err) {
        console.error('Auto-save failed:', err)
        setSaveError(err)
        alert('保存に失敗しました。画面下部のエラー詳細を確認してください。')
      } finally {
        setSaving(false)
      }
    } else {
      // ステップ1は保存せず次へ進む
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep) return
    if (stepId > 2 && !isBasicInfoValid()) return
    setCurrentStep(stepId)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const apiInput = formDataToApiInput(formData)
      
      // フロントエンドでバリデーション [REH]
      const validation = validateTalentProfile(apiInput)
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join('\n')
        alert(`入力内容に誤りがあります:\n\n${errorMessages}`)
        setSaving(false)
        return
      }
      
      await save(apiInput)
      alert('プロフィールを保存しました！')
    } catch (err) {
      console.error('Save failed:', err)
      setSaveError(err)
      alert('保存に失敗しました。画面下部のエラー詳細を確認してください。')
    } finally {
      setSaving(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OverviewStep 
            formData={formData} 
            onStepClick={handleStepClick} 
            isBasicInfoValid={isBasicInfoValid()}
          />
        )
      case 2:
        return <BasicInfoStep formData={formData} onUpdate={updateFormData} />
      case 3:
        return <PhotoStep formData={formData} onChange={updateFormData} />
      case 4:
        return <DetailStep formData={formData} onUpdate={updateFormData} />
      case 5:
        return <AffiliationStep formData={formData} onUpdate={updateFormData} />
      case 6:
        return <SnsStep formData={formData} onUpdate={updateFormData} />
      default:
        return null
    }
  }

  // リアルタイムで完成度を計算 [DRY]
  const apiInput = formDataToApiInput(formData)
  const { completionRate } = calculateTalentProfileCompletion(apiInput)
  

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  // エラー表示（初回ロード時のエラーをデバッグパネルで表示）
  if (error) {
    const errorObj = error as { message?: string }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground">{errorObj.message || 'プロフィール取得に失敗'}</p>
          <DebugErrorPanel error={error} context="Profile Load (Initial)" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StepNavigation 
        currentStep={currentStep}
        onStepClick={handleStepClick}
        isBasicInfoValid={isBasicInfoValid()}
      />

      <div className="flex-1 container max-w-2xl mx-auto px-4 py-6 pb-32">
        <StepCard currentStep={currentStep}>
          {renderStepContent()}
        </StepCard>
      </div>

      <FooterNavigation
        currentStep={currentStep}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isBasicInfoValid={isBasicInfoValid()}
        completionRate={completionRate}
        saving={saving}
      />

      {/* デバッグ用エラーパネル */}
      <DebugErrorPanel error={error || saveError} context={error ? 'Profile Load' : 'Profile Save'} />
    </div>
  )
}
