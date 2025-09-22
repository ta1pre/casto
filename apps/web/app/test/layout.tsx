import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Test - casto',
  description: 'API connectivity test page',
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
