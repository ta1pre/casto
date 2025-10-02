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
  bio: '',
  height: '',
  weight: '',
  bust: '',
  waist: '',
  hip: '',
  shoeSize: '',
  activityAreas: [],
  canMove: null,
  canStay: null,
  passportStatus: '',
  jobTypes: [],
  affiliationType: '',
  workRequestType: '',
  agency: '',
  twitter: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  followers: ''
}

export const STEPS: StepConfig[] = [
  { id: 1, label: 'Eye', icon: Eye, name: 'プロフィール' },
  { id: 2, label: '基', icon: User, name: '基本情報' },
  { id: 3, label: '写', icon: Camera, name: '写真' },
  { id: 4, label: '詳', icon: FileText, name: 'プロフィール詳細' },
  { id: 5, label: '属', icon: Briefcase, name: '所属・ステータス' },
  { id: 6, label: 'SNS', icon: Share2, name: 'SNS情報' }
]

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' }
]

export const JOB_TYPES = [
  { value: 'model', label: 'モデル' },
  { value: 'actor', label: '俳優' },
  { value: 'talent', label: 'タレント' },
  { value: 'voice-actor', label: '声優' },
  { value: 'dancer', label: 'ダンサー' },
  { value: 'singer', label: '歌手' },
  { value: 'influencer', label: 'インフルエンサー' },
  { value: 'mc', label: 'MC・司会' },
  { value: 'other', label: 'その他' }
]

export const OVERVIEW_SECTIONS = [
  { title: '基本情報', desc: '芸名・性別・生年月日・都道府県', step: 2 },
  { title: '写真', desc: '顔写真・全身写真のアップロード', step: 3 },
  { title: 'プロフィール詳細', desc: '身長・体重・自己紹介など', step: 4 },
  { title: '所属・ステータス', desc: '所属形態・仕事の受け方', step: 5 },
  { title: 'SNS情報', desc: 'SNSアカウント・フォロワー数', step: 6 }
]
