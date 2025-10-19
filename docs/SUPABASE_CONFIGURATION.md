# Supabase 設定管理ガイド

## ディレクトリ構成

### `supabase/` - プロジェクト設定（Git管理対象）
```
supabase/
├── config.toml          # プロジェクト設定ファイル ✅ Git管理
├── migrations/          # DBマイグレーション ✅ Git管理
├── .temp/              # 一時ファイル ❌ gitignore
└── .branches/          # ブランチ情報 ❌ gitignore
```

**役割**: プロジェクト全体で共有する設定
- Auth設定（Site URL、Redirect URLs）
- API設定
- DB設定
- Storage設定

**管理方法**: 
```bash
# 設定編集
vim supabase/config.toml

# リモートに反映
supabase config push --project-ref sfscmpjplvxtikmifqhe

# Gitにコミット
git add supabase/config.toml
git commit -m "chore: update supabase config"
```

### `.supabase/` - ローカルリンク情報（Git管理対象外）
```
.supabase/
└── config.toml         # ローカルリンク情報 ❌ gitignore
```

**役割**: ローカル環境ごとのリンク情報（自動生成）
- プロジェクトID
- ローカルポート設定

**管理方法**: 
- `supabase link` コマンドで自動生成
- **Git管理しない**（`.gitignore`に追加済み）
- チーム各自が `supabase link --project-ref sfscmpjplvxtikmifqhe` で生成

## 設定変更フロー

### 1. Auth設定の変更

```bash
# 1. supabase/config.toml を編集
vim supabase/config.toml

# 2. リモートに反映
supabase config push --project-ref sfscmpjplvxtikmifqhe

# 3. Gitにコミット
git add supabase/config.toml
git commit -m "chore: update auth config"
```

### 2. 新しい環境でのセットアップ

```bash
# 1. リポジトリをクローン
git clone <repository>

# 2. Supabaseプロジェクトにリンク
supabase link --project-ref sfscmpjplvxtikmifqhe

# .supabase/config.toml が自動生成される
```

## 設定内容

### `supabase/config.toml`

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

## トラブルシューティング

### `.supabase/` がGit管理されている
```bash
# gitignoreに追加
echo ".supabase/" >> .gitignore

# Git管理から削除
git rm -r --cached .supabase/

# コミット
git commit -m "chore: remove .supabase from git"
```

### 設定がリモートに反映されない
```bash
# 設定を確認
cat supabase/config.toml

# 強制プッシュ
supabase config push --project-ref sfscmpjplvxtikmifqhe

# リンク状態を確認
supabase link --project-ref sfscmpjplvxtikmifqhe
```

## 参考

- [Supabase CLI Config Reference](https://supabase.com/docs/guides/local-development/cli/config)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/redirect-urls)

---

**最終更新**: 2025-10-19
