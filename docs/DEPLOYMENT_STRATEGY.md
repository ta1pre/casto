# casto: デプロイ環境構築作戦

## 🎯 目標
GitHubを起点とした自動デプロイ環境を構築し、dev/staging/production環境への継続的デプロイメントを実現する。

## 📋 事前準備チェックリスト

### ✅ 完了済み
- [x] Next.js (apps/web) 環境構築
- [x] Cloudflare Workers (apps/workers) 環境構築
- [x] Turborepモノレポ構成
- [x] 技術アーキテクチャ設計完了

### 🔲 実施必要項目
- [ ] GitHubリポジトリ作成
- [ ] 環境変数・シークレット管理設計
- [ ] CI/CDパイプライン構築
- [ ] デプロイ先環境セットアップ

---

## 🏗️ デプロイ戦略

### 1. デプロイ先環境選定

#### Frontend (Next.js)
**選定: Vercel** ✅
- **理由**: Next.js最適化、自動プレビュー、簡単設定
- **環境**: 
  - `dev`: feature branchの自動プレビュー
  - `staging`: develop branchの自動デプロイ
  - `production`: main branchの自動デプロイ

#### Backend (Cloudflare Workers)
**選定: Cloudflare Workers** ✅
- **理由**: アーキテクチャ設計通り、グローバルエッジ、低レイテンシ
- **環境**:
  - `dev`: ローカル開発 (wrangler dev)
  - `staging`: staging環境 (wrangler deploy --env staging)
  - `production`: 本番環境 (wrangler deploy --env production)

#### Database
**選定: Supabase** ✅
- **理由**: PostgreSQL、RLS、リアルタイム機能
- **環境**:
  - `dev`: ローカルSupabase (supabase start)
  - `staging`: Supabase staging project
  - `production`: Supabase production project

#### Storage
**選定: Cloudflare R2** ✅
- **理由**: Workers連携、コスト効率
- **環境**: 環境別バケット

---

## 🔄 CI/CDパイプライン設計

