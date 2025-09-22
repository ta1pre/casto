#!/bin/bash

echo "🚀 casto自動デプロイ環境セットアップ開始"

# GitHubリポジトリ作成
echo "📦 GitHubリポジトリ作成中..."
gh repo create casto --private --source=. --push

# developブランチ作成
echo "🌿 developブランチ作成中..."
git checkout -b develop
git push -u origin develop
git checkout main

# Vercelログイン・プロジェクト作成
echo "⚡ Vercelセットアップ中..."
vercel login
cd apps/web
vercel --name casto-dev
vercel --name casto-staging  
vercel --name casto-production
cd ../..

# Cloudflare Workers ログイン・デプロイ
echo "☁️ Cloudflare Workersセットアップ中..."
wrangler login
cd apps/workers
wrangler deploy --env staging
wrangler deploy --env production
cd ../..

# GitHub Secrets設定用の情報表示
echo "🔐 GitHub Secrets設定が必要です："
echo "以下のコマンドを実行してください："
echo ""
echo "# Vercel情報取得"
echo "vercel teams ls"
echo "vercel projects ls"
echo ""
echo "# GitHub Secrets設定"
echo "gh secret set VERCEL_TOKEN"
echo "gh secret set VERCEL_ORG_ID"
echo "gh secret set VERCEL_PROJECT_ID"
echo "gh secret set CLOUDFLARE_API_TOKEN"

echo "✅ 基本セットアップ完了！"
