# casto

オーディションをスマホやパソコンから簡単に管理できるサービスです。

## 🚀 クイックスタート

### データベーススキーマ更新

**必読:** [`docs/DATABASE_MANAGEMENT.md`](./docs/DATABASE_MANAGEMENT.md)

```bash
# 1. 新しいマイグレーション作成
supabase migration new add_feature_name

# 2. マイグレーションファイル編集
vim supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql

# 3. 整合性確認
supabase migration list

# 4. リモートに適用
supabase db push

# 5. Workers再デプロイ（スキーマキャッシュ更新）
cd apps/workers
npx wrangler deploy --env development
```

**重要ルール:**
- マイグレーションには必ず `DROP ... IF EXISTS` を使用
- デプロイ前に `supabase migration list` で整合性確認
- Workers再デプロイでスキーマキャッシュをリフレッシュ

### ローカル開発

⚠️ **重要：`npm run dev`での直接起動は絶対禁止。Dockerのみを使用すること。**

```bash
cd /Users/taichiumeki/dev
docker compose up -d casto
```

👉 **詳細:** [docs/setup/LOCAL_DEVELOPMENT.md](./docs/setup/LOCAL_DEVELOPMENT.md)

---

## 🌐 環境情報

| 環境 | Frontend | API |
|------|----------|-----|
| **開発** | https://casto.sb2024.xyz | https://casto-workers-dev.casto-api.workers.dev |
| **本番** | https://casto.io | https://casto-workers.casto-api.workers.dev |

---

## 🧭 開発の道しるべ

- **テーブル追加・スキーマ変更**: `supabase migration new` でマイグレーション作成 → DDL記述（`DROP ... IF EXISTS`必須） → `supabase db push` → Workers再デプロイ → [`docs/DATABASE_MANAGEMENT.md`](./docs/DATABASE_MANAGEMENT.md)
- **Workers 機能追加**: `apps/workers/src/features/` に機能ディレクトリを作成 → [`docs/setup/WORKERS_STRUCTURE.md`](./docs/setup/WORKERS_STRUCTURE.md)
- **Web UI 追加**: `apps/web/src/app/` へページ・コンポーネントを配置 → API呼び出し実装
- **タスク管理**: `docs/tasks/TODO.md` を更新、完了後はチェック

---

## 📖 ドキュメント

### 必読
- **[docs/DATABASE_MANAGEMENT.md](./docs/DATABASE_MANAGEMENT.md)** - データベース管理標準手順
- **[docs/CRITICAL_RULES.md](./docs/CRITICAL_RULES.md)** - 重要な開発ルール
- **[docs/README.md](./docs/README.md)** - ドキュメント全体の目次

### 開発準備
- ローカル開発: [`docs/setup/LOCAL_DEVELOPMENT.md`](./docs/setup/LOCAL_DEVELOPMENT.md)
- Supabase認証: [`docs/setup/SUPABASE_AUTH_SETUP.md`](./docs/setup/SUPABASE_AUTH_SETUP.md)

### 実装リファレンス
- Workers API: [`docs/setup/WORKERS_STRUCTURE.md`](./docs/setup/WORKERS_STRUCTURE.md)
- アーキテクチャ: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

### タスク管理
- [`docs/tasks/TODO.md`](./docs/tasks/TODO.md)
