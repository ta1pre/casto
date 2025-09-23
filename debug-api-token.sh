#!/bin/bash

# API Token詳細デバッグスクリプト
# 既存のAPI Tokenの権限と動作を詳細に検証する

echo "🔍 API Token詳細デバッグ開始"
echo "========================================"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN環境変数が設定されていません"
    echo ""
    echo "使用方法:"
    echo "export CLOUDFLARE_API_TOKEN='your_existing_token'"
    echo "$0"
    exit 1
fi

echo "📋 基本情報:"
echo "Token format: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo "Token length: ${#CLOUDFLARE_API_TOKEN} characters"
echo ""

# 1. API Token検証
echo "🔐 Step 1: API Token検証"
echo "----------------------------------------"
TOKEN_VERIFY=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "Token verification response:"
echo "$TOKEN_VERIFY" | jq '.' 2>/dev/null || echo "$TOKEN_VERIFY"
echo ""

# 2. ユーザー情報取得
echo "👤 Step 2: ユーザー情報取得"
echo "----------------------------------------"
USER_INFO=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "User info response:"
echo "$USER_INFO" | jq '.' 2>/dev/null || echo "$USER_INFO"
echo ""

# 3. メンバーシップ情報取得（問題のエンドポイント）
echo "🏢 Step 3: メンバーシップ情報取得 (/memberships)"
echo "----------------------------------------"
MEMBERSHIPS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/memberships" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "Memberships response:"
echo "$MEMBERSHIPS" | jq '.' 2>/dev/null || echo "$MEMBERSHIPS"
echo ""

# 4. アカウント情報取得
echo "🏦 Step 4: アカウント情報取得"
echo "----------------------------------------"
ACCOUNTS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

echo "Accounts response:"
echo "$ACCOUNTS" | jq '.' 2>/dev/null || echo "$ACCOUNTS"
echo ""

# 5. Wrangler 4.x系でのテスト
echo "🔧 Step 5: Wrangler 4.x系テスト"
echo "----------------------------------------"
cd apps/workers

echo "Wrangler version:"
npx wrangler --version
echo ""

echo "Wrangler whoami test:"
if npx wrangler whoami; then
    echo "✅ Wrangler認証成功"
    
    echo ""
    echo "Wrangler deploy dry-run test:"
    if npx wrangler deploy --dry-run --env production; then
        echo "✅ Wrangler デプロイテスト成功"
    else
        echo "❌ Wrangler デプロイテスト失敗"
    fi
else
    echo "❌ Wrangler認証失敗"
fi

echo ""
echo "========================================"
echo "🎯 デバッグ完了"
