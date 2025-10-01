# 📚 casto ドキュメント

casto プロジェクトの開発ガイドとタスク管理。

## 📂 構成

- **setup/**: 開発環境構築ガイド
- **tasks/**: タスク管理（進行中・完了・アーカイブ）
- **CRITICAL_RULES.md**: 絶対に守るべき重要ルール

## 🚀 開発開始

1. [ローカル開発環境](./setup/LOCAL_DEVELOPMENT.md) - Docker Compose での起動方法
2. [重要ルール](./CRITICAL_RULES.md) - 必読の禁止事項

## 📋 タスク管理

- [進行中タスク](./tasks/in-progress/)
- [完了タスク](./tasks/completed/)
- [アーカイブ](./tasksarchive/)

## 🏗️ プロジェクト構成

```
apps/
  web/          # Next.js フロントエンド
    src/app/
      liff/     # LINE ミニアプリ
      test/     # 開発テストページ
  workers/      # Cloudflare Workers API
    src/
      features/ # 機能別API実装
      lib/      # 共通ライブラリ
```

## ✏️ 更新ルール

- 構成変更時は関連ドキュメントを更新
- タスク完了時は `tasks/completed/` へ移動

---

**最終更新**: 2025/10/01
