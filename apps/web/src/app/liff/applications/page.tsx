/**
 * マイ応募一覧ページ
 * [SF][CA] ステップ対応の応募管理
 */

import { MyApplicationsClient } from './_components/MyApplicationsClient'

export default function ApplicationsPage() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[ApplicationsPage] Rendering page')
  }
  return <MyApplicationsClient />
}
