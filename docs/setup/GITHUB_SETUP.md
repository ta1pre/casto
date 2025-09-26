# GitHubリポジトリセットアップ手順

## 🎯 今すぐ実行すべきコマンド

以下のコマンドを順番に実行してGitHubリポジトリを作成し、自動デプロイ環境を構築します。

### 1. Git初期化とコミット
```bash
cd /Users/taichiumeki/dev/services/casto

# Git初期化
git init

# 全ファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: casto project setup

- Next.js frontend with MUI v6
- Cloudflare Workers backend with Hono
- Turbo monorepo structure
- Complete CI/CD workflows configured
- Deployment strategy and guides ready
- Environment templates prepared"
```

### 2. GitHubリポジトリ作成
```bash
# GitHub CLI でプライベートリポジトリ作成
gh repo create casto --private --source=. --push

# 作成されたリポジトリ確認
gh repo view
```

### 3. ブランチ戦略設定
```bash
# develop ブランチ作成
git checkout -b develop
git push -u origin develop

# main ブランチに戻る
git checkout main

# ブランチ保護設定 (main)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

# ブランチ保護設定 (develop)  
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

### 4. GitHub Actions 有効化確認
```bash
# ワークフローファイル確認
ls -la .github/workflows/

# リポジトリのActions設定確認
gh api repos/:owner/:repo/actions/permissions
```

## ✅ 完了確認

以下が正常に作成されていることを確認してください：

### GitHubリポジトリ
- [ ] プライベートリポジトリ作成済み
- [ ] main・develop ブランチ存在
- [ ] ブランチ保護設定済み

### ファイル構成
- [ ] `.gitignore` - Git管理除外設定
- [ ] `.env.example` - 環境変数テンプレート
- [ ] `README.md` - プロジェクト概要
- [ ] `.github/workflows/` - CI/CDワークフロー

### ドキュメント
- [ ] `docs/DEPLOYMENT_STRATEGY.md` - デプロイ戦略
- [ ] `docs/DEPLOYMENT_GUIDE.md` - デプロイ手順
- [ ] `docs/ARCHITECTURE.md` - 技術設計
- [ ] `docs/SPEC.md` - 機能仕様

## 🚀 次のステップ

GitHubリポジトリ作成後、以下の手順でデプロイ環境を構築してください：

1. **Vercel連携** - [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) Phase 2
2. **Cloudflare Workers設定** - Phase 3
3. **Supabase設定** - Phase 4
4. **GitHub Secrets設定** - Phase 5
5. **デプロイテスト** - Phase 6

詳細は [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) を参照してください。

## 🔧 トラブルシューティング

### GitHub CLI未インストールの場合
```bash
# macOS
brew install gh

# 認証
gh auth login
```

### Git設定が未完了の場合
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### リポジトリ作成エラーの場合
```bash
# 手動でGitHubにリポジトリ作成後
git remote add origin https://github.com/yourusername/casto.git
git push -u origin main
```

実行後、GitHub上でリポジトリが正常に作成されていることを確認してください。
