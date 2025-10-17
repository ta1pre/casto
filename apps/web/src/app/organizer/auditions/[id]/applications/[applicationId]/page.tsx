/**
 * 応募詳細・評価ページ
 * [SF][CA] ステップごとの評価管理
 */

import { ApplicationDetailClient } from './_components/ApplicationDetailClient'

export default async function ApplicationDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; applicationId: string }> 
}) {
  const { id, applicationId } = await params
  return <ApplicationDetailClient auditionId={id} applicationId={applicationId} />
}
