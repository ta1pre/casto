# Casto 環境構築ガイド

## 1. 全体像

### 1.1 ローカル開発
- `/Users/taichiumeki/dev/docker-compose.yml` に統合された Docker Compose を利用し、サービス名 `casto` が Next.js 開発サーバーを提供する。
- ルーティングは Traefik と Cloudflare Tunnel を経由し、開発中も `https://casto.sb2024.xyz/` で確認する。
- `services/casto/docker-compose.dev.yml` は旧構成で、ローカル API を前提にしているため現在は利用しない。

### 1.2 クラウド/API
- Cloudflare Workers: `apps/workers/wrangler.toml` の `env.development` / `env.production` で `casto-workers-dev` と `casto-workers` を管理。
- Supabase: 本番インスタンスを開発・本番共通で使用。RLS などの設定は Supabase Dashboard で行う。

### 1.3 フロントエンド (Vercel)
- Production: `web-xi-seven-98.vercel.app`（`apps/web/vercel.json` で `NEXT_PUBLIC_API_BASE_URL=https://casto-workers.casto-api.workers.dev`）。
- Preview/Dev: GitHub PR と `develop` ブランチから自動デプロイ（`pr-check.yml` / `production-deploy.yml`）。

### 1.4 GitHub / CI
- リポジトリ: `https://github.com/ta1pre/casto.git`。
- CI ワークフロー: `pr-check.yml`（PR 時に lint/build/preview）、`production-deploy.yml`（`main` push 時に本番デプロイ）。

## 2. 現状の課題と対応タスク

| 優先度 | 課題 | 現状 | 対応案 |
| --- | --- | --- | --- |
| ✅ | 機密情報がレポジトリに残存 | `wrangler.toml` 等から平文シークレットを削除済み。Supabase キーも直近で再設定済み。 | 今後は `wrangler secret put` / GitHub Secrets を用いて管理を継続する。追加対応は不要。 |
| 🔴 | CI で Cloudflare 認証失敗 | `CLOUDFLARE_API_TOKEN` が改行・引用符付きで保存されており、`production-deploy.yml` の `wrangler whoami` が code 6111 を返す。 | GitHub Secrets でトークンを再登録（前後の空白・改行なし）。`./check-token-format.sh` で検証し、必要なら Token を再発行。 |
| 🟡 | ローカルセットアップスクリプトが実態と不整合 | `setup.sh` が Postgres コンテナ起動を前提にしているが、現在は Supabase 共用運用。 | スクリプト廃止またはドキュメントに「使用禁止」と明記し、将来的に置き換え。 |
| 🟡 | Vercel 環境値が固定で Preview と Production の区別が不足 | `apps/web/vercel.json` で常に `NEXT_PUBLIC_APP_ENV=production` が指定されている。 | Vercel Dashboard 側で Dev/Preview 用値を設定し、JSON 側の固定値は必要最小限にする。また `VERCEL_PROJECT_ID` の dev/prod 分離を確認。 |
| 🟢 | ドキュメント間の表現ゆれ | `docs/setup/DEVELOPMENT.md` と本ファイルで表現が重複・角度が異なる。 | ドキュメント刷新時に参照先の統一と差分強調（本ファイルはサマリー）。 |

## 3. ローカル環境セットアップ手順

1. **前提ツールを揃える**
   - Docker, Docker Compose, Git, `wrangler` CLI（Workers にデプロイする場合）。
2. **コンテナ起動**
   ```bash
   cd /Users/taichiumeki/dev/
   docker compose up -d casto
   ```
3. **ログ確認（任意）**
   ```bash
   docker logs -f casto
   ```
4. **アクセス**
   - ブラウザ: `https://casto.sb2024.xyz/`
   - ローカル確認: `curl -H "Host: casto.sb2024.xyz" http://localhost:80`
5. **停止/リセット**
   ```bash
   docker compose stop casto
   # キャッシュ破棄が必要な場合
   docker compose down casto
   rm -rf services/casto/apps/web/.next services/casto/apps/web/node_modules
   docker compose up -d casto
   docker exec casto npm install
   ```
6. **禁止事項**
   - `services/casto/` 直下で `npm run dev` を実行しない。
   - `setup.sh` は旧手順のため使用しない。

## 4. クラウド環境運用メモ

- **Cloudflare Workers**
  ```bash
  cd services/casto/apps/workers
  # 開発環境デプロイ
  CLOUDFLARE_API_TOKEN=... npx wrangler deploy --env development
  # 本番デプロイ（CI が正常化するまで手動での利用を想定）
  npx wrangler deploy --env production
  ```
- **Vercel**
  - GitHub Actions（`production-deploy.yml`）経由で `main` への push が本番デプロイを実行。
  - Preview は `pr-check.yml` の `amondnet/vercel-action@v25` により作成される。

## 5. チェックリスト

- [ ] `wrangler.toml` から機密情報を除去し、キーをローテーションした。
- [ ] GitHub Secrets の `CLOUDFLARE_API_TOKEN` を再登録し、`npx wrangler whoami` が成功する状態を確認した。
- [ ] Vercel の Dev/Prod プロジェクトで環境変数を整理し、`NEXT_PUBLIC_APP_ENV` の値を確認した。
- [ ] ローカル開発が `docker compose up -d casto` のみで再現できることを確認した。
- [ ] 変更内容を `docs/setup/DEVELOPMENT.md` / `docs/deployment/STRATEGY.md` に横展開する計画を立てた。

このサマリーを基点に、関係者へ最新手順の周知とリポジトリのセキュリティ強化を進めてください。
