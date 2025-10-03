# LINE認証実装ドキュメント

## 概要
LINEミニアプリ（LIFF）経由でのユーザー認証・自動登録機能を実装しました。

## 実装内容

### Workers側（バックエンド）

#### 1. 認証サービス (`apps/workers/src/features/auth/service.ts`)
- **`verifyLineIdToken()`**: LINE IDトークンをLINE APIで検証し、プロフィール情報を取得
- **`upsertLineUser()`**: LINEユーザーをDBに自動登録（UPSERT）
  - 初回アクセス時: 新規ユーザー作成（role: applicant）
  - 2回目以降: 既存ユーザー情報を更新

#### 2. 認証ルート (`apps/workers/src/features/auth/routes.ts`)
- **POST `/api/v1/auth/line/verify`**: LINE認証エンドポイント
  - IDトークン検証
  - ユーザー登録/更新
  - JWT生成・Cookieセット
  - 成功時にユーザー情報を返却
  
- **GET `/api/v1/auth/session`**: セッション取得
  - Cookie内のJWTを検証
  - 現在のユーザー情報を返却
  
- **POST `/api/v1/auth/logout`**: ログアウト
  - 認証Cookieをクリア

#### 3. アプリケーション統合 (`apps/workers/src/app.ts`)
- `authRoutes`を`/api/v1`配下に追加

### フロントエンド側（既存実装）

#### 1. 認証フック (`apps/web/src/shared/hooks/useLiffAuth.ts`)
- LIFF SDK自動読み込み
- LINE認証の自動実行
- `loginWithLine()` 経由でWorkers APIを呼び出し

#### 2. 認証プロバイダー (`apps/web/src/shared/providers/AuthProvider.tsx`)
- `loginWithLine()`: `/api/v1/auth/line/verify`を呼び出し
- セッション管理

## フロー

### 初回アクセス時（未登録ユーザー）
1. ユーザーがLINEミニアプリを開く
2. LIFF SDK初期化 → `window.liff.getIDToken()` でIDトークン取得
3. フロントエンド: `loginWithLine(idToken)` → `POST /api/v1/auth/line/verify`
4. Workers: LINE APIでIDトークン検証 → プロフィール取得
5. Workers: `users`テーブルにUPSERT（新規作成）
6. Workers: JWT生成 → Cookieセット → ユーザー情報返却
7. フロントエンド: ユーザー状態更新 → 登録完了

### 2回目以降（登録済みユーザー）
1. ユーザーがLINEミニアプリを開く
2. LIFF SDK初期化 → IDトークン取得
3. フロントエンド: `loginWithLine(idToken)`
4. Workers: IDトークン検証 → 既存ユーザー情報を更新（UPSERT）
5. Workers: JWT生成 → セッション確立
6. フロントエンド: ユーザー状態復元 → ログイン完了

## データベース

### `users`テーブル
```sql
-- LINE認証で登録されるユーザー
INSERT INTO users (
  line_user_id,
  display_name,
  picture_url,
  auth_provider,
  role,
  is_active,
  token_version
) VALUES (
  'U1234567890abcdef...',  -- LINE User ID
  'ユーザー名',
  'https://profile.line-scdn.net/...',
  'line',
  'applicant',
  true,
  0
)
ON CONFLICT (line_user_id) DO UPDATE
SET 
  display_name = EXCLUDED.display_name,
  picture_url = EXCLUDED.picture_url,
  updated_at = NOW();
```

## 環境変数

### Workers (Cloudflare Workers)
```bash
JWT_SECRET=<your-secret>
LINE_CHANNEL_ID=<your-line-channel-id>
LINE_CHANNEL_SECRET=<your-line-channel-secret>  # 現時点では未使用
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Web (Next.js)
```bash
NEXT_PUBLIC_LINE_LIFF_ID=<your-liff-id>
NEXT_PUBLIC_API_BASE_URL=https://casto-workers-dev.casto-api.workers.dev
```

## セキュリティ

### JWT Cookie設定
- **HttpOnly**: XSS攻撃対策
- **Secure**: HTTPS環境のみ送信
- **SameSite**: CSRF対策（本番環境: None、ローカル: Lax）
- **有効期限**: 24時間

### LINE IDトークン検証
- LINE公式API (`https://api.line.me/oauth2/v2.1/verify`) で検証
- チャネルIDが一致しない場合は認証失敗

## テスト手順

### 1. ローカル開発環境
```bash
# Workersを起動
cd apps/workers
npm run dev

# Webを起動
cd apps/web
npm run dev
```

### 2. LINE認証テスト（ブラウザ）
1. `http://localhost:3000/liff` にアクセス
2. デバッグ情報で認証フロー確認

### 3. LINE認証テスト（LINEアプリ内）
1. LINEアプリでミニアプリURL開く
2. 自動認証実行を確認
3. Workers側ログで以下を確認:
   - `[Auth] LINE profile verified: U1234...`
   - `[Auth] User upserted: <uuid>`

### 4. API直接テスト
```bash
# IDトークンを取得（LINEアプリのDevToolsから）
curl -X POST http://localhost:8787/api/v1/auth/line/verify \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<your-id-token>"}'

# セッション確認
curl -X GET http://localhost:8787/api/v1/auth/session \
  -H "Cookie: casto_auth=<jwt-token>"
```

## トラブルシューティング

### 問題: IDトークン検証失敗
**原因**: `LINE_CHANNEL_ID`が正しく設定されていない  
**解決**: `wrangler secret put LINE_CHANNEL_ID --env dev`

### 問題: ユーザー登録失敗
**原因**: Supabase接続エラーまたはテーブル不足  
**解決**: 
1. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`を確認
2. `users`テーブルのマイグレーション適用を確認

### 問題: Cookie送信されない
**原因**: CORS設定またはSameSite設定  
**解決**: 
1. `ALLOWED_ORIGINS`に正しいドメイン追加
2. 本番環境でHTTPS使用を確認

## 次のステップ

- [ ] LINEアプリ内での動作確認（Phase 1.5）
- [ ] プロフィール機能の実装（Phase 2）
- [ ] エラーハンドリング強化（Phase 4）
- [ ] セッション自動更新機能（Phase 3）

## 参考資料
- [LINE Login API](https://developers.line.biz/ja/docs/line-login/)
- [LIFF SDK](https://developers.line.biz/ja/docs/liff/)
- [Hono Documentation](https://hono.dev/)
