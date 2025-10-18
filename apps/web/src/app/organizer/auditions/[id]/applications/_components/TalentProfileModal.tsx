/**
 * タレントプロフィールモーダル
 * [SF][CA] 非同期読み込み・アニメーション対応
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface TalentProfile {
  userId: string
  stageName: string
  gender: string
  birthdate?: string
  prefecture: string
  occupation?: string
  height?: number
  weight?: number
  bust?: number
  waist?: number
  hip?: number
  achievements?: string
  affiliationType?: string
  agency?: string
  twitter?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  followers?: string
  photoFaceUrl?: string
  photoFullBodyUrl?: string
  completionRate: number
}

interface TalentProfileModalProps {
  talentId: string | null
  talentName: string
  isOpen: boolean
  onClose: () => void
}

export function TalentProfileModal({ talentId, talentName, isOpen, onClose }: TalentProfileModalProps) {
  const [profile, setProfile] = useState<TalentProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && talentId && !profile) {
      fetchProfile()
    }
  }, [isOpen, talentId])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const fetchProfile = async () => {
    if (!talentId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/organizer/talents/${talentId}/profile`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('プロフィールの取得に失敗しました')
      }
      
      const data = await response.json()
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const genderLabels = {
    male: '男性',
    female: '女性',
    other: 'その他',
  }

  const affiliationLabels = {
    freelance: 'フリーランス',
    'business-partner': '業務提携',
    exclusive: '専属',
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold">{profile?.stageName || talentName}</h2>
            <p className="text-sm text-gray-500">プロフィール完成度: {profile?.completionRate || 0}%</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchProfile}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                再試行
              </button>
            </div>
          )}

          {profile && !loading && (
            <div className="space-y-6">
              {/* 写真 */}
              {(profile.photoFaceUrl || profile.photoFullBodyUrl) && (
                <section>
                  <h3 className="text-lg font-bold mb-3 pb-2 border-b">写真</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {profile.photoFaceUrl && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">顔写真</p>
                        <img 
                          src={profile.photoFaceUrl} 
                          alt="顔写真" 
                          className="w-full h-64 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {profile.photoFullBodyUrl && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">全身写真</p>
                        <img 
                          src={profile.photoFullBodyUrl} 
                          alt="全身写真" 
                          className="w-full h-64 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 基本情報 */}
              <section>
                <h3 className="text-lg font-bold mb-3 pb-2 border-b">基本情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">性別</span>
                    <p className="font-medium">{genderLabels[profile.gender as keyof typeof genderLabels] || profile.gender}</p>
                  </div>
                  {profile.birthdate && (
                    <div>
                      <span className="text-sm text-gray-600">生年月日</span>
                      <p className="font-medium">{profile.birthdate}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">都道府県</span>
                    <p className="font-medium">{profile.prefecture}</p>
                  </div>
                  {profile.occupation && (
                    <div>
                      <span className="text-sm text-gray-600">職業</span>
                      <p className="font-medium">{profile.occupation}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* 体型情報 */}
              {(profile.height || profile.weight || profile.bust || profile.waist || profile.hip) && (
                <section>
                  <h3 className="text-lg font-bold mb-3 pb-2 border-b">体型情報</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {profile.height && (
                      <div>
                        <span className="text-sm text-gray-600">身長</span>
                        <p className="font-medium">{profile.height} cm</p>
                      </div>
                    )}
                    {profile.weight && (
                      <div>
                        <span className="text-sm text-gray-600">体重</span>
                        <p className="font-medium">{profile.weight} kg</p>
                      </div>
                    )}
                    {profile.bust && (
                      <div>
                        <span className="text-sm text-gray-600">バスト</span>
                        <p className="font-medium">{profile.bust} cm</p>
                      </div>
                    )}
                    {profile.waist && (
                      <div>
                        <span className="text-sm text-gray-600">ウエスト</span>
                        <p className="font-medium">{profile.waist} cm</p>
                      </div>
                    )}
                    {profile.hip && (
                      <div>
                        <span className="text-sm text-gray-600">ヒップ</span>
                        <p className="font-medium">{profile.hip} cm</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 実績・自己PR */}
              {profile.achievements && (
                <section>
                  <h3 className="text-lg font-bold mb-3 pb-2 border-b">実績・自己PR</h3>
                  <p className="text-sm whitespace-pre-wrap">{profile.achievements}</p>
                </section>
              )}

              {/* 所属情報 */}
              {(profile.affiliationType || profile.agency) && (
                <section>
                  <h3 className="text-lg font-bold mb-3 pb-2 border-b">所属情報</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {profile.affiliationType && (
                      <div>
                        <span className="text-sm text-gray-600">所属形態</span>
                        <p className="font-medium">{affiliationLabels[profile.affiliationType as keyof typeof affiliationLabels] || profile.affiliationType}</p>
                      </div>
                    )}
                    {profile.agency && (
                      <div>
                        <span className="text-sm text-gray-600">所属事務所</span>
                        <p className="font-medium">{profile.agency}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* SNS情報 */}
              {(profile.twitter || profile.instagram || profile.tiktok || profile.youtube || profile.followers) && (
                <section>
                  <h3 className="text-lg font-bold mb-3 pb-2 border-b">SNS情報</h3>
                  <div className="space-y-2">
                    {profile.twitter && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-24">Twitter</span>
                        <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          @{profile.twitter}
                        </a>
                      </div>
                    )}
                    {profile.instagram && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-24">Instagram</span>
                        <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          @{profile.instagram}
                        </a>
                      </div>
                    )}
                    {profile.tiktok && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-24">TikTok</span>
                        <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          @{profile.tiktok}
                        </a>
                      </div>
                    )}
                    {profile.youtube && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-24">YouTube</span>
                        <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.youtube}
                        </a>
                      </div>
                    )}
                    {profile.followers && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-24">フォロワー数</span>
                        <p className="font-medium">{profile.followers}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
