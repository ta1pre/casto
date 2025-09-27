# Cloudflare環境構築ガイド

## Cloudflareの役割（castoアプリ内）

### 🚀 Cloudflare Workers
- **API サーバー**: Next.jsからのAPIリクエストを処理
- **認証処理**: LINE/Email認証の検証
- **ビジネスロジック**: 応募・審査・課金処理
- **Webhook受信**: LINE・Stripe等の外部サービス連携

### 📦 Cloudflare R2
- **ファイルストレージ**: 応募者の動画・写真を保存
- **署名URL発行**: セキュアなアップロード機能

### ⚡ Cloudflare KV
- **キャッシュ**: 短期間のデータキャッシュ
- **セッション管理**: JWT無効化リスト

### 📬 Cloudflare Queues
- **非同期処理**: 通知送信・重い処理の順序保証

### 🗄️ データベースは別サービス
- **PostgreSQL**: Supabase/Neon/RDS等（Cloudflareではない）
- **データ永続化**: ユーザー情報、応募データ、課金情報

---

## 1. Cloudflare アカウント準備

### 必要な情報
1. **Cloudflareアカウント** (既存のsb2024.xyzドメイン管理アカウント)
2. **API Token** (Workers用)
3. **Account ID**
4. **Zone ID** (sb2024.xyz用)

## 2. API Token作成手順

### 2-1. Cloudflare Dashboard
1. https://dash.cloudflare.com/ にログイン
2. 右上のユーザーアイコン → "My Profile"
3. "API Tokens" タブ
4. "Create Token" → "Custom token"

### 2-2. Token設定
```
Token name: casto-workers-token
Permissions:
- Account: Cloudflare Workers:Edit
- Zone: Zone:Read (sb2024.xyz)
- Zone: Zone Settings:Edit (sb2024.xyz)
Account Resources: Include - All accounts
Zone Resources: Include - Specific zone (sb2024.xyz)
```

## 3. 環境変数設定

### 3-1. ローカル環境変数更新
```bash
# ~/.zshrc または ~/.bashrc に追加
export CLOUDFLARE_API_TOKEN="your_actual_api_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_actual_account_id_here"

# 古い環境変数を削除
unset CF_API_KEY
unset CF_EMAIL
unset CF_ZONE_ID
```

### 3-2. 設定反映
```bash
source ~/.zshrc
```

## 4. wrangler設定

### 4-1. 認証確認
```bash
cd /Users/taichiumeki/dev/services/casto/apps/workers
wrangler whoami
```

### 4-2. wrangler.toml更新
```toml
name = "casto-workers"
main = "src/index.ts"
compatibility_date = "2024-09-22"
compatibility_flags = ["nodejs_compat"]

# Account ID設定
account_id = "your_actual_account_id_here"

[env.development]
name = "casto-workers-dev"

[env.production]
name = "casto-workers"
```

### 現状メモ（本レポジトリの状態）
- `apps/workers/wrangler.toml` には `account_id` の明記は現時点でない（確認済み）。
- 実運用で `wrangler login` により解決している可能性はあるが、ここでは「わからない」。
- 明示的に `account_id` を記載すると運用が安定する場合がある（要関係者確認）。

## 5. R2バケット作成

### 5-1. 開発環境用
```bash
wrangler r2 bucket create casto-media-dev
wrangler r2 bucket create casto-uploads-dev
```

### 5-2. 本番環境用
```bash
wrangler r2 bucket create casto-media-prod
wrangler r2 bucket create casto-uploads-prod
```

## 6. KV Namespace作成

### 6-1. 開発環境用
```bash
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "CACHE"
```

### 6-2. wrangler.tomlに追加
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "actual_kv_namespace_id"
preview_id = "actual_preview_kv_namespace_id"
```

## 7. Queue作成

```bash
wrangler queues create notifications
```

## 8. シークレット設定

```bash
# JWT署名鍵
wrangler secret put JWT_SECRET

# データベースURL
wrangler secret put DATABASE_URL

# LINE設定
wrangler secret put LINE_CHANNEL_SECRET
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN

# Stripe設定
wrangler secret put STRIPE_SECRET_KEY
```

## 9. デプロイテスト

```bash
# 開発環境
wrangler deploy --env development

# 本番環境
wrangler deploy --env production
```

## 10. 動作確認

```bash
# ヘルスチェック
curl https://casto-workers-dev.your-subdomain.workers.dev/api/v1/health
curl https://casto-workers.your-subdomain.workers.dev/api/v1/health
```

## 次のステップ

1. ✅ API Token作成
2. ✅ 環境変数設定
3. ✅ wrangler認証確認
4. ✅ R2バケット作成
5. ✅ KV Namespace作成
6. ✅ Queue作成
7. ✅ シークレット設定
8. ✅ デプロイテスト
9. ✅ 動作確認

完了後、LINE LIFF設定に進みます。
