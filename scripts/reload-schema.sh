#!/bin/bash
# Supabaseスキーマキャッシュをリロード

SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "Reloading Supabase schema cache..."

curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pgrst_watch" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"

echo ""
echo "Schema cache reload requested."
echo "Note: This might not work on all Supabase plans."
echo "If this fails, use the dashboard method instead."
