/**
 * 応募者一覧ページ
 * [SF][CA] ステップ対応の応募管理
 */

import { StepApplicationsClient } from './_components/StepApplicationsClient'

export default async function ApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StepApplicationsClient auditionId={id} />
}
