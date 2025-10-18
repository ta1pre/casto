# 📚 Casto ドキュメント

Casto開発で参照する標準ガイドラインとタスク管理の入口です。

## 📂 ディレクトリ構成

```
docs/
├── README.md                      # このファイル
├── ARCHITECTURE.md                # システムアーキテクチャ概要
├── AUDITION_SYSTEM_DESIGN.md      # オーディションシステム設計
├── CRITICAL_RULES.md              # 必読：重要な開発ルール
├── DATABASE_MANAGEMENT.md         # ★ データベース管理の標準手順
├── DEVELOPMENT_RULES.md           # 開発ルール詳細
├── setup/                         # セットアップ関連
│   ├── LOCAL_DEVELOPMENT.md       # ローカル開発環境(Docker)
│   ├── PROFILE_IMPLEMENTATION.md  # プロフィール機能実装
│   ├── SUPABASE_AUTH_SETUP.md     # Supabase認証設定
│   └── WORKERS_STRUCTURE.md       # Workers API構成
├── tasks/                         # 現在進行中のタスク管理
│   ├── README.md                  # タスク管理ガイド
│   ├── TODO.md                    # 現在のタスクリスト
│   ├── NOTIFICATION_FUNCTION_DRAFT.md  # 通知機能設計ドラフト
│   └── NOTIFICATION_TESTING_GUIDE.md   # 通知機能テストガイド
├── tasksarchive/                  # 完了タスク・実装レポートのアーカイブ
│   ├── AUDITION_MAIN_VISUAL_IMPLEMENTATION.md
│   ├── AUDITION_STEPS_IMPLEMENTATION.md
│   ├── DATABASE_REORGANIZATION_2025-10-16.md
│   ├── DIRECTORY_STRUCTURE.md
│   ├── LINE_AUTH_IMPLEMENTATION.md
│   └── PHASE1_DEPLOYMENT.md
├── technical/                     # 技術仕様
│   ├── LINE_TOKEN_REFRESH_STRATEGY.md
│   └── SESSION_MANAGEMENT.md      # セッション管理戦略
└── ui/                            # UI設計・ガイドライン
```

## 🚀 クイックスタート

### 1. 開発環境セットアップ

```bash
# Docker環境で起動（推奨）
docker restart casto

# ローカルでの直接起動は非推奨
```

参照: [`setup/LOCAL_DEVELOPMENT.md`](./setup/LOCAL_DEVELOPMENT.md)

### 2. データベース変更

**必読:** [`DATABASE_MANAGEMENT.md`](./DATABASE_MANAGEMENT.md)

```bash
# 新しいマイグレーション作成
supabase migration new add_feature_name

# マイグレーションファイル編集
vim supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql

# ローカル/リモート整合性確認
supabase migration list

# リモートに適用
supabase db push

# Workers再デプロイ（スキーマキャッシュ更新）
cd apps/workers
npx wrangler deploy --env development
```

### 3. Workers API追加

```bash
# 機能ディレクトリ作成
mkdir -p apps/workers/src/features/<feature>

# 必要なファイル
# - routes.ts   : ルート定義
# - service.ts  : ビジネスロジック
# - types.ts    : 型定義
```

参照: [`setup/WORKERS_STRUCTURE.md`](./setup/WORKERS_STRUCTURE.md)

### 4. Web UI追加

```bash
# ページ追加
apps/web/src/app/<route>/page.tsx

# コンポーネント追加
apps/web/src/app/<route>/_components/
```

## 📋 標準ワークフロー

### データベーススキーマ変更

1. **マイグレーション作成**: `supabase migration new <name>`
2. **DDL記述**: `DROP ... IF EXISTS` を必ず使う
3. **整合性確認**: `supabase migration list`
4. **適用**: `supabase db push`
5. **Workers再デプロイ**: `npx wrangler deploy --env development`
6. **動作確認**: ブラウザで実機能テスト

### API実装

1. **型定義**: `packages/shared/src/types/`
2. **バリデーション**: `packages/shared/src/validators/`
3. **Service層**: `apps/workers/src/features/<feature>/service.ts`
4. **Route層**: `apps/workers/src/features/<feature>/routes.ts`
5. **テスト**: 実際のAPIエンドポイントで動作確認

### UI実装

1. **ページ作成**: `apps/web/src/app/<route>/page.tsx`
2. **API呼び出し**: `fetch('/api/v1/...')`
3. **エラーハンドリング**: try-catch + ユーザーフィードバック
4. **ローディング状態**: UX最適化

## 📖 重要ドキュメント

### 必読

- **[DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md)** - データベース管理標準手順
- **[CRITICAL_RULES.md](./CRITICAL_RULES.md)** - 重要な開発ルール
- **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - 開発ルール詳細

### セットアップ

- [LOCAL_DEVELOPMENT.md](./setup/LOCAL_DEVELOPMENT.md) - ローカル環境
- [SUPABASE_AUTH_SETUP.md](./setup/SUPABASE_AUTH_SETUP.md) - 認証設定
- [WORKERS_STRUCTURE.md](./setup/WORKERS_STRUCTURE.md) - Workers構成

### 設計

- [ARCHITECTURE.md](./ARCHITECTURE.md) - システム全体像
- [AUDITION_SYSTEM_DESIGN.md](./AUDITION_SYSTEM_DESIGN.md) - オーディション機能設計

### タスク管理

- [tasks/TODO.md](./tasks/TODO.md) - 現在のタスク

## ✅ チェックリスト

デプロイ前に必ず確認：

- [ ] `supabase migration list` でLocal/Remote列が一致
- [ ] マイグレーションに `DROP ... IF EXISTS` を使用
- [ ] `npm run build` でビルド成功
- [ ] `supabase db dump --linked` で目的のテーブル存在確認
- [ ] Workers再デプロイ完了
- [ ] APIヘルスチェック: `curl https://casto.sb2024.xyz/api/v1/health`
- [ ] ブラウザで実機能確認

## 🔧 トラブルシューティング

### "table not found in schema cache"

**原因**: PostgRESTのスキーマキャッシュが古い

**解決**: 
```bash
cd apps/workers
npx wrangler deploy --env development
```

詳細: [DATABASE_MANAGEMENT.md - トラブルシューティング](./DATABASE_MANAGEMENT.md#トラブルシューティング)

### マイグレーション履歴の不整合

**症状**: `supabase migration list` でRemote列が空白

**解決**:
```bash
supabase migration repair --status reverted <version>
supabase db push --include-all
```

詳細: [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md)

## 📝 ドキュメント更新ルール

- 新機能追加時: 該当ドキュメントを同時更新
- ワークフロー変更時: `DATABASE_MANAGEMENT.md` と `README.md` を更新
- タスク追加時: `tasks/TODO.md` に追記
- タスク完了時: チェックマークを付ける
- 古い情報: 削除または `tasksarchive/` に移動

---

**最終更新**: 2025/10/18  
**Project ID**: `sfscmpjplvxtikmifqhe`  
**Environment**: Development (`casto.sb2024.xyz`) / Production (`casto.io`)
