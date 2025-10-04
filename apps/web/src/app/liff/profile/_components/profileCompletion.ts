import type { ProfileFormData } from './types'

export interface ProfileCompletionSections {
  basic: boolean
  photo: boolean
  detail: boolean
  affiliation: boolean
  sns: boolean
}

export interface ProfileCompletionResult {
  completionRate: number
  sections: ProfileCompletionSections
}

export function calculateProfileCompletion(formData: ProfileFormData): ProfileCompletionResult {
  const hasBasicInfo = Boolean(
    formData.stageName ||
    formData.gender ||
    formData.birthdate ||
    formData.prefecture ||
    formData.occupation
  )

  // 写真アップロード（1枚以上で+20%）
  const hasPhoto = Boolean(
    formData.photoUrls &&
    formData.photoUrls.length > 0 &&
    formData.photoUrls.some(url => url && url.length > 0)
  )

  const hasDetailInfo = Boolean(
    formData.height ||
    formData.weight ||
    formData.bust ||
    formData.waist ||
    formData.hip ||
    formData.achievements
  )

  const hasAffiliation = Boolean(
    formData.affiliationType ||
    formData.agency
  )

  const hasSns = Boolean(
    formData.twitter ||
    formData.instagram ||
    formData.tiktok ||
    formData.youtube ||
    formData.followers
  )

  const completionRate = [hasBasicInfo, hasPhoto, hasDetailInfo, hasAffiliation, hasSns]
    .reduce((total, sectionFilled) => total + (sectionFilled ? 20 : 0), 0)

  return {
    completionRate,
    sections: {
      basic: hasBasicInfo,
      photo: hasPhoto,
      detail: hasDetailInfo,
      affiliation: hasAffiliation,
      sns: hasSns
    }
  }
}
