# Supabase運用ガイド

**シンプル・イズ・ベスト [SF][CA][DRY]**

このガイドは、Supabaseにおける「DBマイグレーション」と「設定（`supabase/config.toml`）」の運用を一元管理します。[TR]

---

## 🎯 基本原則

1. **リモート（Supabase）が唯一の正** – ローカルは常にリモートに従う。[PEC]
2. **DB変更はマイグレーションで自動生成** – `supabase db diff` を使い手書き禁止。[SF]
3. **操作はMakefile経由** – `make db-*` コマンドに集約し、ヒューマンエラーを削減。[DRY]
4. **Workersデプロイとは独立** – Supabase操作（DB/設定）はCloudflare WorkersのCI/CD経路と別物。[CA]

> 重要: ローカルDB（`supabase start` や `localhost:54321` 等）は使用しません。常にリモート（Supabase）を唯一のソース・オブ・トゥルースとし、操作はマイグレーションで行います。[PEC]

---

## 1. DBマイグレーション運用

### 1.1 前提

```bash
export SUPABASE_DB_PASSWORD='your_password'  # 例: xSNOAfHLgdqCOfyM
```

> 一度設定すれば同じシェルで使い回せます。パスワードはSupabase Dashboardで管理。[SFT]

### 1.2 コマンド（4つだけ）

```bash
# 新規変更を作る（自動diff）
make db-new

# リモートに適用
make db-apply

# 整合性確認
make db-check

# 不一致を修正（リモートが正）
make db-sync
```

### 1.3 ワークフロー

1. **`make db-new`** で差分を自動生成
   - ファイル名を意味のあるものに変更（例: `20251103123456_auto_generated.sql` → `20251103123456_add_user_avatar.sql`）
   - SQLは必ずべき等（`CREATE ... IF NOT EXISTS` / `DROP ... IF EXISTS` 等）
   - Seedデータも同じマイグレーションに含める

2. **変更をレビューしGitにコミット**
   ```bash
   git add supabase/migrations/*.sql
   git commit -m "feat: add user avatar column"
   ```

3. **`make db-apply`** でSupabaseリモートへ反映
   - べき等性を確保しているため、再実行しても安全
   - WorkersのAPI更新は自動的にCI/CDで反映（手動デプロイ禁止）

4. **`make db-check`** でLocal/Remoteが一致することを確認
   - Local/Remote列が完全一致すればOK ✅
   - 不一致があれば `make db-sync` を実行

5. **不一致は `make db-sync` → `make db-check` で解消**
   - リモートを正としてローカルを自動修正
   - 完了後に `make db-check` で確認

6. **Workersの再デプロイはGitHub Actionsが自動実行**
   ```bash
   git push origin develop  # CI/CDが自動デプロイ
   ```

### 1.4 トラブルシューティング

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

**まとめ**: `make db-new` → `make db-apply` → `make db-check` と `supabase config push` の2本柱でSupabase全体の状態を保ちます。[SF][DRY]
