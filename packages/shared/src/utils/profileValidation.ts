/**
 * プロフィールバリデーションユーティリティ
 * 
 * [REH][DRY] 入力チェックとエラーメッセージ生成
 */

import type {
  TalentProfileInput,
  ProfileValidationResult,
  ProfileValidationError
} from '../types/profile'

/**
 * プロフィール入力データをバリデーション
 * 
 * @param profile - 入力データ
 * @returns バリデーション結果とエラーリスト
 */
export function validateTalentProfile(
  profile: Partial<TalentProfileInput>
): ProfileValidationResult {
  const errors: ProfileValidationError[] = []

  // 必須項目チェック
  if (!profile.stage_name || profile.stage_name.trim() === '') {
    errors.push({ field: 'stage_name', message: '芸名を入力してください' })
  }

  if (!profile.gender) {
    errors.push({ field: 'gender', message: '性別を選択してください' })
  }

  if (profile.birthdate && !isValidDateFormat(profile.birthdate)) {
    errors.push({ field: 'birthdate', message: '生年月日の形式が正しくありません（YYYY、YYYY-MM、またはYYYY-MM-DD）' })
  }

  if (!profile.prefecture) {
    errors.push({ field: 'prefecture', message: '都道府県を選択してください' })
  }

  // 数値項目の範囲チェック
  if (profile.height !== null && profile.height !== undefined) {
    if (profile.height < 100 || profile.height > 250) {
      errors.push({ field: 'height', message: '身長は100〜250cmの範囲で入力してください' })
    }
  }

  if (profile.weight !== null && profile.weight !== undefined) {
    if (profile.weight < 30 || profile.weight > 200) {
      errors.push({ field: 'weight', message: '体重は30〜200kgの範囲で入力してください' })
    }
  }

  if (profile.bust !== null && profile.bust !== undefined) {
    if (profile.bust < 50 || profile.bust > 150) {
      errors.push({ field: 'bust', message: 'バストは50〜150cmの範囲で入力してください' })
    }
  }

  if (profile.waist !== null && profile.waist !== undefined) {
    if (profile.waist < 40 || profile.waist > 120) {
      errors.push({ field: 'waist', message: 'ウエストは40〜120cmの範囲で入力してください' })
    }
  }

  if (profile.hip !== null && profile.hip !== undefined) {
    if (profile.hip < 50 || profile.hip > 150) {
      errors.push({ field: 'hip', message: 'ヒップは50〜150cmの範囲で入力してください' })
    }
  }

  // gender値チェック
  if (profile.gender && !['male', 'female', 'other'].includes(profile.gender)) {
    errors.push({ field: 'gender', message: '性別の値が不正です' })
  }

  // affiliation_type値チェック
  if (profile.affiliation_type && !['freelance', 'business-partner', 'exclusive'].includes(profile.affiliation_type)) {
    errors.push({ field: 'affiliation_type', message: '所属タイプの値が不正です' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 日付形式（YYYY、YYYY-MM、YYYY-MM-DD）をチェック
 */
function isValidDateFormat(dateStr: string): boolean {
  // YYYY形式
  if (/^\d{4}$/.test(dateStr)) {
    const year = parseInt(dateStr, 10)
    return year >= 1900 && year <= 2100
  }

  // YYYY-MM形式
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [year, month] = dateStr.split('-').map(n => parseInt(n, 10))
    return year >= 1900 && year <= 2100 && month >= 1 && month <= 12
  }

  // YYYY-MM-DD形式
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  }

  return false
}

/**
 * 数値フィールドのバリデーション（個別）
 * 
 * @param value - 検証する数値
 * @param min - 最小値
 * @param max - 最大値
 * @param fieldName - フィールド名（エラーメッセージ用）
 * @returns エラーメッセージ（問題なければnull）
 */
export function validateNumberField(
  value: number | null | undefined,
  min: number,
  max: number,
  fieldName: string
): string | null {
  if (value === null || value === undefined) return null
  if (value < min || value > max) {
    return `${fieldName}は${min}〜${max}の範囲で入力してください`
  }
  return null
}
