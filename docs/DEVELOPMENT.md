# casto: 開発環境構築ガイド

## 現在の状況（2025-09-22時点）

### ✅ 構築済み
- Turborepモノレポ基盤
- `/apps/web` (Next.js 15.5.3)
- `/apps/workers` (Cloudflare Workers雛形)
- `/packages/shared`, `/packages/ui` ディレクトリ

### ❌ 未構築・不足部分
- データベース接続設定（外部環境の実体はわからない）
- 環境変数管理（本番/ステージングの最終値はわからない）
- ローカル開発サーバーの統合
- 本番デプロイ設定

---

## ローカル開発環境

### 1. 前提条件
```bash
# 必要なツール
- Node.js 18+
- npm/yarn
- Docker (PostgreSQL用)
- Cloudflare CLI (wrangler)
```

### 2. 初回セットアップ
```bash
# 1. 依存関係インストール
cd /Users/taichiumeki/dev/services/casto
npm install

# 2. Cloudflare CLI インストール
npm install -g wrangler

# 3. PostgreSQL (Docker)
docker run --name casto-postgres \
  -e POSTGRES_DB=casto_dev \
  -e POSTGRES_USER=casto \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:15

# 4. 環境変数設定
cp .env.example .env.local
```

### 3. 開発サーバー起動
```bash
# 全サービス同時起動
npm run dev

# 個別起動
npm run dev:web      # Next.js
npm run dev:workers  # Cloudflare Workers
```

### 4. 動作確認方法
- **本番 Web**: https://casto.sb2024.xyz/（存在するかは未確認）
- **本番 API**: https://casto-workers.casto-api.workers.dev（確認済み）

## Docker環境での起動
```bash
# ローカル開発サーバーを停止
pkill -f "next dev"

# Dockerでcasto起動
cd /Users/taichiumeki/dev/services/casto
docker-compose -f docker-compose.dev.yml up -d

# ログ確認
docker logs casto-nextjs

# 停止
docker-compose -f docker-compose.dev.yml down
```

---

## 本番環境デプロイ

### 1. Vercel (Next.js Web)
```bash
# Vercel CLI インストール
npm install -g vercel

# プロジェクト設定
cd apps/web
vercel

# 環境変数設定 (Vercel Dashboard)
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_LINE_LIFF_ID
```

### 2. Cloudflare Workers (API)
```bash
# Workers設定
cd apps/workers
wrangler login
wrangler deploy

# 環境変数設定
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
wrangler secret put LINE_CHANNEL_SECRET
wrangler secret put STRIPE_SECRET_KEY
```

補足: `apps/workers/src/index.ts` に API の実装（`/api/v1/health`, `/api/v1/users` など）が既に存在（確認済み）。

### 3. データベース (本番)
```bash
# Supabase推奨
# 1. https://supabase.com でプロジェクト作成
# 2. DATABASE_URL を取得
# 3. スキーマ適用: npm run db:migrate
```

---

## 環境変数管理

### 開発環境 (.env.local)
```env
# Database
DATABASE_URL="わからない（ローカルDB設定不明）"

# LINE
LINE_CHANNEL_ID="your_dev_channel_id"
LINE_CHANNEL_SECRET="your_dev_channel_secret"
LINE_LIFF_ID="your_dev_liff_id"

# Stripe
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# JWT
JWT_SECRET="your_dev_jwt_secret"

# API
NEXT_PUBLIC_API_BASE_URL="わからない（ローカルAPI URL不明）"
```

### 本番環境
- **Vercel**: Dashboard > Settings > Environment Variables
- **Cloudflare**: `wrangler secret put` コマンド
- **Supabase**: Dashboard > Settings > API

---

## 開発ワークフロー

### 1. 機能開発
```bash
# 1. ブランチ作成
git checkout -b feature/auth-system

# 2. 開発
npm run dev
# コード編集...

# 3. テスト
npm run test
npm run lint

# 4. コミット
git add .
git commit -m "feat(auth): implement LINE login"

# 5. プッシュ・PR作成
git push origin feature/auth-system
```

### 2. デプロイフロー
```bash
# Staging環境
git push origin develop
# → 自動デプロイ (Vercel Preview + Cloudflare Workers Preview)

# Production環境
git push origin main
# → 自動デプロイ (Vercel Production + Cloudflare Workers Production)
```

---

## トラブルシューティング

### よくある問題

#### 1. Cloudflare Workers が起動しない
```bash
# wrangler バージョン確認
wrangler --version

# ログイン状態確認
wrangler whoami

# 再ログイン
wrangler logout
wrangler login
```

#### 2. データベース接続エラー
```bash
# PostgreSQL コンテナ確認
docker ps | grep postgres

# 接続テスト
# わからない（ローカルDB接続方法不明）

# コンテナ再起動
docker restart casto-postgres
```

#### 3. Next.js ビルドエラー
```bash
# キャッシュクリア
rm -rf .next
rm -rf node_modules
npm install

# TypeScript エラー確認
npm run type-check
```

---

## 次のステップ

### 優先度 High
- [ ] Cloudflare Workers の実装完了
- [ ] データベーススキーマ作成
- [ ] 認証システム実装
- [ ] LINE LIFF 設定

### 優先度 Medium  
- [ ] CI/CD パイプライン構築
- [ ] 監視・ログ設定
- [ ] セキュリティ設定強化
- [ ] パフォーマンス最適化

---

## 参考リンク
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [LINE Developers](https://developers.line.biz/)
