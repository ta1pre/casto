/**
 * 日付フォーマット関数
 * 
 * 設計原則: [SF][DRY]
 */

function toDate(dateInput: string | Date): Date | null {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(dateString: string | Date): string {
  const date = toDate(dateString)
  if (!date) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}`
}

export function formatDate(dateString: string | Date): string {
  const date = toDate(dateString)
  if (!date) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}/${month}/${day}`
}

const DEFAULT_JA_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

const DEFAULT_JA_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DEFAULT_JA_DATE_OPTIONS,
  hour: '2-digit',
  minute: '2-digit',
}

export function formatDateJa(dateInput: string | Date, options: Intl.DateTimeFormatOptions = DEFAULT_JA_DATE_OPTIONS): string {
  const date = toDate(dateInput)
  if (!date) return '-'
  return new Intl.DateTimeFormat('ja-JP', options).format(date)
}

export function formatDateTimeJa(dateInput: string | Date, options: Intl.DateTimeFormatOptions = DEFAULT_JA_DATETIME_OPTIONS): string {
  const date = toDate(dateInput)
  if (!date) return '-'
  return new Intl.DateTimeFormat('ja-JP', options).format(date)
}

export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`
  
  return formatDate(date)
}
