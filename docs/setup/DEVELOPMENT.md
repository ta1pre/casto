# casto: 開発環境構築ガイド

casto プロジェクトの開発環境は **ローカル Docker Compose** と **クラウド常設リソース** を組み合わせたハイブリッド構成です。本ドキュメントでは、開発に必要な前提・起動手順・クラウド連携の扱いを最新の状態に合わせて整理します。[TR][RP]

## 🧩 コンポーネント構成

- **フロントエンド**: `services/casto/apps/web/`（Next.js 15.5.3）
- **API**: Cloudflare Workers（開発用エンドポイント = `casto-workers-dev.casto-api.workers.dev`）
- **データベース**: Supabase（本番と同一インスタンス。ローカル DB は使用しません）
- **その他**: Traefik + Cloudflare Tunnel（ルーティング／外部公開）

## ✅ 前提ツール

```
- Docker / Docker Compose
- Cloudflare Tunnel（`infrastructure/tunnel/config.yml`）
- （任意）Node.js 18 系ローカル実行環境 ※Docker 内で完結するため必須ではない
```

Cloudflare Workers のデプロイやテストで `wrangler` CLI を利用する場合は、ホストに `npm install -g wrangler` を実施してください。[DM]

## 🚀 ローカル起動手順

1. **ルートディレクトリへ移動**
   ```bash
   cd /Users/taichiumeki/dev/
   ```
2. **casto コンテナを起動**
   ```bash
   docker compose up -d casto
   ```
3. **ログ確認（任意）**
   ```bash
   docker logs -f casto
   ```
4. **アクセス**
   - ブラウザ: `https://casto.sb2024.xyz/`
   - curl: `curl -H "Host: casto.sb2024.xyz" http://localhost:80`

停止する場合は `docker compose stop casto` を実行します。`docker compose down casto` はローカルキャッシュ破棄時のみ利用してください。[SF]

## 🔁 キャッシュ再生成フロー

Next.js のビルドキャッシュが破損した場合は、以下の手順でクリーンに復旧できます。

```bash
docker compose down casto
rm -rf services/casto/apps/web/.next services/casto/apps/web/node_modules
docker compose up -d casto
docker exec casto npm install
```

その後 `docker logs casto` で `✓ Ready` を確認し、ブラウザをリロードしてください。[CA]

## ☁️ クラウドリソースの扱い

- **API（Cloudflare Workers）**
  - 開発環境: `casto-workers-dev.casto-api.workers.dev`
  - デプロイ: `cd services/casto/apps/workers && npx wrangler deploy --env development`

- **データベース（Supabase）**
  - 本番と共用のためローカル DB コンテナは起動しません。
  - スキーマ変更は Supabase Dashboard で実施。必要に応じて SQL エディタや `psql` で接続します。

- **環境変数管理**
  - フロントエンド: `.env` は Docker コンテナ内から参照。`NEXT_PUBLIC_API_BASE_URL` 等はクラウド API を指す値を設定。
  - Workers: `wrangler.toml` と `wrangler secret put` で管理。
  - Supabase: Dashboard 上でキー管理。

クラウド側での変更はステージング環境で検証した上で本番反映してください。[REH][SD]

## 🛠️ よくある作業

- **依存の追加**
  ```bash
  # ホスト側のリポジトリで実行
  cd services/casto
  npm install <package> --workspace apps/web
  # その後 docker compose restart casto で再起動
  ```

- **Lint / 型チェック**
  ```bash
  docker exec casto npm run lint
  docker exec casto npm run type-check
  ```

- **テスト**（未整備の場合は整備後に更新する）
  ```bash
  docker exec casto npm run test
  ```

## 🧭 デプロイ関連ハイライト

- **Next.js**: Vercel による自動デプロイ（詳細は `docs/deployment/STRATEGY.md`）。
- **Workers**: GitHub Actions から develop/main ブランチで自動デプロイ。
- **監視**: Supabase / Cloudflare / Vercel の各ダッシュボードを利用。[ISA]

## 🧾 変更ログの反映

- ローカル環境仕様に変更が発生した場合は、`docs/setup/LOCAL_DEVELOPMENT.md` と本ドキュメントを同時更新する。
- クラウド設定を更新した場合は、`docs/deployment/` や `operations/DECISIONS.md` にも記録する。

## 📚 参考リンク

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Docs](https://supabase.com/docs)
- [LINE Developers](https://developers.line.biz/)

---

最新の運用フローに合わせて継続的にドキュメントを整備してください。[SD]
