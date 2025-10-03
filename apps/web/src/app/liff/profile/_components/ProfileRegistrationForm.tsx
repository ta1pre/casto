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
import { calculateProfileCompletion } from './profileCompletion'
import { useProfileData } from '../_hooks/useProfileData'
import { formDataToApiInput, apiResponseToFormData } from '../_utils/profileConverter'

export function ProfileRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA)
  const [saving, setSaving] = useState(false)
  
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

  const handleNext = () => {
    if (currentStep === 2 && !isBasicInfoValid()) return
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
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
    try {
      const apiInput = formDataToApiInput(formData)
      await save(apiInput)
      alert('プロフィールを保存しました！')
    } catch (err) {
      console.error('Save failed:', err)
      alert('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <OverviewStep onStepClick={handleStepClick} />
      case 2:
        return <BasicInfoStep formData={formData} onUpdate={updateFormData} />
      case 3:
        return <PhotoStep />
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

  const { completionRate } = calculateProfileCompletion(formData)

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
        completionRate={profile?.completion_rate ?? completionRate}
        saving={saving}
      />
    </div>
  )
}
