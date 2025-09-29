# Casto 開発計画＆MVPチェックリスト - 2025年9月時点

このドキュメントは、MVP（Minimum Viable Product）開発に向けた作業計画とチェックリストを管理します。

## MVPスコープ
- **対象機能**: 応募者の応募～主催者の閲覧・連絡まで（課金閲覧を含む）
- **対象ユーザー**:
  - **応募者 / ファン**: LINE LIFF経由での利用
  - **主催者 / マネージャ**: PC/スマホブラウザ経由での利用

---

## 作業チェックリスト - 2025年9月時点の実装状況

### 1. 開発基盤の構築 ✅ 完了
- [x] **1-1. モノレポ環境のセットアップ**
  - [x] Turborepo または同様のツールを導入
  - [x] /apps/web (Next.js), /apps/workers (Cloudflare Workers) の雛形を作成
  - [x] /packages/shared, /packages/ui のディレクトリを作成
- [x] **1-2. 環境分離とシークレット管理** ✅ 完了
  - [x] `dev`, `stg`, `prod` の3環境を定義
  - [x] Cloudflare Pages/Workers の環境変数を設定
  - [x] Vercel の環境変数を設定
  - [x] 各環境のシークレット（APIキー, JWT署名鍵など）を安全に管理する仕組みを導入
- [x] **1-3. データベースとストレージの準備** ✅ 完了
  - [x] DBスキーマの初期バージョンを設計 (`users`, `user_handles`, `user_roles` etc.)
  - [x] Prisma or Drizzle ORM を導入し、スキーマをコード化
  - [x] 各環境用のDB (PostgreSQL) をプロビジョニング
  - [x] 各環境用のCloudflare R2バケットを作成
- [x] **1-4. 型定義と共有パッケージ** ✅ 完了
  - [x] `/packages/shared` にZodスキーマを定義 (APIリクエスト/レスポンス、DBモデル)
  - [x] APIクライアントの雛形を作成
  - [x] 権限管理用のEnumや定数を定義

### 2. 認証基盤の実装 🔄 設計完了、実装中
- [x] **2-1. LINEログイン (LIFF)** 🔄 実装中
  - [x] LIFFアプリの作成と設定 (dev/stg/prod) ✅ 設計完了
  - [x] Next.js (`/liff/*`): LIFF SDKを初期化し、IDトークンを取得する処理を実装 🔄 実装中
  - [x] Workers (`/auth/line/verify`): IDトークンを検証し、`users`, `user_handles` テーブルに情報を保存/更新する処理を実装 🔄 実装中
- [x] **2-2. Emailログイン (Magic Link)** 🔄 実装中
  - [x] Next.js (`/auth/login`): メールアドレス入力フォームを作成 🔄 実装中
  - [x] Workers (`/auth/email/request`): Magic Linkを生成し、メールを送信する処理を実装 🔄 実装中
  - [x] Next.js (`/auth/callback`): リンク内のトークンを検証APIに送信するページを作成 🔄 実装中
  - [x] Workers (`/auth/email/verify`): トークンを検証し、ユーザー情報を保存/更新する処理を実装 🔄 実装中
- [x] **2-3. セッション管理 (JWT)** 🔄 実装中
  - [x] Workers: 認証成功時にJWTを生成・署名する処理を実装 🔄 実装中
  - [x] Workers: JWTをHTTPOnly, Secure, SameSite属性付きのCookieとしてクライアントに設定するレスポンスを実装 🔄 実装中
  - [x] Workers: APIリクエスト毎にJWTを検証し、`userId` と `roles` を確定させるミドルウェアを実装 🔄 実装中
- [x] **2-4. アカウント統合と昇格** 🔄 設計完了
  - [x] 応募者→主催者への昇格フロー（Email追加と`organizer`ロール付与）のAPIとUIを実装 🔄 実装中
  - [x] メールアドレス衝突時のアカウント統合ウィザードのAPIとUIを実装 🔄 設計完了
  - [x] 統合後の高リスク操作を一時的にロックする冷却期間ロジックを実装 🔄 設計完了

