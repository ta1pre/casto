# 🚀 Supabase クイックスタート（5分）

---

## 📋 初回セットアップ（1回のみ）

### Step 1: API Key を取得

Supabase Dashboard を開く：
👉 https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe/settings/api

**「Secret keys」セクションで `default` の値をコピー**
- 形式: `sb_secret__***` で始まる文字列

### Step 2: 環境変数に設定

```bash
cd /Users/taichiumeki/dev/services/casto

# .env.local に追加
echo 'SUPABASE_SERVICE_ROLE_KEY="sb_secret__コピーした値"' >> .env.local
```

### Step 3: DB初期化＆マイグレーション

```bash
# 完全自動実行
node scripts/db-cleanup.js
```

**完了！** 🎉

---

## 🔄 日常的な運用

### 新しいテーブルを追加

```bash
# 1. マイグレーションファイル作成
vim supabase/migrations/20250131_001_create_auditions.sql

# 2. 適用（完全自動）
make migrate

# 3. Git管理
git add supabase/migrations/
git commit -m "feat: add auditions table"
```

### チームメンバーが同期

```bash
git pull
make migrate  # 完全自動
```

---

## 🧪 動作確認

```bash
# DB疎通テスト
node scripts/test-db.js

# Supabase Dashboard で確認
# https://supabase.com/dashboard/project/sfscmpjplvxtikmifqhe/editor
```

---

## 🎯 Workers から接続

```typescript
// apps/workers/src/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://sfscmpjplvxtikmifqhe.supabase.co',
  c.env.SUPABASE_SERVICE_ROLE_KEY
);

// ユーザー取得
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(10);
```

**ストレスなく接続できます！**

---

## 📚 詳細ガイド

- [完全ガイド](./SUPABASE_CONNECTION.md) - 詳細な手順とトラブルシューティング
- [マイグレーション管理](../../MIGRATION_GUIDE.md) - 日々の運用ガイド

---

## 💡 よく使うコマンド

```bash
make migrate          # マイグレーション適用
node scripts/db-cleanup.js  # DB完全リセット
node scripts/test-db.js     # DB疎通テスト
make help             # コマンド一覧
```

---

**以上！シンプルで完全自動です** 🚀
