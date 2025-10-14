/**
 * 主催者プロフィールバリデーション
 * [SF][REH] フロントエンド/バックエンド共通バリデーション
 */

import type {
  OrganizerProfileUpsertRequest,
  OrganizerProfileValidationError,
  OrganizerProfileValidationResult,
} from '../types/organizer'
import { ORGANIZER_PROFILE_CONFIG, PREFECTURES } from '../types/organizer'

/**
 * 団体名のバリデーション
 */
export function validateName(name: string): OrganizerProfileValidationError | null {
  if (!name || name.trim().length === 0) {
    return {
      field: 'name',
      message: '団体名は必須です。',
      code: 'REQUIRED',
    }
  }

  if (name.length > ORGANIZER_PROFILE_CONFIG.NAME_MAX_LENGTH) {
    return {
      field: 'name',
      message: `団体名は${ORGANIZER_PROFILE_CONFIG.NAME_MAX_LENGTH}文字以内で入力してください。`,
      code: 'TOO_LONG',
    }
  }

  return null
}

/**
 * 担当者名のバリデーション
 */
export function validateContactPerson(
  contactPerson?: string | null
): OrganizerProfileValidationError | null {
  if (!contactPerson) return null

  if (contactPerson.length > ORGANIZER_PROFILE_CONFIG.CONTACT_PERSON_MAX_LENGTH) {
    return {
      field: 'contactPerson',
      message: `担当者名は${ORGANIZER_PROFILE_CONFIG.CONTACT_PERSON_MAX_LENGTH}文字以内で入力してください。`,
      code: 'TOO_LONG',
    }
  }

  return null
}

/**
 * 都道府県のバリデーション
 */
export function validatePrefecture(prefecture: string): OrganizerProfileValidationError | null {
  if (!prefecture || prefecture.trim().length === 0) {
    return {
      field: 'prefecture',
      message: '都道府県は必須です。',
      code: 'REQUIRED',
    }
  }

  if (!PREFECTURES.includes(prefecture as any)) {
    return {
      field: 'prefecture',
      message: '有効な都道府県を選択してください。',
      code: 'INVALID_VALUE',
    }
  }

  return null
}

/**
 * 住所詳細のバリデーション
 */
export function validateAddressDetail(addressDetail: string): OrganizerProfileValidationError | null {
  if (!addressDetail || addressDetail.trim().length === 0) {
    return {
      field: 'addressDetail',
      message: '都道府県以降の住所は必須です。',
      code: 'REQUIRED',
    }
  }

  if (addressDetail.length > ORGANIZER_PROFILE_CONFIG.ADDRESS_DETAIL_MAX_LENGTH) {
    return {
      field: 'addressDetail',
      message: `住所は${ORGANIZER_PROFILE_CONFIG.ADDRESS_DETAIL_MAX_LENGTH}文字以内で入力してください。`,
      code: 'TOO_LONG',
    }
  }

  return null
}

/**
 * 電話番号のバリデーション
 */
export function validatePhone(phone: string): OrganizerProfileValidationError | null {
  if (!phone || phone.trim().length === 0) {
    return {
      field: 'phone',
      message: '電話番号は必須です。',
      code: 'REQUIRED',
    }
  }

  if (!ORGANIZER_PROFILE_CONFIG.PHONE_PATTERN.test(phone)) {
    return {
      field: 'phone',
      message: '電話番号の形式が正しくありません。',
      code: 'INVALID_FORMAT',
    }
  }

  return null
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email?: string | null): OrganizerProfileValidationError | null {
  if (!email) return null

  if (!ORGANIZER_PROFILE_CONFIG.EMAIL_PATTERN.test(email)) {
    return {
      field: 'email',
      message: 'メールアドレスの形式が正しくありません。',
      code: 'INVALID_FORMAT',
    }
  }

  return null
}

/**
 * URLのバリデーション
 */
export function validateUrl(
  url: string | null | undefined,
  fieldName: string
): OrganizerProfileValidationError | null {
  if (!url) return null

  if (!ORGANIZER_PROFILE_CONFIG.URL_PATTERN.test(url)) {
    return {
      field: fieldName,
      message: 'URLの形式が正しくありません（http://またはhttps://で始まる必要があります）。',
      code: 'INVALID_URL',
    }
  }

  return null
}

/**
 * 団体概要のバリデーション
 */
export function validateDescription(description: string): OrganizerProfileValidationError | null {
  if (!description || description.trim().length === 0) {
    return {
      field: 'description',
      message: '団体概要は必須です。',
      code: 'REQUIRED',
    }
  }

  if (description.length < ORGANIZER_PROFILE_CONFIG.DESCRIPTION_MIN_LENGTH) {
    return {
      field: 'description',
      message: `団体概要は${ORGANIZER_PROFILE_CONFIG.DESCRIPTION_MIN_LENGTH}文字以上で入力してください。`,
      code: 'TOO_SHORT',
    }
  }

  if (description.length > ORGANIZER_PROFILE_CONFIG.DESCRIPTION_MAX_LENGTH) {
    return {
      field: 'description',
      message: `団体概要は${ORGANIZER_PROFILE_CONFIG.DESCRIPTION_MAX_LENGTH}文字以内で入力してください。`,
      code: 'TOO_LONG',
    }
  }

  return null
}

/**
 * プロフィール全体のバリデーション
 */
export function validateOrganizerProfile(
  data: OrganizerProfileUpsertRequest
): OrganizerProfileValidationResult {
  const errors: OrganizerProfileValidationError[] = []

  // 必須フィールド
  const nameError = validateName(data.name)
  if (nameError) errors.push(nameError)

  const prefectureError = validatePrefecture(data.prefecture)
  if (prefectureError) errors.push(prefectureError)

  const addressDetailError = validateAddressDetail(data.addressDetail)
  if (addressDetailError) errors.push(addressDetailError)

  const phoneError = validatePhone(data.phone)
  if (phoneError) errors.push(phoneError)

  const descriptionError = validateDescription(data.description)
  if (descriptionError) errors.push(descriptionError)

  // 任意フィールド
  const contactPersonError = validateContactPerson(data.contactPerson)
  if (contactPersonError) errors.push(contactPersonError)

  const emailError = validateEmail(data.email)
  if (emailError) errors.push(emailError)

  const websiteError = validateUrl(data.website, 'website')
  if (websiteError) errors.push(websiteError)

  const instagramError = validateUrl(data.instagramUrl, 'instagramUrl')
  if (instagramError) errors.push(instagramError)

  const xError = validateUrl(data.xUrl, 'xUrl')
  if (xError) errors.push(xError)

  const tiktokError = validateUrl(data.tiktokUrl, 'tiktokUrl')
  if (tiktokError) errors.push(tiktokError)

  const youtubeError = validateUrl(data.youtubeUrl, 'youtubeUrl')
  if (youtubeError) errors.push(youtubeError)

  return {
    valid: errors.length === 0,
    errors,
  }
}
