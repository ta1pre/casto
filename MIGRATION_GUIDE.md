# 📚 マイグレーション完全ガイド

## 🎯 基本方針

### マイグレーションファイル = 唯一の真実

```
supabase/migrations/*.sql (Git管理)
  ↓ make migrate
リモートDB (Supabase)
  ↓ make generate-schema
ローカルスキーマ (types.ts, SCHEMA.md)
```

---

## 📁 ファイル構成

```
supabase/migrations/
├── 20250130_001_create_users.sql
├── 20250130_002_create_applicant_profiles.sql
└── 20250130_003_create_viewing_history.sql
```

### 命名規則

```
YYYYMMDD_NNN_<action>_<object>.sql

例:
20250130_001_create_users.sql
20250131_002_add_avatar_column.sql
20250201_001_create_auditions.sql
```

- **YYYYMMDD**: 日付
- **NNN**: 連番（001, 002, 003...）
- **action**: create, add, drop, alter など
- **object**: テーブル名やカラム名

---

## 🚀 クイックスタート

```bash
# 1. API Key設定（初回のみ）
echo 'SUPABASE_SERVICE_ROLE_KEY="sb_secret__your_key"' >> .env.local

# 2. DB初期化
make setup-supabase

# 3. スキーマ確認
make generate-schema
cat supabase/SCHEMA.md
```

---

## 📝 日常的な運用

### パターン1: 新しいテーブルを追加

```bash
# 1. マイグレーションファイル作成
vim supabase/migrations/20250131_001_create_auditions.sql
```

```sql
-- auditionsテーブル作成
CREATE TABLE IF NOT EXISTS auditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  organizer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditions_organizer ON auditions(organizer_id);

ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;
```

```bash
# 2. 適用（完全自動）
make migrate

# 3. Gitにコミット
git add supabase/migrations/
git commit -m "feat: add auditions table"
git push
```

---

### パターン2: 既存テーブルにカラム追加

```bash
# 1. マイグレーションファイル作成
vim supabase/migrations/20250131_002_add_phone_to_users.sql
```

```sql
-- usersテーブルに電話番号カラム追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

COMMENT ON COLUMN users.phone IS '電話番号（任意）';
```

```bash
# 2. 適用
make migrate

# 3. コミット
git add supabase/migrations/
git commit -m "feat: add phone column to users table"
```

---

### パターン3: データ移行

```bash
vim supabase/migrations/20250131_003_migrate_user_data.sql
```

```sql
-- 既存データの移行
UPDATE users 
SET role = 'organizer' 
WHERE email LIKE '%@example.com';
```

```bash
make migrate
```

---

## 🔄 チーム開発での運用

### メンバーAがマイグレーション追加

```bash
# A: マイグレーション作成
vim supabase/migrations/20250131_001_create_auditions.sql
make migrate
git push
```

### メンバーBが同期

```bash
# B: 最新を取得
git pull

# B: マイグレーション適用（完全自動）
make migrate
```

**手動操作は一切不要！** 🎉

---

## 🛠️ よく使うコマンド

```bash
make migrate          # マイグレーション適用
make generate-schema  # スキーマ生成（型定義・ドキュメント）
make test-db          # DB接続テスト
make test-workers     # Workers接続テスト
make reset-db         # DB完全リセット
```

---

## ⚠️ やってはいけないこと

### ❌ ダメな例

```bash
# ❌ 既存のマイグレーションファイルを編集
vim supabase/migrations/20250130_001_create_users.sql  # 既に適用済み

# ❌ Supabase Dashboard で直接テーブル作成
# （マイグレーションファイルとの不整合が発生）

# ❌ マイグレーションファイルを削除
rm supabase/migrations/20250130_001_create_users.sql
```

### ✅ 正しい例

```bash
# ✅ 新しいマイグレーションで変更
vim supabase/migrations/20250131_002_alter_users_table.sql

# ✅ すべての変更をマイグレーションファイルで管理
make migrate
```

---

## 🔐 セキュリティのベストプラクティス

### RLS (Row Level Security) は必須

```sql
-- 必ず有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 適切なポリシーを設定
CREATE POLICY users_select_own 
  ON users 
  FOR SELECT 
  USING (id = auth.uid());
```

### インデックスを忘れずに

```sql
-- 頻繁に検索するカラムにはインデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 📊 マイグレーション管理のチェックリスト

### 新しいマイグレーション作成時

- [ ] 命名規則に従っている（`YYYYMMDD_NNN_action_object.sql`）
- [ ] `IF NOT EXISTS` を使用（冪等性）
- [ ] RLSを有効化
- [ ] 必要なインデックスを作成
- [ ] COMMENTで説明を追加
- [ ] `make migrate` で動作確認
- [ ] Gitにコミット

### 本番適用前

- [ ] ステージング環境でテスト
- [ ] ロールバック手順を確認
- [ ] データバックアップを取得
- [ ] チームに通知

---

## 🎉 まとめ

### 確立したワークフロー

```
1. マイグレーションファイル作成
   ↓
2. make migrate（完全自動）
   ↓
3. Gitにコミット
   ↓
4. チームメンバーが git pull → make migrate
```

**これで完璧なマイグレーション管理が実現しました！** 🚀

---

## 📚 詳細ガイド

- [クイックスタート](./docs/setup/SUPABASE_QUICKSTART.md) - 5分で完了
- [DB管理ガイド](./docs/DATABASE_MANAGEMENT.md) - 詳細な管理方法
- [スクリプト説明](./scripts/README.md) - 各スクリプトの使い方

---

**完璧なマイグレーション管理体制！** 🎉
