# GitHub Secrets 設定ガイド

casto の CI/CD ワークフローが参照するシークレットを整理する。[SF][RP]

## 必須シークレット

- `VERCEL_TOKEN`: Vercel API トークン。`amondnet/vercel-action@v25` が使用する。
- `VERCEL_ORG_ID`: Vercel 組織 ID。`scope` およびデプロイ対象判定に利用。
- `VERCEL_PROJECT_ID`: Vercel プロジェクト ID。Preview/Production を切り替える際も共通で使用する。
- `CLOUDFLARE_API_TOKEN`: Cloudflare Workers のデプロイ用トークン。User Memberships/Workers Edit 権限を含める。[SFT]
- `CLOUDFLARE_ACCOUNT_ID`: `wrangler deploy` 実行時のアカウント識別子。
- `SUPABASE_URL`: Supabase プロジェクト URL。Workers のシークレットへ流し込む。
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase サービスロールキー。Workers からのサーバーサイド操作に利用する。

> **注意:** `CLOUDFLARE_API_TOKEN` は改行やクォートが混入すると Authorization ヘッダー形式エラー（code: 6111）になります。`.github/workflows/production-deploy.yml` ではデプロイ前にトークンを正規化しているため、保存時点で余計な空白を含めないでください。[REH]

## 設定手順

### Web UI
- GitHub リポジトリ `Settings > Secrets and variables > Actions` を開く。
- **New repository secret** から上記キーを登録し、各サービスのダッシュボードで取得した最新値を設定する。

### GitHub CLI
```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID --body "<ORG_ID>"
gh secret set VERCEL_PROJECT_ID --body "<PROJECT_ID>"
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID --body "<ACCOUNT_ID>"
gh secret set SUPABASE_URL --body "<SUPABASE_URL>"
gh secret set SUPABASE_SERVICE_ROLE_KEY
```

CLI 実行時は `<...>` をダッシュボードで確認した値に置き換える。[IV]

## 更新タイミング

- トークン再発行時（例: Vercel Token、Cloudflare API Token）が発生したら即日更新。
- Supabase プロジェクトを切り替える場合は URL とキーを同時に更新。
- CI/CD 失敗ログでシークレット未設定が検出された場合は、そのジョブのワークフローを参照して不足分を補う。[TR]
