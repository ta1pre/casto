#!/bin/bash

echo "🚀 手動GitHubリポジトリ連携セットアップ"

# GitHubリポジトリのURLを入力してもらう
echo "GitHubでリポジトリを作成後、以下を実行してください："
echo ""
echo "git remote add origin https://github.com/yourusername/casto.git"
echo "git push -u origin main"
echo ""
echo "その後、以下のコマンドでVercel・Cloudflareセットアップ："
echo ""

# Vercelセットアップ
echo "# Vercelログイン・プロジェクト作成"
echo "vercel login"
echo "cd apps/web"
echo "vercel --name casto-dev"
echo "vercel --name casto-staging"
echo "vercel --name casto-production"
echo "cd ../.."
echo ""

# Cloudflareセットアップ  
echo "# Cloudflare Workersセットアップ"
echo "wrangler login"
echo "cd apps/workers"
echo "wrangler deploy --env staging"
echo "wrangler deploy --env production"
echo "cd ../.."
echo ""

echo "これで基本セットアップ完了です！"
