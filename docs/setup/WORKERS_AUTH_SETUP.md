# Workers認証機能セットアップガイド

## 必要な環境変数

### ローカル開発用（`.dev.vars`）

`apps/workers/.dev.vars` を以下のように設定してください：

```bash
# JWT認証用シークレット（任意の長い文字列）
JWT_SECRET="your-random-secret-minimum-32-characters"

# Supabase接続情報
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# LINE認証用
LINE_CHANNEL_ID="1234567890"
LINE_CHANNEL_SECRET="abcdef1234567890..."

# CORS設定
ALLOWED_ORIGINS="https://casto.sb2024.xyz,http://localhost:3000"

# 環境識別
ENVIRONMENT=development
```

### 本番環境用（Cloudflare Secrets）

```bash
cd apps/workers

# 必須secrets設定
wrangler secret put JWT_SECRET --env development
wrangler secret put SUPABASE_URL --env development
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env development
wrangler secret put LINE_CHANNEL_ID --env development
wrangler secret put LINE_CHANNEL_SECRET --env development
wrangler secret put ALLOWED_ORIGINS --env development
```

## セットアップ手順

⚠️ **重要**: Workersはローカル実行せず、Cloudflare環境にデプロイして動作確認を行います。

### 1. 型チェック

```bash
cd apps/workers
npm run type-check
```

### 2. Cloudflare Secretsを設定

```bash
cd apps/workers

# 必須secrets設定
wrangler secret put JWT_SECRET --env development
wrangler secret put SUPABASE_URL --env development
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env development
wrangler secret put LINE_CHANNEL_ID --env development
wrangler secret put ALLOWED_ORIGINS --env development
```

各値を入力プロンプトで設定してください。

### 3. development環境へデプロイ

```bash
# Cloudflareにログイン（初回のみ）
wrangler login

# development環境にデプロイ
npm run deploy:dev
```

デプロイ先: `https://casto.sb2024.xyz/api/*` (routesで設定済み)

### 4. デプロイされたAPIをテスト

```bash
# ヘルスチェック
curl https://casto.sb2024.xyz/api/v1/health

# 認証エンドポイント確認（エラーでもOK、404でなければ登録済み）
curl -X POST https://casto.sb2024.xyz/api/v1/auth/line/verify \
  -H "Content-Type: application/json" \
  -d '{"idToken":"dummy"}'
```

### 5. ログ確認

```bash
# リアルタイムログ監視
npm run tail:dev

# または
wrangler tail --env development
```

## トラブルシューティング

### エラー: "Supabase credentials not configured"

**原因**: `.dev.vars` に `SUPABASE_URL` または `SUPABASE_SERVICE_ROLE_KEY` が未設定

**解決**: `.dev.vars` に正しい値を設定して Workers を再起動

### エラー: "LINE_CHANNEL_ID is not configured"

**原因**: LINE認証の環境変数が未設定

**解決**: `.dev.vars` に `LINE_CHANNEL_ID` を追加

### エラー: "CORS error"

**原因**: `ALLOWED_ORIGINS` に Web アプリのドメインが含まれていない

**解決**: `.dev.vars` の `ALLOWED_ORIGINS` を確認

### デプロイしても404が返る

**原因1**: ルーティング設定が反映されていない  
**解決**: `wrangler.toml` の `routes` 設定を確認し、再デプロイ

**原因2**: ドメインのDNS設定が未完了  
**解決**: Cloudflare DashboardでDNS設定を確認

## 必要な値の取得方法

### Supabase URL と Service Role Key

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. Settings → API
4. "Project URL" と "service_role secret" をコピー

### LINE Channel ID と Channel Secret

1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. プロバイダーとチャネルを選択
3. Basic settings タブ
4. "Channel ID" と "Channel secret" をコピー

### JWT Secret

任意のランダム文字列（32文字以上推奨）を生成：

```bash
openssl rand -base64 32
```

## 次のステップ

環境変数設定完了後：
1. ローカルでWorkersを起動して動作確認
2. development環境にデプロイ
3. LINEミニアプリから実際にアクセスしてテスト
4. Supabase DBで `users` テーブルにレコードが作成されているか確認
