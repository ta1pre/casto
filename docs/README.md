# Casto ドキュメント

このディレクトリには、castoプロジェクトの全ドキュメントが整理されて格納されています。

## 📁 ディレクトリ構造

```
docs/
├── README.md              # このファイル
├── PURPOSE.md            # プロジェクトの目的とゴール
├── SPEC.md               # 機能仕様とユーザーフロー
├── ARCHITECTURE.md       # 技術設計とアーキテクチャ
├── PLAN.md               # 開発計画とチェックリスト
├── setup/                # 開発環境・セットアップ関連
│   ├── DEVELOPMENT.md    # 開発環境構築ガイド
│   ├── LOCAL_DEVELOPMENT.md # ローカル開発環境
│   ├── CLOUDFLARE_DEV_SETUP.md # Cloudflare開発セットアップ
│   ├── CLOUDFLARE_SETUP.md # Cloudflareセットアップ
│   ├── CLOUDFLARE_WORKERS_SETUP.md # Cloudflare Workersセットアップ
│   └── GITHUB_SETUP.md   # GitHubセットアップ
├── deployment/           # デプロイ・CI/CD関連
│   ├── STRATEGY.md       # デプロイ戦略
│   ├── GUIDE.md          # デプロイ手順ガイド
│   └── GITHUB_SECRETS.md # GitHubシークレット設定
└── operations/           # 運用・管理関連
    ├── DECISIONS.md      # 意思決定ログ
    ├── QUESTIONS.md      # 未決事項リスト
    ├── DOMAIN_RULES.md   # ユーザー・権限・ドメイン設計
    ├── SYSTEM_GUIDE.md   # システム運用ガイド
    ├── STATUS_CHECK.md   # ステータスチェック
    ├── SYSTEM_STATUS.md  # システムステータス
    └── CICD_TEST.md      # CI/CDテスト
```

## 📖 ドキュメントの読み方

### 初めての方
1. **PURPOSE.md** - プロジェクトの目的を理解
2. **SPEC.md** - 何を作るかを把握
3. **ARCHITECTURE.md** - 技術的な設計を理解
4. **PLAN.md** - 開発の進捗を確認

### 開発者の方
1. **setup/DEVELOPMENT.md** - 開発環境の構築
2. **deployment/STRATEGY.md** - デプロイ戦略の理解
3. **operations/DOMAIN_RULES.md** - API設計と権限管理

### 運用者の方
1. **operations/DECISIONS.md** - 変更履歴の確認
2. **operations/SYSTEM_GUIDE.md** - 運用手順の把握
3. **operations/STATUS_CHECK.md** - 現在のステータス確認

## 🔄 ドキュメント更新について

- **変更時は必ずPRでレビュー** を受けてください
- **重要な決定は operations/DECISIONS.md** に記録してください
- **未解決事項は operations/QUESTIONS.md** に追加してください
- **ファイル名は英語で統一** し、内容が分かりやすいものにしてください

## 📞 サポート

ドキュメントに関する質問や提案は、GitHub Issues または Discussions をご利用ください。
