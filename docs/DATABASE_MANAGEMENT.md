# Supabase運用ガイド

## 📋 目的

**ローカルとリモート間のマイグレーション整合性を常に保つこと**を最優先とし、人為的ミスを排除するためにワークフロー自動化とGit hookを活用します。[SF][REH][PEC]

### なぜ整合性が必要か

- リモート適用済みマイグレーションがローカルに存在しない → 他者の変更を上書きする危険
- ローカル未適用マイグレーションがリモートに存在しない → `system_settings` テーブル欠落等の不整合が発生
- 整合性チェックの実行漏れ → 問題の早期検知が不可能

**→ すべてのマイグレーション操作で自動的に整合性チェックを実行し、不一致を即座に検知・修正する仕組みを構築します。**

---

## 🎯 基本原則

1. **リモート（Supabase）が唯一の正** – ローカルは常にリモートに従う。[PEC]
2. **DB変更はマイグレーションで自動生成** – `supabase db diff` を使い手書き禁止。[SF]
3. **操作はMakefile経由** – `make migrate` コマンドに集約し、ヒューマンエラーを削減。[DRY]
4. **整合性チェックの自動実行** – `make migrate` は `db-apply → db-check` を連続実行し、スキップを許さない。[REH]
5. **Git hookで強制チェック** – マイグレーションファイルをコミットする際、pre-commit hookが整合性を確認する。[PA]

> 重要: ローカルDB（`supabase start` や `localhost:54321` 等）は使用しません。常にリモート（Supabase）を唯一のソース・オブ・トゥルースとし、操作はマイグレーションで行います。[PEC]

---

## 1. DBマイグレーション運用

### 1.1 前提

```bash
export SUPABASE_DB_PASSWORD='your_password'  # 例: xSNOAfHLgdqCOfyM
```

> 一度設定すれば同じシェルで使い回せます。パスワードはSupabase Dashboardで管理。[SFT]

### 1.2 コマンド（2つだけ）

```bash
# 新規変更を作る（自動diff）
make db-new

# リモートに適用 + 整合性チェック（自動実行）
make migrate    # db-apply → db-check を連続実行
```

**補助コマンド（通常は不要）**

```bash
# 不一致を修正（リモートが正）
make db-sync

# 整合性のみ確認（make migrate に含まれるため単独実行は不要）
make db-check
```

### 1.3 ワークフロー（厳格運用）

#### ステップ1: マイグレーション生成

```bash
make db-new
```

- ファイル名を意味のあるものに変更（例: `20251103123456_auto_generated.sql` → `20251103123456_add_user_avatar.sql`）
- SQLは必ずべき等（`CREATE ... IF NOT EXISTS` / `DROP ... IF EXISTS` 等）を確認
- Seedデータも同じマイグレーションに含める

#### ステップ2: リモート適用 + 整合性チェック（自動）

```bash
make migrate
```

**このコマンドは以下を自動実行します：**

1. `supabase db push --linked` でリモートへ適用
2. 成功したら即座に `supabase migration list --linked` で整合性確認
3. 不一致があれば**エラーで停止**し、ログを出力

**重要**: `make db-apply` 単独での実行は禁止。必ず `make migrate` を使用すること。

#### ステップ3: 不一致時の対応（必須）

`make migrate` でエラーが出た場合：

```bash
make db-sync     # リモートを正としてローカルを修正
make migrate     # 再度適用 + チェック
```

#### ステップ4: Git コミット

```bash
git add supabase/migrations/*.sql
git commit -m "feat: add user avatar column"
```

**pre-commit hookが自動で整合性をチェックし、不一致があればコミットを拒否します。**

#### ステップ5: Workers更新（自動）

```bash
git push origin develop  # CI/CDが自動デプロイ
```

### 1.4 自動化による厳格運用

#### Makefile統合（必須実装）

`Makefile` に以下を追加済み：

```makefile
# 既存
db-new:
	@supabase db diff --linked --file supabase/migrations/

db-apply:
	@supabase db push --linked

db-check:
	@supabase migration list --linked

db-sync:
	@supabase db pull --linked

# 新規追加（必須）
migrate:
	@echo "🚀 マイグレーション適用中..."
	@supabase db push --linked && \
	echo "✅ 適用完了。整合性チェック中..." && \
	supabase migration list --linked || \
	(echo "❌ 整合性エラー検知！make db-sync を実行してください。" && exit 1)
```

#### Git pre-commit hook（必須実装）

`.git/hooks/pre-commit` に以下を追加：

```bash
#!/bin/sh
if git diff --cached --name-only | grep -q "supabase/migrations/"; then
  echo "🔍 マイグレーションファイル変更検知。整合性チェック中..."
  supabase migration list --linked || {
    echo "❌ 整合性エラー！コミット前に make migrate を実行してください。"
    exit 1
  }
  echo "✅ 整合性OK"
fi
```

実行権限付与：

```bash
chmod +x .git/hooks/pre-commit
```

#### スキーマスナップショット（定期実行）

マイグレーションが50件を超えたら、以下を実行してスナップショットを生成：

```bash
supabase db pull --schema public --linked --file supabase/schema_snapshot.sql
git add supabase/schema_snapshot.sql
git commit -m "chore: update schema snapshot"
```

**目的**: 過去の全マイグレーションを追わずに、最新スキーマを1ファイルで確認可能にする。

### 1.5 トラブルシューティング

