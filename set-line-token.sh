#!/bin/bash
# LINEチャネルアクセストークンをCloudflare Workers Secretsに設定

cd /Users/taichiumeki/dev/services/casto/apps/workers

echo "LINE_CHANNEL_ACCESS_TOKENを設定します..."
echo "LINE Developers Consoleからコピーしたチャネルアクセストークンを入力してください："
read -s TOKEN

npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN --env development <<< "$TOKEN"

echo "✅ 完了しました"
