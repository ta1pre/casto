export interface ProfileFormData {
  // 基本情報（必須）
  stageName: string
  gender: string
  birthdate: string
  prefecture: string
  
  // 基本情報（任意）
  occupation: string
  
  // 体型情報
  height: string
  weight: string
  bust: string
  waist: string
  hip: string
  shoeSize: string
  achievements: string
  
  // 活動情報
  activityAreas: string[]
  canMove: boolean | null
  canStay: boolean | null
  passportStatus: string
  
  // 所属・ステータス
  affiliationType: string
  agency: string
  
  // SNS情報
  twitter: string
  instagram: string
  tiktok: string
  youtube: string
  followers: string
}

export interface StepConfig {
  id: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  name: string
}

export interface SectionConfig {
  title: string
  desc: string
  step: number
}
