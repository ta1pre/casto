/**
 * Admin オーディション詳細ページ
 * [SF][CA] 詳細表示・編集リンク
 */

import { AuditionDetailPageClient } from './_components/AuditionDetailPageClient'

export default async function AdminAuditionDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  return <AuditionDetailPageClient auditionId={id} />
}
