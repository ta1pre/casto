# Cloudflare設定ガイド

casto で利用している Cloudflare Workers と関連インフラの恒久的な設定情報をまとめる。[SF][RP]

## 基本構成

- ワーカー設定: `apps/workers/wrangler.toml`
- 実行環境: `development` / `preview` / `production`
- ルート環境変数: `ENVIRONMENT = "development"`（必要に応じて環境ごとに上書き）

## 環境区分

- `development`: 開発用ワーカー。開発者がローカルから `npx wrangler deploy --env development` で利用する。
- `preview`: プレビュー用途。必要な場合に `wrangler` から明示的にデプロイする。
- `production`: 本番ワーカー。GitHub Actions 経由でデプロイする。[CA]

`wrangler.toml` の `[env.<name>]` セクションでワーカー名や定数を管理する。[RP]

## シークレット管理

- Cloudflare Secrets: `wrangler secret put <KEY> --env <environment>` で登録する。
- GitHub Actions Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` を保持する。
- 機密値はリポジトリに記録せず、必要なシステムのシークレットストアで共有する。[SFT][IV]

## 認証

```bash
cd services/casto/apps/workers
npx wrangler auth login
npx wrangler whoami
```

`whoami` でアカウント情報を確認し、必要に応じて `npx wrangler logout` で再認証する。[REH]

## デプロイ運用

- ローカル開発: `npx wrangler deploy --env development`
- プレビュー: 必要なブランチから `npx wrangler deploy --env preview`
- 本番: `.github/workflows/production-deploy.yml` が `cloudflare/wrangler-action@v3` を使用して `--env production` をデプロイする。

デプロイ前後は `wrangler.toml` の環境設定と Secrets を確認する。[TR]

## 参考ファイル

- `apps/workers/wrangler.toml`
- `.github/workflows/production-deploy.yml`
- `docs/operations/DECISIONS.md`
