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

**データベース**
- [x] `supabase/schema/auditions.sql` 作成
- [x] `supabase/schema/applications.sql` 作成（applicant_profile/additional_message/additional_urls）
- [x] `supabase/schema/notifications.sql` 作成（通知管理）
- [x] `supabase/schema/application_reviews.sql` 作成
- [x] `supabase/schema/audition_genres.sql` 作成（ジャンルマスタ）
- [x] `supabase/schema/audition_genre_map.sql` 作成（中間テーブル）
- [x] RLS ポリシー設定
- [x] マイグレーション生成・適用完了
- [x] `supabase/migrations/20251016000000_seed_audition_genres.sql` 作成・適用（初期ジャンル10件投入）

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

**Workers API**（apps/workers）
- [x] `features/organizer/auditions/` ディレクトリ作成
- [x] `GET /api/v1/organizer/auditions` - 自分のオーディション一覧（project_type フィルタ対応）
- [x] `POST /api/v1/organizer/auditions` - オーディション作成（project_type 必須、genreIds対応）
- [x] `GET /api/v1/organizer/auditions/:id` - オーディション詳細（ジャンル情報含む）
- [x] `PATCH /api/v1/organizer/auditions/:id` - オーディション更新（ジャンル更新対応）
- [x] `DELETE /api/v1/organizer/auditions/:id` - オーディション削除
- [x] `GET /api/v1/organizer/genres` - ジャンルマスタ一覧取得（「所属」「出演」「SNS完結」の3件対応）
- [ ] `GET /api/v1/organizer/auditions/:id/applications` - 応募一覧
- [ ] `GET /api/v1/organizer/applications/:id` - 応募詳細
- [ ] `POST /api/v1/organizer/applications/:id/review` - 審査・合否決定（通知送信含む）
- [ ] `features/talent/auditions/` ディレクトリ作成
- [ ] `GET /api/v1/talent/auditions` - 公開オーディション一覧（project_type フィルタ対応）
- [ ] `GET /api/v1/talent/auditions/:id` - オーディション詳細
- [ ] `POST /api/v1/talent/auditions/:id/apply` - 応募（talent_profiles から自動取得、通知送信）
- [ ] `GET /api/v1/talent/applications` - 自分の応募一覧
- [ ] `GET /api/v1/talent/applications/:id` - 応募詳細
- [ ] `PATCH /api/v1/talent/applications/:id/withdraw` - 応募辞退
- [ ] `GET /api/v1/talent/genres` - ジャンルマスタ一覧取得
- [ ] `features/notifications/` ディレクトリ作成
- [ ] `GET /api/v1/notifications` - 自分の通知一覧
- [ ] `PATCH /api/v1/notifications/:id/read` - 通知を既読に
- [ ] `services/lineNotification.ts` - LINE Messaging API 統合
- [ ] `services/emailNotification.ts` - Supabase Auth メール通知
- [ ] `app.ts` にルーティング追加

**メインビジュアル機能**（画像・動画対応）
- [ ] `supabase/migrations/{timestamp}_add_main_visual_to_auditions.sql` - マイグレーション作成
- [ ] `packages/shared/src/types/media.ts` - メディア型定義
- [ ] `packages/shared/src/validators/media.ts` - メディアバリデーション（画像5MB/動画50MB）
- [ ] `packages/shared/src/types/audition.ts` - Audition型に main_visual_url/type 追加
- [ ] `apps/workers/src/features/organizer/auditions/mainVisual.service.ts` - R2操作サービス
- [ ] `apps/workers/src/features/organizer/auditions/mainVisual.routes.ts` - メインビジュアルAPI
  - [ ] POST /api/v1/organizer/auditions/:id/main-visual/upload
  - [ ] DELETE /api/v1/organizer/auditions/:id/main-visual
  - [ ] GET /api/v1/organizer/auditions/:id/main-visual/view
- [ ] `apps/workers/src/app.ts` - ルーティング追加
- [ ] `packages/shared/src/components/MediaUploader.tsx` - 汎用メディアアップローダー（スクエア表示）
- [ ] `organizer/auditions/new/page.tsx` - メインビジュアルUI統合
- [ ] `organizer/auditions/[id]/edit/page.tsx` - メインビジュアルUI統合
- [ ] `organizer/auditions/[id]/page.tsx` - メインビジュアル表示追加
- [ ] 動作確認・テスト（画像/動画アップロード、削除、プレビュー）
- 📋 詳細: [AUDITION_MAIN_VISUAL_IMPLEMENTATION.md](./AUDITION_MAIN_VISUAL_IMPLEMENTATION.md)

