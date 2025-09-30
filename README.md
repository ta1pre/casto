# casto

オーディションをスマホやパソコンから簡単に管理できるサービスです。

## 🚀 クイックスタート

### Supabase セットアップ（5分で完了）

```bash
# 1. API Key を .env.local に追加
echo 'SUPABASE_SERVICE_ROLE_KEY="sb_secret__your_key"' >> .env.local

# 2. DB初期化（完全自動）
node scripts/db-cleanup.js

# 3. 日常的なマイグレーション適用
make migrate
```

**完了！** 完全自動で実行されます。

```bash
# スキーマ確認（型定義・ドキュメント生成）
make generate-schema
cat supabase/SCHEMA.md
```

👉 **詳細:** [クイックスタート](./docs/setup/SUPABASE_QUICKSTART.md) | [マイグレーション管理](./MIGRATION_GUIDE.md)

<details>
<summary>手動セットアップ（クリックして展開）</summary>

```bash
# 1. ログイン
supabase login

# 2. リンク（Project Refは Supabase Dashboard → Settings → General から取得）
supabase link --project-ref <YOUR_PROJECT_REF>

# 3. マイグレーション適用
supabase db push --linked
```

</details>

👉 **詳細:** [QUICKSTART_SUPABASE.md](./QUICKSTART_SUPABASE.md)

### ローカル開発

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

## 📖 ドキュメント

### セットアップ
- **[Supabase 接続完全ガイド](./docs/setup/SUPABASE_CONNECTION.md)** ⭐ 必読
- [ローカル開発環境](./docs/setup/LOCAL_DEVELOPMENT.md)

### 仕様・設計
- [アーキテクチャ](./docs/specs/ARCHITECTURE.md)
- [ドメイン設計ルール](./docs/operations/systems/DOMAIN_RULES.md)

### タスク管理
- [TODO リスト](./docs/tasks/TODO.md)
- [Phase 1 デプロイ手順](./docs/tasks/PHASE1_DEPLOYMENT.md)
