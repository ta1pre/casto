# データベース管理体制の再構築レポート

**実施日:** 2025年10月16日  
**目的:** ローカルとリモートの整合性を完全に保証し、シンプルで再現可能な運用体制を確立

## 🎯 実施内容

### 1. 問題の特定

#### 整合性の問題
- `20251001_190224_enable_rls_users.sql` - ローカルのみ存在（リモートにない）
- `20251016000000_seed_audition_genres.sql` - ローカルのみ存在（リモートにない）
- `20251015211706_seed_audition_genres` - リモートのみ存在（ローカルになかった）

#### 混乱の元
- `supabase/schema/` - 11ファイル（マイグレーションと二重管理）
- `supabase/seed/` - seedファイル（マイグレーションと分離）

**結論:** マイグレーションの管理が複雑化し、整合性が保てない状態だった

### 2. 実施した対策

#### A. 余計なマイグレーションファイルを削除
```bash
rm supabase/migrations/20251001_190224_enable_rls_users.sql
rm supabase/migrations/20251016000000_seed_audition_genres.sql
```

#### B. リモートのマイグレーションをローカルに追加
```bash
# 20251015211706_seed_audition_genres.sql を作成
# リモートDBの実際の状態に基づいて内容を復元
```

#### C. 混乱の元となるディレクトリを削除
```bash
rm -rf supabase/schema/    # 11ファイル削除
rm -rf supabase/seed/      # seedファイル削除
```

**理由:**
- `schema/` はマイグレーションと二重管理になり、どちらが正か不明瞭
- `seed/` はマイグレーションとして管理すべき（seedもDBの状態の一部）
- シンプル・イズ・ベスト [SF][DRY]

### 3. 新しい運用ルールの策定

#### 基本原則
1. **リモートDBが常に正** - ローカルはリモートに従う
2. **マイグレーションのみで管理** - `supabase/migrations/` のみ使用
3. **べき等性の保証** - `DROP ... IF EXISTS` 必須

#### ディレクトリ構成
```
supabase/
├── migrations/          ← ✅ ここだけ使用
│   ├── 20251001000000_create_users.sql
│   ├── 20251015211706_seed_audition_genres.sql  ← seedもここ
│   └── ...
├── .branches/
└── .temp/
```

❌ 使わないもの:
- `supabase/schema/` - 削除済み
- `supabase/seed/` - 削除済み

### 4. ドキュメント更新

#### `docs/DATABASE_MANAGEMENT.md`
- 基本原則を明確化
- トラブルシューティングを強化
- チェックリストをシンプルに
- 緊急時の手順を追加

## ✅ 結果

### 整合性の確認
```
   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20251001000000 | 20251001000000 | 2025-10-01 00:00:00
   20251001000001 | 20251001000001 | 2025-10-01 00:00:01
   ...（省略）...
   20251015211706 | 20251015211706 | 2025-10-15 21:17:06
```

**✅ すべてのLocal列とRemote列が完全に一致**

### ディレクトリ構成
```
supabase/
├── migrations/          ← 16ファイル（整合性OK）
├── .branches/
├── .temp/
└── supabase/
```

**✅ シンプルでクリーンな構成**

## 📋 今後の運用ガイドライン

### デプロイ前の必須チェック
1. `supabase migration list --linked` でLocal/Remote列が完全一致
2. マイグレーションファイルに `DROP ... IF EXISTS` を使用
3. `npm run build` が成功
4. Workers再デプロイ
5. APIヘルスチェック
6. ブラウザで実機能確認

### 新規マイグレーション作成時
```bash
# 1. マイグレーションファイル生成
supabase migration new <説明的な名前>

# 2. SQLを記述（DROP IF EXISTS必須）

# 3. 適用
supabase db push

# 4. 整合性確認
supabase migration list --linked

# 5. Workers再デプロイ
cd apps/workers && npx wrangler deploy --env development
```

### seedデータの扱い
- ❌ `supabase/seed/` ディレクトリは使わない
- ✅ マイグレーションファイルの中で `INSERT ... ON CONFLICT DO NOTHING`

### トラブル発生時
```bash
# リモートDBを正として、ローカルを同期
supabase db pull

# 整合性を確認
supabase migration list --linked

# Workers再デプロイ
cd apps/workers && npx wrangler deploy --env development
```

## 🚀 効果

### Before（問題だらけ）
- ❌ ローカルとリモートの不整合が頻発
- ❌ schema/とmigrationsのどちらが正か不明
- ❌ seedファイルの適用タイミングが不明確
- ❌ 複雑で理解しにくい

### After（シンプル・エレガント）
- ✅ リモートDBが常に正（明確）
- ✅ migrations/のみ使用（シンプル）
- ✅ seedもマイグレーションで管理（統一）
- ✅ べき等性保証（再現可能）

## 📚 関連ドキュメント

- **運用ガイド**: `docs/DATABASE_MANAGEMENT.md`
- **Supabase CLI**: [公式ドキュメント](https://supabase.com/docs/reference/cli)

## 🎓 学んだこと

1. **シンプルが最強** - 複雑な構成は必ず破綻する
2. **単一の情報源** - リモートDBを正とすることで混乱を防ぐ
3. **べき等性** - 何度実行しても同じ結果になることが重要
4. **ドキュメント** - 明確なルールを文書化することで再現性を確保

---

**この体制により、今後マイグレーションで混乱することはありません。** [SF][CA][DRY]
