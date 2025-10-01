# データベース クイックスタート

**目的**: 5分でSupabaseデータベースのセットアップとマイグレーション実行を完了する

---

## 📋 前提条件チェック

```bash
# Supabase CLI がインストールされているか確認
supabase --version

# Node.js 18以上がインストールされているか確認
node --version
```

---

## 🚀 セットアップ（5分）

### 1. 環境変数設定（2分）
`.env.local` ファイルをリポジトリルートに作成：

```bash
SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SUPABASE_PROJECT_REF="sfscmpjplvxtikmifqhe"
SUPABASE_DB_PASSWORD="your_database_password"
```

**取得方法**:
- `SUPABASE_ACCESS_TOKEN`: https://supabase.com/dashboard/account/tokens
- `SUPABASE_PROJECT_REF`: プロジェクトURL末尾の文字列
- `SUPABASE_DB_PASSWORD`: Settings > Database > Database Password

### 2. プロジェクトリンク（1分）
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
```

### 3. 初回マイグレーション適用（2分）
```bash
cd ..  # リポジトリルートへ戻る
```

Supabase MCP Server（推奨）を使う場合、Cascade AIで以下を実行：
```
Apply migration from supabase/migrations/20251001000000_create_users.sql to project sfscmpjplvxtikmifqhe
```

または手動で実行する場合：
```bash
# Note: 現状は Supabase MCP Server 経由での適用を推奨
```

---

## ✅ 動作確認

### テーブル存在確認
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase db remote inspect --linked --schema public
```

### スキーマ同期テスト
```bash
cd ..
npm run db:sync
```

出力例:
```
差分はありません。マイグレーションを削除します。
```

---

## 📝 日常運用

### スキーマを変更する
```bash
# 1. DDLファイルを編集
vim supabase/schema/users.sql

# 2. 差分を生成
npm run db:sync

# 3. 生成されたマイグレーションを確認
git diff supabase/migrations/

# 4. コミット & プッシュ
git add supabase/
git commit -m "feat(db): add new column"
git push
```

### PR マージ後
GitHub Actions が自動的にSupabase本番環境へマイグレーションを適用します。

---

## 🔧 トラブルシューティング

### `Cannot find project ref`
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
```

### `Connection refused`
1. Supabaseダッシュボードでプロジェクトが **Active** か確認
2. ネットワーク接続を確認
3. Firewall設定を確認

### マイグレーション適用失敗
- Supabase Dashboard で手動変更していないか確認
- マイグレーションの順序を確認
- Supabase MCP Server 経由での適用を推奨

---

## 📚 詳細ドキュメント
- [データベース管理ガイド](../DATABASE_MANAGEMENT.md) - 完全な運用マニュアル
- [Supabase セットアップ](./SUPABASE_SETUP.md) - 詳細なセットアップ手順
- [ローカル開発環境](./LOCAL_DEVELOPMENT.md) - 開発環境全体の構築
