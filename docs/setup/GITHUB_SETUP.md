# GitHubリポジトリ運用メモ

casto リポジトリの運用ルールと確認事項を記録する。

## ブランチ構成

- `main`: 本番デプロイ対象。GitHub Actions 成功とレビュー1件が必須。
- `develop`: 開発ブランチ。GitHub Actions 成功とレビュー1件が必須。
- 作業ブランチ: `feature/*` または `fix/*` を使用する。

## CI/CD

- `.github/workflows/production-deploy.yml` が本番デプロイを担当。
- Node.js 20、Vercel Deploy、Wrangler Deploy を実行する。
- GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`。

## 必須ファイル

- `.env.example`: 環境変数テンプレート。
- `.github/workflows/`: CI/CD ワークフロー。
- `docs/operations/`: デプロイ戦略・手順・決定事項。
- `docs/specs/`: 仕様・アーキテクチャ。

## 運用手順

- 作業前に `tasks/` と `rules.md` を確認する。
- ブランチ保護設定やCI/CDの変更は `operations/DECISIONS.md` に記録する。
- シークレット更新や権限変更は `operations/deployment/GITHUB_SECRETS.md` に反映する。
