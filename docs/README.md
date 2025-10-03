# 📚 casto ドキュメント

casto の開発で参照するガイドラインとタスクの入口です。[TR]

## 📂 主なディレクトリ

- **setup/**: ローカル環境・Supabase・Workers などのセットアップ手順。[SF]
- **tasks/**: 進行中のタスクと TODO 管理。`TODO.md` を常に最新に保ちます。[AC]
- **tasksarchive/**: 完了済みタスクのアーカイブ。
- **ui/**: UI ガイドやデザインに関する補助資料。
- **CRITICAL_RULES.md** / **DEVELOPMENT_RULES.md**: 必読の開発ルール。[ISA]

## 🚀 開発を始める前に

1. `docs/setup/LOCAL_DEVELOPMENT.md` で Docker ベースの開発環境を確認。ローカル直起動は禁止。[SF]
2. `docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md` でスキーマ更新とマイグレーションの流れを把握。[CA]
3. 役割別ルールは `CRITICAL_RULES.md` と `DEVELOPMENT_RULES.md` を参照。[TR]

## 🧭 機能開発フロー

- **テーブル追加・スキーマ変更**: `supabase/schema/` を編集 → `./supabase/sync` → 生成マイグレーションをレビュー。[TDT]
- **Workers API 追加**: `apps/workers/src/features/<feature>/` に `routes.ts` / `service.ts` / `types.ts` を配置。参照: `docs/setup/WORKERS_STRUCTURE.md`。[CA]
- **Web UI 追加**: `apps/web/src/app/` へページ/コンポーネントを追加し、`apps/web/src/app/test/` のテストハーネスをリファレンスに API 連携を実装。[DRY]

## 📖 参照リンク

- [ローカル開発環境](./setup/LOCAL_DEVELOPMENT.md)
- [Supabase スキーマ運用ガイド](./setup/SUPABASE_SCHEMA_MANAGEMENT.md)
- [Workers 構成ガイド](./setup/WORKERS_STRUCTURE.md)
- [TODO リスト](./tasks/TODO.md)

## ✏️ ドキュメント更新ルール

- 構成変更や新規フロー追加時は該当ドキュメントを同時に更新する。[TR]
- `docs/tasks/TODO.md` に進行タスクを追記し、完了後はチェックを付ける。[AC]
- リファレンス例（`apps/web/src/app/test/` 等）に変更が入った場合は本 README も更新する。[PEC]

---

**最終更新**: 2025/10/04
