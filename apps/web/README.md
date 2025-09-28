# Casto Web Frontend

> **重要**: このディレクトリで直接 `npm run dev` を実行しないでください！
> 上位階層のDocker環境を使用してください: [ローカル開発環境について](../../../docs/ローカル開発環境について.md)

このディレクトリは、castoサービスのフロントエンド（Next.js）に関するソースコードと設定を管理します。

## 📖 概要

castoは「人を集めて選ぶ（オーディション）」を、スマホだけで簡単にできるサービスです。このWebフロントエンドは、主催者・マネージャー向けの管理画面を提供します。

### 🎯 対象ユーザー
- **主催者**: ブラウザでオーディション管理・応募者確認・連絡
- **マネージャー**: 応募者の代理手続き・管理
- **管理者**: システム全体の運用管理

### 🛠️ 技術仕様
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI)
- **Deployment**: Vercel

## 🚀 クイックスタート

### 開発環境
```bash
# 上位ディレクトリで実行
cd /Users/taichiumeki/dev/services/casto
npm run dev:web
```

### アクセスURL
- **ローカル開発**: https://casto.sb2024.xyz
- **ローカル向け API パス**: https://casto.sb2024.xyz/api (Traefik が Workers へ転送)

## 📁 ディレクトリ構造

```
apps/web/
├── public/              # 静的ファイル
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── auth/       # 認証関連ページ
│   │   ├── liff/       # LINE LIFF用ページ
│   │   ├── organizer/  # 主催者ダッシュボード
│   │   └── admin/      # 管理者ページ
│   ├── components/     # 共通コンポーネント
│   ├── lib/           # ユーティリティ
│   └── types/         # 型定義
├── .next/             # ビルド出力
└── package.json       # 依存関係
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Lint
npm run lint

# テスト
npm run test
```

## 🔗 API連携

このフロントエンドは、Cloudflare Workers APIと連携して動作します。

- **API Base URL**: 環境変数による動的設定
- **認証**: JWT Cookieベース
- **主なAPI**:
  - `/api/v1/identity/*` - 認証・権限管理
  - `/api/v1/auditions/*` - オーディション管理
  - `/api/v1/entries/*` - 応募者管理
  - `/api/v1/notifications/*` - 通知管理

## 📱 レスポンシブ対応

- **デスクトップ**: 主催者・管理者向けフル機能
- **タブレット**: タッチ操作対応
- **モバイル**: LINE LIFF経由での利用を想定

## 🔐 認証・認可

### 認証方式
- **主催者/マネージャー**: メール（Magic Link）
- **応募者**: LINE（LIFF）
- **管理者**: システム管理者権限

### 権限管理
- ロールベースアクセス制御（RBAC）
- JWTトークンによるセッション管理
- 機能レベルの権限制御

## 🎨 UI/UX

### デザインシステム
- Material Design準拠
- 統一されたカラーパレット
- レスポンシブグリッドシステム

### 主要コンポーネント
- ダッシュボード
- オーディション一覧
- 応募者詳細
- 通知管理
- 設定画面

## 📋 環境変数

### 必須環境変数
```env
NEXT_PUBLIC_API_BASE_URL= # APIエンドポイント
NEXT_PUBLIC_WEB_BASE_URL= # WebサイトURL
NEXT_PUBLIC_LINE_LIFF_ID= # LINE LIFF ID
```

### 開発環境 (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=https://casto.sb2024.xyz/api
NEXT_PUBLIC_WEB_BASE_URL=https://casto.sb2024.xyz
```

## 🚀 デプロイ

### 自動デプロイ
- **Vercel**: GitHub連携により自動デプロイ
- **環境別**: dev/staging/production

### 手動デプロイ
```bash
# Vercel CLI
npm install -g vercel
vercel --prod
```

## 📚 関連ドキュメント

- [プロジェクト全体 README](../../../README.md)
- [技術設計書](../../../docs/ARCHITECTURE.md)
- [開発計画](../../../docs/PLAN.md)
- [API設計](../../../docs/USER_DOMAIN_RULES.md)

## 🤝 コントリビューション

1. **Issue作成**: 機能要望・バグ報告
2. **ブランチ作成**: `feature/機能名` または `fix/修正内容`
3. **PR作成**: develop ブランチに対してPR
4. **レビュー**: コードレビュー後マージ

### コーディング規約
- ESLint + Prettier適用
- TypeScript strict mode
- コンポーネントは機能単位で分割
- レスポンシブ対応必須

## 📞 サポート

- **ドキュメント**: [docs/](../../../docs/) ディレクトリ
- **Issue報告**: GitHub Issues
- **質問・相談**: GitHub Discussions

---

**注意**: このプロジェクトはアクティブに開発中です。最新の情報は常にドキュメントを確認してください。
