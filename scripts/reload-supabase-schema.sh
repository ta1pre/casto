#!/bin/bash
# Supabaseスキーマキャッシュをリロード
# PostgRESTを再起動してスキーマを再読み込み

PROJECT_REF="sfscmpjplvxtikmifqhe"

echo "🔄 Reloading Supabase schema cache for project: $PROJECT_REF"
echo ""
echo "このスクリプトは、Supabase Management APIを使用してPostgRESTを再起動します。"
echo ""
echo "⚠️  実行するには、Supabaseのアクセストークンが必要です:"
echo "   https://supabase.com/dashboard/account/tokens"
echo ""
echo "以下のコマンドを実行してください:"
echo ""
echo "curl -X POST \\"
echo "  'https://api.supabase.com/v1/projects/${PROJECT_REF}/restart' \\"
echo "  -H 'Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"services\": [\"postgrest\"]}'"
echo ""
echo "または、Supabase Dashboardで:"
echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/general"
echo "  → 'Restart project' ボタンをクリック"
