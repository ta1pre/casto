# Cloudflare Workers 環境変数設定ガイド

## 概要
Cloudflare WorkersでSupabaseを使用するために必要な環境変数の設定方法を説明します。

## 必要な環境変数

### Supabase関連
- `SUPABASE_URL`: SupabaseプロジェクトのURL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー

### その他
- `ENVIRONMENT`: 実行環境（development / production）

## 設定方法

### 1. wrangler CLIでの設定

```bash
# development 環境
cd apps/workers
npx wrangler secret put SUPABASE_URL --env development
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env development

# production 環境
npx wrangler secret put SUPABASE_URL --env production
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
```

### 2. 環境変数の確認

```bash
# シークレット一覧の確認
npx wrangler secret list --env development
npx wrangler secret list --env production
```

### 3. wrangler.toml設定

```toml
[env.production]
name = "casto-workers"
vars = { ENVIRONMENT = "production" }

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

- わからない（本レポジトリからは外部環境の設定有無を確認できない）

## 修正手順

1. Cloudflare APIキーを正しく設定（わからない場合はダッシュボードで再発行・権限確認）
2. Supabase環境変数を wrangler CLI または CI/CD（GitHub Actions）で設定
3. 再デプロイして動作確認（到達性・API応答は実環境で確認）

## CI/CD 連携メモ（確認済みの設定）

GitHub Actions（`.github/workflows/production-deploy.yml`）では、`cloudflare/wrangler-action@v3` を用いて `apps/workers` を本番デプロイし、以下のシークレットを注入しています（リポジトリSecretsに設定が必要）：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

wrangler.toml 側では以下が定義されています（確認済み）：

- [env.production] に `vars = { ENVIRONMENT = "production" }`
- ルートに `ENVIRONMENT = "development"`（デフォルト変数）

なお、`/api/v1/users` のエラーは環境変数未設定時に 500 を返す可能性があるため（コード実装上のエラーハンドリング）、404 とは限りません。
