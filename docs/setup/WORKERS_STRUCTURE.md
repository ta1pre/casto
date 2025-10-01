# 🔧 Workers API 構成

## ディレクトリ構造

```
apps/workers/src/
├── app.ts              # Honoアプリ本体（CORS・ルーティング・エラーハンドリング）
├── index.ts            # エントリポイント（app.tsからexport）
├── config/
│   └── env.ts         # 環境設定（development/production切替、CORS Origin管理）
├── types/
│   ├── index.ts       # 型のre-export
│   ├── bindings.ts    # Hono Bindings、AppContext
│   └── supabase.ts    # Supabaseドメイン型
├── lib/               # 汎用インフラ・ユーティリティ
│   ├── auth.ts        # JWT認証（LINE/Email共通）
│   └── supabase.ts    # Supabaseクライアント初期化
├── middleware/
│   └── authContext.ts # リクエスト認証コンテキスト
└── features/          # 機能特化コード（API単位）
    ├── health/
    │   └── routes.ts
    └── users/
        ├── routes.ts   # API endpoints (GET/POST /api/v1/users)
        └── service.ts  # users関連ビジネスロジック
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
- `bindings.ts`: Cloudflare Workers Bindings
- `supabase.ts`: ドメイン型

## 環境設定

### development（ローカル開発）
- Primary Origin: `https://casto.sb2024.xyz`
- Additional Origins: `http://localhost:3000`, `http://127.0.0.1:3000`

### production（本番）
- Primary Origin: `https://casto.io`
- Additional Origins: 環境変数 `ALLOWED_ORIGINS` で動的追加可能

環境変数 `ENVIRONMENT` を `development` または `production` に設定することで自動切替。

---

**最終更新**: 2025/10/01
