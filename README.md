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
| [**`PURPOSE.md`**](./docs/PURPOSE.md)      | プロジェクトの目的とゴール                          |
| [**`SPEC.md`**](./docs/SPEC.md)            | 機能要件・ユーザーフロー・詳細仕様                  |
| [**`ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) | 技術スタックとシステム設計方針                     |
| [**`PLAN.md`**](./docs/PLAN.md)            | 開発計画とマイルストーン                            |
| [**`DECISIONS.md`**](./docs/DECISIONS.md)  | 意思決定と変更履歴                                 |
| [**`QUESTIONS.md`**](./docs/QUESTIONS.md)  | 未解決の課題・検討事項                              |
| [**`DEVELOPMENT.md`**](./docs/DEVELOPMENT.md) | ローカル開発手順・GitHub 運用フロー               |
| [**`CLOUDFLARE_SETUP.md`**](./docs/CLOUDFLARE_SETUP.md) | Cloudflare 環境構築ガイド                      |
| [**`SUPABASE_SETUP.md`**](./docs/SUPABASE_SETUP.md) | データベース構築手順                              |

---

## 🏗️ プロジェクト構成 (Project Structure)

```
casto/
├── apps/
│   ├── web/          # Next.js フロントエンド
│   └── workers/      # Cloudflare Workers API
├── packages/
│   ├── shared/       # 共通型定義・ユーティリティ
│   └── ui/           # 共通UIコンポーネント
├── docs/             # プロジェクトドキュメント
├── tasks/            # タスク管理用ドキュメント
├── .github/
│   └── workflows/    # CI/CD 設定
└── supabase/         # データベーススキーマ
```

---

## 🌐 デプロイ / ホスティング

- ローカル開発は Traefik / Cloudflare Tunnel 経由で Docker コンテナを起動します。手順は `docs/DEVELOPMENT.md` を参照してください。
  - 共通スタック起動: `./infrastructure/scripts/manage.sh start`
  - casto コンテナ起動: `docker compose -f services/casto/docker-compose.dev.yml up -d`
  - Workers 開発モード: `cd services/casto && npm run dev:workers`（必要に応じて `wrangler dev --remote`）
- 本番・ステージングの恒常的なデプロイ先は現在再構築中です。決定事項は `docs/PLAN.md` と `docs/DECISIONS.md` で追跡してください。

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

## ✉️ メール運用 (Email Operations)

- **Resend** をすべてのトランザクションメール（Magic Link、通知、受領確認など）の送受信基盤として利用します。`RESEND_API_KEY` は `.env.local` に設定し、環境ごとに Resend プロジェクトを分離してください。
- メールテンプレートや送信ドメインの管理は Resend ダッシュボードで行います。開発用サンドボックスドメインを用意し、本番には認証済みドメインを割り当ててください。
- 受信 webhook を利用する場合は Cloudflare Workers に `/api/v1/webhooks/resend`（予定）を追加し、Resend Inbound Routes から転送します。詳細な手順は `docs/` 配下の設計ドキュメントを参照してください。

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
- **今やるべきこと**: [tasks/](./tasks/) ディレクトリ
