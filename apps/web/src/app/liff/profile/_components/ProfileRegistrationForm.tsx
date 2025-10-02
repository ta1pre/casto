'use client'

import React, { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Camera,
  FileText,
  Briefcase,
  Share2,
  CheckCircle2
} from 'lucide-react'

interface ProfileFormData {
  // 基本情報（必須）
  stageName: string
  gender: string
  birthdate: string
  prefecture: string
  
  // 基本情報（任意）
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
  canMove: boolean | null
  canStay: boolean | null
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

const STEPS = [
  { id: 1, label: 'Eye', icon: Eye, name: 'プロフィール' },
  { id: 2, label: '基', icon: User, name: '基本情報' },
  { id: 3, label: '写', icon: Camera, name: '写真' },
  { id: 4, label: '詳', icon: FileText, name: 'プロフィール詳細' },
  { id: 5, label: '属', icon: Briefcase, name: '所属・ステータス' },
  { id: 6, label: 'SNS', icon: Share2, name: 'SNS情報' }
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

const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' }
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

  const calculateCompletion = () => {
    const totalFields = 24
    let filledFields = 0
    
    if (formData.stageName) filledFields++
    if (formData.gender) filledFields++
    if (formData.birthdate) filledFields++
    if (formData.prefecture) filledFields++
    if (formData.bio) filledFields++
    if (formData.height) filledFields++
    if (formData.weight) filledFields++
    if (formData.bust || formData.waist || formData.hip) filledFields++
    if (formData.shoeSize) filledFields++
    if (formData.activityAreas.length > 0) filledFields++
    if (formData.canMove !== null) filledFields++
    if (formData.canStay !== null) filledFields++
    if (formData.passportStatus) filledFields++
    if (formData.jobTypes.length > 0) filledFields++
    if (formData.affiliationType) filledFields++
    if (formData.workRequestType) filledFields++
    if (formData.agency) filledFields++
    if (formData.twitter) filledFields++
    if (formData.instagram) filledFields++
    if (formData.tiktok) filledFields++
    if (formData.youtube) filledFields++
    if (formData.followers) filledFields++
    
    return Math.round((filledFields / totalFields) * 100)
  }

  const completionRate = calculateCompletion()

  const getCompletionGradient = () => {
    if (completionRate < 30) return 'bg-gradient-to-r from-red-600 to-red-400'
    if (completionRate < 70) return 'bg-gradient-to-r from-yellow-600 to-yellow-400'
    return 'bg-gradient-to-r from-green-600 to-green-400'
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ヘッダー */}
      <header className="bg-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">プロフィール登録</h1>
        </div>
      </header>

      {/* 完成度カード */}
      <div className="bg-gradient-to-b from-secondary/30 to-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-border/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">プロフィール完成度</span>
                <span className="font-bold text-lg text-foreground">{completionRate}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-500 ease-out ${getCompletionGradient()}`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ステップナビゲーション */}
      <div className="bg-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const isDisabled = step.id > 2 && !isBasicInfoValid()
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.id)}
                      disabled={isDisabled}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'bg-foreground border-foreground text-background cursor-pointer hover:opacity-80'
                          : isActive
                            ? 'bg-background border-foreground text-foreground'
                            : isDisabled
                              ? 'bg-background border-border text-muted-foreground cursor-not-allowed'
                              : 'bg-background border-border text-muted-foreground cursor-pointer hover:border-foreground/50'
                      } ${!isDisabled ? 'active:scale-95' : ''}`}
                      aria-label={`${step.name}に移動`}
                    >
                      {step.label === 'Eye' ? (
                        <Icon className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{step.label}</span>
                      )}
                    </button>
                  </div>
                  {index < STEPS.length - 1 && <div className="h-0.5 bg-border flex-1 max-w-4" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 container max-w-2xl mx-auto px-4 py-6 pb-32">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                {STEPS[currentStep - 1] && React.createElement(STEPS[currentStep - 1].icon, { className: 'w-5 h-5 text-foreground' })}
              </div>
              <div>
                <CardTitle className="text-2xl">{STEPS[currentStep - 1]?.name}</CardTitle>
                <CardDescription>
                  ステップ {currentStep} / {STEPS.length}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* ステップ1: 概要 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      これから入力する項目の全体像です。各セクションから入力を始めましょう。
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: '基本情報', desc: '芸名・性別・生年月日・都道府県', step: 2 },
                      { title: '写真', desc: '顔写真・全身写真のアップロード', step: 3 },
                      { title: 'プロフィール詳細', desc: '身長・体重・自己紹介など', step: 4 },
                      { title: '所属・ステータス', desc: '所属形態・仕事の受け方', step: 5 },
                      { title: 'SNS情報', desc: 'SNSアカウント・フォロワー数', step: 6 }
                    ].map((section) => (
                      <Button
                        key={section.step}
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto py-4 px-4"
                        onClick={() => handleStepClick(section.step)}
                      >
                        <div className="text-left">
                          <div className="font-semibold">{section.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{section.desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* ステップ2: 基本情報 */}
              {currentStep === 2 && (
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
                    <Label>性別 *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {GENDERS.map((g) => (
                        <Button
                          key={g.value}
                          type="button"
                          variant={formData.gender === g.value ? 'default' : 'outline'}
                          onClick={() => updateFormData('gender', g.value)}
                        >
                          {g.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                        <option value="">選択</option>
                        {PREFECTURES.map((pref) => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                      </select>
                    </div>
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

              {/* ステップ3: 写真 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      顔写真と全身写真をアップロードします
                    </p>
                    <Button type="button" variant="outline" disabled>
                      写真をアップロード（実装予定）
                    </Button>
                  </div>
                </div>
              )}

              {/* ステップ4: プロフィール詳細 */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-3 gap-3">
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
                </div>
              )}

              {/* ステップ5: 所属・ステータス */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>対応可能な仕事（複数選択可）</Label>
                    <div className="grid grid-cols-2 gap-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="agency">所属事務所名（任意）</Label>
                    <Input
                      id="agency"
                      placeholder="事務所名を入力してください"
                      value={formData.agency}
                      onChange={(e) => updateFormData('agency', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ステップ6: SNS情報 */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">X（旧Twitter）</Label>
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
                    <Label htmlFor="instagram">Instagram</Label>
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
                    <Label htmlFor="tiktok">TikTok</Label>
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
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      placeholder="チャンネルURL"
                      value={formData.youtube}
                      onChange={(e) => updateFormData('youtube', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followers">合計フォロワー数</Label>
                    <Input
                      id="followers"
                      type="number"
                      placeholder="10000"
                      value={formData.followers}
                      onChange={(e) => updateFormData('followers', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* フッターナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="container max-w-2xl mx-auto px-4 py-4">
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
                disabled={currentStep === 2 && !isBasicInfoValid()}
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
        </div>
      </div>
    </div>
  )
}
