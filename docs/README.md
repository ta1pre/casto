# 📚 Casto ドキュメント

## 📋 重要ドキュメント

### **必読**
1. **[DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md)** - Supabase運用ガイド（DB・設定）
2. **[CRITICAL_RULES.md](./CRITICAL_RULES.md)** - 重要な開発ルール

### **開発ガイド**
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - システム構成
- **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - コーディング規約

### **タスク管理**
- **[tasks/TODO.md](./tasks/TODO.md)** - 現在のタスクリスト
- **[tasks/](./tasks/)** - 進行中のタスク
- **[tasksarchive/](./tasksarchive/)** - 完了済みタスク

## 🚀 開発・運用の原則

- **Docker必須**: 開発サーバは必ずDocker Compose経由で起動する。
- **localhost禁止**: `localhost:3000` 等での直接起動を行わない。
- **デプロイはCI/CDのみ**: 手動デプロイ（wrangler deploy 含む）は禁止。詳細は [DEPLOYMENT_POLICY.md](./DEPLOYMENT_POLICY.md) を参照。

### よく使うコマンド（データベース管理）

```bash
# 新規変更を作る
export SUPABASE_DB_PASSWORD='your_password'
make db-new

# リモートに適用
make db-apply

# 整合性確認
make db-check

# 不一致を修正
make db-sync

# Docker再起動
docker restart casto
```

> 詳細は [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) を参照

## 📖 詳細ドキュメント

### **セットアップ**
- [setup/LOCAL_DEVELOPMENT.md](./setup/LOCAL_DEVELOPMENT.md) - ローカル環境
- [setup/SUPABASE_AUTH_SETUP.md](./setup/SUPABASE_AUTH_SETUP.md) - 認証設定

### **技術仕様**
- [technical/SESSION_MANAGEMENT.md](./technical/SESSION_MANAGEMENT.md) - セッション管理

---

**Project ID**: `sfscmpjplvxtikmifqhe`  
**Environment**: Development (`casto.sb2024.xyz`)
