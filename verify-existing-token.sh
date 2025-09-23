#!/bin/bash

# 既存のAPI Tokenの権限確認スクリプト
# GitHub SecretsのAPI Tokenをテストする

echo "🔍 既存のAPI Tokenの権限確認"
echo "このスクリプトは既存のAPI TokenでWrangler 4.x系が動作するかテストします"
echo ""

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN環境変数が設定されていません"
    echo "使用方法:"
    echo "export CLOUDFLARE_API_TOKEN='your_existing_token'"
    echo "$0"
    exit 1
fi

cd apps/workers

echo "📋 Wrangler バージョン:"
npx wrangler --version
echo ""

echo "🔐 既存のAPI Tokenでの認証テスト:"
echo "Token format: ${CLOUDFLARE_API_TOKEN:0:10}..."

# 認証テスト
if npx wrangler whoami; then
    echo ""
    echo "✅ 既存のAPI Tokenで認証成功！"
    echo ""
    echo "🚀 デプロイテスト (dry-run):"
    if npx wrangler deploy --dry-run --env production; then
        echo ""
        echo "🎉 既存のAPI TokenでWrangler 4.x系が正常動作！"
        echo "💡 結論: 新しいAPI Tokenは不要です"
        echo ""
        echo "📝 GitHub Secretsの確認事項:"
        echo "1. CLOUDFLARE_API_TOKEN が正しく設定されているか"
        echo "2. API Tokenの有効期限が切れていないか"
        echo "3. GitHub Actions環境での環境変数設定が正しいか"
    else
        echo ""
        echo "❌ デプロイテスト失敗"
        echo "💡 権限不足の可能性があります"
    fi
else
    echo ""
    echo "❌ 既存のAPI Tokenで認証失敗"
    echo "💡 以下を確認してください:"
    echo "1. API Tokenの有効期限"
    echo "2. API Tokenの権限設定"
    echo "3. Cloudflareアカウントの状態"
fi
