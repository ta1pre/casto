# apps ディレクトリ構成ガイド

## 1. 目的
`apps/workers/` と `apps/web/` の役割分担と、認証・データモデルがどこで管理されるかをまとめます。[SF][RP]

## 2. 全体像
```text
apps/
├─ workers/   … Cloudflare Workers 上で動く API / Webhook / ドメインロジック
└─ web/       … Next.js (App Router) によるフロントエンド UI
```

## 3. `apps/workers/`
- **routes/**: HTTP エントリポイント。
  - **api/**: JWT 認証が必要な通常 API。`identity/`・`auditions/`・`entries/` 等のユースケース別エンドポイントを配置。
  - **webhooks/**: 外部サービス連携用エンドポイント。Cloudflare Workers で署名検証のみを行い、後段処理にイベントを引き渡します。
- **middleware/**: API ルート専用の共通ミドルウェア。
  - **auth.ts**: Supabase Auth で発行された JWT を検証。Cloudflare Workers 自体は認証情報を保持せず、`Authorization` ヘッダの検証役に徹します。[ISA]
  - **scope.ts**: リソース所有権やロール権限を確認。
  - **rate-limit.ts**: 呼び出し頻度制限。
  - **errors.ts**: 例外の共通整形。
- **domain/**: ビジネスロジック層。ユースケース単位でアクションを記述します。
- **services/**: 外部サービスやデータアクセスを隠蔽する薄いラッパー。`db/`・`line/`・`stripe/` など。
- **schemas/**: 入出力 DTO とバリデーションを集中管理。
- **lib/**: 日付操作やロギング等のクロスカッティングなユーティリティ。
- **supabase/**: データベース定義の唯一の真実。`migrations/` に DDL を蓄積し、Supabase/Neon 側スキーマと同期します。[CMV]

### Cloudflare Workers と認証
- **JWT 発行元**: Supabase Auth（メールマジックリンクや LIFF 連携）で JWT を作成。
- **Cloudflare Workers の役割**: `middleware/auth.ts` で JWT を検証し、コンテキストにユーザー情報を載せてハンドラへ渡す「門番」。トークンの保存や管理は行いません。[SFT]
- **Webhook 認証**: `routes/webhooks/line.ts` では LINE 署名、`routes/webhooks/stripe.ts` では Stripe のイベント署名を検証し、JWT は利用しません。

## 4. `apps/web/`
- **app/**: URL とページレイアウトの起点。App Router の `(root)` / `(applicant)` / `(organizer)` / `(admin)` などで役割別の画面を分岐します。
- **components/**: 見た目に特化した再利用 UI コンポーネント群。状態は持たせません。
- **features/**: ドメインごとの React Hooks・API SDK・型定義。
  - Hooks が画面状態を管理し、SDK が `lib/api/client.ts` を介して Workers の `/routes/api/**` を呼び出します。
- **lib/**: HTTP クライアント、認証セッション補助、共通設定などを一元化。
- **styles/**: グローバルスタイルや Tailwind 設定。

### フロント側から見た認証
- **セッション取得**: `(root)/layout.tsx` で「任意セッション」を読み込み、`Header` に配布。
- **API 呼び出し**: `features/identity/sdk/` などでアクセストークンをヘッダに添えて API を呼び出し、Cloudflare Workers のミドルウェアが検証します。[DRY]
- **LIFF 利用者**: LINE ミニアプリ内で自動ログインし、取得した JWT を同じ経路で送信。

## 5. データモデルとマイグレーション
- **唯一の DDL 管理場所**: `apps/workers/supabase/migrations/`。
  - ここで PostgreSQL のテーブル定義・インデックス・ロール設定を管理し、Supabase CLI で適用します。
- **アプリコード内モデル**: DB へのアクセスは `services/db/` や `domain/**` に集約し、アプリ側で独自にスキーマを重複定義しません。[DRY]
- **生成物の共有**: 必要に応じて `schemas/**` や `features/**/types/` で DTO を定義し、API 入出力と UI の型を同期させます。

## 6. 開発フローの要点
- **API 実装手順**:
  1. `schemas/` に入出力型を定義。
  2. `domain/**` でユースケースを実装。
  3. `routes/api/**` で HTTP ハンドラを組み立て、ミドルウェアを適用。
  4. フロント側 `features/**/sdk/` から呼び出し、Hook で状態を管理。
- **Webhook 実装手順**:
  1. `routes/webhooks/` にエントリポイントを追加。
  2. `services/**` で外部サービスとのイベント処理を実装。
  3. 必要に応じて `queues` や `domain` 層で後段処理を組む。

## 7. 参考: Cloudflare Workers デプロイと認証設定
- **CI/CD**: `.github/workflows/production-deploy.yml` で Node.js v20、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` を使用。
- **Wrangler シークレット**: Supabase 接続情報や環境変数は `wrangler secret put` で登録し、Workers から参照。
- **認証に関する FAQ**:
  - Cloudflare Workers は認証サーバーではなく、Supabase Auth で発行された JWT を検証する **ゲートウェイ** です。
  - DB スキーマは Supabase プロジェクトと `apps/workers/supabase/migrations/` で同期管理します。
