# 📚 Casto ドキュメント

## 📋 重要ドキュメント

### **必読**
1. **[DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md)** - DB管理・マイグレーション手順
2. **[CRITICAL_RULES.md](./CRITICAL_RULES.md)** - 重要な開発ルール

### **開発ガイド**
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - システム構成
- **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - コーディング規約

### **タスク管理**
- **[tasks/TODO.md](./tasks/TODO.md)** - 現在のタスクリスト
- **[tasks/](./tasks/)** - 進行中のタスク
- **[tasksarchive/](./tasksarchive/)** - 完了済みタスク

## 🚀 クイックコマンド

```bash
# マイグレーション適用（自動化）
make migrate

# Workers再デプロイ
cd apps/workers && npx wrangler deploy --env development

# Docker再起動
docker restart casto
```

## 📖 詳細ドキュメント

### **セットアップ**
- [setup/LOCAL_DEVELOPMENT.md](./setup/LOCAL_DEVELOPMENT.md) - ローカル環境
- [setup/SUPABASE_AUTH_SETUP.md](./setup/SUPABASE_AUTH_SETUP.md) - 認証設定
- [SUPABASE_CONFIGURATION.md](./SUPABASE_CONFIGURATION.md) - Supabase設定管理 ⭐ **必読**

### **技術仕様**
- [technical/SESSION_MANAGEMENT.md](./technical/SESSION_MANAGEMENT.md) - セッション管理

---

**Project ID**: `sfscmpjplvxtikmifqhe`  
**Environment**: Development (`casto.sb2024.xyz`)
