# Supabase セットアップ手順

最終更新: 2025-10-01

## 前提条件
- Supabase アカウント登録済み
- プロジェクト作成済み（本ガイドでは `sfscmpjplvxtikmifqhe` を使用）
- Supabase CLI インストール済み

---

## 1. Supabase CLI インストール

### macOS
```bash
brew install supabase/tap/supabase
```

### Linux
```bash
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

### Windows
```powershell
scoop install supabase
```

### インストール確認
```bash
supabase --version
# 出力例: 2.47.2
```

---

## 2. 認証情報の取得

### 2.1 Personal Access Token
1. https://supabase.com/dashboard/account/tokens にアクセス
2. **Generate new token** をクリック
3. 名前を入力（例: `casto-local-dev`）
4. スコープはデフォルトのまま
5. **Generate token** をクリックしてトークンをコピー

### 2.2 Project Ref
プロジェクトURLから取得します：
```
https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe
                                      ^^^^^^^^^^^^^^^^^^^^
                                      これが Project Ref
```

### 2.3 Database Password
1. プロジェクトダッシュボードを開く
2. **Settings** > **Database** を選択
3. **Database Password** セクションで確認または再生成

---

## 3. 環境変数設定

### 3.1 .env.local 作成
リポジトリルートで `.env.local` を作成します：

```bash
# Supabase Database Configuration
SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SUPABASE_PROJECT_REF="sfscmpjplvxtikmifqhe"
SUPABASE_DB_PASSWORD="your_database_password"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase API Configuration
SUPABASE_URL="https://sfscmpjplvxtikmifqhe.supabase.co"
```

### 3.2 .gitignore 確認
`.env.local` が `.gitignore` に含まれていることを確認：

```bash
grep -q "\.env\.local" .gitignore || echo ".env.local" >> .gitignore
```

---

## 4. プロジェクトリンク

### 4.1 初回リンク
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
```

### 4.2 リンク確認
```bash
ls -la .temp/
# 出力例: project-ref というファイルが存在
```

---

## 5. 初期マイグレーション適用

### 5.1 既存マイグレーション確認
```bash
ls -la migrations/
```

### 5.2 マイグレーション適用（必要に応じて）
既にマイグレーションファイルが存在する場合：

```bash
cd supabase
set -a && source ../.env.local && set +a

# 各マイグレーションファイルを順に適用
# Note: 本番環境では Supabase MCP Server を推奨
```

または Supabase MCP Server 経由：
```bash
# Cascade AI の mcp0_apply_migration ツールを使用
```

---

## 6. 動作確認

### 6.1 テーブル一覧取得
```bash
cd supabase
set -a && source ../.env.local && set +a
supabase db remote inspect --linked --schema public
```

### 6.2 スキーマ同期テスト
```bash
cd ..  # リポジトリルートへ
npm run db:sync
```

差分がなければ以下のメッセージが表示されます：
```
差分はありません。マイグレーションを削除します。
```

---

## 7. CI/CD 設定（GitHub Actions）

### 7.1 GitHub Secrets 追加
リポジトリの **Settings** > **Secrets and variables** > **Actions** で以下を追加：

| Name | Value | 説明 |
|------|-------|------|
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` | Personal Access Token |
| `SUPABASE_PROJECT_REF` | `sfscmpjplvxtikmifqhe` | プロジェクトID |
| `SUPABASE_DB_PASSWORD` | `...` | データベースパスワード |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service Role Key（API用） |
| `SUPABASE_URL` | `https://...supabase.co` | プロジェクトURL |

### 7.2 ワークフロー確認
`.github/workflows/database-sync.yml` が存在することを確認。

---

## トラブルシューティング

### エラー: `Connection refused`
- **原因**: ネットワーク接続の問題、またはSupabaseプロジェクトが一時停止中
- **対処**: 
  1. Supabaseダッシュボードでプロジェクトが Active か確認
  2. ネットワーク接続を確認
  3. Firewall設定を確認（ポート 5432, 6543）

### エラー: `Cannot find project ref`
- **原因**: `supabase link` が未実行、または `.temp/project-ref` が存在しない
- **対処**: 「4. プロジェクトリンク」を再実行

### エラー: `Invalid token`
- **原因**: Access Token が無効または期限切れ
- **対処**: 
  1. Supabaseダッシュボードで新しいトークンを生成
  2. `.env.local` を更新

---

## 関連ドキュメント
- [データベース管理ガイド](../DATABASE_MANAGEMENT.md)
- [ローカル開発環境](./LOCAL_DEVELOPMENT.md)
- [アーキテクチャ設計](../specs/ARCHITECTURE.md)
