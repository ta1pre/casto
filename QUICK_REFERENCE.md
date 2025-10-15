# クイックリファレンス

よく使うコマンドとチェック項目の一覧です。

## 🔍 整合性チェック

```bash
# マイグレーション履歴確認
supabase migration list
# → Local列とRemote列が一致していること

# リモートDBの実際のテーブル確認
supabase db dump --linked | grep "CREATE TABLE" | grep -v "^--"

# ローカルマイグレーション一覧
ls -la supabase/migrations/

# APIヘルスチェック
curl https://casto.sb2024.xyz/api/v1/health
```

## 🗄️ データベース操作

```bash
# 新しいマイグレーション作成
supabase migration new <説明的な名前>

# 整合性確認
supabase migration list

# リモートに適用
supabase db push

# 履歴不整合の修復
supabase migration repair --status reverted <version>
supabase db push --include-all

# リモートDBダンプ（バックアップ）
supabase db dump --linked -f backup_$(date +%Y%m%d).sql
```

## 🚀 デプロイ

```bash
# Workers - 開発環境
cd apps/workers
npx wrangler deploy --env development

# Workers - 本番環境
npx wrangler deploy --env production

# Web - Docker
docker restart casto
```

## ✅ デプロイ前チェックリスト

```bash
# 1. マイグレーション履歴一致
supabase migration list

# 2. ビルド成功
npm run build

# 3. リモートDBにテーブル存在
supabase db dump --linked | grep "<your_table>"

# 4. Workers再デプロイ
cd apps/workers && npx wrangler deploy --env development

# 5. APIヘルスチェック
curl https://casto.sb2024.xyz/api/v1/health

# 6. ブラウザで動作確認
open https://casto.sb2024.xyz
```

## 🐛 トラブルシューティング

### "table not found in schema cache"

```bash
cd apps/workers
npx wrangler deploy --env development
```

### マイグレーション履歴不整合

```bash
supabase migration repair --status reverted <version>
supabase db push --include-all
```

### 接続エラー（Supabase再起動中）

```bash
# 30秒～1分待つ
sleep 30
supabase db push
```

## 📁 プロジェクト情報

```
Project ID:     sfscmpjplvxtikmifqhe
開発環境:       https://casto.sb2024.xyz
本番環境:       https://casto.io
Workers API:    https://casto.sb2024.xyz/api/*
```

## 📖 詳細ドキュメント

- [DATABASE_MANAGEMENT.md](./docs/DATABASE_MANAGEMENT.md) - 完全なデータベース管理手順
- [docs/README.md](./docs/README.md) - ドキュメント全体の目次
- [README.md](./README.md) - プロジェクト概要
