/**
 * プロフィールAPI統合テストページ
 * 
 * [TDT] GET/POST/PUT/PATCHの動作確認
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchProfile, saveProfile, updateProfile, patchProfile } from '@/app/liff/profile/api/profile'
import type { TalentProfileInput, TalentProfileResponse } from '@casto/shared'
import { calculateTalentProfileCompletion, validateTalentProfile } from '@casto/shared'

export default function ProfileTestPage() {
  const [profile, setProfile] = useState<TalentProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // 初回ロード時に認証状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      addLog('認証状態チェック中...')
      try {
        await fetchProfile()
        setAuthStatus('authenticated')
        addLog('✅ 認証OK')
      } catch (err) {
        const error = err as any
        if (error?.status === 401) {
          setAuthStatus('unauthenticated')
          addLog('❌ 未認証: LINE認証が必要です')
        } else if (error?.status === 404) {
          setAuthStatus('authenticated')
          addLog('✅ 認証OK（プロフィール未作成）')
        } else {
          setAuthStatus('unauthenticated')
          addLog(`❌ エラー: ${error?.message || 'Unknown error'}`)
        }
      }
    }
    checkAuth()
  }, [])

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    addLog('プロフィール取得開始...')
    try {
      const data = await fetchProfile()
      setProfile(data)
      addLog(`✅ 取得成功: ${data.stage_name} (完成度: ${data.completion_rate}%)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '取得失敗'
      setError(msg)
      addLog(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    addLog('プロフィール作成開始...')

    const testInput: TalentProfileInput = {
      stage_name: 'テスト太郎',
      gender: 'male',
      birthdate: '1995-05-15',
      prefecture: '東京都',
      occupation: 'モデル',
      height: 175,
      weight: 65,
      bust: 90,
      waist: 70,
      hip: 95,
      achievements: 'テスト用の自己PRです。',
      can_move: true,
      can_stay: false,
      passport_status: '有効',
      affiliation_type: 'freelance',
      agency: null,
      twitter: '@test_user',
      instagram: 'test_user',
      tiktok: null,
      youtube: null,
      followers: '1000'
    }

    // バリデーション確認
    const validation = validateTalentProfile(testInput)
    addLog(`バリデーション: ${validation.valid ? '✅ OK' : '❌ NG'}`)
    if (!validation.valid) {
      addLog(`エラー: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    // 完成度確認
    const completion = calculateTalentProfileCompletion(testInput)
    addLog(`完成度計算: ${completion.completionRate}% (${JSON.stringify(completion.sections)})`)

    try {
      const data = await saveProfile(testInput)
      setProfile(data)
      addLog(`✅ 作成成功: ${data.stage_name} (完成度: ${data.completion_rate}%)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '作成失敗'
      setError(msg)
      addLog(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!profile) {
      addLog('❌ プロフィールが存在しません')
      return
    }

    setLoading(true)
    setError(null)
    addLog('プロフィール更新開始...')

    const updatedInput: TalentProfileInput = {
      stage_name: profile.stage_name + ' (更新)',
      gender: profile.gender as 'male' | 'female' | 'other',
      birthdate: profile.birthdate,
      prefecture: profile.prefecture,
      occupation: profile.occupation || undefined,
      height: (profile.height || 0) + 1,
      weight: profile.weight || undefined,
      bust: profile.bust || undefined,
      waist: profile.waist || undefined,
      hip: profile.hip || undefined,
      achievements: profile.achievements || undefined,
      can_move: profile.can_move,
      can_stay: profile.can_stay,
      passport_status: profile.passport_status || undefined,
      affiliation_type: (profile.affiliation_type as 'freelance' | 'business-partner' | 'exclusive' | null) || undefined,
      agency: profile.agency || undefined,
      twitter: profile.twitter || undefined,
      instagram: profile.instagram || undefined,
      tiktok: profile.tiktok || undefined,
      youtube: profile.youtube || undefined,
      followers: profile.followers || undefined
    }

    try {
      const data = await updateProfile(updatedInput)
      setProfile(data)
      addLog(`✅ 更新成功: ${data.stage_name} (完成度: ${data.completion_rate}%)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '更新失敗'
      setError(msg)
      addLog(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePatch = async () => {
    setLoading(true)
    setError(null)
    addLog('プロフィール部分更新開始...')

    try {
      const data = await patchProfile({
        weight: 70,
        achievements: '部分更新テスト: ' + new Date().toLocaleTimeString()
      })
      setProfile(data)
      addLog(`✅ 部分更新成功: ${data.stage_name} (完成度: ${data.completion_rate}%)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '部分更新失敗'
      setError(msg)
      addLog(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">プロフィールAPI統合テスト</h1>

      {/* 認証状態表示 */}
      <div className="mb-6 p-4 rounded border">
        <div className="flex items-center gap-2">
          <span className="font-semibold">認証状態:</span>
          {authStatus === 'checking' && (
            <span className="text-gray-600">確認中...</span>
          )}
          {authStatus === 'authenticated' && (
            <span className="text-green-600">✅ 認証済み</span>
          )}
          {authStatus === 'unauthenticated' && (
            <>
              <span className="text-red-600">❌ 未認証</span>
              <Link 
                href="/test/auth/line" 
                className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                LINE認証ページへ
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex gap-4">
          <button
            onClick={handleFetch}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            GET: プロフィール取得
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            POST: プロフィール作成
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !profile}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            PUT: プロフィール更新
          </button>
          <button
            onClick={handlePatch}
            disabled={loading || !profile}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            PATCH: 部分更新
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            エラー: {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">プロフィールデータ</h2>
          {profile ? (
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">データなし</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">実行ログ</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono overflow-auto max-h-96">
            {log.length > 0 ? (
              log.map((line, i) => <div key={i}>{line}</div>)
            ) : (
              <div className="text-gray-500">ログなし</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