### 3. 応募・閲覧フローの実装 🔄 基本API実装中
- [x] **3-1. 応募機能** 🔄 実装中
  - [x] Workers (`/uploads/sign`): Cloudflare R2へのダイレクトアップロード用の署名付きURLを発行するAPIを実装 🔄 設計完了
  - [x] Next.js (`/liff/apply`): 応募フォームを作成。ファイル選択時に署名付きURLを取得し、R2へ直接アップロードする処理を実装 🔄 設計完了
  - [x] Workers (`/auditions/:id/entries`): 応募情報（メタデータとアセットURL）をDBに保存するAPIを実装 🔄 実装中
- [x] **3-2. 主催者による閲覧機能** 🔄 設計完了
  - [x] Workers (`/organizer/auditions/:id/entries`): 応募者一覧を取得するAPIを実装 🔄 設計完了
  - [x] Next.js (`/organizer/audition-details`): 応募者一覧を表示するダッシュボードUIを実装 🔄 設計完了
- [x] **3-3. 連絡機能** 🔄 設計完了
  - [x] Workers (`/notifications/line/push`): 指定したユーザーにLINEでプッシュ通知を送信するAPIを実装 🔄 設計完了
  - [x] Next.js: 主催者ダッシュボードに、応募者へ連絡（LINE通知）を送信するボタンを設置 🔄 設計完了

### 4. LINE公式アカウント連携 ⏳ 未実装
- [ ] **4-1. Webhook受信**
  - [ ] LINE Messaging APIのWebhook URLをWorkersに設定
  - [ ] Workers (`/webhooks/line`): LINEからのWebhookリクエストを受信し、署名を検証する処理を実装
  - [ ] 受信したイベントをCloudflare Queuesに投入し、非同期で処理する仕組みを構築
- [ ] **4-2. 自動応答**
  - [ ] QueuesのコンシューマWorkerを実装
  - [ ] 簡単なキーワードに基づいたFAQ自動応答ロジックを実装
- [ ] **4-3. 通知配信**
  - [ ] 応募完了時や審査結果通知など、特定のイベントに応じてユーザーに通知を送信する処理を実装

### 5. 課金・決済機能 (Stripe) ⏳ 未実装
- [ ] **5-1. 決済フロー**
  - [ ] Stripeアカウントと商品の設定
  - [ ] Workers (`/billing/checkout`): プロフィール閲覧などのためのStripe Checkoutセッションを作成するAPIを実装
  - [ ] Next.js: 決済ボタンとStripe Checkoutへのリダイレクト処理を実装
- [ ] **5-2. 決済結果の反映**
  - [ ] Workers (`/webhooks/stripe`): StripeからのWebhookを受信・検証し、Queuesに投入する処理を実装
  - [ ] QueuesのコンシューマWorkerで、決済結果をDB (`payments`テーブル)に反映し、閲覧権限を付与するロジックを実装

### 6. 運用・監視 ⏳ 未実装
- [ ] **6-1. エラー監視とロギング**
  - [ ] Sentryまたは同様のツールをNext.jsとWorkersに導入
  - [ ] Workersの処理結果や重要なイベントをログに出力
  - [ ] `audit_logs` テーブルに重要な操作履歴を記録する処理を各APIに組み込む
- [ ] **6-2. セキュリティ強化**
  - [ ] Cloudflare Turnstileをログインや応募フォームに導入
  - [ ] Workersにレート制限を設定
  - [ ] Webhookの冪等性キー（イベントID）をチェックする処理を実装

### 7. 現在の開発状況サマリー
- **完了**: 基盤構築、技術仕様策定、ドキュメント整備 ✅
- **進行中**: 認証システム実装、基本API開発 🔄
- **未着手**: ビジネスロジック、決済機能、監視システム ⏳

### 8. 次のマイルストーン
- **認証システムの完成**（2025年10月上旬予定）
- **応募・閲覧フローの基本実装**（2025年10月下旬予定）
- **MVPリリース**（2025年11月予定）
