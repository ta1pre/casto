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
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

---

## 🌐 Phase 2: Vercel (Frontend) セットアップ

### 2.1 Vercelプロジェクト作成

#### Development (Preview)
```bash
cd apps/web
vercel --name casto-dev
# ドメイン: casto-dev.vercel.app
```

#### Staging
```bash
vercel --name casto-staging
# ドメイン: casto-staging.vercel.app
```

#### Production
```bash
vercel --name casto-production
# カスタムドメイン: casto.app
```

### 2.2 環境変数設定

#### Development
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL development
# 値: http://localhost:8787

vercel env add NEXT_PUBLIC_WEB_BASE_URL development
# 値: http://localhost:3000
```

#### Staging
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL staging
# 値: https://api-staging.casto.app

vercel env add NEXT_PUBLIC_WEB_BASE_URL staging
# 値: https://casto-staging.vercel.app
```

#### Production
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL production
# 値: https://casto-workers.casto-api.workers.dev

vercel env add NEXT_PUBLIC_WEB_BASE_URL production
# 値: https://casto.app
```

### 2.3 Git連携設定
1. Vercel Dashboard → Settings → Git
2. GitHub連携を有効化
3. ブランチ設定:
   - `main` → Production
   - `develop` → Staging
   - `feature/*` → Preview

---

## ⚡ Phase 3: Cloudflare Workers (Backend) セットアップ

### 3.1 Cloudflareアカウント設定
```bash
cd apps/workers

# Cloudflareにログイン
wrangler login

# アカウントID確認
wrangler whoami
```

### 3.2 環境別デプロイ

#### Staging環境
```bash
# Staging環境にデプロイ
wrangler deploy --env staging

# カスタムドメイン設定 (Cloudflare Dashboard)
# api-staging.casto.app → casto-workers-stg.your-subdomain.workers.dev
```

#### Production環境
```bash
# Production環境にデプロイ
wrangler deploy --env production

# カスタムドメイン設定
# api.casto.app → casto-workers.your-subdomain.workers.dev
```

### 3.3 Secrets設定
```bash
# JWT Secret
wrangler secret put JWT_SECRET --env staging
wrangler secret put JWT_SECRET --env production

# Database URL
wrangler secret put DATABASE_URL --env staging
wrangler secret put DATABASE_URL --env production

# LINE設定
wrangler secret put LINE_CHANNEL_SECRET --env staging
wrangler secret put LINE_CHANNEL_SECRET --env production

# Stripe設定
wrangler secret put STRIPE_SECRET_KEY --env staging
wrangler secret put STRIPE_SECRET_KEY --env production
```

---

## 🗄️ Phase 4: Supabase (Database) セットアップ

### 4.1 プロジェクト作成

#### Staging
1. [Supabase Dashboard](https://supabase.com/dashboard) → New Project
2. プロジェクト名: `casto-staging`
3. データベースパスワード設定
4. リージョン: `Northeast Asia (Tokyo)`

#### Production
1. New Project
2. プロジェクト名: `casto-production`
3. データベースパスワード設定
4. リージョン: `Northeast Asia (Tokyo)`

### 4.2 データベーススキーマ作成
```bash
# Staging環境
supabase link --project-ref your-staging-project-ref
supabase db push

# Production環境
supabase link --project-ref your-production-project-ref
supabase db push
```

### 4.3 RLS (Row Level Security) 設定
```sql
-- 各テーブルでRLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- ポリシー作成 (例: ユーザーは自分のデータのみアクセス可能)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

---

## 🔐 Phase 5: GitHub Secrets 設定

### 5.1 必要なSecrets
```bash
# Vercel関連
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set VERCEL_STAGING_PROJECT_ID
gh secret set VERCEL_PRODUCTION_PROJECT_ID

# Cloudflare関連
gh secret set CLOUDFLARE_API_TOKEN
```

### 5.2 Secrets取得方法

#### Vercel Token
1. [Vercel Settings](https://vercel.com/account/tokens) → Create Token
2. スコープ: Full Account
3. 有効期限: 1年

#### Vercel Project IDs
```bash
# プロジェクトID確認
vercel ls
```

---

## ⚠️ 注意事項（ヘルスチェックの整合性）

- `.github/workflows/production-deploy.yml` では Web のヘルスチェックとして `https://casto.app/api/health` を参照しています。
- 本レポジトリ（`apps/web`）内には `/api/health` エンドポイントの実装は見当たりません（確認済み）。
- Cloudflare Workers 側には `/api/v1/health` が実装されています（確認済み）。
- 実運用で Web 側に別途ヘルスエンドポイントがあるかは「わからない」。
- 運用方針に合わせて ①Web に `/api/health` を実装する ②ヘルスチェック先を別URLに変更する ③Workers の `/api/v1/health` を用いる、のいずれかに統一してください。

#### Cloudflare API Token
1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token
2. テンプレート: Custom token
3. 権限:
   - Zone:Zone:Read
   - Zone:DNS:Edit
   - Account:Cloudflare Workers:Edit

---

## 🧪 Phase 6: デプロイテスト

### 6.1 PR作成テスト
```bash
# feature ブランチ作成
git checkout -b feature/test-deploy
echo "# Test Deploy" > TEST_DEPLOY.md
git add TEST_DEPLOY.md
git commit -m "feat: add test deploy file"
git push -u origin feature/test-deploy

# PR作成
gh pr create --title "Test Deploy" --body "Testing CI/CD pipeline"
```

**期待結果:**
- ✅ Lint & Type Check 成功
- ✅ Vercel Preview Deploy 成功
- ✅ Workers Preview Deploy 成功

### 6.2 Staging デプロイテスト
```bash
# PR をdevelopにマージ
gh pr merge --merge

# develop ブランチでの自動デプロイ確認
git checkout develop
git pull origin develop
```

**期待結果:**
- ✅ Staging環境に自動デプロイ
- ✅ https://casto-staging.vercel.app アクセス可能
- ✅ https://api-staging.casto.app アクセス可能

### 6.3 Production デプロイテスト
```bash
# develop → main PR作成
git checkout main
git pull origin main
gh pr create --base main --head develop --title "Release v1.0.0" --body "Initial production release"

# PR承認・マージ後、Production環境確認
```

**期待結果:**
- ✅ Production環境に自動デプロイ
- ✅ https://casto.app アクセス可能
- ✅ https://casto-workers.casto-api.workers.dev アクセス可能

---

## 📊 Phase 7: 監視・アラート設定

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
- [ ] develop ブランチの自動Stagingデプロイ
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
- **セキュリティ問題**: security@casto.app

### 有用なリンク
- [Vercel Documentation](https://vercel.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

このガイドに従って、安全で効率的なデプロイ環境を構築できます。
