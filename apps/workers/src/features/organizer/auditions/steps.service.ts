/**
 * オーディションステップサービス
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionStepRow,
  AuditionStep,
  CreateAuditionStepRequest,
  UpdateAuditionStepRequest,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
 */
function toAuditionStep(row: SupabaseAuditionStepRow): AuditionStep {
  return {
    id: row.id,
    auditionId: row.audition_id,
    stepOrder: row.step_order,
    stepType: row.step_type,
    title: row.title,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * オーディションのステップ一覧取得
 */
export async function getAuditionSteps(
  client: GenericSupabaseClient,
  auditionId: string
): Promise<AuditionStep[]> {
  const { data, error } = await client
    .from('audition_steps')
    .select('*')
    .eq('audition_id', auditionId)
    .order('step_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch steps: ${error.message}`)
  }

  return (data || []).map(toAuditionStep)
}

/**
 * ステップ作成
 */
export async function createAuditionStep(
  client: GenericSupabaseClient,
  auditionId: string,
  data: CreateAuditionStepRequest
): Promise<AuditionStep> {
  // 次のstep_orderを取得
  const { data: existingSteps, error: fetchError } = await client
    .from('audition_steps')
    .select('step_order')
    .eq('audition_id', auditionId)
    .order('step_order', { ascending: false })
    .limit(1)

  if (fetchError) {
    throw new Error(`Failed to fetch existing steps: ${fetchError.message}`)
  }

  const nextOrder = existingSteps && existingSteps.length > 0 
    ? existingSteps[0].step_order + 1 
    : 2  // 1は書類選考用に予約

  const { data: newStep, error: insertError } = await client
    .from('audition_steps')
    .insert({
      audition_id: auditionId,
      step_order: nextOrder,
      step_type: data.stepType || 'custom',
      title: data.title,
      description: data.description || null,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create step: ${insertError.message}`)
  }

  return toAuditionStep(newStep)
}

/**
 * ステップ更新
 */
export async function updateAuditionStep(
  client: GenericSupabaseClient,
  stepId: string,
  auditionId: string,
  data: UpdateAuditionStepRequest
): Promise<AuditionStep> {
  const updateData: any = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null

  const { data: updatedStep, error } = await client
    .from('audition_steps')
    .update(updateData)
    .eq('id', stepId)
    .eq('audition_id', auditionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update step: ${error.message}`)
  }

  return toAuditionStep(updatedStep)
}

/**
 * ステップ削除
 */
export async function deleteAuditionStep(
  client: GenericSupabaseClient,
  stepId: string,
  auditionId: string
): Promise<void> {
  // 書類選考（step_order = 1）は削除不可
  const { data: step, error: fetchError } = await client
    .from('audition_steps')
    .select('step_order, step_type')
    .eq('id', stepId)
    .eq('audition_id', auditionId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch step: ${fetchError.message}`)
  }

  if (!step) {
    throw new Error('Step not found')
  }

  if (step.step_type === 'document_screening' || step.step_order === 1) {
    throw new Error('Cannot delete document screening step')
  }

  const { error: deleteError } = await client
    .from('audition_steps')
    .delete()
    .eq('id', stepId)
    .eq('audition_id', auditionId)

  if (deleteError) {
    throw new Error(`Failed to delete step: ${deleteError.message}`)
  }
}

/**
 * オーディション公開時に書類選考ステップを自動作成
 */
export async function createDocumentScreeningStep(
  client: GenericSupabaseClient,
  auditionId: string
): Promise<AuditionStep> {
  // 既に書類選考ステップが存在するか確認
  const { data: existing, error: checkError } = await client
    .from('audition_steps')
    .select('id')
    .eq('audition_id', auditionId)
    .eq('step_order', 1)
    .maybeSingle()

  if (checkError) {
    throw new Error(`Failed to check existing document screening: ${checkError.message}`)
  }

  // 既に存在する場合はそれを返す
  if (existing) {
    const { data: existingStep, error: fetchError } = await client
      .from('audition_steps')
      .select('*')
      .eq('id', existing.id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch existing step: ${fetchError.message}`)
    }

    return toAuditionStep(existingStep)
  }

  // 新規作成
  const { data: newStep, error: insertError } = await client
    .from('audition_steps')
    .insert({
      audition_id: auditionId,
      step_order: 1,
      step_type: 'document_screening',
      title: '書類選考',
      description: '応募フォーム送信後、書類選考を実施します。',
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create document screening step: ${insertError.message}`)
  }

  return toAuditionStep(newStep)
}
