# 🔧 Workers API 構成

## ディレクトリ構造

```
apps/workers/src/
├── app.ts              # Hono アプリ本体（CORS・ルーティング・エラーハンドリング）
├── index.ts            # エントリポイント（app.ts から export）
├── config/
│   └── env.ts         # 環境設定（development / production 切替、CORS Origin 管理）
├── types/
│   ├── index.ts       # 型の re-export（@casto/shared から import）
│   ├── bindings.ts    # Hono Bindings、AppContext（Workers 専用）
│   └── supabase.ts    # @casto/shared から再エクスポート（重複排除）
├── lib/               # 汎用インフラ・ユーティリティ
│   ├── auth.ts        # JWT 認証（LINE / Email 共通）
│   └── supabase.ts    # Supabase クライアント初期化
├── middleware/
│   └── authContext.ts # リクエスト認証コンテキスト
└── features/          # 機能特化コード（API 単位）
    ├── health/
    │   └── routes.ts
    └── users/        # ★ 実装リファレンス
        ├── routes.ts   # API endpoints (GET/POST /api/v1/users)
        └── service.ts  # users 関連ビジネスロジック
```

## 配置ルール

### `lib/`
機能横断的な汎用ロジックのみ配置
- 認証（JWT）
- DB接続（Supabase）
- 将来的なロガー、バリデーター等

### `features/*/`
各機能のAPI routes + service + types を集約
- 追加機能は `features/auditions/`、`features/payments/` 等のフォルダで整理
- `routes.ts`: Hono ルート定義
- `service.ts`: ビジネスロジック

### `config/`
環境依存設定を集約
- `env.ts`: `ENVIRONMENT` から `development` / `production` を判定
- CORS Allowed Origins を環境別に設定

### `types/`
アプリ全体で使う共通型定義
- `bindings.ts`: Cloudflare Workers Bindings（Workers 専用）。
- `supabase.ts`: `@casto/shared` から `SupabaseUserRow` 等を再エクスポート。Workers 側では独自定義を持たず、共通パッケージを参照します。[PEC][DRY]
- `index.ts`: 上記をまとめて再エクスポート。

## 環境設定

### development（ローカル開発）
- Primary Origin: `https://casto.sb2024.xyz`
- Additional Origins: `http://localhost:3000`, `http://127.0.0.1:3000`

### production（本番）
- Primary Origin: `https://casto.io`
- Additional Origins: 環境変数 `ALLOWED_ORIGINS` で動的追加可能

環境変数 `ENVIRONMENT` を `development` または `production` に設定することで自動切替。

## 実装リファレンス

新規 API 機能を追加する際は以下を参考にしてください:

- **Workers API 構成例**: `apps/workers/src/features/users/`
  - `routes.ts`: API エンドポイント定義。
  - `service.ts`: DB 操作、ビジネスロジック。
  - `@casto/shared` の型を利用し、レスポンス形式を Web と統一。[DRY]

- **Web UI 連携例**: `apps/web/src/app/test/`
  - Workers API を呼び出し、共通型を利用したデータフック、UI コンポーネント統合の実装サンプル。[TDT]
  - API レスポンスの型安全性をフロントとバックで一致させる手本としても機能します。

- **共通パッケージ**: `packages/shared/src/`
  - `types/user.ts`: Workers / Web で共有する型定義。
  - `utils/user.ts`: DB レスポンスを整形する関数群。

---

**最終更新**: 2025/10/04
