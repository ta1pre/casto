# ⚙️ ローカル開発環境仕様（casto）

casto フロントエンドは `/Users/taichiumeki/dev/` 配下の Docker Compose で起動する。Next.js はコンテナ内で実行され、API・DB はクラウド常設環境を利用する。[SF][RP]

## ✅ 前提

- Docker / Docker Compose
- Cloudflare Tunnel クライアント
- Node.js/NPM（依存追加や `wrangler` 実行に使用）

## ☁️ 提供コンポーネント

- `services/casto/apps/web/`: Next.js アプリ（Traefik 経由で HTTPS 提供）
- Cloudflare Workers（開発用・本番用環境）
- Supabase（共有インスタンス）

ローカルで API や DB を新規起動する運用は行わない。[SF]

## 🧭 ディレクトリ抜粋

```
/Users/taichiumeki/dev/
├── docker-compose.yml
└── services/
    └── casto/
        ├── Dockerfile.dev
        ├── apps/web/
        └── docs/
```

## 🚀 起動手順

1. ルートディレクトリへ移動
   ```bash
   cd /Users/taichiumeki/dev/
   ```
2. `casto` コンテナを起動
   ```bash
   docker compose up -d casto
   ```
3. ログ確認（任意）
   ```bash
   docker logs -f casto
   ```

アクセス時は Traefik により `https://casto.sb2024.xyz/` にリバースプロキシされる。[CA]

停止は `docker compose stop casto`、再起動は `docker compose restart casto` を使用する。[SF]

## 🔒 運用ルール

- `services/casto/` 直下で `npm run dev` や `npm start` を実行しない。
- Next.js をホスト側で誤って起動した場合はプロセスを終了し、コンテナを再起動する。

```bash
ps aux | grep -i next
kill <PID>
docker compose restart casto
```

## 🧹 キャッシュ復旧

Next.js ビルドキャッシュが破損した場合の再生成手順。

```bash
docker compose down casto
rm -rf services/casto/apps/web/.next services/casto/apps/web/node_modules
docker compose up -d casto
docker exec casto npm install
```

`docker logs casto` で `✓ Ready` が確認できれば復旧完了。[CA]

## 🔗 クラウドリソース連携

- Workers: `services/casto/apps/workers/` で開発し、`npx wrangler deploy --env <environment>` でデプロイ
- Supabase: Dashboard でスキーマ/RLS を更新し、必要に応じて `supabase db push` を使用
- 環境変数: Docker Compose、Wrangler Secrets、GitHub Secrets を併用する

## 🧰 よく使うコマンド

```bash
# 依存追加（ホスト側）
cd services/casto
npm install <package> --workspace apps/web
docker compose restart casto

# Lint / 型チェック / テスト
docker exec casto npm run lint
docker exec casto npm run type-check
docker exec casto npm run test
```

## 📚 参考ドキュメント

- `operations/deployment/STRATEGY.md`
- `operations/DECISIONS.md`

構成変更時は本ドキュメントを更新する。[TR]
