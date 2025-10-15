/**
 * オーディション詳細ページ
 * [SF][CA] 詳細表示・編集・応募者一覧
 */

import { AuditionDetailPageClient } from './_components/AuditionDetailPageClient'

export default async function AuditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AuditionDetailPageClient auditionId={id} />
}
