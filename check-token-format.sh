#!/bin/bash

# API Token形式チェックスクリプト

echo "🔍 API Token形式チェック"
echo "=========================="

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN環境変数が設定されていません"
    echo ""
    echo "GitHub Actionsでの実際のToken情報:"
    echo "Token format: bf1fe26a5c..."
    echo ""
    echo "💡 確認事項:"
    echo "1. GitHub Secrets の CLOUDFLARE_API_TOKEN が正しく設定されているか"
    echo "2. API Tokenに余分な文字（スペース、改行など）が含まれていないか"
    echo "3. API Tokenの有効期限が切れていないか"
    echo "4. API Tokenの権限が正しく設定されているか"
    exit 1
fi

echo "📋 Token情報:"
echo "Token format: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo "Token length: ${#CLOUDFLARE_API_TOKEN} characters"

# 正しいAPI Tokenの形式チェック
if [[ ${#CLOUDFLARE_API_TOKEN} -eq 40 ]]; then
    echo "✅ Token length is correct (40 characters)"
else
    echo "❌ Token length is incorrect (expected: 40, actual: ${#CLOUDFLARE_API_TOKEN})"
fi

# 文字形式チェック
if [[ $CLOUDFLARE_API_TOKEN =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "✅ Token format appears valid"
else
    echo "❌ Token contains invalid characters"
fi

echo ""
echo "🔐 API Token直接テスト:"
echo "------------------------"

# API Token直接テスト
RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Token is valid!"
    
    # 権限確認
    echo ""
    echo "🔍 Token権限確認:"
    echo "----------------"
    echo "$BODY" | jq '.result.permissions // "No permissions found"' 2>/dev/null || echo "$BODY"
else
    echo "❌ API Token verification failed"
    
    if [ "$HTTP_CODE" = "401" ]; then
        echo "💡 Token is invalid or expired"
    elif [ "$HTTP_CODE" = "403" ]; then
        echo "💡 Token lacks necessary permissions"
    else
        echo "💡 Unexpected error occurred"
    fi
fi
