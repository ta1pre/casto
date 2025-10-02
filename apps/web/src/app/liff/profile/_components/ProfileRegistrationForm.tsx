'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface ProfileFormData {
  // 基本情報（必須）
  stageName: string
  gender: string
  birthdate: string
  prefecture: string
  
  // 基本情報（任意）
  realName: string
  bio: string
  
  // 体型情報
  height: string
  weight: string
  bust: string
  waist: string
  hip: string
  shoeSize: string
  
  // 活動情報
  activityAreas: string[]
  canMove: boolean
  canStay: boolean
  passportStatus: string
  
  // 仕事情報
  jobTypes: string[]
  affiliationType: string
  workRequestType: string
  agency: string
  
  // SNS情報
  twitter: string
  instagram: string
  tiktok: string
  youtube: string
  followers: string
}

const INITIAL_FORM_DATA: ProfileFormData = {
  stageName: '',
  gender: '',
  birthdate: '',
  prefecture: '',
  realName: '',
  bio: '',
  height: '',
  weight: '',
  bust: '',
  waist: '',
  hip: '',
  shoeSize: '',
  activityAreas: [],
  canMove: false,
  canStay: false,
  passportStatus: 'none',
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

const STEPS = [
  { id: 1, title: '基本情報', description: '芸名・性別・生年月日など' },
  { id: 2, title: '体型情報', description: '身長・体重など' },
  { id: 3, title: '活動エリア', description: '活動可能な地域' },
  { id: 4, title: '対応可能な仕事', description: '受けられる仕事の種類' },
  { id: 5, title: '事務所情報', description: '所属・契約形態' },
  { id: 6, title: 'SNS情報', description: 'ソーシャルメディア' }
]

const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' }
]

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

