# Scripts Directory

## 📂 ファイル一覧

### ✅ 使用するスクリプト

| ファイル | 説明 | 使用頻度 |
|---------|------|---------|
| `db-cleanup.js` | DB完全リセット＆マイグレーション適用 | 初回のみ |
| `test-db.js` | DB疎通テスト・動作確認 | 必要時 |
| `test-workers-connection.js` | Workers接続テスト | 必要時 |
| `generate-schema.js` | スキーマ生成（型定義・ドキュメント） | 毎日/変更時 |

---

## 🚀 使い方

### 初回セットアップ

```bash
# DB完全リセット＆マイグレーション適用
node scripts/db-cleanup.js
```

### DB疎通テスト

```bash
# テーブル作成確認・API疎通確認
node scripts/test-db.js
```

### 日常的なマイグレーション適用

```bash
# Makefile経由（推奨）
make migrate
```

---

## 📋 前提条件

- `.env.local` に以下が設定されていること:
  ```
  SUPABASE_SERVICE_ROLE_KEY="sb_secret__***"
  ```

---

## 🎯 内部動作

### `db-cleanup.js`

1. `.env.local` から API Key 取得
2. 既存テーブル削除（CASCADE）
3. マイグレーション履歴削除
4. `supabase/migrations/*.sql` を順次実行
5. テーブル作成確認

### `test-db.js`

1. テーブル存在確認（users, applicant_profiles, viewing_history）
2. ユーザー作成テスト
3. プロフィール作成テスト
4. 閲覧履歴作成テスト

---

## ⚠️ 注意事項

- **`db-cleanup.js` は既存データを全削除します**
- 本番環境では絶対に実行しないこと
- 開発環境のみで使用

---

## 📚 詳細

- [Supabase クイックスタート](../docs/setup/SUPABASE_QUICKSTART.md)
- [マイグレーション管理](../MIGRATION_GUIDE.md)
