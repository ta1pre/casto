# 開発環境ガイド

casto プロジェクトの開発環境と GitHub 運用フローをまとめています。初回セットアップから日常的な開発まで、このドキュメントを起点に確認してください。

## 開発環境アクセス

- **フロントエンド**: `https://casto.sb2024.xyz`
- **API (Cloudflare Workers)**: `https://casto.sb2024.xyz/api`
- **データベース**: 共有開発用 PostgreSQL 接続情報は `docs/SUPABASE_SETUP.md` を参照

`https://casto.sb2024.xyz/` は Traefik を介してローカルマシン上のコンテナ群へ到達するための開発者専用ドメインです。インターネット上の Vercel 環境ではなく、各開発者の Mac に接続されます。

## Cloudflare Workers 開発モード

- `npm run dev:workers` または `npm run dev` の実行で `wrangler dev` が起動し、Miniflare ベースのローカルサーバーがポート `8787` で待ち受けます。
- Traefik が `https://casto.sb2024.xyz/api` へのアクセスをポート `8787` にフォワードするため、フロントエンドは常に HTTPS ドメイン経由で API に到達します。
- リモート実行が必要な場合は、`cd apps/workers && wrangler dev --remote` を利用すると Cloudflare 側の開発用ランタイムに接続できます。
- フロントエンド (`apps/web/`) は環境変数 `NEXT_PUBLIC_API_BASE_URL` を通じて `https://casto.sb2024.xyz/api` を参照します。リモートモードを利用する際は `.env.local` で API ベース URL をリモートエンドポイントに切り替えてください。

## 前提ツール

- Node.js 20 以降
- npm (同梱)
- Git / GitHub CLI (`gh`)
- Resend CLI（メールテンプレート管理が必要な場合）

## ローカル環境セットアップ

1. 依存関係インストール
   ```bash
   npm install
   ```
2. 環境変数ファイル作成
   ```bash
   cp .env.example .env.local
   # 必要な値を .env.local に追記
   ```
3. データベース初期化
   ```bash
   npm run db:setup
   ```
4. 開発サーバー起動
   ```bash
   npm run dev
   ```

### Resend のセットアップ

1. Resend CLI をインストール
   ```bash
   npm install -g resend
   ```
2. APIキーを設定
   ```bash
   resend login --api-key $RESEND_API_KEY
   ```
3. テンプレートを同期（例）
   ```bash
   resend templates list
   ```

開発環境では Resend のサンドボックスドメインを使用し、本番では認証済みドメインを用意してください。APIキーは `.env.local` の `RESEND_API_KEY` に設定し、環境ごとに発行します。

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