const JOB_TYPES = [
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

export function ProfileRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA)

  const updateFormData = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isBasicInfoValid = () => {
    return formData.stageName && formData.gender && formData.birthdate && formData.prefecture
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log('Form submitted:', formData)
    alert('プロフィール登録完了！（モックデータ）')
  }

  const calculateCompletion = () => {
    const totalFields = Object.keys(formData).length
    const filledFields = Object.values(formData).filter(v => {
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'boolean') return v
      return v !== '' && v !== null && v !== undefined
    }).length
    return Math.round((filledFields / totalFields) * 100)
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ヘッダー */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center text-foreground">プロフィール登録</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            ステップ {currentStep} / {STEPS.length}
          </p>
        </div>
      </header>

      {/* 進捗バー */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full mx-1 ${
                step.id <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{STEPS[currentStep - 1]?.title}</span>
          <span>{calculateCompletion()}% 完成</span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {/* ステップ1: 基本情報 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stageName">芸名・活動名 *</Label>
                    <Input
                      id="stageName"
                      placeholder="例: 山田 太郎"
                      value={formData.stageName}
                      onChange={(e) => updateFormData('stageName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="realName">本名（任意）</Label>
                    <Input
                      id="realName"
                      placeholder="本名を入力"
                      value={formData.realName}
                      onChange={(e) => updateFormData('realName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>性別 *</Label>
                    <div className="flex gap-2">
                      {GENDERS.map((g) => (
                        <Button
                          key={g.value}
                          type="button"
                          variant={formData.gender === g.value ? 'default' : 'outline'}
                          onClick={() => updateFormData('gender', g.value)}
                          className="flex-1"
                        >
                          {g.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthdate">生年月日 *</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => updateFormData('birthdate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prefecture">都道府県 *</Label>
                    <select
                      id="prefecture"
                      value={formData.prefecture}
                      onChange={(e) => updateFormData('prefecture', e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                      required
                    >
                      <option value="">選択してください</option>
                      {PREFECTURES.map((pref) => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">自己紹介（任意）</Label>
                    <textarea
                      id="bio"
                      placeholder="あなたの魅力をアピールしてください"
                      value={formData.bio}
                      onChange={(e) => updateFormData('bio', e.target.value)}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {/* ステップ2: 体型情報 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">身長（cm）</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="170"
                        value={formData.height}
                        onChange={(e) => updateFormData('height', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">体重（kg）</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="60"
                        value={formData.weight}
                        onChange={(e) => updateFormData('weight', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bust">バスト（cm）</Label>
                      <Input
                        id="bust"
                        type="number"
                        placeholder="85"
                        value={formData.bust}
                        onChange={(e) => updateFormData('bust', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waist">ウエスト（cm）</Label>
                      <Input
                        id="waist"
                        type="number"
                        placeholder="65"
                        value={formData.waist}
                        onChange={(e) => updateFormData('waist', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hip">ヒップ（cm）</Label>
                      <Input
                        id="hip"
                        type="number"
                        placeholder="90"
                        value={formData.hip}
                        onChange={(e) => updateFormData('hip', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shoeSize">靴のサイズ（cm）</Label>
                    <Input
                      id="shoeSize"
                      type="number"
                      step="0.5"
                      placeholder="25.5"
                      value={formData.shoeSize}
                      onChange={(e) => updateFormData('shoeSize', e.target.value)}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground mt-4">
                    💡 体型情報は任意ですが、モデル案件では重要な情報となります
                  </p>
                </div>
              )}

              {/* ステップ3: 活動エリア */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    📍 活動可能な地域や移動に関する情報を入力してください
                  </p>
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-center text-sm text-muted-foreground">
                      活動エリアの選択機能は実装中です
                    </p>
                  </div>
                </div>
              )}

              {/* ステップ4: 対応可能な仕事 */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    どのような仕事に対応できますか？（複数選択可）
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {JOB_TYPES.map((job) => (
                      <Button
                        key={job.value}
                        type="button"
                        variant={formData.jobTypes.includes(job.value) ? 'default' : 'outline'}
                        onClick={() => {
                          const newJobTypes = formData.jobTypes.includes(job.value)
                            ? formData.jobTypes.filter(j => j !== job.value)
                            : [...formData.jobTypes, job.value]
                          updateFormData('jobTypes', newJobTypes)
                        }}
                        className="h-auto py-3"
                      >
                        {job.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* ステップ5: 事務所情報 */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agency">所属事務所名（任意）</Label>
                    <Input
                      id="agency"
                      placeholder="事務所名を入力してください"
                      value={formData.agency}
                      onChange={(e) => updateFormData('agency', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      名義上の所属や業務委託先がある場合は記入してください
                    </p>
                  </div>
                </div>
              )}

              {/* ステップ6: SNS情報 */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">X（旧Twitter）アカウント</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        id="twitter"
                        placeholder="username"
                        value={formData.twitter}
                        onChange={(e) => updateFormData('twitter', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram アカウント</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        id="instagram"
                        placeholder="username"
                        value={formData.instagram}
                        onChange={(e) => updateFormData('instagram', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok アカウント</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        id="tiktok"
                        placeholder="username"
                        value={formData.tiktok}
                        onChange={(e) => updateFormData('tiktok', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube チャンネル</Label>
                    <Input
                      id="youtube"
                      placeholder="チャンネルURL"
                      value={formData.youtube}
                      onChange={(e) => updateFormData('youtube', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followers">合計フォロワー数（任意）</Label>
                    <Input
                      id="followers"
                      type="number"
                      placeholder="10000"
                      value={formData.followers}
                      onChange={(e) => updateFormData('followers', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">全SNSの合計フォロワー数の目安</p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* フッターナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-none"
                  disabled={currentStep === 1 && !isBasicInfoValid()}
                >
                  次へ
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none"
                >
                  登録完了
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
            {currentStep >= 1 && currentStep < STEPS.length && (
              <p className="text-xs text-muted-foreground text-center">入力内容は自動保存されます</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
