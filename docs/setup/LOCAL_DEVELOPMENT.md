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

### ⚠️ 重要：ローカルでの直接起動は絶対禁止

**絶対にlocalhostで直接起動しないこと。Dockerのみを使用すること。**

- `services/casto/` 直下で `npm run dev` や `npm start` を**絶対に実行しない**
- `localhost:3000` での起動は**完全に禁止**
- 全ての開発作業は **Docker Compose経由のみ**で行う
- Next.js をホスト側で誤って起動した場合は即座にプロセスを終了し、コンテナを再起動する

```bash
# 誤って起動してしまった場合の緊急停止手順
pkill -f "npm run dev"
pkill -f "next dev"
ps aux | grep -i next  # プロセス確認
kill <PID>             # 残っているプロセスを停止
docker compose restart casto
```

### なぜlocalhostでの起動を禁止するのか

1. **環境の一貫性**: 全開発者が同一のDocker環境で作業することで、「自分の環境では動く」問題を防ぐ
2. **リバースプロキシ設定**: Traefikを経由したHTTPS接続が必須のため
3. **設定の一元管理**: 環境変数やネットワーク設定がDocker Compose内で完結
4. **デプロイ環境との整合性**: 本番環境に近い構成でのテスト

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

### 環境変数設定

ローカル開発環境では、メインの `docker-compose.yml` で環境変数が設定されます：

```bash
NEXT_PUBLIC_API_BASE_URL="https://casto.sb2024.xyz"
```

**重要**: ベースURLに `/api` を含めません。コード内で `/api/v1/...` を使用しているためです。

### Workers APIの運用方針

**⚠️ 重要**: Workersはローカルで実行せず、Cloudflare環境を使用します

#### アーキテクチャ
- **ローカル Next.js**: `https://casto.sb2024.xyz`（Dockerコンテナ、Traefik経由）
- **Workers API**: `https://casto.sb2024.xyz/api/*`（Cloudflare Routes経由でWorkers）
- **Workers直接URL（開発）**: `https://casto-workers-dev.casto-api.workers.dev`
- **Workers直接URL（本番）**: `https://casto-workers.casto-api.workers.dev`

#### ルーティング
`wrangler.toml`で設定されたCloudflare Routesにより、`casto.sb2024.xyz/api/*` のリクエストが自動的にWorkersにルーティングされます：

```toml
[env.development]
routes = [
  { pattern = "casto.sb2024.xyz/api/*", zone_name = "sb2024.xyz" }
]
```

#### Workersをローカル実行しない理由
- ARM64環境（Apple Silicon）でのwrangler dev実行に技術的制約
- Cloudflare固有機能（R2、KV等）はローカルで完全再現不可
- デプロイ環境での動作確認が確実

#### Workers APIの更新
```bash
cd apps/workers
npx wrangler deploy --env development
```

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

- [`SUPABASE_SCHEMA_MANAGEMENT.md`](./SUPABASE_SCHEMA_MANAGEMENT.md) - テーブル追加・マイグレーション手順
- [`WORKERS_STRUCTURE.md`](./WORKERS_STRUCTURE.md) - Workers API の構成と実装例
- [`../tasks/TODO.md`](../tasks/TODO.md) - 進行中タスクと完了履歴
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) - プロジェクト全体の構成と型共有方針

構成変更時は本ドキュメントを更新する。[TR]

---

**最終更新**: 2025/10/04
