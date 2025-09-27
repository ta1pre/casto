# Casto 環境構築ガイド

## 1. GitHub リポジトリ接続
- **リモート確認**: 既存環境では `https://github.com/ta1pre/casto.git` が remotes (`origin`) に設定済み。
  ```bash
  git remote -v
  ```
- **新規 clone**:
  ```bash
  git clone https://github.com/ta1pre/casto.git
  cd casto
  ```
- **既存プロジェクトで remote 設定を追加したい場合**:
  ```bash
  git remote add origin https://github.com/ta1pre/casto.git
  ```

## 2. ローカル開発環境 (Docker)
- **前提ツール**: Docker / Docker Compose, Git, (任意) Node.js 20 以上。
- **構成**:
  - `docker-compose.yml` (ルート `/Users/taichiumeki/dev/`): Traefik, Cloudflare Tunnel, 各種アプリ。
  - `Dockerfile.dev`: `node:20-alpine` ベース。`apps/web` の Next.js dev サーバーを提供。
- **起動手順**:
  ```bash
  cd /Users/taichiumeki/dev/
  docker compose up -d casto
  docker logs -f casto    # 任意
  ```
- **アクセス**: `https://casto.sb2024.xyz/` (Traefik + Cloudflare Tunnel 経由)。
- **停止**:
  ```bash
  docker compose stop casto
  ```
- **キャッシュ破棄・再構築**:
  ```bash
  docker compose down casto
  rm -rf services/casto/apps/web/.next services/casto/apps/web/node_modules
  docker compose build casto
  docker compose up -d casto
  docker exec casto npm install
  ```

## 3. Cloudflare Workers
- **設定ファイル**: `apps/workers/wrangler.toml`
  - `env.development`: `casto-workers-dev`（`develop` ブランチと連携予定）
  - `env.production`: `casto-workers`（`main` ブランチと連携）
- **必要なシークレット / 変数**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `DATABASE_URL`, `LINE_CHANNEL_SECRET`, `STRIPE_SECRET_KEY`。
- **ローカルからの手動デプロイ**:
  ```bash
  cd /Users/taichiumeki/dev/services/casto/apps/workers
  export CLOUDFLARE_API_TOKEN=<your_token>
  npx wrangler deploy --env development   # 開発検証用
  npx wrangler deploy --env production    # 本番
  ```
  - *補足*: Docker コンテナ内で実行する場合は、`docker exec casto` 経由で環境変数を渡すか、`docker compose` の環境設定にトークンを追加すること。
- **CI/CD**:
  - `develop` ブランチ→ （準備中）Cloudflare development 環境へデプロイ予定
  - `main` ブランチ→ `.github/workflows/production-deploy.yml` → `wrangler deploy --env production`

## 4. Vercel (Next.js フロントエンド)
- **設定ファイル**: `apps/web/vercel.json`
  - `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_BASE_URL` などを environment 毎に管理。
- **デプロイ手段**:
  - GitHub Actions: `develop` → Development (Preview/Dev) プロジェクト (`VERCEL_PROJECT_ID_DEV` など命名ルールはチームで統一)、`main` → Production プロジェクト (`VERCEL_PROJECT_ID`)。
  - 手動: `cd apps/web && vercel --prod`（要 `VERCEL_TOKEN`）。
- **環境変数**: Vercel ダッシュボードで `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WEB_BASE_URL` を Development / Production で設定。

## 5. Supabase (DB)
- **利用先**: 本番インスタンスを開発・ステージングと共用。
- **接続情報**: `wrangler.toml` の環境変数および GitHub Secrets に保存。
- **変更手順**: Supabase Dashboard でスキーマ・RLS を更新。ローカル DB コンテナは不要。

## 6. 設定まとめ
| 区分 | 管理場所 | 主な環境変数 / 設定 |
| ---- | -------- | ------------------- |
| GitHub | `.github/workflows/*.yml` / Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (dev/prod), `SUPABASE_*` |
| Cloudflare Workers | `apps/workers/wrangler.toml` | `env.development` / `env.production`, シークレット各種 |
| Vercel | `apps/web/vercel.json`, Vercel Dashboard | `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WEB_BASE_URL` |
| ローカル Docker | `docker-compose.yml`, `Dockerfile.dev` | Traefik ルーティング、Node ベースイメージ、`casto` サービス |

## 7. 今後の運用メモ
- Development 環境デプロイは `develop` ブランチへの push をトリガーとする GitHub Actions を利用する（準備中）。
- ローカルで直接 Cloudflare へデプロイする場合は API トークンを忘れずに注入する。
- ドキュメント更新時は `docs/setup/LOCAL_DEVELOPMENT.md` / `docs/deployment/*.md` も合わせて見直すこと。
