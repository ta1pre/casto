#!/bin/bash

# Wrangler 4.x系でのAPI Token テストスクリプト
# 使用方法: ./test-api-token.sh YOUR_NEW_API_TOKEN

if [ -z "$1" ]; then
    echo "使用方法: $0 <CLOUDFLARE_API_TOKEN>"
    echo "例: $0 your_new_api_token_here"
    exit 1
fi

API_TOKEN="$1"

echo "🔍 Wrangler 4.x系でのAPI Token テスト開始..."
echo "API Token: ${API_TOKEN:0:10}..."

cd apps/workers

# 環境変数を設定してテスト
export CLOUDFLARE_API_TOKEN="$API_TOKEN"

echo "📋 Wrangler バージョン確認:"
npx wrangler --version

echo "🔐 認証テスト:"
npx wrangler whoami

if [ $? -eq 0 ]; then
    echo "✅ 認証成功！"
    echo "🚀 デプロイテスト (dry-run):"
    npx wrangler deploy --dry-run --env production
    
    if [ $? -eq 0 ]; then
        echo "✅ デプロイテスト成功！"
        echo "🎉 Wrangler 4.x系への移行準備完了"
    else
        echo "❌ デプロイテスト失敗"
    fi
else
    echo "❌ 認証失敗"
    echo "💡 API Tokenの権限を確認してください："
    echo "   - Account: Cloudflare Workers:Edit"
    echo "   - User: User Details:Read"
    echo "   - User: Memberships:Read"
fi

# 環境変数をクリア
unset CLOUDFLARE_API_TOKEN
