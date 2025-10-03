'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AlertCircle } from "lucide-react"
import { UsersTable } from './_components/UsersTable'
import { ApiTestCards } from './_components/ApiTestCards'
import { UserCreateForm, type UserFormData } from './_components/UserCreateForm'
import { TestResultDisplay } from './_components/TestResultDisplay'
import { UsersOverview } from './_components/UsersOverview'
import { useApiTest } from './_hooks/useApiTest'
import { useUsersData } from './_hooks/useUsersData'
import type { UserUpsertRequest } from '@casto/shared'

export const dynamic = 'force-dynamic'

const INITIAL_FORM_DATA: UserFormData = {
  provider: 'email',
  handle: '',
  role: 'applicant'
}

export default function TestPage() {
  const { loading, result, executeApiCall, reset: resetResult } = useApiTest()
  const [userForm, setUserForm] = useState<UserFormData>(INITIAL_FORM_DATA)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  const {
    users,
    stats,
    lastFetchedAt,
    loading: usersLoading,
    error: usersError,
    refresh: refreshUsers
  } = useUsersData(API_BASE)

  const pageDescription = useMemo(() => {
    return `Workers API のエンドポイントをブラウザ上で直接テストするためのハーネスです。` +
      ` 共通パッケージ (@casto/shared) で定義した型を使って、レスポンスの整合性を確認できます。`
  }, [])

  if (!API_BASE) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            APIベースURLが設定されていません。環境変数 NEXT_PUBLIC_API_BASE_URL を確認してください。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const testHealthCheck = () => {
    if (!API_BASE) return
    executeApiCall(`${API_BASE}/api/v1/health`, 'GET', 'Health Check')
  }

  const testGetUsers = async () => {
    if (!API_BASE) return
    const success = await executeApiCall(`${API_BASE}/api/v1/users`, 'GET', 'Get Users')
    if (success) {
      await refreshUsers()
    }
  }

  const testCreateUser = async (payload: UserUpsertRequest) => {
    if (!API_BASE) return

    const success = await executeApiCall(`${API_BASE}/api/v1/users`, 'POST', 'Create User', payload)
    if (success) {
      await refreshUsers()
      setUserForm((prev) => ({ ...prev, handle: '' }))
    }
  }

  const resetAllStates = async () => {
    resetResult()
    setUserForm({ ...INITIAL_FORM_DATA })
    await refreshUsers()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold">Workers API テストハーネス</h1>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">/api/v1</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {pageDescription}
        </p>
      </div>

      <UsersOverview
        stats={stats}
        lastFetchedAt={lastFetchedAt}
        loading={usersLoading}
        onRefresh={refreshUsers}
      />

      <UsersTable 
        users={users}
        loading={usersLoading}
        error={usersError}
        onRefresh={refreshUsers}
      />
      
      <ApiTestCards
        loading={loading}
        onHealthCheck={testHealthCheck}
        onGetUsers={testGetUsers}
        onReset={resetAllStates}
      />

      <UserCreateForm
        formData={userForm}
        loading={loading}
        onFormChange={setUserForm}
        onSubmit={testCreateUser}
      />

      <TestResultDisplay result={result} />

      <Card>
        <CardHeader>
          <CardTitle>🔗 API Endpoints</CardTitle>
          <CardDescription>このページで使用する Workers API のエンドポイント一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono text-muted-foreground">
            <p>GET&nbsp;&nbsp;&nbsp;{API_BASE}/api/v1/health</p>
            <p>GET&nbsp;&nbsp;&nbsp;{API_BASE}/api/v1/users</p>
            <p>POST&nbsp;{API_BASE}/api/v1/users</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
