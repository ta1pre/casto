# 開発環境ガイド

casto プロジェクトの開発環境と GitHub 運用フローをまとめています。初回セットアップから日常的な開発まで、このドキュメントを起点に確認してください。

## 開発環境アクセス

- **フロントエンド**: `https://casto.sb2024.xyz`
- **API (Cloudflare Workers)**: `https://casto.sb2024.xyz/api`
- **データベース**: 共有開発用 PostgreSQL 接続情報は `docs/SUPABASE_SETUP.md` を参照

`https://casto.sb2024.xyz/` は Traefik → Cloudflare Tunnel → ローカル Docker コンテナへ到達するための開発者専用ドメインです。Vercel 等のクラウド環境ではなく、各開発者の Mac で稼働する `docker-compose.dev.yml` のサービスへルーティングされます。

## 前提ツール

- **Docker Desktop**（Docker Compose v2 を含む）
- **Node.js 20 以降 / npm**（Cloudflare Workers 用ローカル開発で使用）
- **Wrangler CLI** (`npm install -g wrangler`)
- **Git / GitHub CLI (`gh`)**
- *(任意)* Resend CLI（メールテンプレート管理が必要な場合）

## 初回セットアップ

1. 依存関係インストール
   ```bash
   cd services/casto
   npm install
   ```
   Workers 開発やユーティリティスクリプトをホストで動かすために必要です。
2. 環境変数ファイル作成
   ```bash
   cp .env.example .env.local
   # 必要な値を .env.local に追記
   ```
   `NEXT_PUBLIC_API_BASE_URL` などの URL は Traefik ドメインを指すよう維持してください。
3. Supabase / DB 準備
   - スキーマや接続情報は `docs/SUPABASE_SETUP.md` を参照してください。
   - 旧 `npm run db:setup`（単発 Postgres コンテナ）は使用せず、共有 Supabase 環境または各自の PostgreSQL を適切に構成します。

## 起動シーケンス（通常の開発フロー）

1. **SB2024 基盤サービス起動**
   ```bash
   ./infrastructure/scripts/manage.sh start
   ```
   Traefik・Cloudflare Tunnel 連携前提の共通スタックを起動します。トンネルを常駐させたい場合は `./infrastructure/scripts/manage.sh tunnel-bg`（または監視サービス）を利用してください。
2. **casto Next.js コンテナ起動**
   ```bash
   docker compose -f services/casto/docker-compose.dev.yml up -d
   ```
   コンテナ `casto-nextjs` がポート `3000` を開き、Traefik ラベル経由で `https://casto.sb2024.xyz` に公開されます。
3. **Cloudflare Workers 開発モード開始**
   ```bash
   cd services/casto
   npm run dev:workers
   # または wrangler dev --remote （Cloudflare開発ランタイムを利用する場合）
   ```
   `wrangler dev` がポート `8787` を待ち受け、Traefik が `/api` トラフィックを転送します。リモートモードを利用する場合は `.env.local` の `NEXT_PUBLIC_API_BASE_URL` をリモートエンドポイントに変更してください。
4. **アクセス確認**
   - フロントエンド: `https://casto.sb2024.xyz`
   - API ヘルスチェック: `https://casto.sb2024.xyz/api`

### 停止・再起動

- casto コンテナのみ停止: `docker compose -f services/casto/docker-compose.dev.yml down`
- 基盤ごと停止: `./infrastructure/scripts/manage.sh stop`

## Resend のセットアップ（任意）

1. Resend CLI をインストール
   ```bash
   npm install -g resend
   ```
2. API キーを設定
   ```bash
   resend login --api-key "$RESEND_API_KEY"
   ```
3. テンプレートを同期（例）
   ```bash
   resend templates list
   ```

開発環境では Resend のサンドボックスドメインを利用し、本番では認証済みドメインを用意してください。API キーは `.env.local` の `RESEND_API_KEY` に設定し、環境ごとに分離します。

## GitHub リポジトリ初期設定

新規開発者がプロジェクトを引き継ぐ場合は、以下の手順でリポジトリを初期化します。

1. Git 初期化と初回コミット
   ```bash
   git init
   git add .
   git commit -m "Initial commit: casto project setup"
   ```
2. GitHub リポジトリ作成（プライベート推奨）
   ```bash
   gh repo create casto --private --source=. --push
   gh repo view
   ```

## ブランチ戦略と保護設定

- `main`: 本番運用ブランチ
- `develop`: 開発統合ブランチ
- `feature/*`, `fix/*`: 作業用ブランチ

ブランチ保護ルールは GitHub CLI で設定できます。

```bash
# develop ブランチ作成
git checkout -b develop
git push -u origin develop
git checkout main

# main ブランチ保護
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

# develop ブランチ保護
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

## GitHub Actions 動作確認

```bash
ls -la .github/workflows/
gh api repos/:owner/:repo/actions/permissions
```

## トラブルシューティング

- `gh` コマンドが見つからない場合
  ```bash
  brew install gh
  gh auth login
  ```
- Git ユーザー設定が未完了の場合
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- GitHub リポジトリ作成で失敗した場合
  ```bash
  git remote add origin https://github.com/<your-account>/casto.git
  git push -u origin main
  ```

