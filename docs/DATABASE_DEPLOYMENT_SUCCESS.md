# データベースデプロイ 成功記録

**日時**: 2025-10-01  
**作業**: usersテーブルのRLS有効化とマイグレーション適用

---

## 実施した手順

### 1. パスワード更新
Supabaseダッシュボードでデータベースパスワードをリセット:
```
https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe/settings/database
→ Reset database password
→ 新パスワード: 5dmnrhxwHo25JvCF
```

`.env.local` を更新:
```bash
SUPABASE_DB_PASSWORD="5dmnrhxwHo25JvCF"
```

### 2. プロジェクトリンク確立
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
```

**結果**: ✅ `Finished supabase link.`

### 3. マイグレーション差分生成
```bash
cd ..  # リポジトリルートへ
set -a && source .env.local && set +a
npm run db:sync
```

**結果**: ✅ `差分はありません。マイグレーションを削除します。`
- 既にSupabase MCP経由で適用済みのため、差分なし

### 4. リモートマイグレーション履歴の確認
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase migration list --linked
```

**結果**:
```
  Local | Remote   | Time (UTC) 
 -------|----------|------------
        | 20250130 | 20250130
```

### 5. マイグレーション履歴の修復
リモートに存在する不要なマイグレーションを reverted に設定:
```bash
supabase migration repair --status reverted 20250130
```

**結果**: ✅ `Repaired migration history: [20250130] => reverted`

### 6. マイグレーション適用
```bash
supabase db push --linked
```

**結果**: ✅ `Remote database is up to date.`

### 7. 最終確認
Supabase MCP経由でテーブル状態を確認:
```json
{
  "schema": "public",
  "name": "users",
  "rls_enabled": true,
  "rows": 0
}
```

✅ RLS有効化済み  
✅ ポリシー設定済み  
✅ 全カラム正常

---

## 確立した運用フロー

### スキーマ変更 → デプロイ
```bash
# 1. スキーマファイル編集
vim supabase/schema/users.sql

# 2. 環境変数読み込み
set -a && source .env.local && set +a

# 3. 差分生成
npm run db:sync

# 4. 生成されたマイグレーションを確認
git diff supabase/migrations/

# 5. コミット
git add supabase/
git commit -m "feat(db): update schema"

# 6. プッシュ（GitHub Actionsが自動適用）
git push

# または手動適用:
cd supabase
supabase db push --linked
```

### トラブルシューティング
```bash
# パスワード認証エラー
# → Supabaseダッシュボードでパスワード再生成

# マイグレーション履歴不一致
supabase migration list --linked
supabase migration repair --status reverted <version>
supabase db push --linked

# 差分が生成されない
# → 正常（既に適用済み）
```

---

## 重要な教訓

### ✅ 成功要因
1. **パスワード再生成**: 古いパスワードでは認証失敗するため、必ず最新に更新
2. **環境変数の正確な読み込み**: `set -a && source .env.local && set +a` で確実に読み込む
3. **マイグレーション履歴の修復**: リモートに不要なマイグレーションがある場合は `migration repair` で解決
4. **段階的確認**: 各ステップで結果を確認しながら進める

### ❌ 避けるべきこと
1. 古いパスワードを使い続ける
2. 代替手段（Supabase MCP）を先に使う（手順確立が目的の場合）
3. マイグレーション履歴を無視して `db push` する
4. エラーメッセージを読まずに進める

---

## ファイル構成（最終状態）

```
supabase/
├── schema/
│   └── users.sql                          # DDL定義（RLS含む）
├── migrations/
│   ├── 20251001000000_create_users.sql   # 初回マイグレーション
│   └── 20251001_190224_enable_rls_users.sql  # RLS有効化
├── sync                                   # 同期スクリプト
└── .temp/
    └── project-ref                        # リンク情報
```

---

## 次回以降の手順

### 新しいテーブル追加
```bash
# 1. スキーマファイル作成
vim supabase/schema/posts.sql

# 2. 差分生成 & デプロイ
npm run db:sync
git add supabase/
git commit -m "feat(db): add posts table"
git push
```

### スキーマ変更
```bash
# 1. 既存ファイル編集
vim supabase/schema/users.sql

# 2. 差分生成 & デプロイ
npm run db:sync
git add supabase/
git commit -m "feat(db): add column to users"
git push
```

---

## 関連ドキュメント
- [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) - 完全な運用ガイド
- [SUPABASE_SETUP.md](./setup/SUPABASE_SETUP.md) - 初回セットアップ手順
- [DATABASE_QUICKSTART.md](./setup/DATABASE_QUICKSTART.md) - 5分クイックスタート
