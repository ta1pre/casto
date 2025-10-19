#!/bin/bash
# データベースマイグレーション自動化スクリプト
# [SF][CA] シンプル、クリーンアーキテクチャ

set -e

echo "🔍 環境変数を読み込み中..."

# .env.localから環境変数を読み込む
if [ -f "apps/web/.env.local" ]; then
  export $(grep -v '^#' apps/web/.env.local | grep SUPABASE_DB_PASSWORD | xargs)
  echo "✅ SUPABASE_DB_PASSWORD を読み込みました"
else
  echo "❌ apps/web/.env.local が見つかりません"
  exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ SUPABASE_DB_PASSWORD が設定されていません"
  exit 1
fi

# PostgreSQL標準の環境変数に設定
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

echo ""
echo "📋 マイグレーション整合性をチェック中..."
supabase migration list --linked

echo ""
echo "🚀 マイグレーションを適用中..."
supabase db push --include-all

echo ""
echo "✅ マイグレーション完了！"
echo ""
echo "📋 適用後の整合性を確認中..."
supabase migration list --linked

echo ""
echo "🎉 すべて完了しました！"
echo ""
echo "次のステップ:"
echo "  cd apps/workers"
echo "  npx wrangler deploy --env development"
