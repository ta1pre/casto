# ⚙️ ローカル開発環境仕様（casto）

casto フロントエンドは `/Users/taichiumeki/dev/` 直下の Docker Compose で統合管理されており、ローカル開発では **Next.js のみ** をホストします。API と DB はクラウド常設で動作しているため、ローカルで同等のサービスを用意する必要はありません。[SF][RP][TR]

## ✅ ローカルで提供される機能

- `services/casto/apps/web/` の Next.js アプリ
- Traefik を介したリバースプロキシ（`casto.sb2024.xyz` でアクセス）
- Cloudflare Tunnel クライアント（外部 HTTPS → ローカルへの転送）

## ☁️ クラウド常設の機能

- **API**: `casto-workers-dev.casto-api.workers.dev`（Cloudflare Workers）
- **DB**: Supabase（本番 DB を共用）

フロントエンドは常にクラウド上の API/DB に接続します。ローカル用の API/DB を起動したり、エミュレータを用意する必要はありません。[DM]

## 🧭 ディレクトリ構成（抜粋）

```
/Users/taichiumeki/dev/
├── docker-compose.yml          # ルートの統合 Docker 設定
├── services/
│   └── casto/
│       ├── Dockerfile.dev      # casto コンテナ（Next.js dev server）
│       ├── apps/web/           # フロントエンド
│       └── docs/               # ドキュメント
└── infrastructure/
    └── tunnel/config.yml       # Cloudflare Tunnel 設定
```

## 🚀 起動・停止手順

1. **起動**
   ```bash
   cd /Users/taichiumeki/dev/
   docker compose up -d casto
   ```
2. **ログ確認**
   ```bash
   docker logs -f casto
   ```
3. **停止**
   ```bash
   docker compose stop casto
   ```

`casto` コンテナ起動時に `npm run dev:web` が自動実行され、Next.js 開発サーバーがポート 3000 で待ち受けます。Traefik 経由で `https://casto.sb2024.xyz/` からアクセスできます。[RP]

## 🔒 禁止事項

- `services/casto/` 直下で `npm run dev` / `npm run dev:web` / `npm start` を実行しない。
- ローカルで独自の API / DB を立ち上げない（クラウドと衝突します）。

誤って Next.js を直接起動した場合は以下で終了→再起動してください。

```bash
ps aux | grep -i next
kill <PID>
docker compose restart casto
```

## 🌐 動作確認

- **ブラウザ**: `https://casto.sb2024.xyz/`
- **ローカルホスト経由**: `curl -H "Host: casto.sb2024.xyz" http://localhost:80`
- **API 健全性**: `https://casto-workers-dev.casto-api.workers.dev/api/v1/health`

API/DB はクラウド側で提供されるため、障害発生時は Cloudflare Workers と Supabase のログを確認してください。[REH]

## 🧹 キャッシュ復旧手順

```
docker compose down casto
rm -rf services/casto/apps/web/.next services/casto/apps/web/node_modules
docker compose up -d casto
docker exec casto npm install
```

再起動後に `docker logs casto` で `✓ Ready` が出力されれば復旧完了です。`.next` が破損した場合もこの手順で解消できます。[CA]

## 🔗 クラウド側の変更

- **API デプロイ**: `services/casto/apps/workers/` で開発 → `npx wrangler deploy --env development`
- **DB 変更**: Supabase Dashboard でスキーマ・RLS を編集。ローカルから参照する場合は Supabase 提供の接続文字列を利用。

クラウド環境へ影響する変更は、先にステージング環境で検証してから本番反映する運用としてください。[SD]

## 📚 関連ドキュメント

- `docs/setup/DEVELOPMENT.md`
- `docs/deployment/STRATEGY.md`
- `docs/architecture/system-overview.md`

---

手順や構成に変更が生じた場合は本ドキュメントを速やかに更新し、最新状態を維持してください。[SD]
