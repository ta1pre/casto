# Cloudflare Workers 環境変数設定ガイド（Wrangler 4.x）

## 概要
Cloudflare Workers で Supabase を使用するために必要な環境変数と、Wrangler 4.x での認証・CI 設定のポイントをまとめます。

## 必要な環境変数

### Supabase関連
- `SUPABASE_URL`: SupabaseプロジェクトのURL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー

### その他
- `ENVIRONMENT`: 実行環境（development/staging/production）
  
Wrangler 4.x の CI で使用する Cloudflare 認証環境変数:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン（Bearer トークン）
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare アカウント ID（`wrangler whoami` で確認可）

## 設定方法

### 1. wrangler CLI でのシークレット設定（Supabase）

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
```

### 3. wrangler.toml 設定

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

### 認証エラーが発生する場合（Wrangler 4.x）

- Wrangler 4.x は **API Token (Bearer)** を要求します。**Global API Key は使用しません**。
- `CLOUDFLARE_API_TOKEN` は **40 文字**であること（前後の空白・改行・引用符なし）
- GitHub Actions の Secrets に以下を設定:
  - `CLOUDFLARE_API_TOKEN`（テンプレート「Cloudflare Workers を編集する」で作成した API トークン）
  - `CLOUDFLARE_ACCOUNT_ID`（アカウント ID）
- Node.js は **v20 以上**（`actions/setup-node@v4` で `node-version: '20'`）

参考コマンド:
```bash
# 値の長さチェック（40であること）
echo -n "$CLOUDFLARE_API_TOKEN" | wc -c

# アカウント ID の取得（ローカル・OAuth）
npx wrangler login
npx wrangler whoami
```

### 環境変数が反映されない場合

1. デプロイ後に環境変数を設定した場合は再デプロイが必要
2. GitHub Actionsでデプロイする場合は、GitHub SecretsにCloudflare認証情報が必要

## 実践ガイド（CI/CD）

GitHub Actions（`.github/workflows/production-deploy.yml`）でのポイント:

- Node.js v20 を使用
- `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を Secrets から注入
- デプロイ前にトークンの CR/LF や前後空白を除去する最小の正規化を実施（ワークフロー内に実装済み）

## 用語: API Token と Global API Key の違い

- API Token（推奨）
  - `Authorization: Bearer <token>` で使用
  - テンプレート「Cloudflare Workers を編集する」で簡単作成
  - 長さは概ね 40 文字

- Global API Key（非推奨）
  - `X-Auth-Email` / `X-Auth-Key` 方式
  - Wrangler 4.x の CI では使用しない
