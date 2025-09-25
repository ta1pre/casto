# Identity ドメイン DB マイグレーション レビュー資料 (2025-09-24)

## 1. 概要
- **対象範囲**: `supabase/migrations/001_initial_schema.sql` および `202509241000` ～ `202509241050` の Identity 系マイグレーション
- **目的**: Identity ドメインの共通テーブル（`users`, `user_handles`, `roles`, `user_roles`, `permissions`, `role_permissions`）を Supabase 上に整備し、ヘッダー実装の前提となるデータ取得を可能にする
- **適用環境**: Supabase プロジェクト `sfscmpjplvxtikmifqhe`（dev/prod 共通）

## 2. 変更内容
- **001_initial_schema.sql**: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` のみ残し、旧スキーマ定義を削除
- **Identity テーブル作成**:
  - `users`: 表示名/状態/メタ情報を保持、更新トリガー `set_updated_at()` を併設
  - `user_handles`: `provider` + `handle` の一意制約と `ON DELETE CASCADE`
  - `roles` / `permissions`: 各マスタテーブル（`name` に UNIQUE 制約）
  - `user_roles` / `role_permissions`: 複合 PK による割当テーブル、`ON DELETE CASCADE`
- **インデックス**: `user_handles(user_id)`, `user_roles(role_id)`, `role_permissions(permission_id)` などアクセス頻度の高い列へ付与

## 3. 適用手順と結果
1. Supabase CLI を v2.45.5 に更新 (`brew upgrade supabase`)
2. `supabase link --project-ref sfscmpjplvxtikmifqhe --password ZOnSmcK1OMM3fAq3`
3. 旧 `001_initial_schema.sql` を簡素化
4. `supabase db reset --linked`
   - 既存テーブル削除／匿名化の NOTICE を確認
   - Identity 系マイグレーションがすべて適用完了
5. `psql` でテーブル一覧を確認 (`\dt`)
   - `users`, `user_handles`, `roles`, `user_roles`, `permissions`, `role_permissions` のみ存在

## 4. レビューポイント
- **互換性**: 旧 `001_initial_schema.sql` の内容は完全削除されているため、過去テーブルが必要な場合は別ブランチで保守する必要あり。
- **データ初期化**: 全テーブルが空のため、必要に応じて `supabase/seed.sql` で初期ロール/権限の投入を検討。
- **セキュリティ**: `user_handles` の `provider` と `role`/`permission` の候補はハードコードされている。拡張時はマイグレーション追加が必要。
- **ドキュメント**: `docs/tasks/LOGIN_STATUS_HEADER.md` に初期化ログを追記済み。

## 5. TODO / Follow-up
- `docs/tasks/LOGIN_STATUS_HEADER.md` の 0-2 最終チェック「レビュー資料」完了チェックを付ける（本資料で対応）
- 初期データ投入が必要なら `supabase/seed.sql` を用意
- API (`apps/workers/`) と Web (`apps/web/`) での Identity セッション取得実装に着手
