# TODO - Casto開発タスク

## 🎯 現在のフォーカス

### Phase 3: オーディション機能（段階的実装）

主催者がオーディションを作成・管理し、応募者を審査できる機能を実装します。
**設計方針**: MVPファーストでシンプルに開始し、段階的に高度な機能を追加 [SF][CA]

#### 📁 ディレクトリ構成ガイド（Phase 3 向け）
- **packages/shared/src/**: `types/`, `validators/`, `constants/`, `utils/` を用途別に集約し、`index.ts` から再エクスポート。
- **apps/workers/src/features/**: `auditions/`, `talentProfile/`, `notifications/` にまとめ、サービス・コントローラ・通知送信ロジックをドメイン単位で配置。
- **apps/web/src/app/**: `organizer/`・`talent/` 配下にページと `_components/`・`_hooks/` を集約し、ドメイン外の共通 UI は `shared/components/` に配置。
- **supabase/schema/**: `talent_profiles.sql` などテーブル単位で管理し、マイグレーションは `supabase/migrations/` で時系列管理。

---

## 📋 実装計画

### Phase 3A: 基本オーディション機能（MVP）

**目標**: 主催者が単一ステージのオーディションを作成・管理できる最小限の機能

#### データベース設計

**1. auditions テーブル**
```sql
- id (uuid, PK)
- organizer_id (uuid, FK → organizer_profiles.user_id)
- title (text, 必須)
- description (text)
- requirements (text, 募集要項)
- short_description (text, SNS向け100文字以内)
- application_start_date (timestamptz)
- application_end_date (timestamptz)
- max_applicants (integer, null=無制限)
- status (enum: draft/published/closed/cancelled)
- project_type (enum: audition/job, デフォルト audition)
- evaluation_mode (enum: manual, 初期は manual のみ)
- cover_image_url (text, null可)
- cover_image_alt (text, null可)
- 関連: `audition_genre_map` でジャンル紐付け
- created_at, updated_at
- RLS: 主催者本人・管理者のみ CRUD、公開中は誰でも読取
```

**2. applications テーブル**
```sql
- id (uuid, PK)
- audition_id (uuid, FK → auditions)
- applicant_id (uuid, FK → users.id)
- applicant_profile (jsonb, talent_profiles のスナップショット)
- additional_message (text, 任意, 2000文字以内)
- additional_urls (text[], 任意, 最大5件)
- status (enum: submitted/under_review/accepted/rejected/withdrawn)
- submitted_at (timestamptz)
- reviewed_at (timestamptz)
- created_at, updated_at
- RLS: 応募者本人・該当主催者・管理者のみ閲覧
```

**3. notifications テーブル（通知管理）**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- type (text, 通知タイプ)
- title (text, タイトル)
- message (text, メッセージ本文)
- reference_type (text, audition/application)
- reference_id (uuid, 関連レコードID)
- read_at (timestamptz, null可)
- created_at, updated_at
- RLS: user_id = auth.uid() のみ閲覧・更新
```

**4. audition_genres テーブル（ジャンルマスタ）**
```sql
- id (uuid, PK)
- slug (text, 一意, 例: idol, dance)
- display_name (text, 表示名)
- category (text, 任意, 上位分類)
- description (text, 任意)
- sort_order (integer, 表示順)
- is_active (boolean, デフォルト true)
- created_at, updated_at
- RLS: 管理者のみ更新、誰でも参照
```

**5. audition_genre_map テーブル（中間テーブル）**
```sql
- audition_id (uuid, FK → auditions)
- genre_id (uuid, FK → audition_genres)
- PRIMARY KEY (audition_id, genre_id)
- created_at (timestamptz)
- RLS: 紐付く主催者 or 管理者のみCRUD
```

**6. application_reviews テーブル**（reviews の簡略版）
```sql
- id (uuid, PK)
- application_id (uuid, FK → applications)
- reviewer_id (uuid, FK → users.id)
- decision (enum: pending/accept/reject)
- comment (text)
- is_final (boolean, default: false)
- created_at, updated_at
- RLS: 該当主催者・管理者のみ CRUD
```

#### タスクリスト

**データベース** ✅ Phase 3A 完了
- [x] auditions テーブル作成（20251015000004）
- [x] applications テーブル作成（20251015000006）
- [x] notifications テーブル作成（20251015000007）
- [x] application_reviews テーブル作成（20251015000008）
- [x] audition_genres テーブル作成（20251015000003）
- [x] audition_genre_map テーブル作成（20251015000005）
- [x] audition_areas テーブル作成（20251017000001）
- [x] RLS ポリシー設定完了
- [x] 初期ジャンルデータ投入（20251015211706, 20251015232732）
- [x] 初期エリアデータ投入（20251017000002）
- [x] メインビジュアル機能追加（20251016100000）
- [x] 通知既読ステータス追加（20251018000000）
- [x] **多段階選考機能（Phase 3B）完了**（20251017000003）

**共通型定義・バリデーション**（packages/shared）
- [x] `types/audition.ts` 作成
  - `Audition`, `AuditionStatus`, `EvaluationMode`, `ProjectType` 型
- [x] `types/auditionGenre.ts` 作成
- [x] `types/application.ts` 作成
  - `Application`, `ApplicationStatus` 型
- [x] `types/notification.ts` 作成
  - `Notification`, `NotificationType` 型
- [x] `types/review.ts` 作成
  - `ApplicationReview`, `ReviewDecision` 型
- [x] `validators/audition.ts` 作成
  - Zod スキーマ: `createAuditionSchema`, `updateAuditionSchema`（short_description/cover_image_url/project_type/genreIds[] をバリデート）
- [x] `validators/application.ts` 作成
  - Zod スキーマ: `submitApplicationSchema`（additional_message/additional_urls をバリデート）
- [x] `validators/review.ts` 作成
  - Zod スキーマ: `createReviewSchema`

**Workers API** ✅ Phase 3A & 3B 完了
- [x] オーディション管理API（主催者側）完全実装
  - [x] GET/POST/PATCH/DELETE `/api/v1/organizer/auditions`
  - [x] GET `/api/v1/organizer/genres` - ジャンル一覧
  - [x] GET `/api/v1/organizer/areas` - エリア一覧
  - [x] メインビジュアルAPI（upload/delete/view）
- [x] ステップ管理API（主催者側）完全実装
  - [x] GET/POST/PATCH/DELETE `/api/v1/organizer/auditions/:id/steps`
- [x] 応募管理API（主催者側）完全実装
  - [x] GET `/api/v1/organizer/auditions/:id/applications` - 応募一覧
  - [x] GET/PATCH `/api/v1/organizer/applications/:id` - 応募詳細・更新
- [x] 評価管理API（主催者側）完全実装
  - [x] POST/PATCH/DELETE `/api/v1/organizer/auditions/:id/applications/:appId/steps/:stepId/evaluation`
- [x] オーディション閲覧API（タレント側）完全実装
  - [x] GET `/api/v1/talent/auditions` - 公開オーディション一覧
  - [x] GET `/api/v1/talent/auditions/:id` - オーディション詳細
  - [x] GET `/api/v1/talent/genres` - ジャンル一覧
- [x] 応募管理API（タレント側）完全実装
  - [x] POST `/api/v1/talent/audition-applications` - 応募作成
  - [x] GET `/api/v1/talent/audition-applications` - 自分の応募一覧
  - [x] GET `/api/v1/talent/audition-applications/:id` - 応募詳細
  - [x] PATCH `/api/v1/talent/audition-applications/:id/withdraw` - 応募辞退
- [x] すべてのルーティングを app.ts に追加完了
- [ ] 通知API（後続フェーズ）
- [ ] LINE Messaging API統合（後続フェーズ）

**メインビジュアル機能** ✅ 実装完了
- [x] マイグレーション作成（20251016100000_add_main_visual_to_auditions.sql）
- [x] メディア型定義・バリデーション実装
- [x] 1:1アスペクト比チェック実装（±5%許容）
- [x] R2操作サービス実装
- [x] メインビジュアルAPI実装完了
  - [x] POST /api/v1/organizer/auditions/:id/main-visual/upload
  - [x] DELETE /api/v1/organizer/auditions/:id/main-visual
  - [x] GET /api/v1/organizer/auditions/:id/main-visual/view
- [x] ルーティング追加完了
- [x] MediaUploaderコンポーネント実装
- [x] オーディション作成・編集ページに統合
- [x] オーディション詳細ページに表示追加
- 📋 詳細: tasksarchive/AUDITION_MAIN_VISUAL_IMPLEMENTATION.md

**Web UI - 主催者側** ✅ Phase 3A & 3B 基本完了
- [x] オーディション一覧ページ
- [x] オーディション作成ページ（ジャンル選択・メインビジュアル対応）
- [x] オーディション詳細ページ
- [x] オーディション編集ページ（ジャンル編集・メインビジュアル対応）
- [x] 応募者一覧ページ（ステップ機能対応済み）
- [x] 応募詳細・評価ページ（ステップ評価対応済み）
- [x] AuditionFormコンポーネント実装
- [x] ジャンル選択UI実装（最大3件）
- [x] エリア選択UI実装
- [x] メインビジュアルアップロード機能
- [x] ステップ設定UI実装
- [x] ステップ評価UI実装
- [x] ヘッダーナビゲーション統合

**Web UI - 応募者側（LIFF/Talent）** ✅ Phase 3A & 3B 基本完了
- [x] オーディション一覧ページ（/liff/auditions）
- [x] オーディション詳細ページ
- [x] 応募フォームページ（プロフィール自動取得）
- [x] マイ応募一覧ページ
- [x] 応募詳細ページ（選考進捗表示対応）
- [x] 応募取り下げ機能
- [x] ステップ進捗表示機能
- [ ] 通知機能（後続フェーズ）

**テスト・動作確認** 🔄 継続中
- [x] 主催者: オーディション作成・編集・削除
- [x] 主催者: ステータス変更（draft → published → closed）
- [x] 主催者: ジャンル・エリア選択
- [x] 主催者: メインビジュアルアップロード
- [x] 主催者: ステップ設定（書類選考自動作成確認）
- [x] 応募者: プロフィール作成（LIFF経由）
- [x] 応募者: オーディション一覧・詳細閲覧
- [x] 応募者: 応募作成（プロフィール自動取得）
- [x] 主催者: 応募者一覧・フィルタリング（ステップ対応）
- [x] 主催者: 応募詳細閲覧・評価（ステップ評価）
- [x] 主催者: ステップ進行管理
- [x] 応募者: 選考進捗確認
- [ ] 通知機能テスト（後続フェーズ）
- [ ] RLS 権限の包括的テスト

---

### Phase 3B: 多段階選考機能 ✅ 実装完了

**目標**: 一次→二次→三次の段階的選考とスコアリングによる評価管理

**実装完了内容:**
- ✅ audition_steps テーブル（ステップ定義）
- ✅ audition_applications テーブル（応募とステップの紐付け）
- ✅ audition_step_evaluations テーブル（評価管理）
- ✅ ステップ管理API（主催者側）
- ✅ 応募管理API（タレント側）
- ✅ 評価管理API
- ✅ ステップ設定UI（主催者）
- ✅ 応募者一覧・評価UI（主催者）
- ✅ 選考進捗表示UI（タレント）
- 📋 詳細: tasksarchive/AUDITION_STEPS_IMPLEMENTATION.md

**マイグレーション:** 20251017000003_create_audition_steps.sql

---

### Phase 3B.5: 通知機能 🔄 実装中

**目標**: 応募者（LINEサービスメッセージ無料）・主催者（メール無料枠）で確実に届く通知システム

**設計方針:**
- 📋 詳細: `docs/tasks/NOTIFICATION_FUNCTION_DRAFT.md`
- 応募者向け: LINEミニアプリ「サービスメッセージ」（無料・友だち追加不要）
- 主催者向け: AWS SES / SendGrid（無料枠）
- LIFF内通知一覧で履歴管理

#### Phase 1: サービスメッセージ基盤 ✅ 実装完了（2025-10-19）

**データベース** ✅
- [x] `notifications` テーブル拡張（context, channel, service_notification_token）
- [x] マイグレーション: `20251018000001_extend_notifications.sql`
- [x] Supabase MCP ツールでマイグレーション適用

**Workers API** ✅
- [x] `lib/notification.service.ts` - 通知ディスパッチャ
- [x] `lib/line-service-message.ts` - **短期のチャネルアクセストークン動的生成**
- [x] `config/notification-templates.ts` - テンプレート定義
- [x] `types/bindings.ts` - 環境変数（LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_LIFF_ID）
- [x] `types/lineServiceMessage.ts` - LINE API型定義
- [x] `types/notification.ts` - 通知型定義
- [x] `types/application.ts` - liffAccessToken追加
- [x] `features/talent/applications/routes.ts` - 応募完了時の通知送信
- [x] Workers 再デプロイ（Version: e81d8352-2a19-43a5-b763-5ce91faea725）

**LINE Developers コンソール** ✅
- [x] サービスメッセージテンプレート登録
  - [x] `Entry confirmed (simple)` - 応募受付完了
- [x] 環境変数設定（チャネルID、シークレット、LIFF ID）

**Web UI** ✅
- [x] 応募フォームで `liff.getAccessToken()` を取得してリクエストボディに含める

**動作確認** ✅
- [x] 開発環境でLINE通知送信成功
- [x] `notifications` テーブルに記録
- [x] 後続メッセージ用の通知トークン保存

**実装方式** 📋
- 短期のチャネルアクセストークン（30日間有効）を動的生成
- チャネルIDとシークレットのみで発行（シンプル）
- 詳細: `docs/tasks/LINE_SERVICE_MESSAGE_IMPLEMENTATION_GUIDE.md`

#### Phase 2: メール通知（⭐️⭐️⭐️ 最優先）

**AWS SES 設定**
- [ ] AWS SES アカウント作成（Sandbox 環境）
- [ ] 送信元メールアドレス認証
- [ ] 環境変数追加（AWS_SES_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, FROM_EMAIL）

**Workers API**
- [ ] `services/email.service.ts` - メール送信サービス
- [ ] メールテンプレート定義（new_application, application_status_changed）
- [ ] 新規応募時のメール送信実装

**テスト**
- [ ] Sandbox 環境でメール送信確認
- [ ] テンプレート変数の展開確認

#### Phase 3: LIFF通知一覧UI（⭐️⭐️）

**Workers API**
- [ ] `features/talent/notifications/` ディレクトリ作成
- [ ] `GET /api/v1/talent/notifications` - 一覧取得API
- [ ] `PATCH /api/v1/talent/notifications/:id/read` - 既読化API
- [ ] ルーティング追加

**Web UI**
- [ ] `apps/web/src/app/liff/notifications/page.tsx` 作成
- [ ] `NotificationListClient.tsx` コンポーネント
- [ ] 未読バッジ表示
- [ ] 既読/未読フィルタ

**テスト**
- [ ] LIFF画面で通知一覧表示確認
- [ ] 既読/未読ステータス管理確認

#### 本番環境移行前チェック
- [ ] LINEミニアプリを認証済みに変更
- [ ] サービスメッセージテンプレートの審査通過
- [ ] AWS SES を本番モード（Sandbox 解除）
- [ ] 環境変数の本番設定
- [ ] RLS ポリシーの最終確認

---

### Phase 3B.6: LINE公式アカウント統合 🔄 Phase 1 完了（Phase 2 以降計画中）

**目標**: 友だち追加状態を表示し、将来的にMessaging API活用の基盤を構築

**設計方針:**
- 📋 詳細: `docs/tasks/LINE_OFFICIAL_ACCOUNT_INTEGRATION.md`
- Phase 1: 友だち追加状態の表示のみ（フロントエンドのみ）
- Phase 2: Webhook連携 + DB保存（将来実装）
- Phase 3: Messaging API活用（将来実装）

#### 【確認事項】実装前に回答必須
- [ ] **LINE公式アカウントの状況確認**
  - LINE公式アカウントは作成済みか？
  - 友だち追加URL（`https://lin.ee/XXXXX`）は何か？
  - 未作成の場合: プレースホルダーURLで実装し、後で差し替え
- [ ] **Webhook URL設定のタイミング**
  - 今回はPhase 1のみ実装（推奨）
  - Phase 2でWebhook設定を実施予定
  - Webhook URL: `https://casto-workers-dev.casto-api.workers.dev/api/v1/webhook/line`

#### Phase 1: 友だち追加状態の表示（実装完了）⭐️⭐️⭐️

**Web UI**
- [x] `apps/web/src/shared/hooks/useOfficialLineStatus.ts` 作成
  - `liff.getFriendship()` で友だち追加状態取得
  - 型定義: `{ isFriend: boolean | null, loading: boolean, error: string | null, refetch: () => Promise<void>, lastCheckedAt: number | null }`
  - エラーハンドリング: LIFF未初期化、API未許可（403）、その他エラー
  - 依存: `useLiffAuth()` で LIFF 初期化状態確認
- [x] `apps/web/src/app/liff/page.tsx` 修正
  - ウェルカムセクション直後に友だち追加状態カード追加
  - 条件分岐: 友だち追加済み（緑）/未追加（黄色）/確認中（灰色）
  - 未追加時: 参加促進文言 + LINEボタン（`NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL`）
  - 既存カードと統一デザイン（`bg-card`, `border-border`, `rounded-lg`, `p-4`）

**環境変数**
- [x] `.env.example` に `NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL` 追加
  - プレースホルダー: `https://lin.ee/PLACEHOLDER`
  - 実際のURLに差し替え可能

**ドキュメント**
- [x] `docs/tasks/LINE_OFFICIAL_ACCOUNT_INTEGRATION.md` 作成
  - Phase 1〜3の実装計画詳細
  - Webhook設定手順（Phase 2用）
  - Messaging API活用案（Phase 3用）

**テスト**
- [ ] 友だち追加前: 黄色アイコン + 参加ボタン表示確認
- [ ] 友だち追加後: 緑色アイコン + 参加済みメッセージ表示確認
- [ ] エラー時: 灰色アイコン + 確認中メッセージ表示確認
- [ ] LIFF未初期化時: エラーハンドリング正常動作確認

#### Phase 2: Webhook連携 + DB保存 ✅ 実装完了（2025-10-19）

**データベース** ✅
- [x] マイグレーション: `20251019000000_add_line_friendship_and_messaging_logs.sql`
  - `users.line_friendship_status` カラム追加（boolean）
  - `users.line_friendship_updated_at` カラム追加（timestamptz）
  - `messaging_logs` テーブル追加（送信履歴管理）
  - RLS ポリシー設定完了

**Workers API** ✅
- [x] `features/webhook/line.service.ts` - Webhook処理ロジック
- [x] `features/webhook/line.routes.ts` - `POST /api/v1/webhook/line`
- [x] HMAC-SHA256署名検証実装
- [x] 友だち追加/ブロック/解除イベント処理
- [x] `types/lineMessaging.ts` - LINE API型定義
- [x] `lib/line-messaging.ts` - プッシュ/マルチキャスト送信

**LINE Developers設定** 🔄
- [ ] **Webhook URL設定（要対応）**
  - URL: `https://casto-workers-dev.casto-api.workers.dev/api/v1/webhook/line`
  - Webhook有効化
- [ ] Webhook再送信機能有効化

#### Phase 3: Messaging API活用 ✅ 実装完了（2025-10-19）

**Workers API** ✅
- [x] `features/messaging/broadcast.service.ts` - 一斉配信ロジック
- [x] `features/messaging/broadcast.routes.ts` - 配信API（4エンドポイント）
  - `POST /api/v1/internal/messaging/audition-announcement` - 新着告知
  - `POST /api/v1/internal/messaging/weekly-summary` - 週次まとめ
  - `GET /api/v1/internal/messaging/stats` - 無料枠モニター
  - `GET /api/v1/internal/messaging/history` - 送信履歴
- [x] メッセージテンプレート生成（FlexMessage）
- [x] バッチ送信（500件ずつ）

**Web UI（管理者向け）** ✅
- [x] `apps/web/src/app/admin/messaging/page.tsx` - 配信管理画面
  - 無料枠モニター表示（残量/使用率）
  - 週次まとめ配信ボタン
  - 送信履歴一覧

**コスト管理** ✅
- [x] 無料枠（500通/月）で運用
- [x] 月間送信数カウント機能
- [x] 超過警告表示

---

#### 追加データ設計（Phase 3C以降）

**1. オーディション固有の提出要件（auditions テーブルに追加）**
```sql
- submission_requirements (jsonb, 任意)
  例: {
    "required_files": [
      {type: "video", title: "自己PR動画", max_size_mb: 50},
      {type: "document", title: "履歴書", formats: ["pdf", "docx"]}
    ]
  }
```

**2. 提出ファイル（applications テーブルに追加）**
```sql
- submitted_files (jsonb, 任意)
  例: [
    {type: "video", title: "課題動画", url: "...", uploaded_at: "..."},
    {type: "document", title: "履歴書", url: "...", uploaded_at: "..."}
  ]
```

**3. stages テーブル**（ステージ定義）
```sql
- id (uuid, PK)
- audition_id (uuid, FK → auditions)
- stage_order (integer, 1/2/3)
- name (text, 例: "一次審査", "二次審査")
- description (text)
- submission_requirements (text)
- start_date (timestamptz)
- end_date (timestamptz)
- evaluation_mode (enum: manual/score_threshold/top_n/hybrid)
- pass_threshold (numeric, スコア閾値)
- pass_count (integer, 上位n名)
- evaluation_criteria (jsonb, 評価観点と重み)
- created_at, updated_at
```

**4. stage_applications テーブル**（応募×ステージの進捗）
```sql
- id (uuid, PK)
- application_id (uuid, FK → applications)
- stage_id (uuid, FK → stages)
- status (enum: pending/submitted/reviewing/passed/failed/withdrawn)
- submission_data (jsonb, ステージごとの提出物)
- submitted_at (timestamptz)
- reviewed_at (timestamptz)
- created_at, updated_at
```

**5. stage_reviews テーブル**（ステージごとのレビュー）
```sql
- id (uuid, PK)
- stage_application_id (uuid, FK → stage_applications)
- reviewer_id (uuid, FK → users.id)
- scores (jsonb, 観点別スコア)
- total_score (numeric, 合計スコア)
- comment (text)
- decision (enum: pending/pass/fail)
- is_final (boolean)
- created_at, updated_at
```

#### タスクリスト

**データベース**
- [ ] auditions テーブルに submission_requirements 追加
- [ ] applications テーブルに submitted_files 追加
- [ ] stages テーブル作成
- [ ] stage_applications テーブル作成
- [ ] stage_reviews テーブル作成
- [ ] RLS ポリシー設定
- [ ] マイグレーション生成・適用

**共通型定義・バリデーション**
- [ ] `types/stage.ts` 作成
- [ ] `validators/stage.ts` 作成
- [ ] スコアリングロジックのユーティリティ関数

**Workers API**
- [ ] Supabase Storage 統合（ファイルアップロード）
- [ ] `POST /api/v1/talent/upload` - ファイルアップロード API
- [ ] ステージ管理 API
- [ ] ステージごとの提出 API
- [ ] スコアリング・自動候補化 API
- [ ] 次ステージへの進出処理 API

**Web UI**
- [ ] ファイルアップロードコンポーネント
- [ ] 提出要件に応じた応募フォーム
- [ ] ステージ設定 UI
- [ ] ステージごとの応募者管理 UI
- [ ] スコアリング入力 UI
- [ ] 自動候補化結果表示 UI

---

### Phase 3C: プレミアム機能（プレビュー/アンロック）

**目標**: 応募者情報のプレビュー/完全閲覧の二段階制御とポイント消費

#### 追加データ設計

**1. application_unlocks テーブル**（閲覧アンロック記録）
```sql
- id (uuid, PK)
- organizer_id (uuid, FK → organizer_profiles.user_id)
- application_id (uuid, FK → applications)
- audition_id (uuid, FK → auditions)
- unlocked_at (timestamptz)
- valid_until (timestamptz, 再閲覧期限)
- billing_transaction_id (uuid, 外部決済システムへの参照)
- created_at, updated_at
- UNIQUE: (organizer_id, application_id)
```

**2. pricing_rules テーブル（価格設定）**
```sql
- id (uuid, PK)
- project_type (text, audition/job)
- genre_id (uuid, FK → audition_genres, null可)
- unlock_price (integer, ポイント数)
- is_active (boolean, デフォルト true)
- created_at, updated_at
- UNIQUE: (project_type, genre_id)
```

**価格設定例**:
- `project_type='job'` + `genre_id='actor'` → 50ポイント（安価）
- `project_type='audition'` + `genre_id='idol'` → 200ポイント（高価）
- `genre_id=NULL` → デフォルト価格

**3. プレビュー制御ロジック**
- 顔写真・動画は低解像度/モザイク処理
- 自己PR は冒頭 100 文字のみ
- 詳細情報は「***」でマスキング

#### タスクリスト

**データベース**
- [ ] pricing_rules テーブル作成
- [ ] application_unlocks テーブル作成
- [ ] RLS ポリシー設定
- [ ] マイグレーション生成・適用
- [ ] `supabase/seed/pricing_rules.sql` 作成（初期価格データ投入）

**共通型定義・バリデーション**
- [ ] `types/pricingRule.ts` 作成
- [ ] `types/unlock.ts` 作成
- [ ] プレビュー/フル表示の判定ロジック
- [ ] 価格計算ロジック（project_type + genre_id → unlock_price）

**Workers API**
- [ ] `GET /api/v1/organizer/pricing-rules` - 価格ルール一覧取得
- [ ] `GET /api/v1/organizer/applications/:id/unlock-price` - アンロック価格計算（project_type + genre から自動計算）
- [ ] `POST /api/v1/organizer/applications/:id/unlock` - アンロック実行（ポイント消費）
- [ ] `GET /api/v1/organizer/applications/:id/unlock-status` - アンロック状態確認

**Web UI**
- [ ] プレビュー表示コンポーネント（制限表示）
- [ ] アンロックボタン・確認モーダル
- [ ] アンロック後の完全表示
- [ ] 再閲覧無料の表示

---

## 🎨 UI/UX 設計指針

### 主催者側

**オーディション一覧**
- カード型レイアウト
- ステータスバッジ（draft/published/closed）
- 応募者数の表示
- 締切までの残り日数

**応募者一覧**
- テーブル型レイアウト
- フィルタ: ステータス（全て/審査中/合格/不合格）
- ソート: 応募日時/レビュー日時
- 一括選択・一括操作（Phase 3B 以降）

**応募詳細**
- プロフィール情報
- 志望動機・ポートフォリオ
- 審査コメント入力エリア
- 合否決定ボタン（明確な視覚的区別）

### 応募者側

**オーディション一覧**
- カード型グリッドレイアウト
- 募集中/終了のフィルタ
- キーワード検索（Phase 3B 以降）
- 主催者情報の表示

**応募フォーム**
- シンプルな段階的入力
- リアルタイムバリデーション
- 下書き保存機能（Phase 3B 以降）
- 確認画面

**マイ応募**
- 応募したオーディション一覧
- 各応募のステータス（審査中/合格/不合格）
- 結果通知の表示

---

## 📊 データフロー

### 応募プロセス
```
1. 応募者: オーディション詳細閲覧
2. 応募者: 応募フォーム入力・送信
3. システム: applications.status = 'submitted'
4. 主催者: 応募者一覧で確認
5. 主催者: 応募詳細閲覧・審査コメント入力
6. 主催者: 合否決定
7. システム: applications.status = 'accepted' | 'rejected'
8. システム: application_reviews レコード作成（is_final = true）
9. 応募者: マイ応募ページで結果確認
```

### 多段階選考（Phase 3B）
```
1. 一次審査合格者 → stage_applications 作成（stage_order = 2）
2. 二次審査の提出物アップロード
3. スコアリング → 自動候補化 or 手動選考
4. 合格者 → stage_applications 作成（stage_order = 3）
5. 最終合格 → applications.status = 'accepted'
```

---

## 🔒 セキュリティ・RLS 設計

### auditions テーブル
- **SELECT**: 公開中（status = 'published'）は誰でも閲覧可
- **INSERT/UPDATE/DELETE**: organizer_id = auth.uid() または admin ロール

### applications テーブル
- **SELECT**: applicant_id = auth.uid() または該当オーディションの主催者または admin
- **INSERT**: 認証済みユーザー（applicant_id = auth.uid()）
- **UPDATE**: applicant_id = auth.uid()（status = 'submitted' の場合のみ辞退可能）
- **DELETE**: 禁止（論理削除のみ）

### application_reviews テーブル
- **SELECT**: 該当オーディションの主催者または admin
- **INSERT/UPDATE/DELETE**: 該当オーディションの主催者または admin

---

## 🧪 テスト戦略

### 単体テスト
- バリデーションスキーマのテスト
- ユーティリティ関数のテスト

### 統合テスト
- API エンドポイントのテスト
- RLS ポリシーのテスト（権限違反を確認）

### E2E テスト（Phase 3B 以降）
- オーディション作成→応募→審査→合否決定の全フロー
- 複数ユーザーでの同時アクセステスト

---

## 📝 技術的考慮事項

### パフォーマンス
- 応募者一覧: ページネーション実装（初期は 20 件/ページ）
- 画像アップロード: Supabase Storage 活用
- キャッシュ戦略: SWR で適切な再検証間隔設定

### 拡張性
- 審査員機能（Phase 3B）を見据えた設計
- カスタムフィールド（Phase 4 以降）への対応余地
- 通知システム（メール/LINE）との統合準備

### 保守性
- 共通型定義の一元管理
- API レスポンス形式の統一
- エラーハンドリングの標準化

---

## 🚀 実装順序の推奨

1. **データベース設計・マイグレーション**（Phase 3A）
2. **共通型定義・バリデーション**（Phase 3A）
3. **Workers API - 主催者側**（Phase 3A）
4. **Workers API - 応募者側**（Phase 3A）
5. **Web UI - 主催者側**（Phase 3A）
6. **Web UI - 応募者側**（Phase 3A）
7. **テスト・動作確認**（Phase 3A）
8. **Phase 3B 着手**（多段階選考）
9. **Phase 3C 着手**（プレビュー/アンロック）

---

## ✅ 完了済み機能

### Phase 1: データベース・認証基盤（完了）
- ✅ roles テーブル作成（admin, organizer, talent, fan）
- ✅ user_roles テーブル作成（多対多の中間テーブル）
- ✅ packages/shared: ロール関連の型・ユーティリティ
- ✅ Workers: 認証ミドルウェア作成
- ✅ Workers: 管理者認証 API
- ✅ Workers: 主催者認証 API
- ✅ Workers: パスワードリセット API
- ✅ マイグレーション適用完了

### Phase 2: フロントエンド構成の整備（完了）
- ✅ 管理者ログイン UI
- ✅ 主催者ログイン UI
- ✅ 新規アカウント作成 UI
- ✅ パスワードリセット UI
- ✅ 共通レイアウト実装
- ✅ useAdminAuth, useOrganizerAuth フック
- ✅ ダッシュボードページ
- ✅ Next.js 15 対応

### Phase 2.5: 主催者共通UI強化（完了）
- ✅ OrganizerHeader コンポーネント
- ✅ UserMenu コンポーネント
- ✅ MobileDrawer コンポーネント
- ✅ レスポンシブ対応

### Phase 2.6: 主催者プロフィール機能（完了）
- ✅ organizer_profiles テーブル作成
- ✅ RLS 設定
- ✅ 共有型定義・バリデーション
- ✅ Workers API 実装

### Phase 2.7: 応募者プロフィール機能（Phase 3A の前提）

**目標**: 応募者がプロフィールを作成・管理できる機能を実装。オーディション応募時にプロフィール情報を自動取得するための基盤。

#### データベース設計

**talent_profiles テーブル**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id, UNIQUE)
- display_name (text, 必須)
- bio (text, 自己PR, 2000文字以内)
- profile_image_url (text, null可)
- birthdate (text, YYYY-MM-DD)
- gender (text, null可)
- prefecture (text, 都道府県)
- portfolio_urls (text[], 外部URL配列, 最大5件)
- media_showcase (jsonb, 任意)
  例: [
    {type: "youtube", title: "ダンス動画", url: "https://youtube.com/..."},
    {type: "soundcloud", title: "歌唱サンプル", url: "https://soundcloud.com/..."}
  ]
- created_at, updated_at
- RLS: 本人のみ CRUD、公開プロフィールは誰でも閲覧可
```

#### タスクリスト

**データベース**
- [ ] `supabase/schema/talent_profiles.sql` 作成
- [ ] RLS ポリシー設定
- [ ] マイグレーション生成・適用

**共通型定義・バリデーション**（packages/shared）
- [ ] `types/talentProfile.ts` 作成
- [ ] `validators/talentProfile.ts` 作成（Zod スキーマ）

**Workers API**（apps/workers）
- [ ] `features/talent/profile/` ディレクトリ作成
- [ ] `GET /api/v1/talent/profile` - 自分のプロフィール取得
- [ ] `POST /api/v1/talent/profile` - プロフィール作成
- [ ] `PATCH /api/v1/talent/profile` - プロフィール更新
- [ ] `app.ts` にルーティング追加

**Web UI - 応募者側**（apps/web）
- [ ] `hooks/useTalentProfile.ts` - プロフィール CRUD フック
- [ ] `talent/profile/page.tsx` - プロフィール表示ページ
- [ ] `talent/profile/edit/page.tsx` - プロフィール編集ページ
- [ ] `talent/_components/ProfileForm.tsx` - プロフィールフォーム
- [ ] `talent/_components/MediaShowcase.tsx` - メディアショーケース

**テスト・動作確認**
- [ ] 応募者: プロフィール作成・編集
- [ ] 応募者: 外部URL追加（YouTube, SoundCloud 等）
- [ ] RLS 権限テスト
- ✅ useOrganizerProfile フック
- ✅ プロフィール表示・編集ページ
- ✅ ヘッダー統合

### その他完了機能
- ✅ LINE認証（LIFF）実装
- ✅ プロフィール完成度表示
- ✅ セッション管理の改善
- ✅ CI/CD パイプライン（Node.js v20 対応）

---

## 📂 関連ドキュメント

- [ディレクトリ構成詳細](./DIRECTORY_STRUCTURE.md)
- [アーキテクチャ](../ARCHITECTURE.md)
- [Supabase スキーマ運用ガイド](../setup/SUPABASE_SCHEMA_MANAGEMENT.md)
- [Workers API 構成](../setup/WORKERS_STRUCTURE.md)

---

## 📌 設計方針と原則

このオーディション機能は以下の原則に基づいて設計されています：

1. **Simplicity First (SF)**: MVP から開始し、段階的に機能を追加
2. **Readability Priority (RP)**: コードは将来のメンテナンス性を重視
3. **Dependency Minimalism (DM)**: 既存の Supabase 機能を最大限活用
4. **Security-First Thinking (SFT)**: RLS による厳格な権限管理
5. **Performance Awareness (PA)**: ページネーションと適切なキャッシュ戦略

---

**最終更新**: 2025-10-18
**現在の状況**: 
- ✅ Phase 3A（基本オーディション機能）完了
- ✅ Phase 3B（多段階選考機能）完了
- 🔄 Phase 3C（プレミアム機能）未着手
- 🔄 通知機能実装中

**次のアクション**: 
1. 通知機能の実装（LINE Messaging API統合）
2. RLS権限の包括的テスト
3. Phase 3C（プレミアム機能）検討
