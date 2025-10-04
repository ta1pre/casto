# LINE IDトークン リフレッシュ戦略

## 背景

LINEのIDトークンは**発行から約1時間**で期限切れとなります。期限切れトークンをAPIに送信すると`401 Unauthorized`エラー（`IdToken expired`）が返されます。

## 実装済みの解決策

### ✅ Phase 1: エラー時の自動再認証 [REH][SF]（完了）

**実装場所**: `apps/web/src/shared/hooks/useLiffAuth.ts` の `synchronizeLineSession()`

**動作**:
1. APIから401エラー + `"IdToken expired"`メッセージを受信
2. `isReloginInProgressRef`フラグを立てて、同時実行を防止
3. 即座に`window.liff.login()`を実行（ページリダイレクト）
4. リダイレクト中は他の認証処理をスキップ
5. ログイン成功後、フラグをリセット

**コード**:
```typescript
// リログイン中の場合は処理をスキップ
if (isReloginInProgressRef.current) {
  console.log('[useLiffAuth] Skipping synchronization (re-login in progress)')
  return
}

// ... 認証処理 ...

const isTokenExpiredError = 
  !isRetry &&
  apiError?.status === 401 &&
  apiError.body &&
  typeof apiError.body === 'object' &&
  'details' in apiError.body &&
  typeof apiError.body.details === 'string' &&
  (apiError.body.details.includes('IdToken expired') || 
   apiError.body.details.includes('expired'))

if (isTokenExpiredError) {
  console.warn('[useLiffAuth] ID token expired, triggering re-login')
  setError('LINEトークンの有効期限が切れました。再認証します...')
  
  // リログイン中フラグを立てる（無限ループ防止）
  isReloginInProgressRef.current = true
  
  // liff.login()はページをリダイレクトするため、即座に実行
  if (window.liff) {
    window.liff.login()
  }
  return
}

// 認証成功したらフラグをリセット
await loginWithLine(idToken)
isReloginInProgressRef.current = false
```

**メリット**:
- ✅ 追加ライブラリ不要
- ✅ 最小限のコード変更
- ✅ 他の認証方式（email等）への影響なし
- ✅ エラーが自動的に処理される
- ✅ 無限ループ防止機構搭載

**デメリット**:
- ⚠️ エラーが一度発生してから対処（reactive）
- ⚠️ 短時間だがユーザーにエラーメッセージが表示される
- ⚠️ ページリダイレクトが発生するため、入力中のデータは失われる可能性

---

### ✅ Phase 2: プロアクティブなトークンリフレッシュ [PA][SF]（完了）

**コンセプト**: トークン期限切れを**事前に防ぐ**

**実装場所**: `apps/web/src/shared/hooks/useLiffAuth.ts`

**動作**:
1. ユーザーがログイン後、50分ごとに自動でトークンをリフレッシュ
2. アプリが非アクティブ（バックグラウンド）の場合はスキップ
3. リフレッシュ失敗時はPhase 1のエラーハンドリングがフォールバック

**コード概要**:
```typescript
useEffect(() => {
  if (!isLiffReady || !user) return

  let isActive = true

  // アプリが非アクティブな場合はスキップ（バッテリー節約）
  const handleVisibilityChange = () => {
    isActive = !document.hidden
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  // 50分ごとにリフレッシュ（60分の期限より前）
  const REFRESH_INTERVAL = 50 * 60 * 1000
  const intervalId = setInterval(async () => {
    if (!isActive || !window.liff?.isLoggedIn()) return

    try {
      const newToken = window.liff.getIDToken?.()
      if (newToken) {
        await loginWithLine(newToken)
      }
    } catch (err) {
      // 失敗しても既存のフォールバック（Phase 1）が動作する
    }
  }, REFRESH_INTERVAL)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    clearInterval(intervalId)
  }
}, [isLiffReady, user, loginWithLine, addLog])
```

**メリット**:
- ✅ ユーザーがエラーを見ることがない
- ✅ シームレスな体験
- ✅ Phase 1と組み合わせて多層防御
- ✅ バックグラウンド時はスキップでバッテリー節約

**デメリット**:
- ⚠️ バックグラウンドで定期的なAPIリクエスト（50分に1回）
- ⚠️ わずかなバッテリー消費増（ただしVisibility APIで最適化済み）

---

## 非推奨案

### ❌ JWT有効期限の事前チェック

**必要ライブラリ**: `jwt-decode` [DM違反]

