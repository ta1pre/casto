'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

export default function DesignTestPage() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* ヘッダー */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Casto デザインシステム</h1>
          <p className="text-muted-foreground">
            Tailwind CSS + shadcn/ui コンポーネントショーケース
          </p>
        </div>

        {/* タイポグラフィ */}
        <Card>
          <CardHeader>
            <CardTitle>タイポグラフィ</CardTitle>
            <CardDescription>フォントサイズとウェイトのバリエーション</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold">見出し1 (text-4xl font-bold)</h1>
              <h2 className="text-3xl font-semibold">見出し2 (text-3xl font-semibold)</h2>
              <h3 className="text-2xl font-semibold">見出し3 (text-2xl font-semibold)</h3>
              <h4 className="text-xl font-medium">見出し4 (text-xl font-medium)</h4>
              <p className="text-base">本文テキスト (text-base)</p>
              <p className="text-sm text-muted-foreground">小さいテキスト (text-sm)</p>
              <p className="text-xs text-muted-foreground">極小テキスト (text-xs)</p>
            </div>
          </CardContent>
        </Card>

        {/* ボタン */}
        <Card>
          <CardHeader>
            <CardTitle>ボタン</CardTitle>
            <CardDescription>各種バリアントとサイズ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">バリアント</p>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">サイズ</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">状態</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  アイコン付き
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* カード */}
        <Card>
          <CardHeader>
            <CardTitle>カード</CardTitle>
            <CardDescription>カードコンポーネントのバリエーション</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>カード1</CardTitle>
                  <CardDescription>説明文がここに入ります</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">カードのコンテンツ</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">アクション</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>カード2</CardTitle>
                  <CardDescription>別の説明文</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">別のコンテンツ</p>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>強調カード</CardTitle>
                  <CardDescription>ボーダーで強調</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">重要な情報</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>フォーム要素</CardTitle>
            <CardDescription>入力フィールドとラベル</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" placeholder="山田太郎" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" placeholder="example@casto.jp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="controlled">制御された入力</Label>
              <Input 
                id="controlled" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="入力してください"
              />
              <p className="text-xs text-muted-foreground">
                入力値: {inputValue || '(空)'}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button>送信</Button>
          </CardFooter>
        </Card>

        {/* アラート */}
        <Card>
          <CardHeader>
            <CardTitle>アラート</CardTitle>
            <CardDescription>通知とメッセージ表示</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>情報</AlertTitle>
              <AlertDescription>
                これは情報メッセージです。ユーザーに何かを伝えます。
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>
                エラーが発生しました。入力内容を確認してください。
              </AlertDescription>
            </Alert>

            <Alert className="border-green-500 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>成功</AlertTitle>
              <AlertDescription>
                操作が正常に完了しました。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* カラーパレット */}
        <Card>
          <CardHeader>
            <CardTitle>カラーパレット</CardTitle>
            <CardDescription>デザイントークンのカラー</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary" />
                <p className="text-sm font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-secondary" />
                <p className="text-sm font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-accent" />
                <p className="text-sm font-medium">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-destructive" />
                <p className="text-sm font-medium">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-muted" />
                <p className="text-sm font-medium">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border-2 bg-card" />
                <p className="text-sm font-medium">Card</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border-2 bg-popover" />
                <p className="text-sm font-medium">Popover</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg border-2 bg-background" />
                <p className="text-sm font-medium">Background</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スペーシング */}
        <Card>
          <CardHeader>
            <CardTitle>スペーシング</CardTitle>
            <CardDescription>余白のバリエーション</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-8 bg-primary" />
                <span className="text-sm">1 (4px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-8 bg-primary" />
                <span className="text-sm">2 (8px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-8 bg-primary" />
                <span className="text-sm">4 (16px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary" />
                <span className="text-sm">8 (32px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 bg-primary" />
                <span className="text-sm">16 (64px)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* レスポンシブグリッド */}
        <Card>
          <CardHeader>
            <CardTitle>レスポンシブグリッド</CardTitle>
            <CardDescription>画面サイズに応じて変化するレイアウト</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">アイテム {i}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Casto Design System v1.0.0
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by Tailwind CSS + shadcn/ui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
