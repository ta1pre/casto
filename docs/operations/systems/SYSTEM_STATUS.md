# casto: システム運用リファレンス

本書は casto の運用における恒久的な確認手順と主要リソースをまとめたリファレンスであり、瞬間的なステータスは記載しない。[SF][RP]

## 1. 主要リソース

- **Web（開発）**: `https://casto.sb2024.xyz`
- **Web（本番）**: `https://casto.io`
- **API（開発）**: `https://casto-workers-dev.casto-api.workers.dev`
- **API（本番）**: `https://casto-workers.casto-api.workers.dev`
- **Supabase プロジェクト**: `supabase/` ディレクトリと Supabase Dashboard

各 URL は `docs/README.md` と `.github/workflows/` の設定と整合させる。[TR]

## 2. 健康チェック手順

- **API ヘルス**: `curl -f https://casto-workers.casto-api.workers.dev/api/v1/health`
- **DB 疎通**: Workers で `supabase db push` を適用後、`/api/v1/db-test` を利用して接続を確認（必要時のみ公開）
- **Web 動作**: `https://casto.sb2024.xyz` のテストページから API 呼び出しログを確認

本番・開発どちらもデプロイ後 30 秒程度待ってからヘルスチェックを実施する。[REH]

## 3. GitHub Actions 運用

- `pr-check.yml`: PR 作成時に Lint/Build/Test、および Vercel・Workers のプレビューを実行
- `development-deploy.yml`: `develop` ブランチ push で Workers を開発環境へデプロイ
- `production-deploy.yml`: `main` ブランチ push で Web/Workers 本番デプロイ + ヘルスチェック

各ワークフローで使用する Secrets は `docs/operations/deployment/GITHUB_SECRETS.md` を参照する。[TR]

## 4. ロールバックガイド

- **Vercel**: Dashboard → Deployments から対象リリースを選択し「Promote to Production」
- **Workers**: `npx wrangler deploy --env <env> --version <id>` を利用。`wrangler deployments list` でバージョン ID を取得
- **Supabase**: マイグレーションは `supabase/migrations/` で管理し、必要に応じて `supabase db diff` でロールバック SQL を生成

## 5. 確認すべき項目

- GitHub Actions の成功/失敗ログ
- Vercel / Cloudflare Workers のデプロイ結果
- Supabase Dashboard でのテーブル・RLS 設定
- Cloudflare Secrets と GitHub Secrets が最新か

いずれか不明な場合は必ず「わからない」と明記し、確認手順を残す。[TR]

## 6. 運用ルール

- 作業着手前に `docs/rules.md` と `docs/tasks/` を確認する
- 既存の設定情報を最大限活用し、重複ドキュメントを作らない
- 実機で検証できた事実のみを記録し、想定や未検証項目は区別する
- 変更が発生した場合は関連ドキュメントを同時に更新する

## 7. 関連ドキュメント

- `docs/operations/deployment/STRATEGY.md`: CI/CD とデプロイ運用の詳細
- `docs/setup/LOCAL_DEVELOPMENT.md`: ローカル開発環境の取り扱い
- `docs/setup/SUPABASE_SETUP.md`: Supabase セットアップとマイグレーション方針
- `specs/ARCHITECTURE.md`: システムアーキテクチャ全体像
