# casto: デプロイメントガイド

## 🎯 概要
このガイドでは、castoアプリケーションをGitHubからVercel・Cloudflare・Supabaseに自動デプロイする手順を説明します。

## 📋 前提条件

### 必要なアカウント
- [x] GitHub アカウント
- [ ] Vercel アカウント
- [ ] Cloudflare アカウント
- [ ] Supabase アカウント
- [ ] Stripe アカウント (課金機能用)

### 必要なCLIツール
```bash
# GitHub CLI
brew install gh

# Vercel CLI
npm install -g vercel

# Wrangler (Cloudflare)
npm install -g wrangler

# Supabase CLI
brew install supabase/tap/supabase
```

---

## 🚀 Phase 1: GitHubリポジトリセットアップ

### 1.1 リポジトリ作成
```bash
cd /Users/taichiumeki/dev/services/casto

# Git初期化
git init
git add .
git commit -m "Initial commit: casto project setup

- Next.js frontend with MUI
- Cloudflare Workers backend
- Turbo monorepo structure
- CI/CD workflows configured"

# GitHubリポジトリ作成 (プライベート)
gh repo create casto --private --source=. --push
```

### 1.2 ブランチ戦略設定
```bash
# develop ブランチ作成
git checkout -b develop
git push -u origin develop

# main ブランチに戻る
git checkout main
```

### 1.3 ブランチ保護設定
```bash
# GitHub CLI でブランチ保護設定
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=true \
## 🌐 Phase 2: Vercel (Frontend) セットアップ
### 2.1 環境構成
- Development: `develop` ブランチ（Preview / Dev プロジェクト）
- Production: `main` ブランチ（本番プロジェクト）

### 2.2 プロジェクト作成
```bash
cd apps/web
vercel --name casto-dev           # Development（例: casto-dev.vercel.app）
vercel --name casto-production    # Production（例: web-xi-seven-98.vercel.app）
cd ../..
```

### 2.3 繰境変数設定
```bash
# Development
vercel env add NEXT_PUBLIC_API_BASE_URL development   # 例: https://casto-workers-dev.casto-api.workers.dev
vercel env add NEXT_PUBLIC_WEB_BASE_URL development   # 例: https://casto-dev.vercel.app

# Production
vercel env add NEXT_PUBLIC_API_BASE_URL production    # https://casto-workers.casto-api.workers.dev
vercel env add NEXT_PUBLIC_WEB_BASE_URL production    # https://web-xi-seven-98.vercel.app/
# 将来: https://casto.io/ へ切替予定
### 7.1 Vercel Analytics
1. Vercel Dashboard → Analytics → Enable
2. Core Web Vitals監視
3. エラー率監視

### 7.2 Cloudflare Analytics
1. Cloudflare Dashboard → Analytics & Logs
2. Workers Analytics有効化
3. レスポンス時間・エラー率監視

### 7.3 Supabase Monitoring
1. Supabase Dashboard → Settings → Monitoring
2. データベース使用量監視
3. API使用量監視

### 7.4 GitHub Actions通知
```yaml
# .github/workflows/notify.yml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 🚨 トラブルシューティング

### デプロイ失敗時の対処

#### 1. Vercel デプロイ失敗
```bash
# ローカルでビルド確認
cd apps/web
npm run build

# Vercel ログ確認
vercel logs
```

#### 2. Workers デプロイ失敗
```bash
# ローカルでビルド確認
cd apps/workers
npm run build

# Wrangler ログ確認
wrangler tail
```

#### 3. 環境変数エラー
```bash
# Vercel 環境変数確認
vercel env ls

# Workers Secrets確認
wrangler secret list
```

### ロールバック手順

#### 1. Vercel ロールバック
1. Vercel Dashboard → Deployments
2. 前のデプロイメントを選択
3. "Promote to Production" クリック

#### 2. Workers ロールバック
```bash
# 前のバージョンに戻す
wrangler rollback
```

#### 3. Database ロールバック
```bash
# Supabase Migration ロールバック
supabase db reset
```

---

## ✅ デプロイ完了チェックリスト

### 基本機能
- [ ] フロントエンド (Next.js) 正常表示
- [ ] API (Workers) 正常レスポンス
- [ ] データベース (Supabase) 接続確認
- [ ] 認証機能動作確認

### CI/CD
- [ ] PR作成時の自動テスト
- [ ] develop ブランチの自動Developmentデプロイ
- [ ] main ブランチの自動Productionデプロイ
- [ ] デプロイ失敗時の通知

### セキュリティ
- [ ] HTTPS通信確認
- [ ] 環境変数の適切な設定
- [ ] RLS (Row Level Security) 有効化
- [ ] CORS設定確認

### パフォーマンス
- [ ] Core Web Vitals 良好
- [ ] API レスポンス時間 < 500ms
- [ ] データベースクエリ最適化

### 監視
- [ ] エラー監視設定
- [ ] パフォーマンス監視設定
- [ ] 使用量監視設定
- [ ] アラート通知設定

---

## 🔄 継続的改善

### 定期的なメンテナンス
- **週次**: 依存関係更新
- **月次**: セキュリティ監査
- **四半期**: パフォーマンス最適化

### メトリクス監視
- デプロイ頻度: 目標 1回/日
- デプロイ成功率: 目標 95%以上
- ロールバック時間: 目標 5分以内

### 改善施策
1. **自動テスト拡充**: E2Eテスト追加
2. **パフォーマンス最適化**: CDN活用
3. **セキュリティ強化**: 定期的な脆弱性スキャン

---

## 📞 サポート

### 問題発生時の連絡先
- **緊急時**: Slack #casto-alerts
- **一般的な問題**: GitHub Issues
- **セキュリティ問題**: security@casto.io（予定ドメイン）

### 有用なリンク
- [Vercel Documentation](https://vercel.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

このガイドに従って、安全で効率的なデプロイ環境を構築できます。
