# Supabase スキーマ運用ガイド

## 目的

Supabase 上の `users` テーブルなど、共通データベース構造を整然と管理するための手順をまとめます。[SD][TR]

## ディレクトリ構成

```
supabase/
├── schema/            # 人手で編集する正規化済み DDL
│   └── users.sql
├── schema.sql         # schema/ を結合した生成物（自動生成）
├── migrations/        # Supabase CLI が生成するマイグレーション
│   ├── 20251001000000_create_users.sql
│   └── ...
└── sync               # スキーマ同期用スクリプト
```

- `schema/` … 手動編集する唯一の場所。論理的な DDL を用途別に分割。[SF][CA]
- `schema.sql` … `schema/` 配下を結合した成果物。**直接編集しない**。[PEC]
- `migrations/` … `supabase db diff` や `db push` によって生成されたファイルを保存。[TDT]
- `sync` … 生成物更新とマイグレーション差分抽出を自動で行う Bash スクリプト。[DM]

## 更新フロー

1. `schema/*.sql` を編集する（例: `users.sql` に列追加）。[SF]
2. 変更内容をローカルで確認。
   ```bash
   cd supabase
   ./sync
   ```
3. `schema.sql` が更新され、差分があれば `migrations/YYYYMMDD_HHMMSS_users.sql` が生成される。
4. 差分が不要であれば自動的に削除される。必要な場合は生成されたマイグレーションをレビューし、リポジトリへコミット。
5. Supabase 環境へ適用する際は、CI/CD もしくはマニュアルで `supabase db push` / `db reset` を実行。[ISA]

## 環境変数

`sync` スクリプトは以下の環境変数を参照します。

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`（リンク未設定時のみ）

環境ごとに `.envrc` や CI のシークレットストアで管理し、リポジトリに書き込まない。[SFT][RM]

## 注意事項

- `schema.sql` を直接編集しないこと。`schema/` 配下の DDL を変更し `./sync` を実行する。[CA]
- マイグレーションの命名規則は `YYYYMMDD_HHMMSS_<feature>.sql` とし、生成直後に内容をレビューする。[ISA]
- 大規模変更時は `docs/tasks/TODO.md` に必ず作業ログを残し、進行中タスクを明示する。[TR]
- Workers / Web の実装は `apps/web/src/app/test/` をリファレンスにしてレスポンス整形を確認し、高度な API 変更時の回帰を防ぐ。[DRY]

## 参考

- [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) - ローカル開発環境の構築
- [`WORKERS_STRUCTURE.md`](./WORKERS_STRUCTURE.md) - Workers API 構成と実装リファレンス
- [`../tasks/TODO.md`](../tasks/TODO.md) - タスク管理
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) - プロジェクト全体の構成

整然としたスキーマ管理のため、上記フローに従って運用してください。[CA][TR]

---

**最終更新**: 2025/10/04
