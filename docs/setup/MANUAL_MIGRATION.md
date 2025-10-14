# 手動マイグレーション実行ガイド

## 概要

Supabaseのスキーマ変更を本番環境に適用するための手動手順です。

## 前提条件

以下の環境変数が設定されている必要があります：

```bash
export SUPABASE_ACCESS_TOKEN="your_access_token"
export SUPABASE_PROJECT_REF="your_project_ref"
export SUPABASE_DB_PASSWORD="your_db_password"  # 初回のみ必要
```

## 手順

### 1. スキーマファイルを編集

`supabase/schema/`配下のSQLファイルを編集します。

```bash
# 例: rolesテーブルを追加
vim supabase/schema/roles.sql
```

### 2. マイグレーション生成

`sync`スクリプトを実行してマイグレーションを生成します。

```bash
cd supabase
./sync
```

このスクリプトは以下を実行します：
1. `schema/`配下の全SQLファイルを`schema.sql`に結合
2. Supabaseプロジェクトにリンク（初回のみ）
3. `supabase db diff`で差分を検出
4. `migrations/YYYYMMDD_HHMMSS_*.sql`を生成

### 3. マイグレーションファイルの確認

生成されたマイグレーションファイルを確認します。

```bash
# 最新のマイグレーションファイルを確認
ls -la migrations/ | tail -5

# 内容を確認
cat migrations/20251014_HHMMSS_*.sql
```

### 4. マイグレーション適用（本番環境）

⚠️ **重要**: マイグレーションは手動で適用する必要があります。

#### 方法1: Supabase CLI（推奨）

```bash
cd supabase
supabase db push --linked
```

#### 方法2: Supabase Dashboard

1. Supabase Dashboard → SQL Editor を開く
2. マイグレーションファイルの内容をコピー
3. SQL Editorに貼り付けて実行

#### 方法3: Supabase MCP Server（最も安全）

```bash
# Supabase MCP Serverを使用してマイグレーション適用
# 詳細はSupabase MCPドキュメントを参照
```

### 5. 適用確認

```bash
# テーブルが作成されたか確認
supabase db diff --linked

# 差分がなければ成功
# "No schema changes detected"と表示されるはず
```

## トラブルシューティング

### エラー: "環境変数が設定されていません"

```bash
# 環境変数を確認
echo $SUPABASE_ACCESS_TOKEN
echo $SUPABASE_PROJECT_REF

# 設定されていない場合は設定
export SUPABASE_ACCESS_TOKEN="..."
export SUPABASE_PROJECT_REF="..."
```

### エラー: "Supabase CLI のログインに失敗しました"

```bash
# 手動でログイン
supabase login

# トークンを使ってログイン
supabase login --token "$SUPABASE_ACCESS_TOKEN"
```

### エラー: "差分はありません"

スキーマファイルの変更が既に適用されているか、変更が検出されていません。

```bash
# schema.sqlが正しく生成されているか確認
cat supabase/schema.sql | grep "CREATE TABLE"

# 手動で差分を確認
supabase db diff --linked --schema public
```

## 注意事項

- **本番環境への適用は慎重に**: マイグレーションは元に戻せません
- **バックアップを取る**: 重要なデータがある場合は事前にバックアップ
- **ステージング環境でテスト**: 可能であればステージング環境で先にテスト
- **マイグレーションファイルをコミット**: 生成されたマイグレーションは必ずGitにコミット

## 参考

- [Supabase スキーマ運用ガイド](./SUPABASE_SCHEMA_MANAGEMENT.md)
- [ローカル開発環境](./LOCAL_DEVELOPMENT.md)

---

**最終更新**: 2025-10-14
