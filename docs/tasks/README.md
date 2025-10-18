# タスク管理

## ファイル構成
- `README.md`: このガイド
- `TODO.md`: 現在の作業リスト

## 運用ルール
1. このディレクトリには上記2ファイルのみ配置
2. タスク完了時は `TODO.md` から削除し、完了記録を残す
3. ドキュメントはすべて日本語で記述する
4. **作業前に必ず関連ファイルを確認する**
5. **無駄に新しいファイルを作成せず、なるべく既存ファイルを活用する**
6. **変更時は影響範囲を十分に考慮する**
7. **作業開始前にrules.mdの内容を必ず確認する**
8. **終わったタスク項目にはチェックを入れる**

## データベースマイグレーション実行手順

### マイグレーション前の確認
```bash
# 1. 現在のマイグレーション状態を確認（ローカル/リモートの整合性確認）
supabase migration list --linked

# 2. リモートDBの実際のテーブル構成を確認
supabase db dump --linked

# 3. 既存マイグレーションファイルを確認
ls -la supabase/migrations/
```

### マイグレーション実行
```bash
# 新しいマイグレーションファイル作成
supabase migration new <migration_name>

# マイグレーションファイルを編集（必ず `DROP ... IF EXISTS` を使用）
vim supabase/migrations/<timestamp>_<migration_name>.sql

# マイグレーション適用
supabase db push

# 適用後の確認
supabase migration list --linked
```

### Workers再デプロイ（必須）
```bash
# スキーマキャッシュをリフレッシュ
cd apps/workers
npx wrangler deploy --env development
```

### 重要事項
- **べき等性の保証**: 必ず `DROP POLICY IF EXISTS`, `DROP TABLE IF EXISTS` などを使用
- **リモートDBが正**: ローカルはリモートに従う運用
- **整合性確認**: デプロイ前に `supabase migration list --linked` で Local/Remote 列が完全一致することを確認
- **参照**: 詳細は `docs/DATABASE_MANAGEMENT.md` を参照


## TODO.mdテンプレート
```markdown
# TODOリスト

## 作業開始前の確認事項
- [ ] rules.mdの内容を確認した
- [ ] 作業前にtasks/以下を必ず確認する

## 現在の作業の目的
作業の目的を記述

## 現在の作業項目
- [ ] 作業項目

---

## 最終タスク
- [ ] docs内のファイル更新（ドキュメント整備・更新）
```
