# casto Makefile
# 全ての操作をコマンド一発で実行できます

.PHONY: help setup-supabase migrate deploy-workers deploy-web test lint db-new db-apply db-check db-sync

# デフォルトターゲット
help:
	@echo "🚀 casto コマンド一覧"
	@echo "================================"
	@echo ""
	@echo "データベース:"
	@echo "  make db-new            - 新規マイグレーション生成（自動diff）"
	@echo "  make db-apply          - マイグレーション適用"
	@echo "  make db-check          - 整合性チェック（Local/Remote）"
	@echo "  make db-sync           - 不一致を自動修正（Remoteが正）"
	@echo "  make migrate           - マイグレーション適用（互換性のため残存）"
	@echo ""
	@echo "セットアップ:"
	@echo "  make setup-supabase    - Supabase DB初期化"
	@echo "  make reset-db          - DB完全リセット"
	@echo "  make generate-schema   - スキーマ生成（型定義・ドキュメント）"
	@echo ""
	@echo "テスト:"
	@echo "  make test-db           - DB接続テスト"
	@echo "  make test-workers      - Workers接続テスト"
	@echo ""
	@echo "デプロイ:"
	@echo "  make deploy-workers    - Workers デプロイ（開発環境）"
	@echo "  make deploy-web        - Web 再起動（Docker）"
	@echo "  make deploy-all        - 全てデプロイ"
	@echo ""
	@echo "開発:"
	@echo "  make lint              - Lint実行"
	@echo "  make test              - テスト実行"
	@echo "  make dev               - ローカル開発サーバー起動"
	@echo ""
	@echo "その他:"
	@echo "  make clean             - キャッシュクリア"
	@echo "  make logs              - Docker ログ表示"
	@echo ""

# Supabase セットアップ（完全自動）
setup-supabase:
	@echo "🚀 Supabase DB初期化..."
	@node scripts/db-cleanup.js

# ===== データベース管理（新方式） =====

# 新規マイグレーション生成（自動diff）
db-new:
	@echo "🔍 Generating migration from remote diff..."
	@if [ -z "$$SUPABASE_DB_PASSWORD" ]; then \
		echo "❌ Error: SUPABASE_DB_PASSWORD is not set"; \
		echo "Run: export SUPABASE_DB_PASSWORD='your_password'"; \
		exit 1; \
	fi
	@SUPABASE_DB_PASSWORD=$$SUPABASE_DB_PASSWORD supabase db diff --linked --file supabase/migrations/$$(date +%Y%m%d%H%M%S)_auto_generated.sql
	@echo "✅ Migration file created. Please review and rename it."

# リモートに適用
db-apply:
	@echo "🚀 Applying migrations to remote..."
	@if [ -z "$$SUPABASE_DB_PASSWORD" ]; then \
		echo "❌ Error: SUPABASE_DB_PASSWORD is not set"; \
		echo "Run: export SUPABASE_DB_PASSWORD='your_password'"; \
		exit 1; \
	fi
	@SUPABASE_DB_PASSWORD=$$SUPABASE_DB_PASSWORD supabase db push --include-all
	@echo "✅ Migrations applied."

# 整合性チェック
db-check:
	@echo "🔍 Checking local/remote migration consistency..."
	@if [ -z "$$SUPABASE_DB_PASSWORD" ]; then \
		echo "❌ Error: SUPABASE_DB_PASSWORD is not set"; \
		echo "Run: export SUPABASE_DB_PASSWORD='your_password'"; \
		exit 1; \
	fi
	@SUPABASE_DB_PASSWORD=$$SUPABASE_DB_PASSWORD supabase migration list --linked

# 自動同期（不一致を修正）
db-sync:
	@echo "🔄 Syncing local with remote (remote is source of truth)..."
	@if [ -z "$$SUPABASE_DB_PASSWORD" ]; then \
		echo "❌ Error: SUPABASE_DB_PASSWORD is not set"; \
		echo "Run: export SUPABASE_DB_PASSWORD='your_password'"; \
		exit 1; \
	fi
	@SUPABASE_DB_PASSWORD=$$SUPABASE_DB_PASSWORD supabase db pull --linked || true
	@echo "✅ Sync complete. Run 'make db-check' to verify."

# マイグレーション適用のみ（完全自動・互換性のため残存）
migrate: db-apply
	@echo "ℹ️  Note: 'make migrate' is deprecated. Use 'make db-apply' instead."

# DB完全リセット＆マイグレーション
reset-db:
	@echo "🔄 DB完全リセット..."
	@node scripts/db-cleanup.js

# DB接続テスト
test-db:
	@echo "🧪 DB接続テスト..."
	@node scripts/test-db.js

# Workers接続テスト
test-workers:
	@echo "🔧 Workers接続テスト..."
	@node scripts/test-workers-connection.js

# スキーマ生成（型定義・ドキュメント）
generate-schema:
	@echo "📊 スキーマ生成..."
	@node scripts/generate-schema.js

# Workers デプロイ（開発環境）
deploy-workers:
	@echo "🚀 Workers デプロイ（開発環境）..."
	@cd apps/workers && npm run deploy:development
	@echo "✅ 完了"

# Web 再起動（Docker）
deploy-web:
	@echo "🚀 Web 再起動..."
	@cd /Users/taichiumeki/dev && docker compose restart casto
	@echo "✅ 完了"

# 全てデプロイ
deploy-all: migrate deploy-workers deploy-web
	@echo "🎉 全てのデプロイが完了しました！"

# Lint
lint:
	@echo "🔍 Lint実行..."
	@cd apps/web && npm run lint
	@cd apps/workers && npm run lint
	@echo "✅ 完了"

# テスト
test:
	@echo "🧪 テスト実行..."
	@cd apps/web && npm run test
	@echo "✅ 完了"

# ローカル開発サーバー起動
dev:
	@echo "🚀 ローカル開発サーバー起動..."
	@cd /Users/taichiumeki/dev && docker compose up -d casto
	@echo "✅ 起動完了: https://casto.sb2024.xyz"

# キャッシュクリア
clean:
	@echo "🧹 キャッシュクリア..."
	@rm -rf apps/web/.next
	@rm -rf apps/web/node_modules/.cache
	@echo "✅ 完了"

# Docker ログ表示
logs:
	@cd /Users/taichiumeki/dev && docker logs -f casto

# Supabase ログイン（初回のみ）
supabase-login:
	@echo "🔐 Supabase ログイン..."
	@supabase login
	@echo "✅ ログイン完了"

# 接続確認
check:
	@echo "🧪 接続確認..."
	@echo ""
	@echo "1. Supabase 接続:"
	@supabase db pull --linked --schema public > /dev/null 2>&1 && echo "  ✅ Supabase 接続成功" || echo "  ❌ Supabase 接続失敗"
	@echo ""
	@echo "2. Workers API:"
	@curl -f https://casto-workers-dev.casto-api.workers.dev/api/v1/health > /dev/null 2>&1 && echo "  ✅ Workers API 正常" || echo "  ❌ Workers API エラー"
	@echo ""
	@echo "3. Web:"
	@curl -f https://casto.sb2024.xyz > /dev/null 2>&1 && echo "  ✅ Web 正常" || echo "  ❌ Web エラー"
	@echo ""
