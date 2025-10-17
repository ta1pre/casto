/**
 * オーディション評価サービス（主催者側）
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionEvaluationRow,
  AuditionEvaluation,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
 */
function toAuditionEvaluation(row: SupabaseAuditionEvaluationRow): AuditionEvaluation {
  return {
    id: row.id,
    applicationId: row.application_id,
    stepId: row.step_id,
    evaluatorId: row.evaluator_id || undefined,
    score: row.score !== null ? row.score : undefined,
    comments: row.comments || undefined,
    result: row.result || undefined,
    evaluatedAt: row.evaluated_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 応募のステップ別評価一覧取得
 */
export async function getApplicationEvaluations(
  client: GenericSupabaseClient,
  applicationId: string
): Promise<AuditionEvaluation[]> {
  const { data, error } = await client
    .from('audition_step_evaluations')
    .select('*, audition_steps(title)')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch evaluations: ${error.message}`)
  }

  return (data || []).map((row: any) => {
    const evaluation = toAuditionEvaluation(row)
    if (row.audition_steps?.title) {
      evaluation.stepTitle = row.audition_steps.title
    }
    return evaluation
  })
}

/**
 * 評価取得（単一）
 */
export async function getEvaluationById(
  client: GenericSupabaseClient,
  evaluationId: string
): Promise<AuditionEvaluation | null> {
  const { data, error } = await client
    .from('audition_step_evaluations')
    .select('*')
    .eq('id', evaluationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch evaluation: ${error.message}`)
  }

  return toAuditionEvaluation(data)
}

/**
 * 評価作成
 */
export async function createEvaluation(
  client: GenericSupabaseClient,
  applicationId: string,
  stepId: string,
  evaluatorId: string,
  data: CreateEvaluationRequest
): Promise<AuditionEvaluation> {
  // 既に評価が存在するか確認
  const { data: existing, error: checkError } = await client
    .from('audition_step_evaluations')
    .select('id')
    .eq('application_id', applicationId)
    .eq('step_id', stepId)
    .maybeSingle()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Failed to check existing evaluation: ${checkError.message}`)
  }

  if (existing) {
    throw new Error('Evaluation already exists for this step')
  }

  const { data: newEvaluation, error: insertError } = await client
    .from('audition_step_evaluations')
    .insert({
      application_id: applicationId,
      step_id: stepId,
      evaluator_id: evaluatorId,
      score: data.score !== undefined ? data.score : null,
      comments: data.comments || null,
      result: data.result || null,
      evaluated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create evaluation: ${insertError.message}`)
  }

  return toAuditionEvaluation(newEvaluation)
}

/**
 * 評価更新
 */
export async function updateEvaluation(
  client: GenericSupabaseClient,
  evaluationId: string,
  data: UpdateEvaluationRequest
): Promise<AuditionEvaluation> {
  const updateData: any = {}

  if (data.score !== undefined) {
    updateData.score = data.score
  }
  if (data.comments !== undefined) {
    updateData.comments = data.comments || null
  }
  if (data.result !== undefined) {
    updateData.result = data.result
  }

  // 更新があれば評価日時も更新
  if (Object.keys(updateData).length > 0) {
    updateData.evaluated_at = new Date().toISOString()
  }

  const { data: updatedEvaluation, error } = await client
    .from('audition_step_evaluations')
    .update(updateData)
    .eq('id', evaluationId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update evaluation: ${error.message}`)
  }

  return toAuditionEvaluation(updatedEvaluation)
}

/**
 * 評価削除
 */
export async function deleteEvaluation(
  client: GenericSupabaseClient,
  evaluationId: string
): Promise<void> {
  const { error } = await client
    .from('audition_step_evaluations')
    .delete()
    .eq('id', evaluationId)

  if (error) {
    throw new Error(`Failed to delete evaluation: ${error.message}`)
  }
}
