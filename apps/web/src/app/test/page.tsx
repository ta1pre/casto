'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { UsersTable } from './_components/UsersTable'
import { ApiTestCards } from './_components/ApiTestCards'
import { UserCreateForm } from './_components/UserCreateForm'
import { TestResultDisplay } from './_components/TestResultDisplay'
import { useApiTest } from './_hooks/useApiTest'
import { useUsersData } from './_hooks/useUsersData'

export const dynamic = 'force-dynamic'

export default function TestPage() {
  const { loading, result, executeApiCall } = useApiTest()
  const [userForm, setUserForm] = useState({
    provider: 'email',
    handle: '',
    role: 'applicant'
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  const {
    users,
    loading: usersLoading,
    error: usersError,
    refresh: refreshUsers
  } = useUsersData(API_BASE)

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

  const testCreateUser = async () => {
    if (!API_BASE || !userForm.handle) return
    const success = await executeApiCall(`${API_BASE}/api/v1/users`, 'POST', 'Create User', userForm)
    if (success) {
      await refreshUsers()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-2">
        🔍 Workers API 接続テスト
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        更新日時: 2025/10/01
      </p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">🎯 テスト目的</AlertTitle>
        <AlertDescription className="text-sm">
          • Workers API経由でのデータ取得・表示<br/>
          • usersテーブルのCRUD操作確認<br/>
          • ブラウザの開発者ツール（F12）→ コンソールタブで詳細ログを確認できます
        </AlertDescription>
      </Alert>

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
      />

      <UserCreateForm
        formData={userForm}
        loading={loading}
        onFormChange={setUserForm}
        onSubmit={testCreateUser}
      />

      <TestResultDisplay result={result} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔗 API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm font-mono text-muted-foreground">
            <p>GET {API_BASE}/api/v1/health</p>
            <p>GET {API_BASE}/api/v1/users</p>
            <p>POST {API_BASE}/api/v1/users</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
