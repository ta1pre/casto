/**
 * 応募者一覧ページ
 * [SF][CA] オーディションへの応募管理
 */

import { ApplicationsPageClient } from './_components/ApplicationsPageClient'

export default async function ApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ApplicationsPageClient auditionId={id} />
}
