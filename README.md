# casto

オーディションをスマホやパソコンから簡単に管理できるサービスです。

## 🚀 クイックスタート

### Supabase スキーマ更新

```bash
# schema/*.sql を編集した後に差分を生成
cd supabase
./sync
```

- `schema/` でテーブル定義を編集し、`schema.sql` は自動生成物として直接編集しません。[SF][PEC]
- 新しい `supabase/migrations/*.sql` が生成された場合は内容をレビューしてコミットします。[CA]
- 詳細手順は [`docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md`](./docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md) を参照してください。[SD]

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

👉 **詳細:** [Supabase スキーマ運用ガイド](./docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md)

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

- **テーブル追加・スキーマ変更**: `supabase/schema/` を編集し、`./supabase/sync` を実行 → 生成されたマイグレーションをレビュー → [`docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md`](./docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md)。
- **Workers 機能追加**: `apps/workers/src/features/` に機能ディレクトリを作成し、構成は [`docs/setup/WORKERS_STRUCTURE.md`](./docs/setup/WORKERS_STRUCTURE.md) を参照。API のレスポンス設計は `apps/web/src/app/test/` をリファレンスに統一します。
- **Web UI 追加**: `apps/web/src/app/` へページ・コンポーネントを配置し、データ連携は `apps/web/src/app/test/` のテストハーネスを参考に共通型を利用します。
- **タスク着手前**: `docs/tasks/TODO.md` を更新し、完了後はチェックを付けて履歴を残します。

---

## 📖 ドキュメント

### 開発準備
- Supabase: [`docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md`](./docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md)
- ローカル開発: [`docs/setup/LOCAL_DEVELOPMENT.md`](./docs/setup/LOCAL_DEVELOPMENT.md)

### 実装リファレンス
- Workers API 構成: [`docs/setup/WORKERS_STRUCTURE.md`](./docs/setup/WORKERS_STRUCTURE.md)
- Web / テストハーネス: `apps/web/src/app/test/`（API レスポンスと UI のサンプル）

### タスク管理
- [`docs/tasks/TODO.md`](./docs/tasks/TODO.md)
