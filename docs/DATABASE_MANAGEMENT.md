# データベース管理ガイド

**シンプル・イズ・ベスト [SF][CA][DRY]**

このドキュメントは、Supabaseデータベースのマイグレーション管理の標準手順を定義します。

## 🎯 基本原則

### 1. リモートDBが常に正
**リモート（Supabase）のデータベース状態が唯一の正解です。**
- ローカルのマイグレーションファイルはリモートの記録
- ローカルとリモートの不整合は即座に修正

### 2. マイグレーションのみで管理
- ✅ `supabase/migrations/` のみ使用
- ❌ `supabase/schema/` 不使用（混乱の元）
- ❌ `supabase/seed/` 不使用（seedもマイグレーションで管理）

### 3. べき等性の保証
すべてのマイグレーションは何度実行しても同じ結果になること。

## 前提条件

- Supabase CLI v2.51.0以上がインストール済み
- プロジェクトが `sfscmpjplvxtikmifqhe` にリンク済み

## 🔴 絶対ルール

1. **リモートDBが常に正** - ローカルはリモートに従う
2. **マイグレーションファイルは直接編集しない**（適用後）
3. **必ず `DROP ... IF EXISTS` を使う**（べき等性のため）
4. **seedデータもマイグレーションとして管理**
5. **デプロイ前に `supabase migration list` で整合性確認**

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

-- 初期データ投入（必要に応じて）
INSERT INTO public.example (name) VALUES
  ('初期データ1'),
  ('初期データ2')
ON CONFLICT (name) DO NOTHING;  -- べき等性保証
```

**重要:** seedデータは別ファイルではなく、マイグレーションとして管理します。

### 3. ローカル/リモート整合性チェック

**デプロイ前に必ず実行:**

```bash
# 1. マイグレーション履歴確認（最重要）
supabase migration list --linked

# 出力例:
#   Local          | Remote         | Time (UTC)
#  ----------------|----------------|---------------------
#   20251015000000 | 20251015000000 | 2025-10-15 00:00:00  ← ✅ 整合性OK
#   20251015000001 |                | 2025-10-15 00:00:01  ← ❌ リモート未適用
#                  | 20251015000002 | 2025-10-15 00:00:02  ← ❌ ローカルにない

# ✅ 理想状態: すべての行でLocal列とRemote列が一致
# ❌ 問題状態: どれか1つでも不一致があれば修正が必要
```

**整合性が取れていない場合は、このガイドの「トラブルシューティング」を参照してください。**

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

### 問題1: ローカルのマイグレーションがリモートに適用されていない

**症状:**
```bash
supabase migration list --linked
# Local列にはあるが、Remote列が空白
```

**解決:**
```bash
# 1. 履歴を修復（未適用扱いにする）
supabase migration repair --status reverted <version>

# 2. すべてのマイグレーションを適用
supabase db push --include-all

# 3. Workers再デプロイ
cd apps/workers && npx wrangler deploy --env development
```

### 問題2: リモートのマイグレーションがローカルにない

**症状:**
```bash
supabase migration list --linked
# Remote列にはあるが、Local列が空白
```

**原因:** 他の開発者がマイグレーションを適用したか、直接DBで作業した

**解決（推奨）:**
```bash
# リモートDBを正として、ローカルを同期
supabase db pull

# これにより、不足しているマイグレーションファイルがローカルに作成される
```

**解決（代替案）:**
```bash
# ローカルに手動でマイグレーションファイルを作成
# ファイル名はRemote列のバージョンと一致させる

# 例: 20251015211706_seed_audition_genres.sql
# 内容はリモートDBから推測または確認して作成
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

## ✅ デプロイ前チェックリスト

**すべて✅になるまでデプロイしないこと:**

1. [ ] **整合性確認** - `supabase migration list --linked` でLocal/Remote列が完全一致
2. [ ] **べき等性確認** - マイグレーションファイルに `DROP ... IF EXISTS` を使用
3. [ ] **ローカルビルド** - `npm run build` が成功
4. [ ] **Workers再デプロイ** - `cd apps/workers && npx wrangler deploy --env development`
5. [ ] **APIヘルスチェック** - `curl https://casto.sb2024.xyz/api/v1/health` が成功
6. [ ] **実機能確認** - ブラウザで実際の機能をテスト

**これらを守れば、マイグレーションの問題は起きません。**

## 🚨 緊急時の手順

### すべてがおかしくなった場合

```bash
# ⚠️ 本番環境では絶対に実行しない - 開発環境のみ

# 1. リモートDBを正として、ローカルを同期
supabase db pull

# 2. 整合性を確認
supabase migration list --linked
# → すべてのLocal/Remote列が一致していることを確認

# 3. Workers再デプロイ
cd apps/workers && npx wrangler deploy --env development

# これで解決しない場合は、このドキュメントを最初から読み直してください
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
