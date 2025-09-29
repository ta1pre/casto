# casto: デプロイ運用戦略

casto の CI/CD は GitHub Actions を中心に `development` と `production` の二系統で運用する。ここでは確定済みの構成と運用ルールだけを記載する。[SF][RP]

## ブランチと環境

- `develop`: 開発用ブランチ。`development-deploy.yml` が自動デプロイを担当する。
- `main`: 本番ブランチ。`production-deploy.yml` が本番リリースを担当する。
- Pull Request (対象: `develop`, `main`): `pr-check.yml` が検証とプレビュー配信を行う。[TR]

## GitHub Actions ワークフロー

- `pr-check.yml`
  - Lint / Build / Test を `apps/web` と `apps/workers` で実行。
  - Vercel Preview を `amondnet/vercel-action@v25` で配信。
  - Workers Preview を `wrangler deploy --env preview` で実施。Cloudflare 認証失敗時はログを出してスキップする。[REH]

- `development-deploy.yml`
  - `develop` push で実行。リポジトリ全体を `npm ci` → Lint → Type Check → Build → Test。
  - 成功後、`apps/workers` を `wrangler deploy --env development` で配信。トークン正規化と `whoami` 検証を含む。
  - 通知ステップで開発 URL (`https://casto.sb2024.xyz`, `https://casto-workers-dev.casto-api.workers.dev`) を出力する。

- `production-deploy.yml`
  - `main` push で実行。Lint/Type Check/Test/Build 後、Vercel Production と Workers Production を分離ジョブでデプロイ。
  - Workers デプロイでは Wrangler バージョンとトークン正規化をログ出しし、認証失敗時は権限チェック手順を提示する。
  - `health-check` ジョブが API ヘルス (`/api/v1/health`) を確認し、`notify` ジョブが結果を出力する。[REH]

## Secrets と環境変数

- 必要な GitHub Secrets は `docs/operations/deployment/GITHUB_SECRETS.md` を参照。[TR]
- Cloudflare Secrets は `wrangler secret put` で環境ごとに登録。Workers 側の `.dev.vars` ではローカル検証用の値を保持する。
- Vercel の環境変数はダッシュボードで管理し、GitHub Actions からはトークン経由で参照する。

## ロールバックと検証

- Vercel: Dashboard で対象デプロイを選択して `Promote to Production` を実行する。
- Workers: `npx wrangler deploy --env <env> --version <id>` で過去バージョンに戻す。バージョン ID は `wrangler deployments list` で取得可能。[REH]
- ヘルスチェック失敗時は `production-deploy.yml` の `notify` ジョブが失敗メッセージを出力するため、そのログを起点に調査する。

## 監視とログ

- Vercel ログ: `vercel logs <deployment-url>` または Dashboard。
- Workers ログ: `npx wrangler tail --env <env>`。
- Supabase: Dashboard の Monitoring を参照する。

## 運用メモ

- Wrangler 4.x は Node.js 20 以上を要求する。全ワークフローで `actions/setup-node@v4` + `node-version: 20` を指定済み。[ISA]
- Cloudflare API Token 形式エラー（code: 6111）が発生した場合は GitHub Secrets に保存した値を確認し、改行・引用符を除去して再登録する。`production-deploy.yml` にデバッグステップあり。[REH]
- 新しいシークレットや環境を追加する場合は、該当ワークフローに明示的な参照を追加し、本ドキュメントと `GITHUB_SECRETS.md` を更新する。[TR]
