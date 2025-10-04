import {
  Eye,
  User,
  Camera,
  FileText,
  Briefcase,
  Share2
} from 'lucide-react'
import type { ProfileFormData, StepConfig } from './types'

export const INITIAL_FORM_DATA: ProfileFormData = {
  stageName: '',
  gender: '',
  birthdate: '',
  prefecture: '',
  occupation: '',
  height: '',
  weight: '',
  bust: '',
  waist: '',
  hip: '',
  achievements: '',
  affiliationType: '',
  agency: '',
  twitter: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  followers: '',
  photoUrls: []
}

export const STEPS: StepConfig[] = [
  { id: 1, label: 'Eye', icon: Eye, name: 'プロフィール', description: '入力状況の確認' },
  { id: 2, label: '基', icon: User, name: '基本情報', description: '芸名・性別・都道府県など' },
  { id: 3, label: '写', icon: Camera, name: '写真', description: '顔写真・全身写真のアップロード' },
  { id: 4, label: '詳', icon: FileText, name: 'プロフィール詳細', description: '身長・体重・自己PRなど' },
  { id: 5, label: '属', icon: Briefcase, name: '所属・ステータス', description: '現在の所属状況・契約窓口' },
  { id: 6, label: 'SNS', icon: Share2, name: 'SNS情報', description: 'SNSアカウント・フォロワー数' }
]

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', 'その他'
]

export const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' }
]

export const AFFILIATION_TYPES = [
  { value: 'freelance', label: 'フリー', description: '本人と直接契約' },
  { value: 'business-partner', label: '業務提携', description: '本人が契約当事者' },
  { value: 'exclusive', label: '専属所属', description: '事務所経由が必須' }
]

export const PHOTO_CONFIG = {
  MAX_FILES: 6,
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
  PHOTO_LABELS: ['顔写真', '全身写真', '写真3', '写真4', '写真5', '写真6']
}

export const OVERVIEW_SECTIONS = [
  { title: '基本情報', desc: '芸名・性別・生年月日・都道府県', step: 2 },
  { title: '写真', desc: '顔写真・全身写真のアップロード', step: 3 },
  { title: 'プロフィール詳細', desc: '身長・体重・自己紹介など', step: 4 },
  { title: '所属・ステータス', desc: '現在の所属状況・契約窓口', step: 5 },
  { title: 'SNS情報', desc: 'SNSアカウント・フォロワー数', step: 6 }
]