**Web UI - 主催者側**（apps/web）
- [ ] `hooks/useAuditions.ts` - オーディション CRUD フック
- [ ] `hooks/useApplications.ts` - 応募管理フック
- [x] `organizer/auditions/page.tsx` - オーディション一覧ページ
- [x] `organizer/auditions/new/page.tsx` - オーディション作成ページ（ジャンル選択UI実装済み）
- [x] `organizer/auditions/[id]/page.tsx` - オーディション詳細ページ
- [x] `organizer/auditions/[id]/edit/page.tsx` - オーディション編集ページ（ジャンル編集対応）
- [ ] `organizer/auditions/[id]/applications/page.tsx` - 応募者一覧ページ
- [ ] `organizer/auditions/[id]/applications/[applicationId]/page.tsx` - 応募詳細ページ
- [ ] `organizer/auditions/_components/AuditionForm.tsx` - オーディションフォーム
  - [ ] プロジェクトタイプ選択（ラジオボタン: オーディション/求人）
  - [ ] SNS向け短文入力欄・画像アップロード欄・ジャンル選択UI（マスタ取得＆複数選択）を追加
- [ ] `organizer/auditions/_components/AuditionCard.tsx` - オーディションカード
  - [ ] 応募者一覧（略）
- [ ] `organizer/auditions/_components/ApplicationList.tsx` - 応募者一覧
- [ ] `organizer/auditions/_components/ApplicationDetail.tsx` - 応募詳細
- [ ] `organizer/auditions/_components/ReviewForm.tsx` - 審査フォーム
- [ ] ヘッダーナビゲーションに「オーディション」リンク追加

**Web UI - 応募者側（Talent）**
- [ ] `hooks/useNotifications.ts` - 通知管理フック
- [ ] `talent/auditions/page.tsx` - オーディション一覧ページ（公開）
  - [ ] プロジェクトタイプフィルタ（全て/オーディション/求人）
  - [ ] カードにタイプバッジ表示
- [ ] `talent/auditions/[id]/page.tsx` - オーディション詳細ページ
- [ ] `talent/auditions/[id]/apply/page.tsx` - 応募フォームページ
  - [ ] talent_profiles から情報自動取得
  - [ ] 追加メッセージ・追加URL入力（任意）
  - [ ] 「応募する」ボタン一つで完結
- [ ] `talent/applications/page.tsx` - マイ応募一覧ページ
- [ ] `talent/applications/[id]/page.tsx` - 応募詳細ページ
- [ ] `talent/notifications/page.tsx` - 通知一覧ページ
- [ ] `talent/_components/AuditionBrowser.tsx` - オーディション検索・フィルタ
- [ ] `talent/_components/ApplicationForm.tsx` - 応募フォーム（プロフィール自動取得）
- [ ] `talent/_components/ApplicationStatus.tsx` - 応募状況表示
- [ ] `talent/_components/NotificationBell.tsx` - 通知ベルアイコン（ヘッダー）

**テスト・動作確認**
- [ ] 主催者: オーディション作成・編集・削除（job/audition 両方）
- [ ] 主催者: ステータス変更（draft → published → closed）
- [ ] 主催者: プロジェクトタイプ別フィルタ動作確認
- [ ] 応募者: プロフィール作成（talent_profiles）
- [ ] 応募者: オーディション一覧・詳細閲覧（タイプ別フィルタ）
- [ ] 応募者: ワンクリック応募（プロフィール自動取得）
- [ ] 応募者: 応募受付完了通知受信（LINE）
- [ ] 主催者: 新規応募通知受信（メール）
- [ ] 主催者: 応募者一覧・フィルタリング
- [ ] 主催者: 応募詳細閲覧（プロフィールスナップショット）
- [ ] 主催者: 審査コメント・合否決定
- [ ] 応募者: 合否決定通知受信（LINE）
- [ ] 応募者: 通知一覧・既読管理
- [ ] RLS 権限テスト（他人のデータにアクセスできないこと）

---

### Phase 3B: 多段階選考＋自動審査（高度な機能）

**目標**: 一次→二次→三次の段階的選考とスコアリングによる自動候補化

#### 追加データ設計

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

**最終更新**: 2025-10-15
**次のアクション**: Phase 3A データベース設計の着手
