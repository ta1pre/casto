/**
 * 主催者レイアウト
 * [SF][CA] 認証ガード + 共通ヘッダー付きレイアウト
 */

import { ReactNode } from 'react'
import { OrganizerLayout as Layout } from './_components/OrganizerLayout'

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>
}