### GitHub Actions ワークフロー

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ feature/* → PR  │───▶│ develop branch  │───▶│  main branch    │
│ Auto Preview    │    │ Auto Deploy     │    │ Manual Deploy   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### ワークフロー詳細

#### 1. PR作成時 (feature/* → develop)
- **トリガー**: Pull Request作成・更新
- **実行内容**:
  - Lint & Type Check
  - Unit Tests
  - Build Check
  - Vercel Preview Deploy
  - Workers Preview Deploy

#### 2. Staging Deploy (develop branch)
- **トリガー**: develop branchへのpush
- **実行内容**:
  - 全テスト実行
  - Vercel Staging Deploy
  - Workers Staging Deploy
  - E2E Tests (staging環境)

#### 3. Production Deploy (main branch)
- **トリガー**: main branchへのpush (手動承認)
- **実行内容**:
  - Production Build
  - Vercel Production Deploy
  - Workers Production Deploy
  - Health Check
  - Rollback準備

---

## 🔐 環境変数・シークレット管理

### 管理方針
- **GitHub Secrets**: CI/CD用のデプロイキー
- **Vercel Environment Variables**: Frontend用環境変数
- **Cloudflare Workers Secrets**: Backend用シークレット
- **Supabase**: Database接続情報

### 環境別設定

#### Development
```bash
# .env.local (Git管理外)
NEXT_PUBLIC_API_BASE_URL=わからない（ローカルAPI URL不明）
NEXT_PUBLIC_WEB_BASE_URL=わからない（ローカルWeb URL不明）
SUPABASE_URL=わからない（ローカルSupabase URL不明）
SUPABASE_ANON_KEY=local_anon_key
```

#### Staging
```bash
# Vercel Environment Variables
NEXT_PUBLIC_API_BASE_URL=https://api-staging.casto.app
NEXT_PUBLIC_WEB_BASE_URL=https://staging.casto.app
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging_anon_key
```

#### Production
```bash
# Vercel Environment Variables
NEXT_PUBLIC_API_BASE_URL=https://casto-workers.casto-api.workers.dev
NEXT_PUBLIC_WEB_BASE_URL=https://casto.app
SUPABASE_URL=https://production-project.supabase.co
SUPABASE_ANON_KEY=production_anon_key
```

---

## 📦 デプロイ手順

### Phase 1: 基盤セットアップ (1-2日)
1. **GitHubリポジトリ作成**
   ```bash
   # ローカルでGit初期化
   cd /Users/taichiumeki/dev/services/casto
   git init
   git add .
   git commit -m "Initial commit: casto project setup"
   
   # GitHub CLI使用 (推奨)
   gh repo create casto --private --source=. --push
   ```

2. **ブランチ戦略設定**
   ```bash
   git checkout -b develop
   git push -u origin develop
   git checkout main
   ```

3. **環境別プロジェクト作成**
   - Vercel: 3プロジェクト (dev/staging/production)
   - Supabase: 2プロジェクト (staging/production)
   - Cloudflare: Workers環境設定

### Phase 2: CI/CD構築 (2-3日)
1. **GitHub Actions設定**
   - `.github/workflows/` ディレクトリ作成
   - PR Check workflow
   - Staging Deploy workflow  
   - Production Deploy workflow

2. **Secrets設定**
   - GitHub Repository Secrets
   - Vercel Deploy Hooks
   - Cloudflare API Tokens

### Phase 3: 自動化テスト (1日)
1. **デプロイテスト**
   - feature branch → PR → Preview
   - develop → Staging Deploy
   - main → Production Deploy

2. **ロールバック手順確認**

---

## 🚀 実装優先順位

### 🔥 High Priority (今すぐ)
1. **GitHubリポジトリ作成** - 全ての基盤
2. **Vercel連携** - Frontend自動デプロイ
3. **基本CI/CD** - PR Check + Auto Deploy

### 🟡 Medium Priority (1週間以内)
1. **Cloudflare Workers自動デプロイ**
2. **Supabase Migration自動化**
3. **E2E Testing Pipeline**

### 🟢 Low Priority (2週間以内)
1. **監視・アラート設定**
2. **Performance Testing**
3. **Security Scanning**

---

## 🛠️ 必要なツール・サービス

### 開発ツール
- **GitHub CLI**: `gh` コマンド
- **Vercel CLI**: `vercel` コマンド  
- **Wrangler CLI**: `wrangler` コマンド
- **Supabase CLI**: `supabase` コマンド

### 外部サービス
- **GitHub**: ソースコード管理・CI/CD
- **Vercel**: Frontend hosting
- **Cloudflare**: Workers・R2・DNS
- **Supabase**: Database・Auth

---

## 📊 成功指標

### デプロイ効率
- [ ] PR作成からPreview表示まで: 5分以内
- [ ] develop pushからStaging反映まで: 10分以内
- [ ] main pushからProduction反映まで: 15分以内

### 品質保証
- [ ] 自動テストカバレッジ: 80%以上
- [ ] デプロイ成功率: 95%以上
- [ ] ロールバック時間: 5分以内

### 運用効率
- [ ] 手動デプロイ作業: 0回/週
- [ ] 環境差異によるバグ: 0件/月
- [ ] デプロイ関連障害: 0件/月

---

## 🚨 リスク対策

### デプロイ失敗時
- **自動ロールバック**: Health Check失敗時
- **手動ロールバック**: 5分以内実行可能
- **緊急連絡**: Slack通知・メール通知

### セキュリティ
- **シークレット漏洩防止**: GitHub Secrets使用
- **アクセス制御**: 最小権限原則
- **監査ログ**: 全デプロイ操作記録

### 依存関係
- **外部サービス障害**: 代替手段準備
- **API制限**: レート制限監視
- **コスト管理**: 使用量アラート

---

## 📝 次のアクション

### 今日実施
1. **GitHubリポジトリ作成**
2. **Vercel初期設定**
3. **基本ワークフロー作成**

### 今週実施  
1. **全環境デプロイテスト**
2. **CI/CD完全自動化**
3. **監視設定**

### 来週実施
1. **パフォーマンス最適化**
2. **セキュリティ強化**
3. **運用ドキュメント整備**

---

## 💡 補足

### アーキテクチャとの整合性
- ✅ Next.js (Vercel) = フロントエンド専用
- ✅ Cloudflare Workers = API・認証・Webhook
- ✅ PostgreSQL (Supabase) = データベース
- ✅ Cloudflare R2 = ストレージ

### スケーラビリティ
- **水平スケーリング**: Vercel・Workers自動スケール
- **垂直スケーリング**: Supabaseプラン変更
- **地理的分散**: Cloudflareグローバルエッジ

この戦略により、安全で効率的な自動デプロイ環境を構築できます。
