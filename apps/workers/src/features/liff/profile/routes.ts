/**
 * タレントプロフィールAPIルート
 * 
 * [CA][REH] GET/POST/PUT/PATCH /api/v1/liff/profile
 */

import { Hono } from 'hono'
import { verifyLineToken } from '../../../middleware/verifyLineToken'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getTalentProfile,
  upsertTalentProfile,
  serializeTalentProfileResponse
} from './service'
import type { TalentProfileInput } from '@casto/shared'
import type { AppBindings } from '../../../types'

const profileRoutes = new Hono<AppBindings>()

// すべてのプロフィールルートにLINE認証ミドルウェアを適用
profileRoutes.use('/*', verifyLineToken)

/**
 * プロフィール取得
 * GET /api/v1/liff/profile
 */
profileRoutes.get('/', async (c) => {
  try {
    const userContext = c.get('user')
    console.log('[Profile GET] userContext:', userContext ? { id: userContext.id, provider: userContext.provider } : null)
    
    if (!userContext) {
      console.error('[Profile GET] No user context - returning 401')
      return c.json({ error: 'Unauthorized', detail: 'No authentication context' }, 401)
    }

    const supabase = createSupabaseClient(c)
    const profile = await getTalentProfile(supabase, userContext.id)

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    return c.json({
      profile: serializeTalentProfileResponse(profile)
    })
  } catch (error) {
    console.error('[Profile] Failed to fetch profile:', error)
    return c.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
})

/**
 * プロフィール作成・更新（POST）
 * POST /api/v1/liff/profile
 */
profileRoutes.post('/', async (c) => {
  try {
    const userContext = c.get('user')
    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const input = await c.req.json<TalentProfileInput>()
    const supabase = createSupabaseClient(c)

    const profile = await upsertTalentProfile(supabase, userContext.id, input)

    return c.json({
      profile: serializeTalentProfileResponse(profile)
    }, 201)
  } catch (error) {
    console.error('[Profile] Failed to create/update profile:', error)
    
    // バリデーションエラーの場合は400を返す
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return c.json(
        {
          error: 'Validation error',
          details: error.message
        },
        400
      )
    }

    return c.json(
      {
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
})

/**
 * プロフィール更新（PUT）
 * PUT /api/v1/liff/profile
 */
profileRoutes.put('/', async (c) => {
  try {
    const userContext = c.get('user')
    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const input = await c.req.json<TalentProfileInput>()
    const supabase = createSupabaseClient(c)

    const profile = await upsertTalentProfile(supabase, userContext.id, input)

    return c.json({
      profile: serializeTalentProfileResponse(profile)
    })
  } catch (error) {
    console.error('[Profile] Failed to update profile:', error)
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return c.json(
        {
          error: 'Validation error',
          details: error.message
        },
        400
      )
    }

    return c.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
})

/**
 * プロフィール部分更新（PATCH）
 * PATCH /api/v1/liff/profile
 */
profileRoutes.patch('/', async (c) => {
  try {
    const userContext = c.get('user')
    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    
    // 既存プロフィールを取得
    const existingProfile = await getTalentProfile(supabase, userContext.id)
    if (!existingProfile) {
      return c.json({ error: 'Profile not found. Please create a profile first.' }, 404)
    }

    // 部分更新データを取得
    const partialInput = await c.req.json<Partial<TalentProfileInput>>()

    // 既存データとマージ
    const mergedInput: TalentProfileInput = {
      stage_name: partialInput.stage_name ?? existingProfile.stage_name,
      gender: partialInput.gender ?? (existingProfile.gender as any),
      birthdate: partialInput.birthdate ?? existingProfile.birthdate,
      prefecture: partialInput.prefecture ?? existingProfile.prefecture,
      occupation: partialInput.occupation ?? existingProfile.occupation,
      height: partialInput.height ?? existingProfile.height,
      weight: partialInput.weight ?? existingProfile.weight,
      bust: partialInput.bust ?? existingProfile.bust,
      waist: partialInput.waist ?? existingProfile.waist,
      hip: partialInput.hip ?? existingProfile.hip,
      achievements: partialInput.achievements ?? existingProfile.achievements,
      can_move: partialInput.can_move ?? existingProfile.can_move,
      can_stay: partialInput.can_stay ?? existingProfile.can_stay,
      passport_status: partialInput.passport_status ?? existingProfile.passport_status,
      affiliation_type: partialInput.affiliation_type ?? (existingProfile.affiliation_type as any),
      agency: partialInput.agency ?? existingProfile.agency,
      twitter: partialInput.twitter ?? existingProfile.twitter,
      instagram: partialInput.instagram ?? existingProfile.instagram,
      tiktok: partialInput.tiktok ?? existingProfile.tiktok,
      youtube: partialInput.youtube ?? existingProfile.youtube,
      followers: partialInput.followers ?? existingProfile.followers,
      photo_face_url: partialInput.photo_face_url ?? existingProfile.photo_face_url,
      photo_full_body_url: partialInput.photo_full_body_url ?? existingProfile.photo_full_body_url
    }

    const profile = await upsertTalentProfile(supabase, userContext.id, mergedInput)

    return c.json({
      profile: serializeTalentProfileResponse(profile)
    })
  } catch (error) {
    console.error('[Profile] Failed to patch profile:', error)
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return c.json(
        {
          error: 'Validation error',
          details: error.message
        },
        400
      )
    }

    return c.json(
      {
        error: 'Failed to patch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
})

export default profileRoutes
