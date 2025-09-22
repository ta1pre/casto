# Project: casto

「人を集めて選ぶ（オーディション）」を、スマホだけで簡単にできるサービスです。
このディレクトリは、castoサービスの開発に関する全てのドキュメントとソースコードを管理します。

## 📖 ドキュメントの歩き方 (Documentation Guide)

このプロジェクトでは、情報を以下のドキュメントに分けて管理しています。初めての方はまずこの `README.md` を読んで、目的のドキュメントを探してください。

- **大きな方針を知りたい**: `PURPOSE.md` (目的) → `SPEC.md` (仕様) の順で読むのがおすすめです。
- **技術的な実装を知りたい**: `ARCHITECTURE.md` (技術設計) を参照してください。
- **タスクの進捗を確認したい**: `PLAN.md` (開発計画) を見てください。
- **最新の仕様変更や決定事項を知りたい**: `DECISIONS.md` (変更・決定ログ) を確認してください。日々の細かい決定はここに時系列で記録されます。
- **未解決の課題を知りたい**: `QUESTIONS.md` (未決事項リスト) を確認してください。

---

## 📚 主要ドキュメント一覧 (Key Documents)

| ドキュメント                               | 内容                                               |
| ------------------------------------------ | -------------------------------------------------- |
| [**`PURPOSE.md`**](./docs/PURPOSE.md)      | このプロジェクトが何を目指すのか（目的・ゴール）   |
| [**`SPEC.md`**](./docs/SPEC.md)            | 何を作るか（機能要件、ユーザーフロー、仕様）       |
| [**`ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) | どう作るか（技術スタック、設計方針、データモデル） |
| [**`PLAN.md`**](./docs/PLAN.md)            | どう進めるか（開発計画、作業チェックリスト）       |
| [**`DECISIONS.md`**](./docs/DECISIONS.md)    | 変更・決定の履歴（日々の細かい決定事項）           |
| [**`QUESTIONS.md`**](./docs/QUESTIONS.md)    | 未解決の課題・疑問リスト                           |
| [**`DEPLOYMENT_STRATEGY.md`**](./docs/DEPLOYMENT_STRATEGY.md) | デプロイ戦略・CI/CD設計                            |
| [**`DEPLOYMENT_GUIDE.md`**](./docs/DEPLOYMENT_GUIDE.md) | デプロイ手順・環境構築ガイド                       |

---

## 🚀 クイックスタート (Quick Start)

### ローカル開発環境セットアップ
```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# .env.local を編集して実際の値を設定

# 3. データベース起動
npm run db:setup

# 4. 開発サーバー起動
npm run dev
```

### アクセスURL
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8787
- **Database**: localhost:5432

---

## 🏗️ プロジェクト構成 (Project Structure)

```
casto/
├── apps/
│   ├── web/          # Next.js Frontend
│   └── workers/      # Cloudflare Workers API
├── packages/
│   ├── shared/       # 共通型定義・ユーティリティ
│   └── ui/           # 共通UIコンポーネント
├── docs/             # プロジェクトドキュメント
├── .github/
│   └── workflows/    # CI/CD設定
└── supabase/         # データベーススキーマ
```

---

## 🌐 デプロイ環境 (Deployment)

| 環境 | Frontend | API | Database |
|------|----------|-----|----------|
| **Development** | http://localhost:3000 | http://localhost:8787 | Local PostgreSQL |
| **Staging** | https://casto-staging.vercel.app | https://api-staging.casto.app | Supabase Staging |
| **Production** | https://casto.app | https://api.casto.app | Supabase Production |

### 自動デプロイ
- **PR作成**: Preview環境に自動デプロイ
- **develop ブランチ**: Staging環境に自動デプロイ  
- **main ブランチ**: Production環境に自動デプロイ

詳細は [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) を参照してください。

---

## 🛠️ 開発コマンド (Development Commands)

```bash
# 開発サーバー起動
npm run dev              # 全アプリ同時起動
npm run dev:web          # Frontend のみ
npm run dev:workers      # API のみ

# ビルド・テスト
npm run build            # 全アプリビルド
npm run test             # テスト実行
npm run lint             # Lint チェック
npm run type-check       # 型チェック

# データベース
npm run db:setup         # 初回セットアップ
npm run db:start         # 起動
npm run db:stop          # 停止
```

---

## 📋 技術スタック (Tech Stack)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: MUI (Material-UI)
- **Deployment**: Vercel

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Language**: TypeScript
- **Authentication**: JWT + LINE Login

### Database & Storage
- **Database**: PostgreSQL (Supabase)
- **File Storage**: Cloudflare R2
- **Cache**: Cloudflare KV

### External Services
- **Payment**: Stripe
- **Messaging**: LINE Messaging API
- **Email**: Resend

---

## 🤝 コントリビューション (Contributing)

1. **Issue作成**: 機能要望・バグ報告
2. **ブランチ作成**: `feature/機能名` または `fix/修正内容`
3. **PR作成**: develop ブランチに対してPR
4. **レビュー**: コードレビュー後マージ

### ブランチ戦略
- `main`: Production環境
- `develop`: Staging環境  
- `feature/*`: 機能開発
- `fix/*`: バグ修正

---

## 📞 サポート (Support)

- **ドキュメント**: [docs/](./docs/) ディレクトリ
- **Issue報告**: GitHub Issues
- **質問・相談**: GitHub Discussions