# 🏗️ casto アーキテクチャ

## システム構成

```
┌─────────────────┐
│   ユーザー      │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Next.js  │ (apps/web)
    │ Frontend │
    └────┬─────┘
         │
    ┌────▼──────────┐
    │ Cloudflare    │ (apps/workers)
    │ Workers API   │
    └────┬──────────┘
         │
    ┌────▼─────┐
    │ Supabase │
    │ Database │
    └──────────┘
```

## API配置方針

### Cloudflare Workers (`apps/workers/src/features/`)
- **用途**: 汎用API、認証、決済など外部公開が必要な処理
- **特徴**: 独立したAPIサーバー、複数クライアント対応、エッジ配信
- **構成**: 機能ごとに `features/<name>/routes.ts` で実装

### Next.js Route Handlers (`apps/web/src/app/api/`)
- **用途**: フロントエンド専用の軽量処理、SSR用データフェッチ
- **特徴**: Next.jsと同じリポジトリで完結、内部API向け
- **方針**: 現状は未使用、必要に応じて後から追加

## データベース接続

### フロントエンド → Workers API → Supabase
- フロントエンドは Workers API 経由でデータ取得
- Supabase への直接接続は行わない（セキュリティ・権限管理の一元化）
- `NEXT_PUBLIC_API_BASE_URL` で Workers エンドポイントを参照

### Workers → Supabase
- `SUPABASE_SERVICE_ROLE_KEY` でサーバー側から接続
- RLS は `USING (false)` で維持し、Service Role のみ操作可能

## ディレクトリ構造

### フロントエンド (`apps/web/src/`)
```
app/
  liff/           # LINE ミニアプリ
  test/           # 開発テストページ
components/
  common/         # 共通UIコンポーネント
  <feature>/      # 機能別コンポーネント
hooks/
  common/         # 共通カスタムフック
  <feature>/      # 機能別フック
lib/              # ユーティリティ
```

### API (`apps/workers/src/`)
```
app.ts            # Honoアプリ本体（CORS・ルーティング）
index.ts          # エントリポイント
config/
  env.ts          # 環境設定（development/production）
features/
  <feature>/
    routes.ts     # API endpoints
    service.ts    # ビジネスロジック
    test/
      *.test.ts   # エンドポイント用の最小テスト
lib/              # 汎用インフラ（auth・supabase等）
middleware/       # 認証コンテキスト
types/
  index.ts        # 型のre-export
  bindings.ts     # Hono Bindings
  supabase.ts     # ドメイン型
```

## 命名規則

- **機能別ファイル**: プレフィックスで統一（例: `TestUserTable.tsx`, `useTestUsers.ts`）
- **共通ファイル**: 機能名のみ（例: `DataTable.tsx`, `usePagination.ts`）
- **依存方向**: `<feature>/` → `common/` は可、逆は禁止

### フロントエンド ↔ バックエンド連携
- フロントエンド（Next.js）は `NEXT_PUBLIC_API_BASE_URL` を使って Cloudflare Workers API (`/api/v1/*`) を呼び出す。
- Workers (`features/<feature>/routes.ts`) が `lib/supabase.ts` の Service Role クライアントを通じて Supabase DB にアクセス。
- 共通ロジック（認証、DB接続、設定）は `lib/`・`middleware/`・`config/` に集約。
```mermaid
flowchart LR
  A[Next.js client] -- fetch --> B[/api/v1/*]
  B -- Service Role Key --> C[Supabase]
```