```typescript
import { jwtDecode } from 'jwt-decode'

const synchronizeLineSession = useCallback(async (isRetry = false) => {
  // ... 既存コード ...
  
  const idToken = window.liff.getIDToken?.()
  if (idToken) {
    try {
      const decoded = jwtDecode<{ exp: number }>(idToken)
      const expiresAt = decoded.exp * 1000 // ミリ秒に変換
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now
      
      // 有効期限まで5分未満の場合は再取得
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.warn('[useLiffAuth] Token expires soon, refreshing...')
        window.liff.login()
        return
      }
    } catch (err) {
      // デコードエラーは無視（既存のフローに進む）
    }
  }
  
  // ... 既存コード ...
}, [loginWithLine, updateWindowLiff, addLog])
```

**メリット**:
- ✅ 期限切れ直前に確実にリフレッシュ
- ✅ オンデマンドで動作（定期実行なし）

**デメリット**:
- ❌ 新しいライブラリ依存が発生 [DM]
- ⚠️ APIコール時のみチェック（バックグラウンドでは動作しない）

---

## 実装状況

1. **✅ 完了**: Phase 1（エラー時の自動再認証）
2. **✅ 完了**: Phase 2（プロアクティブなトークンリフレッシュ）
   - Phase 1と組み合わせて多層防御を実現
3. **✅ 完了**: Phase 3（サイレントトークンリフレッシュ）
   - `liff.init()`再実行によるトークンリフレッシュ
   - ログアウトせずにトークンを更新
   - ページリダイレクトなしでシームレスな体験
4. **❌ 非推奨**: JWT有効期限の事前チェック
   - [DM]違反のため実装せず

---

## メール認証との関係

**結論**: 現時点では**影響なし**

- **LINE認証（LIFF）**: IDトークンは1時間で期限切れ
- **メール認証（マジックリンク）**: JWTトークンはサーバー側で管理
  - 期限はバックエンドの`JWT_EXPIRATION`設定による
  - 通常は長期間有効（例：7日間）
  
**将来的な統一戦略**:
もし複数の認証方式でトークンリフレッシュが必要になった場合：
1. `AuthProvider`に統一的な`refreshToken()`メソッドを追加
2. 各認証プロバイダー（LINE、email）で実装を分岐
3. `useLiffAuth`は内部で`refreshToken()`を呼び出す

---

## テスト方法

### Phase 1のテスト
1. LIFFアプリを開く
2. 1時間以上待つ（または手動でトークンの`exp`を過去に設定）
3. 何らかのアクションを実行
4. エラーメッセージ「LINEトークンの有効期限が切れました。再認証します...」が表示
5. 自動的に`liff.login()`が呼ばれ、再認証される

### Phase 2のテスト（実装案A）
1. LIFFアプリを開く
2. ブラウザのコンソールで定期実行のログを確認
3. 50分後に自動的にトークンがリフレッシュされる
4. エラーが発生しないことを確認

---

## パフォーマンス考慮 [PA]

### 実装案Aのコスト
- **APIリクエスト**: 50分に1回 = 1日あたり約28回
- **データ量**: トークン検証APIは軽量（数KB）
- **バッテリー影響**: 最小限（ネイティブアプリのバックグラウンドタスクと同等）

### 最適化
- アプリがフォアグラウンドにある場合のみリフレッシュ
- ユーザーが非アクティブな場合はスキップ

```typescript
useEffect(() => {
  if (!isLiffReady || !user) return

  let isActive = true
  
  // Visibility APIで非アクティブ時はスキップ
  const handleVisibilityChange = () => {
    isActive = !document.hidden
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  const REFRESH_INTERVAL = 50 * 60 * 1000
  const intervalId = setInterval(async () => {
    if (!isActive) {
      console.log('[useLiffAuth] Skipping refresh (app inactive)')
      return
    }
    
    // リフレッシュ処理...
  }, REFRESH_INTERVAL)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    clearInterval(intervalId)
  }
}, [isLiffReady, user, loginWithLine, addLog])
```

---

## まとめ

| アプローチ | シンプルさ | UX | 依存関係 | 状態 |
|-----------|----------|-----|---------|-------|
| Phase 1: エラー時の自動再認証 | ⭐⭐⭐ | ⭐⭐ | ✅ なし | **✅ 実装済み** |
| Phase 2: 定期的リフレッシュ | ⭐⭐ | ⭐⭐⭐ | ✅ なし | **✅ 実装済み** |
| JWT事前チェック | ⭐ | ⭐⭐⭐ | ❌ jwt-decode | ❌ 非推奨 |

