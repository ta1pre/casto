# Cloudflare Workers 環境変数設定ガイド

## 概要
Cloudflare WorkersでSupabaseを使用するために必要な環境変数の設定方法を説明します。

## 必要な環境変数

### Supabase関連
- `SUPABASE_URL`: SupabaseプロジェクトのURL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー

### その他
- `ENVIRONMENT`: 実行環境（development/staging/production）

## 設定方法

### 1. wrangler CLIでの設定

```bash
# プロダクション環境
cd apps/workers
npx wrangler secret put SUPABASE_URL --env production
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production

# ステージング環境
npx wrangler secret put SUPABASE_URL --env staging
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging
```

### 2. 環境変数の確認

```bash
# シークレット一覧の確認
npx wrangler secret list --env production
npx wrangler secret list --env staging

# 環境変数の確認（デバッグ用APIエンドポイント）
curl https://casto-workers.casto-api.workers.dev/api/v1/debug/env
```

### 3. wrangler.toml設定

```toml
[env.production]
name = "casto-workers"
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "casto-workers-stg"
vars = { ENVIRONMENT = "staging" }

# Secrets (use `wrangler secret put` to set)
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
```

## トラブルシューティング

### 認証エラーが発生する場合

```bash
# 環境変数の確認
env | grep -E "(CF_|CLOUDFLARE_)"

# 正しいAPIキーの設定
export CLOUDFLARE_API_KEY="your_actual_api_key"
export CLOUDFLARE_EMAIL="your_email@example.com"
```

### 環境変数が反映されない場合

1. デプロイ後に環境変数を設定した場合は再デプロイが必要
2. GitHub Actionsでデプロイする場合は、GitHub SecretsにCloudflare認証情報が必要

## 現在の問題

- Cloudflare WorkersにSupabase環境変数が設定されていない
- そのため`/api/v1/users`エンドポイントで404エラーが発生
- 認証情報が正しく設定されていないため、wrangler CLIでの操作ができない

## 修正手順

1. Cloudflare APIキーを正しく設定
2. Supabase環境変数をwrangler CLIで設定
3. 再デプロイして動作確認
