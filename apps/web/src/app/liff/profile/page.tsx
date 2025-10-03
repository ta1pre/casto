'use client'

import React from 'react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { ProfileRegistrationForm } from './_components/ProfileRegistrationForm'

export default function ProfilePage() {
  const { user, isLoading, error } = useLiffAuth()

  if (isLoading) {
    return <LoadingScreen message="読み込み中..." />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  if (!user) {
    return <ErrorScreen message="認証に失敗しました" />
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ProfileRegistrationForm />
      </main>
    </div>
  )
}