**最終実装**: Phase 1 + Phase 2 の多層防御システム [SF][REH][PA]

### 動作の流れ

1. **通常時**: 50分ごとに自動でトークンをリフレッシュ（Phase 2）
2. **リフレッシュ失敗時**: エラー発生でPhase 1が自動で再認証
3. **バックグラウンド時**: Phase 2はスキップ、エラー時のみPhase 1が動作

これにより、**ユーザーはほぼエラーを見ることなく**シームレスに利用できます。

---

## Phase 3: サイレントトークンリフレッシュ [REH][SF]（完了）

### 問題の背景

Phase 1とPhase 2の実装後、以下の問題が発見されました:

**症状**: しばらく時間をあけてアクセスすると、401エラーで無限ループに陥る

**根本原因**:
1. LINE IDトークンが期限切れ（約1時間）
2. `synchronizeLineSession()`が401エラーを検知
3. エラーハンドリングで`window.liff.login()`を呼び出し
4. **`liff.login()`がページをリダイレクト** → ユーザーセッションが失われる
5. リダイレクト後、再度`useLiffAuth`が初期化される
6. **古いIDトークンが再利用される** → 再び401エラー
7. 2〜6を無限に繰り返す

**問題の核心**: 
- `liff.login()`は**完全なログアウト + 再ログイン**を実行
- ページリダイレクトが発生し、ユーザー体験が悪い
- 入力中のデータが失われる

### 正しいアプローチ: `liff.init()`の再実行

LIFF SDKの公式ドキュメントによると:

> **IDトークンの取得タイミング**
> - LIFFブラウザ: `liff.init()`時に自動取得
> - 外部ブラウザ: `liff.login()` → ログイン → **再度`liff.init()`** で取得

つまり、**`liff.init()`を再実行すれば、ログアウトせずに新しいトークンを取得できる**！

### 解決策

#### サイレントトークンリフレッシュ

トークン期限切れ検知時に`liff.init()`を再実行:

```typescript
if (isTokenExpiredError) {
  console.warn('[useLiffAuth] ID token expired, attempting silent refresh via liff.init()')
  
  // 同時実行防止フラグを立てる [REH]
  if (isRefreshingRef.current) {
    console.log('[useLiffAuth] Token refresh already in progress, skipping')
    return
  }
  
  isRefreshingRef.current = true
  setError('トークンを更新中...')
  
  try {
    // liff.init()を再実行してトークンをリフレッシュ [SF]
    // これによりログアウトせずに新しいトークンを取得できる
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
    if (window.liff && liffId) {
      console.log('[useLiffAuth] Re-initializing LIFF to refresh token...')
      await window.liff.init({ liffId })
      
      // 新しいトークンを取得
      const freshToken = window.liff.getIDToken?.()
      if (freshToken && freshToken !== idToken) {
        console.log('[useLiffAuth] Got fresh token after re-init, retrying authentication')
        isRefreshingRef.current = false
        return synchronizeLineSession(true) // リトライ
      } else {
        console.warn('[useLiffAuth] Re-init did not provide a fresh token')
        setError('トークンの更新に失敗しました。ページを再読み込みしてください。')
      }
    }
  } catch (reinitError) {
    console.error('[useLiffAuth] Failed to re-initialize LIFF:', reinitError)
    setError('トークンの更新に失敗しました。ページを再読み込みしてください。')
  } finally {
    isRefreshingRef.current = false
  }
  return
}
```

### メリット

- ✅ **ログアウトしない**: ユーザーセッションを維持
- ✅ **ページリダイレクトなし**: シームレスな体験
- ✅ **入力データを保持**: フォーム入力が失われない
- ✅ **シンプルな実装**: LocalStorage不要
- ✅ **追加ライブラリ不要**: [DM]準拠

### デメリット

- ⚠️ `liff.init()`が新しいトークンを返さない場合、手動再読み込みが必要

### 動作フロー

1. **通常時**: Phase 2が50分ごとに自動リフレッシュ
2. **トークン期限切れ検知**: `liff.init()`を再実行してトークンをリフレッシュ
3. **新しいトークン取得**: 認証APIを再実行
4. **リフレッシュ失敗**: エラーメッセージを表示し、手動再読み込みを促す
5. **認証成功**: フラグをリセット

これにより、**ユーザーをログアウトさせずに**トークンをリフレッシュできます。
