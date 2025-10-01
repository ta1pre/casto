# 📊 データベース管理ガイド

最終更新: 2025-10-01

## 概要
- **データベース**: Supabase PostgreSQL
- **管理方針**: `supabase/schema/` でDDLを宣言的に管理し、差分をマイグレーションとして自動生成
- **自動化**: ローカル・CI/CDともに `npm run db:sync` で同期可能

---

## ディレクトリ構成
```
supabase/
├── schema/              # DDL定義（ソース・オブ・トゥルース）
│   └── users.sql       # テーブルごとにファイル分割
├── migrations/          # 自動生成されたマイグレーション（Git管理対象）
│   └── YYYYMMDD_HHMMSS_*.sql
├── sync                 # 同期スクリプト（schema連結 → diff生成）
└── .temp/               # CLIの一時ファイル（.gitignore対象）
```

---

## 運用フロー

### 1. スキーマ変更
`supabase/schema/` 配下のSQLファイルを編集します。

```sql
-- supabase/schema/users.sql
ALTER TABLE public.users ADD COLUMN phone TEXT;
```

### 2. マイグレーション生成
環境変数を設定して同期スクリプトを実行します。

```bash
# .env.local に以下を設定（初回のみ）
SUPABASE_ACCESS_TOKEN="sbp_..."
SUPABASE_PROJECT_REF="sfscmpjplvxtikmifqhe"
SUPABASE_DB_PASSWORD="..."

# 同期実行
set -a && source .env.local && set +a
npm run db:sync
```

**または**

```bash
./supabase/sync
```

差分があれば `supabase/migrations/<timestamp>.sql` が生成されます。

### 3. レビュー & コミット
生成されたマイグレーションを確認し、問題なければコミットします。

```bash
git add supabase/migrations/
git commit -m "feat(db): add phone column to users"
```

### 4. PR作成 & CI確認
PRを作成すると GitHub Actions が以下を自動実行します：
- スキーマ同期チェック（未適用の差分がないか検証）
- マイグレーション生成確認

### 5. 本番適用
`main` ブランチにマージすると、GitHub Actions が自動的にSupabase本番環境へマイグレーションを適用します。

---

## ローカル開発

### 初回セットアップ
```bash
# 1. Supabase CLI インストール（未導入の場合）
brew install supabase/tap/supabase

# 2. 環境変数設定
# .env.local を作成して以下を設定:
SUPABASE_ACCESS_TOKEN="sbp_..."  # https://supabase.com/dashboard/account/tokens
SUPABASE_PROJECT_REF="sfscmpjplvxtikmifqhe"
SUPABASE_DB_PASSWORD="..."  # Settings > Database > Database Password

# 3. リンク確立（初回のみ）
cd supabase
set -a && source ../.env.local && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"

# 成功メッセージ: "Finished supabase link."
```

**重要**: パスワード認証エラーが出る場合は、Supabaseダッシュボードでデータベースパスワードを再生成してください。

### 日常運用
```bash
# スキーマ編集
vim supabase/schema/users.sql

# 差分生成
npm run db:sync

# 生成されたマイグレーションを確認
git diff supabase/migrations/

# コミット & プッシュ
git add supabase/
git commit -m "feat(db): update schema"
git push
```

---

## CI/CD 自動化

### GitHub Secrets 設定
リポジトリの Settings > Secrets and variables > Actions に以下を追加：

- `SUPABASE_ACCESS_TOKEN`: Supabase Personal Access Token
- `SUPABASE_PROJECT_REF`: プロジェクトID（例: `sfscmpjplvxtikmifqhe`）
- `SUPABASE_DB_PASSWORD`: データベースパスワード

### ワークフロー
`.github/workflows/database-sync.yml` が以下を自動実行：

**PR時**:
- スキーマ同期チェック
- 未適用マイグレーション検出

**main マージ時**:
- Supabase本番環境へマイグレーション適用

---

## トラブルシューティング

### `Cannot find project ref` エラー
リンクが確立されていません。以下を実行してください：

```bash
cd supabase
set -a && source ../.env.local && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
```

### 差分が生成されない
1. リモートDBに既に同じ定義が存在する可能性があります
2. `supabase db diff --linked --schema public --debug` で詳細ログを確認

### マイグレーション適用に失敗
1. Supabase Dashboard で手動変更していないか確認
2. マイグレーションの依存関係を確認（順序が重要）
3. リモートに存在しないマイグレーションがある場合は修復:
   ```bash
   # リモートのマイグレーション履歴を確認
   supabase migration list --linked
   
   # 不要なマイグレーションを reverted に設定
   supabase migration repair --status reverted <version>
   
   # 再度プッシュ
   supabase db push --linked
   ```

---

## ベストプラクティス

### ✅ DO
- DDL変更は必ず `supabase/schema/` で管理
- `npm run db:sync` で差分を生成してからコミット
- マイグレーションファイルは手動編集せず、自動生成されたものを使用
- 破壊的変更（DROP など）は慎重にレビュー

### ❌ DON'T
- Supabase Dashboard で直接テーブル作成・編集しない
- `supabase/migrations/` を手動で作成しない
- 環境変数を `.env.local` 以外に記録しない（セキュリティリスク）
- `.env.local` を Git にコミットしない

---

## 関連ドキュメント
- [Supabase セットアップ手順](./setup/SUPABASE_SETUP.md)
- [アーキテクチャ設計](./specs/ARCHITECTURE.md)
- [ローカル開発環境](./setup/LOCAL_DEVELOPMENT.md)

