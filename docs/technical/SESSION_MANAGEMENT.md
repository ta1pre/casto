# セッション管理アーキテクチャ

## 概要

Castoのセッション管理は、LINEトークンとJWTクッキーの二重管理により、長時間のセッション維持を実現しています。

## 問題の背景

### 発生していた問題
- **症状**: 長時間（24時間以上）放置後にアクセスすると401エラーが一瞬表示され、無限ループに陥る
- **原因**: JWTクッキーの有効期限（24時間）が切れた後、セッション延長機能がなかった

### 無限ループのメカニズム
1. JWTクッキーが24時間で期限切れ
2. `AuthProvider`が`/api/v1/auth/session`を呼び出し → 401エラー
3. `useLiffAuth`がLINEトークンで再認証を試みる
4. LINEトークンも期限切れ → `liff.login()`でリダイレクト
5. リダイレクト後、1に戻る（無限ループ）

## 解決策

### 1. セッション取得時のクッキー自動延長 [REH]

**実装場所**: `apps/workers/src/features/auth/routes.ts`

```typescript
authRoutes.get('/auth/session', async (c) => {
  // ... ユーザー情報取得 ...
  
  // 新しいJWTトークンを発行してクッキーを更新
  const token = await createJWT({
    userId: data.id,
    roles: userContext.roles,
    provider,
    tokenVersion: data.token_version ?? 0
  }, jwtSecret)
  
  setAuthCookie(c, token) // 24時間延長
})
```

**効果**: セッション取得のたびにクッキーの有効期限が24時間延長される

### 2. 定期的なセッションリフレッシュ [REH]

**実装場所**: `apps/web/src/shared/providers/AuthProvider.tsx`

```typescript
useEffect(() => {
  if (!user) return
  
  const REFRESH_INTERVAL = 20 * 60 * 1000 // 20分
  
  const intervalId = setInterval(async () => {
    if (document.hidden) return // ページ非表示時はスキップ
    
    await refreshSession() // クッキー延長
  }, REFRESH_INTERVAL)
  
  return () => clearInterval(intervalId)
}, [user, refreshSession])
```

**効果**: アクティブなユーザーは20分ごとに自動的にセッションが延長される

### 3. LINEトークンリフレッシュ時のJWT更新 [REH]

**実装場所**: `apps/web/src/shared/hooks/useLiffAuth.ts`

```typescript
// 50分ごとにLINEトークンをリフレッシュ
const intervalId = setInterval(async () => {
  const newToken = window.liff.getIDToken?.()
  if (newToken) {
    await loginWithLine(newToken) // LINE認証
    await refreshSession() // JWTクッキーも更新
  }
}, 50 * 60 * 1000)
```

**効果**: LINEトークンの更新と同時にJWTクッキーも更新され、同期が保たれる

### 4. LINEトークン期限切れ時のサイレントリフレッシュ [SF][REH]

**実装場所**: `apps/web/src/shared/hooks/useLiffAuth.ts`

```typescript
// トークン期限切れエラーを検知
if (isTokenExpiredError) {
  // LIFFのログイン状態を確認
  if (window.liff?.isLoggedIn()) {
    // 新しいトークンを取得してリトライ
    const freshToken = window.liff.getIDToken?.()
    if (freshToken && freshToken !== oldToken) {
      return synchronizeLineSession(true) // サイレントリトライ
    }
  }
  
  // サイレントリフレッシュ失敗 → liff.login()でリダイレクト
  window.liff.login()
}
```

**効果**: 
- **ケース1（成功）**: LINEトークンが期限切れでも、LIFFがログイン済みなら**ページリダイレクトなし**で自動回復
- **ケース2（失敗）**: LIFFのセッションも切れている場合のみ、ユーザーに再ログインを促す

## セッション延長のタイミング

| タイミング | 間隔 | 実装場所 | 目的 |
|-----------|------|---------|------|
| セッション取得時 | 毎回 | `auth/routes.ts` | 基本的な延長機能 |
| 定期リフレッシュ | 20分 | `AuthProvider.tsx` | アクティブユーザーの維持 |
| LINEトークン更新 | 50分 | `useLiffAuth.ts` | LINE認証との同期 |
| トークン期限切れ検知時 | エラー時 | `useLiffAuth.ts` | サイレント自動回復 |

## トークンの有効期限

| トークン種別 | 有効期限 | リフレッシュ間隔 | 備考 |
|------------|---------|----------------|------|
| LINEトークン | 60分 | 50分 | LIFFが管理 |
| JWTクッキー | 24時間 | 20分（定期）| バックエンドが管理 |

## セキュリティ考慮事項

### クッキー設定
- `httpOnly: true` - XSS攻撃からの保護
- `secure: true` - HTTPS通信のみ（本番環境）
- `sameSite: 'None'` - クロスオリジンリクエスト対応（LINEアプリ内）
- `path: '/'` - 全パスで有効

### トークンバージョニング
- `token_version`フィールドでトークンの無効化が可能
- ユーザーのパスワード変更やセキュリティ侵害時に全セッションを無効化できる

## パフォーマンス最適化

### バッテリー節約 [PA]
- ページが非表示（`document.hidden`）の場合、定期リフレッシュをスキップ
- アプリがバックグラウンドの場合、不要な通信を削減

### ネットワーク効率
- セッション取得は既存のAPI呼び出しに統合
- 追加のネットワークリクエストは最小限

## トラブルシューティング

### セッションが切れる場合
1. ブラウザのクッキー設定を確認
2. 開発者ツールでクッキーの有効期限を確認
3. ネットワークタブで`/api/v1/auth/session`のレスポンスを確認

### 無限ループが発生する場合
1. LINEトークンの有効性を確認（`window.liff.isLoggedIn()`）
2. デバッグパネルで認証フローを確認
3. ブラウザのコンソールログを確認

## 今後の改善案

- [ ] セッション有効期限の動的調整（ユーザーの活動パターンに応じて）
- [ ] リフレッシュトークンの導入（より長期的なセッション維持）
- [ ] セッション管理のメトリクス収集（延長回数、失敗率など）

---

**最終更新**: 2025-10-05
