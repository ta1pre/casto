# 📊 データベース管理ガイド

## 🎯 基本方針

### マイグレーションファイル = 真実の源

```
supabase/migrations/*.sql（Git管理）
  ↓ make migrate
リモートDB（Supabase）
  ↓ make generate-schema
ローカルスキーマ（schema.json, types.ts, SCHEMA.md）
```

**ポイント:**
- マイグレーションファイルがすべての変更履歴
- ローカルスキーマは自動生成（Gitには含めない）
- 型安全性を保つためにTypeScript型定義を生成

---

## 📁 ファイル構成

```
supabase/
├── migrations/                    # Git管理 ✅
│   ├── 20250130_001_create_users.sql
│   ├── 20250130_002_create_applicant_profiles.sql
│   └── 20250130_003_create_viewing_history.sql
├── schema.json                    # 自動生成（Gitignore）
├── types.ts                       # 自動生成（Gitignore）
└── SCHEMA.md                      # 自動生成（Gitignore）
```

---

## 🔄 ワークフロー

### 1. ローカルでテーブル構成を確認

```bash
# スキーマ生成（最新の状態を取得）
make generate-schema

# 確認方法1: JSON形式
cat supabase/schema.json

# 確認方法2: ドキュメント形式
cat supabase/SCHEMA.md

# 確認方法3: TypeScript型定義
cat supabase/types.ts
```

**メリット:**
- ✅ 毎回DBに接続不要
- ✅ 型定義でコード補完が効く
- ✅ ドキュメントとして共有可能

---

### 2. 新しいテーブルを追加

```bash
# 1. マイグレーションファイル作成
vim supabase/migrations/20250131_001_create_auditions.sql

# 2. 適用
make migrate

# 3. スキーマ更新
make generate-schema

# 4. Git管理
git add supabase/migrations/20250131_001_create_auditions.sql
git commit -m "feat: add auditions table"
```

**ポイント:**
- マイグレーションファイルだけをGit管理
- スキーマファイルは自動生成なのでGitignore

---

### 3. チームメンバーが同期

```bash
# 1. 最新を取得
git pull

# 2. マイグレーション適用
make migrate

# 3. ローカルスキーマ更新
make generate-schema
```

---

## 📊 マイグレーション管理のベストプラクティス

### ✅ 推奨: 小さく頻繁にマイグレーション

```
❌ ダメな例:
migrations/
└── 20250130_big_update.sql  (500行、10テーブル)

✅ 良い例:
migrations/
├── 20250130_001_create_users.sql
├── 20250130_002_create_profiles.sql
├── 20250130_003_add_avatar_column.sql
└── 20250131_001_create_auditions.sql
```

**理由:**
- 変更履歴が明確
- ロールバックしやすい
- レビューしやすい
- 競合しにくい

---

### ✅ マイグレーションファイルは削除しない

```
❌ ダメ:
rm supabase/migrations/20250130_001_create_users.sql

✅ 正しい:
# 新しいマイグレーションで変更
vim supabase/migrations/20250131_002_drop_old_column.sql
```

**理由:**
- 変更履歴が消える
- 他のメンバーの環境が壊れる
- ロールバックできなくなる

---

### ✅ 本番適用前にロールバック手順を用意

```sql
-- 20250131_001_create_auditions.sql
CREATE TABLE auditions (...);

-- ロールバック用（別途作成）
-- 20250131_999_rollback_auditions.sql
DROP TABLE IF EXISTS auditions CASCADE;
```

---

## 🎯 マイグレーションが多くなったら？

### 方法1: スキーマスナップショット（推奨）

定期的に「現在の全体スキーマ」のスナップショットを作成：

```bash
# 半年に1回など
vim supabase/migrations/20250630_000_schema_snapshot.sql

# 内容: すべてのテーブルのCREATE文
```

**メリット:**
- 新規メンバーは最新のスナップショットから開始
- 古いマイグレーションを参照する必要がない
- セットアップ時間が短縮

---

### 方法2: マイグレーション整理

```
supabase/migrations/
├── archive/                      # アーカイブ（参照用）
│   └── 2025_01_deprecated/
│       ├── 20250130_001_old.sql
│       └── 20250130_002_old.sql
└── 20250630_000_schema_snapshot.sql  # 最新スナップショット
```

---

## 💡 実運用での管理

### 開発環境での運用

```bash
# 1. 毎朝: 最新を取得
git pull && make migrate && make generate-schema

# 2. 開発中: スキーマ確認
cat supabase/SCHEMA.md

# 3. コード書く: 型定義を使用
import { Database } from './supabase/types';
```

### 型定義の活用

```typescript
// apps/workers/src/index.ts
import { Database } from '../../../supabase/types';

const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY
);

// 型安全なクエリ
const { data } = await supabase
  .from('users')  // 型補完が効く
  .select('id, email, display_name')  // カラム名も補完される
  .limit(10);
```

---

## 🧪 動作確認

### スキーマが正しく生成されるか確認

```bash
# 1. スキーマ生成
make generate-schema

# 2. ファイル確認
ls -la supabase/

# 3. 内容確認
cat supabase/SCHEMA.md
```

---

## 📋 よくある質問

### Q: マイグレーションファイルが100個になったら？

A: スキーマスナップショットを作成して、古いものはアーカイブ。
   新規メンバーは最新のスナップショットから開始。

### Q: ローカルでスキーマを持ちたくない？

A: `make generate-schema` を毎回実行するか、
   CI/CDで自動生成してGitに含める選択肢もあります。

### Q: 型定義は必須？

A: なくても動作しますが、型安全性のために強く推奨します。

---

## 🎉 まとめ

### ✅ ローカルでテーブル構成を持つ方法

```bash
make generate-schema
```

- `schema.json` - JSON形式
- `types.ts` - TypeScript型定義
- `SCHEMA.md` - ドキュメント

### ✅ マイグレーション管理

- 小さく頻繁にマイグレーション
- マイグレーションファイルは削除しない
- 半年に1回スキーマスナップショット

### ✅ 実運用

```bash
# 朝イチ
git pull && make migrate && make generate-schema

# 開発中
cat supabase/SCHEMA.md  # スキーマ確認

# コード書く
import { Database } from './supabase/types';  # 型安全
```

**完璧な管理体制です！** 🚀