| 症状 | 対応 |
| ---- | ---- |
| Local/Remote が不一致 | `make db-sync` でリモートに合わせて再度 `make db-check`。[REH] |
| マイグレーション適用でエラー | SQLがべき等か確認。`CREATE TABLE IF NOT EXISTS` / `DROP TABLE IF EXISTS` を徹底。[REH] |
| Workersが新テーブルを認識しない | `git push` してCI/CDによる再デプロイを待つ。手動デプロイは禁止。 |
| パスワード不明 | Supabase Dashboard → Settings → Database で確認・更新。 |

#### べき等性の例

```sql
-- ❌ 悪い例（再実行でエラー）
CREATE TABLE users (...);
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- ✅ 良い例（再実行しても安全）
CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
DROP TABLE IF EXISTS old_table;
```

> 詳細な背景・履歴はアーカイブ [tasksarchive/DATABASE_MANAGEMENT_DETAILED.md](./tasksarchive/DATABASE_MANAGEMENT_DETAILED.md) を参照。[CWM]

---

## 2. Supabase設定（`supabase/config.toml`）

SupabaseのAuth/API/Storage設定は `supabase/config.toml` をGitで管理し、`supabase config push` でリモートへ反映します。[CA]

### 2.1 ディレクトリ構成

```
supabase/
├── config.toml          # プロジェクト設定 ✅ Git管理
├── migrations/          # DBマイグレーション ✅ Git管理
├── .temp/              # 一時ファイル ❌ gitignore
└── .branches/          # ブランチ情報 ❌ gitignore

.supabase/
└── config.toml         # ローカルリンク情報 ❌ gitignore
```

| フォルダ | 役割 | 管理方針 |
| --- | --- | --- |
| `supabase/` | プロジェクト共通設定（Auth/Storage等） | Gitで管理 |
| `.supabase/` | 個人マシンのリンク情報 | `supabase link` で生成。Git管理しない |

### 2.2 設定変更フロー

```bash
# 0. 前提
export SUPABASE_DB_PASSWORD='your_password'

# 1. 設定を編集
vim supabase/config.toml

# 2. リモートに反映
supabase config push --project-ref sfscmpjplvxtikmifqhe

# 3. Gitにコミット
git add supabase/config.toml
git commit -m "chore: update supabase config"
```

#### 主な管理対象

- **Auth設定**: Site URL, Redirect URLs, JWT設定
- **API設定**: REST API, GraphQL
- **Storage設定**: バケット設定
- **Realtime設定**: リアルタイム通信

#### 設定例（`supabase/config.toml`）

```toml
[auth]
enabled = true
site_url = "https://casto.sb2024.xyz"
additional_redirect_urls = [
  "https://casto.sb2024.xyz/admin/auth/callback",
  "https://casto.sb2024.xyz/organizer/auth/callback",
  "https://casto.sb2024.xyz/admin/reset-password/confirm",
  "https://casto.sb2024.xyz/organizer/reset-password/confirm",
  "https://casto.io/admin/auth/callback",
  "https://casto.io/organizer/auth/callback",
  "https://casto.io/admin/reset-password/confirm",
  "https://casto.io/organizer/reset-password/confirm"
]
jwt_expiry = 3600
enable_refresh_token_rotation = true
enable_signup = true
```

### 2.3 新しい開発環境のセットアップ

```bash
# 1. リポジトリをクローン
git clone <repository>
cd casto

# 2. Supabaseプロジェクトにリンク（`.supabase/config.toml` 自動生成）
supabase link --project-ref sfscmpjplvxtikmifqhe

# 3. DBマイグレーションを適用
make db-apply
```

### 2.4 設定系トラブルシューティング

| 症状 | 対応 |
| ---- | ---- |
| `.supabase/` がGitに入った | `.gitignore` に追記し、`git rm -r --cached .supabase/`。 |
| 設定が反映されない | `supabase config push --project-ref ...` を再実行。必要に応じ `supabase link` をやり直す。 |
| 設定内容を確認したい | `cat supabase/config.toml` でGit管理内容を参照。 |

---

## 3. 参考情報

- **Project Ref**: `sfscmpjplvxtikmifqhe`
- **パスワード**: 環境変数 `SUPABASE_DB_PASSWORD` で指定
- **Supabase Dashboard**: https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe
- **Supabase CLI Config**: https://supabase.com/docs/guides/local-development/cli/config
- **Supabase Auth Redirect URLs**: https://supabase.com/docs/guides/auth/redirect-urls
- **詳細手順**: [DATABASE_MANAGEMENT_DETAILED.md](./tasksarchive/DATABASE_MANAGEMENT_DETAILED.md)（アーカイブ）

---

## 4. Workersとの関係

- **Supabase（DB/設定）の反映**: `make db-apply` / `supabase config push`
- **Workersのデプロイ**: GitHub Actions（CI/CD）のみ。手動 `wrangler deploy` 禁止。[ISA]
- **アクセス先**: 開発・本番とも Docker+Traefik 経由の `https://casto.sb2024.xyz` を使用。`localhost` 禁止。

詳細は [DEPLOYMENT_POLICY.md](./DEPLOYMENT_POLICY.md) と [CRITICAL_RULES.md](./CRITICAL_RULES.md) を参照。

---

**まとめ**: `make db-new` → `make migrate`（自動チェック付き）と `supabase config push` の2本柱でSupabase全体の状態を保ちます。Git hookとMakefileによる自動化で、整合性チェックの実行漏れをゼロにします。[SF][DRY][REH]
