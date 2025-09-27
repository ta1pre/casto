# Cloudflare Workers開発環境セットアップ

## 🎯 目的
本番環境と同じ設定で、開発専用のCloudflare Workerを作成する

## ✅ 構築完了状況（2025-09-23）

**完璧な開発環境が完成しました：**

| コンポーネント | 環境 | URL | 状態 |
|---------------|------|-----|------|
| **Frontend** | Docker Next.js | https://casto.sb2024.xyz | ✅ 動作中 |
| **Backend** | Cloudflare Workers Dev | https://casto-workers-dev.casto-api.workers.dev | ✅ 動作中 |
| **Database** | Supabase Production | 本番DB共用 | ✅ 接続済み |

**環境変数設定ポリシー：**
- `NEXT_PUBLIC_API_BASE_URL` など公開可能値は Git 管理下に残してよい。
- `SUPABASE_*` や `JWT_SECRET` など機密値は Git に含めず、`wrangler secret put` / GitHub Secrets / Vercel Secrets で管理する。
- 本番 Supabase と同一インスタンスを利用するため、権限管理とキーのローテーションを定期的に行う。

## 📋 手順

### Step 1: Cloudflare認証設定

```bash
cd services/casto/apps/workers

# 認証（ブラウザが開きます）
npx wrangler auth login

# 認証確認
npx wrangler whoami
```

### Step 2: 開発用Workerをデプロイ

```bash
# 開発環境用Workerをデプロイ
npx wrangler deploy --env development

# 成功すると以下のURLが取得できます:
# https://casto-workers-dev.casto-api.workers.dev
```

### Step 3: Next.js環境変数を更新

`/Users/taichiumeki/dev/docker-compose.yml`の環境変数を更新：

```yaml
environment:
  - NODE_ENV=development
  - NEXT_PUBLIC_API_BASE_URL=https://casto-workers-dev.casto-api.workers.dev
```

### Step 4: Next.jsコンテナ再ビルド

```bash
cd /Users/taichiumeki/dev
docker-compose stop casto
docker-compose build casto
docker-compose up -d casto
```

## 🔧 設定詳細

### 現在の環境構成

| 環境 | Worker名 | URL | 用途 |
|------|----------|-----|------|
| development | casto-workers-dev | https://casto-workers-dev.casto-api.workers.dev | 開発専用 |
| production | casto-workers | https://casto-workers.casto-api.workers.dev | 本番環境 |

### 環境変数

**共通設定（例）:**
- `SUPABASE_URL`: Supabase プロジェクトの URL（例: `https://<project>.supabase.co`）
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase サービスロールキー（秘密情報）

**環境別設定:**
- `ENVIRONMENT`: `development` / `preview` / `production`

> **重要:** `SUPABASE_*` を含むすべての秘密値は Git にコミットせず、Cloudflare / GitHub / Vercel のシークレット機能で管理してください。[SFT][IV]

## 🚀 開発フロー

```bash
# 1. コード変更
vim services/casto/apps/workers/src/index.ts

# 2. 開発用Workerにデプロイ
cd services/casto/apps/workers
npx wrangler deploy --env development

# 3. テスト
# https://casto.sb2024.xyz/test でAPI動作確認

# 4. 本番デプロイ
git push → GitHub Actions → 本番環境自動デプロイ
```

### 🧪 テスト方法

**今すぐテストできます：**
1. https://casto.sb2024.xyz/test にアクセス
2. "Health Check"ボタンをクリック
3. 開発用API（environment: "development"）からのレスポンスを確認

**期待されるレスポンス：**
```json
{
  "status": "ok",
  "timestamp": "2025-09-23T09:51:43.929Z",
  "environment": "development"
}
```

## 🔍 トラブルシューティング

### 認証エラーが出る場合

```bash
# 認証をリセット
npx wrangler logout
npx wrangler auth login
```

### デプロイエラーが出る場合

```bash
# wranglerを最新に更新
npm install --save-dev wrangler@latest

# 再度デプロイ
npx wrangler deploy --env development
```

## 🎯 利点

- 🔒 **安全性**: 本番に影響なし
- 🔄 **一貫性**: 本番と同じDB・設定
- 🚀 **効率性**: 独立した開発環境
- 📊 **リアルデータ**: 本番データでテスト
- 🛠️ **完全統合**: Docker + Cloudflare + Supabase

## 📁 関連ファイル

### 設定ファイル
- `/Users/taichiumeki/dev/docker-compose.yml` - Next.js環境変数設定
- `/Users/taichiumeki/dev/services/casto/apps/workers/wrangler.toml` - Cloudflare Workers設定
- `/Users/taichiumeki/dev/services/casto/apps/workers/.dev.vars` - 開発用環境変数

### 重要な設定内容

**docker-compose.yml:**
```yaml
environment:
  - NODE_ENV=development
  - NEXT_PUBLIC_API_BASE_URL=https://casto-workers-dev.casto-api.workers.dev
```

**wrangler.toml:**
```toml
[env.development]
name = "casto-workers-dev"
vars = { ENVIRONMENT = "development" }

# 機密値は以下のように登録する
# npx wrangler secret put SUPABASE_URL --env development
# npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env development
```

## 🎊 完成記録

**構築完了日**: 2025-09-23  
**構築者**: AI Assistant + User  
**状態**: 完全動作確認済み  
**次のステップ**: UI開発・API拡張・認証実装
