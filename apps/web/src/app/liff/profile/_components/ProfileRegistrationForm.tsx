'use client'

import { useState } from 'react'
import { INITIAL_FORM_DATA, STEPS } from './constants'
import type { ProfileFormData } from './types'
import { ProfileHeader } from './ui/ProfileHeader'
import { StepNavigation } from './ui/StepNavigation'
import { StepCard } from './ui/StepCard'
import { FooterNavigation } from './ui/FooterNavigation'
import { OverviewStep } from './steps/OverviewStep'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { PhotoStep } from './steps/PhotoStep'
import { DetailStep } from './steps/DetailStep'
import { AffiliationStep } from './steps/AffiliationStep'
import { SnsStep } from './steps/SnsStep'

export function ProfileRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA)

  const updateFormData = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isBasicInfoValid = (): boolean => {
    return !!(formData.stageName && formData.gender && formData.birthdate && formData.prefecture)
  }

  const calculateCompletion = () => {
    let completionRate = 0
    
    // 基本情報 (20%)
    const hasBasicInfo = !!(
      formData.stageName ||
      formData.gender ||
      formData.birthdate ||
      formData.prefecture ||
      formData.occupation
    )
    if (hasBasicInfo) completionRate += 20
    
    // 写真 (20%) - 現在未実装のため0%
    // TODO: 写真アップロード機能実装時に追加
    
    // 詳細情報 (20%)
    const hasDetailInfo = !!(
      formData.height ||
      formData.weight ||
      formData.bust ||
      formData.waist ||
      formData.hip ||
      formData.shoeSize ||
      formData.achievements ||
      formData.activityAreas.length > 0 ||
      formData.canMove !== null ||
      formData.canStay !== null ||
      formData.passportStatus
    )
    if (hasDetailInfo) completionRate += 20
    
    // 所属 (20%)
    const hasAffiliation = !!(
      formData.affiliationType ||
      formData.agency
    )
    if (hasAffiliation) completionRate += 20
    
    // SNS (20%)
    const hasSns = !!(
      formData.twitter ||
      formData.instagram ||
      formData.tiktok ||
      formData.youtube ||
      formData.followers
    )
    if (hasSns) completionRate += 20
    
    return completionRate
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

  const handleSubmit = () => {
    console.log('Form submitted:', formData)
    alert('プロフィール登録完了！（モックデータ）')
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

  const completionRate = calculateCompletion()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ProfileHeader />
      
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
      />
    </div>
  )
}
