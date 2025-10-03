# Supabase マイグレーションガイド

> 旧 `MIGRATION_GUIDE.md` の内容を統合しました。スキーマ変更は本書と `SUPABASE_SCHEMA_MANAGEMENT.md` を併読してください。[TR]

## 方針

- **宣言的管理**: すべてのテーブル定義は `supabase/schema/` に記述し、`schema.sql` は生成物として扱う。[SF]
- **CLI 主導**: `./supabase/sync` で差分を抽出し、`supabase/migrations/*.sql` をレビューしたうえでコミットする。[TDT]
- **テスト志向**: 生成されたマイグレーションは Workers / Web 双方の実装（`apps/web/src/app/test/`）でレスポンス整形を確認し、意図しない変更を検知する。[DRY]

## 手順

1. `supabase/schema/<table>.sql` を編集。
2. `cd supabase && ./sync` を実行し、`schema.sql` と `migrations/` を更新。
3. 差分のないマイグレーションは自動削除される。残ったファイルはレビューしてコミット。
4. 本番環境へ適用する場合は `supabase db push --linked` を利用し、環境変数は `.envrc` や CI で安全に管理する。[SFT]

## チェックリスト

- [ ] `schema.sql` を直接編集していないか。
- [ ] マイグレーションファイルの命名規則が `YYYYMMDD_HHMMSS_<feature>.sql` になっているか。
- [ ] `docs/tasks/TODO.md` に関連タスクを記録したか。
- [ ] `apps/web/src/app/test/` で API レスポンスのシナリオ確認を行ったか。

## 参考資料

- [`SUPABASE_SCHEMA_MANAGEMENT.md`](./SUPABASE_SCHEMA_MANAGEMENT.md) - スキーマ運用フロー詳細
- [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) - ローカル開発環境
- [`WORKERS_STRUCTURE.md`](./WORKERS_STRUCTURE.md) - Workers API 構成と実装例
- [`../tasks/TODO.md`](../tasks/TODO.md) - タスク管理

---

**最終更新**: 2025/10/04
