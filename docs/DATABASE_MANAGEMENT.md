# データベース管理ガイド

このドキュメントは、Supabaseデータベースのマイグレーションとローカル/リモート間の整合性管理の標準手順を定義します。

## 前提条件

- Supabase CLI v2.51.0以上がインストール済み
- プロジェクトが `sfscmpjplvxtikmifqhe` にリンク済み

## 重要な原則

### 🔴 絶対ルール

1. **マイグレーションファイルは直接編集しない**（適用後）
2. **本番DBで直接SQLを実行しない**（緊急時を除く）
3. **必ず `DROP ... IF EXISTS` を使う**（ポリシー、トリガー、関数など）
4. **デプロイ前に整合性を確認する**

## 標準ワークフロー

### 1. 新しいマイグレーション作成

```bash
# プロジェクトルートで実行
cd /Users/taichiumeki/dev/services/casto

# マイグレーションファイル生成
supabase migration new <説明的な名前>

# 例: supabase migration new add_user_avatar
```

### 2. マイグレーションファイル作成のベストプラクティス

**テンプレート:**

```sql
-- <説明>
-- [CA][SF] <機能説明>

-- テーブル作成
CREATE TABLE IF NOT EXISTS public.example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_example_name ON public.example(name);

-- RLS有効化
ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（必ず DROP IF EXISTS）
DROP POLICY IF EXISTS "example_select_policy" ON public.example;
CREATE POLICY "example_select_policy"
  ON public.example
  FOR SELECT
  USING (true);

-- コメント
COMMENT ON TABLE public.example IS '例示用テーブル';
```

### 3. ローカル/リモート整合性チェック

**デプロイ前に必ず実行:**

```bash
# 1. マイグレーション履歴確認
supabase migration list

# 出力例:
#   Local          | Remote         | Time (UTC)
#  ----------------|----------------|---------------------
#   20251015000000 | 20251015000000 | 2025-10-15 00:00:00  ← 整合性OK
#   20251015000001 |                | 2025-10-15 00:00:01  ← リモート未適用

# 2. リモートDBの実際の状態確認
supabase db dump --linked | grep "CREATE TABLE" | grep -v "^--"

# 3. ローカルマイグレーション確認
ls -la supabase/migrations/
```

### 4. マイグレーション適用

#### ケースA: 通常適用（Remote列が全て埋まっている）

```bash
supabase db push
```

#### ケースB: 履歴不整合（Remote列が空白）

```bash
# 1. 不整合があるバージョンを特定
supabase migration list

# 2. 履歴を修復（reverted = 未適用扱い）
supabase migration repair --status reverted <version>

# 例:
# supabase migration repair --status reverted 20251015000003

# 3. すべてのマイグレーションを適用
supabase db push --include-all
```

#### ケースC: ポリシー衝突エラー

エラー例:
```
ERROR: policy "xxx" for table "yyy" already exists
```

**解決:**

1. 該当マイグレーションファイルを編集
2. `DROP POLICY IF EXISTS` を追加
3. 再度 `supabase db push --include-all`

### 5. Workers APIへのスキーマ反映

マイグレーション適用後、Workers APIが新しいテーブルを認識するには：

```bash
# Workers再デプロイ（開発環境）
cd apps/workers
npx wrangler deploy --env development

# 本番環境
npx wrangler deploy --env production
```

**注意:** Workers再デプロイでSupabaseクライアントが再初期化され、スキーマキャッシュがリフレッシュされます。

### 6. 整合性確認（必須）

```bash
# 1. マイグレーション履歴が一致しているか
supabase migration list
# → すべてのLocal/Remoteが一致していること

# 2. テーブルが存在するか
supabase db dump --linked | grep "CREATE TABLE" | grep "<your_table>"

# 3. APIが正常動作するか
curl https://casto.sb2024.xyz/api/v1/health

# 4. ブラウザでページ動作確認
# https://casto.sb2024.xyz で実際の機能をテスト
```

## トラブルシューティング

### 問題: マイグレーションがリモートに適用されない

**症状:**
```bash
supabase migration list
# Local列にはあるが、Remote列が空白
```

**解決:**
```bash
supabase migration repair --status reverted <version>
supabase db push --include-all
```

### 問題: "table not found in schema cache"

**原因:** PostgRESTのスキーマキャッシュが古い

**解決方法1（推奨）:** Workers再デプロイ
```bash
cd apps/workers
npx wrangler deploy --env development
```

**解決方法2:** Supabase Dashboard
1. https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe/sql/new
2. SQL実行: `NOTIFY pgrst, 'reload schema';`

**解決方法3:** プロジェクト再起動（最終手段）
1. https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe/settings/general
2. "Restart project" → "Fast database reboot"

### 問題: マイグレーション適用時の接続エラー

**症状:**
```
connection refused
```

**原因:** Supabase再起動中またはネットワーク問題

**解決:**
1. 1-2分待つ
2. `supabase db push` を再実行
3. Supabase Dashboardでプロジェクト状態を確認

## チェックリスト

デプロイ前に確認:

- [ ] `supabase migration list` でLocal/Remote列が一致
- [ ] マイグレーションファイルに `DROP ... IF EXISTS` を使用
- [ ] ローカルでビルド成功: `npm run build`
- [ ] `supabase db dump --linked` で目的のテーブルが存在
- [ ] Workers再デプロイ完了
- [ ] APIヘルスチェック: `curl https://casto.sb2024.xyz/api/v1/health`
- [ ] ブラウザで実機能確認

## 緊急時の手順

### リモートDBを完全にローカルと同期

```bash
# ⚠️ 本番環境では絶対に実行しない
# 開発環境のみ

# 1. リモートDBをローカルにpull
supabase db pull

# 2. ローカルDBをリセット
supabase db reset

# 3. すべてのマイグレーションを再適用
supabase db push --include-all
```

## 参考コマンド

```bash
# プロジェクト情報
supabase projects list

# リンク状態確認
cat .supabase/config.toml | grep project_id

# マイグレーション差分確認
supabase db diff

# リモートDBダンプ（バックアップ）
supabase db dump --linked -f backup_$(date +%Y%m%d).sql
```

## 関連ドキュメント

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [マイグレーションベストプラクティス](https://supabase.com/docs/guides/cli/local-development#database-migrations)
