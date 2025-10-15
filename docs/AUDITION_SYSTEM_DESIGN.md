# オーディションシステム詳細設計書

## 📌 設計コンセプト

### 核心的な価値提案
- **主催者**: オーディションの作成から合否決定までをワンストップで管理
- **応募者**: 簡単な応募プロセスと選考状況のリアルタイム確認

### 設計原則 [SF][CA][DRY]
1. **段階的実装**: MVP → 基本機能 → プレミアム機能
2. **データ整合性**: 外部キー制約と RLS による厳格な権限管理
3. **拡張性**: 将来の機能追加に対応できる柔軟な設計
4. **シンプルさ**: 過度な抽象化を避け、実用性を重視

### プロモーション要素
- `short_description`: SNS共有やカード表示で使うリード文。最大100文字。[RP]
- `cover_image_url` / `cover_image_alt`: 一覧カードやSNSでの視認性向上。Altはアクセシビリティ確保。[SFT]

### ジャンル管理
- **構造**: マスターテーブル `audition_genres` と中間テーブル `audition_genre_map` で管理。[CA][DRY]
- **メリット**: 表示名・並び順・多言語対応・統計集計を柔軟に運用可能。[RP][ISA]
- **初期データ例**: `idol`, `dance`, `vocal`, `acting`, `model`, `voice_actor`, `mc_host`, `creator`, `influencer`, `campaign`, `other`（slugで管理）。[SF]
- 表示時はスラッグ→ラベル変換を行い、複数選択（最大3件推奨）。

### ステータス遷移
- **ステータス**: `draft` / `published` / `closed` / `cancelled`
- **ステータス遷移**: `draft` → `published` → `closed` / `cancelled`

---

## データベース設計（Phase 3A: MVP）

### テーブル一覧（Phase 3A）

1. **talent_profiles**: 応募者プロフィール（Phase 2.7 で先行実装）
2. **auditions**: オーディション基本情報（プロモーション向けメタ情報含む、project_type で job/audition を区別）
3. **audition_genres**: ジャンルマスタ
4. **audition_genre_map**: オーディション×ジャンルの中間テーブル
5. **applications**: 応募情報（talent_profiles のスナップショット）
6. **notifications**: 通知管理
7. **application_reviews**: 審査記録

### auditions テーブル

```sql
CREATE TABLE auditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(user_id) ON DELETE CASCADE,
  
  -- 基本情報
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 5000),
  requirements TEXT,
  
  -- プロモーション向け短文・ビジュアル
  short_description TEXT CHECK (char_length(short_description) <= 100),
  cover_image_url TEXT CHECK (cover_image_url ~* '^https?://'),
  cover_image_alt TEXT CHECK (char_length(cover_image_alt) <= 120),
  
  -- 募集期間
  application_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  application_end_date TIMESTAMPTZ NOT NULL,
  
  -- 募集制限
  max_applicants INTEGER CHECK (max_applicants > 0), -- null = 無制限
  
  -- ステータス
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
  
  -- プロジェクトタイプ
  project_type TEXT NOT NULL DEFAULT 'audition' CHECK (project_type IN ('audition', 'job')),
  
  -- 審査方式（Phase 3A では manual のみ）
  evaluation_mode TEXT NOT NULL DEFAULT 'manual' CHECK (evaluation_mode IN ('manual', 'score_threshold', 'top_n', 'hybrid')),
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約: 終了日は開始日より後
  CONSTRAINT valid_date_range CHECK (application_end_date > application_start_date)
);
```

### audition_genres テーブル（ジャンルマスタ）

```sql
CREATE TABLE audition_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audition_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "誰でもジャンルを閲覧可能"
  ON audition_genres FOR SELECT USING (true);
CREATE POLICY "管理者のみジャンルを変更可能"
  ON audition_genres FOR INSERT WITH CHECK (is_admin(auth.uid()))
  , ON audition_genres FOR UPDATE USING (is_admin(auth.uid()))
  , ON audition_genres FOR DELETE USING (is_admin(auth.uid()));
```

### audition_genre_map テーブル（中間テーブル）

```sql
CREATE TABLE audition_genre_map (
  audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES audition_genres(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (audition_id, genre_id)
);

ALTER TABLE audition_genre_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "主催者は自分のオーディションのジャンルを閲覧可能"
  ON audition_genre_map FOR SELECT
  USING (is_audition_owner(audition_id, auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "主催者は自分のオーディションのジャンルを設定可能"
  ON audition_genre_map FOR INSERT
  WITH CHECK (is_audition_owner(audition_id, auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "主催者は自分のオーディションのジャンルを削除可能"
  ON audition_genre_map FOR DELETE
  USING (is_audition_owner(audition_id, auth.uid()) OR is_admin(auth.uid()));
```

> `is_admin` / `is_audition_owner` は SQL Security definer 関数を作成予定。[SFT]

### applications テーブル

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- talent_profiles のスナップショット（応募時点の情報を保持）
  applicant_profile JSONB NOT NULL,
  
  -- オーディション固有の追加情報
  additional_message TEXT CHECK (char_length(additional_message) <= 2000),
  additional_urls TEXT[] DEFAULT '{}',
  
  -- ステータス
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  
  -- タイムスタンプ
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約: 同一ユーザーは同一オーディションに1回のみ応募可
  UNIQUE(audition_id, applicant_id)
);
```

**設計ポイント**:
- `applicant_profile`: talent_profiles のスナップショットを JSONB で保存。応募後にプロフィールが変更されても応募時の情報を保持。[CA][SFT]
- `additional_message`: 志望動機など、オーディション固有のメッセージ（任意）。[RP]
- `additional_urls`: YouTube, SoundCloud 等の外部URL（任意、最大5件）。[SF]

### notifications テーブル

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 通知内容
  type TEXT NOT NULL, -- application_received, application_accepted, application_rejected, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- 関連レコード
  reference_type TEXT CHECK (reference_type IN ('audition', 'application')),
  reference_id UUID,
  
  -- 既読管理
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(user_id, read_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "本人の通知のみ閲覧・更新可能"
  ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**通知タイプ**:
- `application_received`: 応募受付完了（応募者へ）
- `new_application`: 新規応募（主催者へ）
- `application_accepted`: 合格通知（応募者へ）
- `application_rejected`: 不合格通知（応募者へ）
- `audition_deadline_reminder`: 締切リマインダー

---

## データフロー（Phase 3A: MVP）

### 応募プロセス（ワンクリック応募）
```
1. 応募者: オーディション詳細閲覧（公開中のもの）
2. 応募者: 「応募する」ボタンクリック
3. システム: talent_profiles から情報自動取得 → applicant_profile にスナップショット保存
4. 応募者: 追加メッセージ・URL入力（任意）
5. 応募者: 「送信」ボタンクリック
6. システム: applications.status = 'submitted'
7. システム: LINE 通知送信（応募者へ「応募受付完了」）
8. システム: メール通知送信（主催者へ「新規応募」）
9. 主催者: 応募者一覧で確認
10. 主催者: 応募詳細閲覧（プロフィールスナップショット）
11. 主催者: 審査コメント入力
12. 主催者: 合否決定（accept/reject）
13. システム: applications.status = 'accepted'/'rejected' + application_reviews 作成（is_final=true）
14. システム: LINE 通知送信（応募者へ「合否決定」）
15. 応募者: マイ応募ページで結果確認
```

**ワンクリック応募のメリット**: [RP][SF]
- 応募者の手間が最小限（離脱率低下）
- プロフィール情報の再入力不要
- スナップショットで応募時点の情報を保持

---

## UI/UX 設計（Phase 3A）

### 主催者側画面

#### 1. オーディション一覧（`/organizer/auditions`）
- カードグリッドレイアウト（カバービジュアル表示）
- ステータスバッジ（draft/published/closed）
- `short_description` をサマリとして表示
- 応募者数 / 募集人数の表示
- 締切までのカウントダウン
- フィルタ: 全て/公開中/下書き/終了、ジャンルフィルタ（Phase 3A は単一選択）

#### 2. オーディション作成・編集（`/organizer/auditions/new`）
- **プロジェクトタイプ**: ラジオボタン（🎭 オーディション / 💼 求人）
- **基本情報**: タイトル、説明、募集要項
- **プロモーション情報**: `short_description`（100文字以内、文字カウント表示）、カバー画像（URL入力 or アップロード後のURL貼付）、代替テキスト
- **ジャンル設定**: 複数選択チェックボックス（最大3件推奨）
- **募集期間**: 開始日時、終了日時
- **募集制限**: 最大応募者数（任意）
- **保存アクション**: 下書き保存 / 公開

#### 3. 応募者一覧（`/organizer/auditions/[id]/applications`）
- テーブルレイアウト
- フィルタ: 全て/審査中/合格/不合格
- ソート: 応募日時/レビュー日時
- プレビュー情報: ニックネーム、年齢帯、地域、志望動機（冒頭）、オーディションのジャンル表示

#### 4. 応募詳細（`/organizer/auditions/[id]/applications/[applicationId]`）
- プロフィール情報（スナップショット）
- 志望動機（全文）
- ポートフォリオURL
- 審査コメント入力エリア
- 合否決定ボタン（accept/reject）

### 応募者側画面

#### 1. オーディション一覧（`/talent/auditions`）
- カードグリッドレイアウト
- プロジェクトタイプフィルタ（全て / 🎭 オーディション / 💼 求人）
- カードにタイプバッジ表示
- 募集中のみ表示（published + 締切前）
- 主催者情報の表示
- 「応募する」ボタン

#### 2. オーディション詳細（`/talent/auditions/[id]`）
- オーディション情報（タイトル、説明、要項）
- 募集期間・募集人数
- 主催者情報
- 「応募する」ボタン

#### 3. 応募フォーム（`/talent/auditions/[id]/apply`）
- プロフィール情報（自動取得・編集不可）
- 志望動機（必須、10〜2000文字）
- ポートフォリオURL（任意、複数可）
- 確認画面 → 送信

#### 4. マイ応募一覧（`/talent/applications`）
- 応募したオーディション一覧
- 各応募のステータス（審査中/合格/不合格）
- 結果通知の表示

---

## 実装順序（Phase 3A）

### ステップ 1: データベース
1. `supabase/schema/auditions.sql` 作成
2. `supabase/schema/audition_genres.sql` 作成（初期データ投入用 seed も作成）
3. `supabase/schema/audition_genre_map.sql` 作成
4. `supabase/schema/applications.sql` 作成
5. `supabase/schema/application_reviews.sql` 作成
6. `./supabase/sync` 実行
7. マイグレーション内容レビュー
8. `supabase db push --linked` で適用

### ステップ 2: 共通型定義（packages/shared）
1. `types/audition.ts`
2. `types/auditionGenre.ts`
3. `constants/auditionGenres.ts`
4. `types/application.ts`
5. `types/review.ts`
6. `validators/audition.ts`（ジャンルID配列のバリデーションを含む）
7. `validators/application.ts`
8. `validators/review.ts`

### ステップ 3: Workers API
1. `features/organizer/auditions/` 作成
2. ジャンルマスタ取得 API (`/organizer/genres`, `/talent/genres`)
3. オーディション CRUD API 実装（ジャンル紐付けを含む）
4. 応募管理 API 実装
5. `features/talent/auditions/` 作成
6. オーディション閲覧 API 実装
7. 応募送信 API 実装
8. `app.ts` にルーティング追加

### ステップ 4: Web UI（主催者側）
1. `hooks/useAuditions.ts`
2. `hooks/useApplications.ts`
3. オーディション一覧ページ
4. オーディション作成・編集ページ
5. 応募者一覧ページ
6. 応募詳細ページ
7. 各種コンポーネント

### ステップ 5: Web UI（応募者側）
1. オーディション一覧ページ
2. オーディション詳細ページ
3. 応募フォームページ
4. マイ応募一覧ページ
5. 各種コンポーネント

### ステップ 6: テスト
1. RLS 権限テスト
2. オーディション作成→公開フロー（job/audition 両方）
3. プロジェクトタイプフィルタテスト
4. 応募フロー
5. 審査→合否決定フロー

---

## ディレクトリ構成（Phase 3 実装指針）

### packages/
- **`packages/shared/src/`**: 共通型・定数・バリデータ・ユーティリティを用途別に集約。
  - `types/`: `audition.ts`、`application.ts`、`notification.ts`、`talentProfile.ts`。
  - `validators/`: 同名の Zod スキーマを配置。
  - `constants/`: `auditionGenres.ts`、`projectTypes.ts` などマスタ定義。
  - `utils/`: 通知メッセージ生成やスナップショット整形処理。

### apps/workers/
- **`apps/workers/src/features/`**: ドメイン単位で集約。
  - `auditions/`: organizer/talent API、通知送信サービスを含む。
  - `talentProfile/`: Phase 2.7 のプロフィール CRUD。
  - `notifications/`: 通知一覧・既読更新。
- **`apps/workers/src/types/`**: Workers 固有 DTO（共有型を拡張）。
- **`apps/workers/src/middleware/`**: 認証、エラーハンドリング。

### apps/web/
- **`apps/web/src/app/organizer/auditions/`**: オーディション画面一式。
  - ページ: `page.tsx`、`new/page.tsx`、`[id]/page.tsx`、`[id]/edit/page.tsx`、`[id]/applications/page.tsx`。
  - `_components/`: カード・応募一覧・レビュー UI。
  - `_hooks/`: `useAuditions.ts` などドメイン専用フック。
- **`apps/web/src/app/talent/`**:
  - `auditions/`: 一覧・詳細・応募ページ＋ `_components/`（フォーム、ステータス、検索）。
  - `applications/`: マイ応募一覧・詳細。
  - `profile/`: 表示・編集ページ＋ `ProfileForm`。
  - `notifications/`: 一覧ページ＋ `NotificationBell`。
- **`apps/web/src/shared/components/`**: ドメイン汎用 UI を集約。

### supabase/
- **`supabase/schema/`**: テーブル単位の SQL (`talent_profiles.sql` など)。
- **`supabase/migrations/`**: 生成されたマイグレーションを時系列管理。

> 目的: ファイル分散を避け、ドメイン単位での把握・保守性向上を図る。[SF][CA][RP]

---

## 📊 Phase 3B: 多段階選考＋ファイルアップロード（今後の拡張）

### 追加テーブル
- `stages`: ステージ定義（1次/2次/3次）
- `stage_applications`: 応募×ステージの進捗
- `stage_reviews`: ステージごとのレビュー

### 新機能

#### 1. オーディション固有のファイル提出機能
**auditions テーブルに追加**:
```sql
- submission_requirements (jsonb, 任意)
  例: {
    "required_files": [
      {type: "video", title: "自己PR動画", max_size_mb: 50, required: true},
      {type: "document", title: "履歴書", formats: ["pdf", "docx"], required: false}
    ]
  }
```

**applications テーブルに追加**:
```sql
- submitted_files (jsonb, 任意)
  例: [
    {type: "video", title: "課題動画", url: "https://storage.supabase.co/...", uploaded_at: "..."},
    {type: "document", title: "履歴書", url: "https://storage.supabase.co/...", uploaded_at: "..."}
  ]
```

**実装方針**:
- Supabase Storage を使用してファイルをアップロード
- ファイルサイズ制限: 50MB（動画）、10MB（画像・書類）
- 対応形式: video/*, image/*, application/pdf, application/msword
- 提出要件がある場合のみアップロード画面を表示

#### 2. 多段階選考
- ステージごとの提出物管理
- スコアリング（観点別評価）
- 自動候補化（score_threshold / top_n / hybrid）
- 次ステージへの進出処理

---

## 🎁 Phase 3C: プレミアム機能（今後の拡張）

### 追加テーブル
- `pricing_rules`: プロジェクトタイプ×ジャンル別の価格設定
- `application_unlocks`: 閲覧アンロック記録

### 新機能
- **価格設定**: `project_type` (求人/オーディション) × `genre` (アイドル/俳優等) で柔軟な価格設定
  - 例: 求人×俳優 = 50ポイント（安価）、オーディション×アイドル = 200ポイント（高価）
- **プレビュー表示**: 制限表示（低解像度、マスキング）
- **アンロック操作**: ポイント消費で完全閲覧
- **再閲覧無料**: 同一オーディション内では追加課金なし
- **チーム共有**: 同一主催者配下の審査員もアンロック状態を共有

---

## 🧪 テスト戦略

### 単体テスト
- バリデーションスキーマ
- ユーティリティ関数

### 統合テスト
- API エンドポイント
- RLS ポリシー

### E2E テスト（Phase 3B 以降）
- 全フローテスト
- 複数ユーザー同時アクセス

---

## 📝 技術的考慮事項

### パフォーマンス
- ページネーション（20件/ページ）
- インデックス最適化
- SWR キャッシュ戦略

### 拡張性
- 審査員機能への対応余地
- カスタムフィールド対応
- 通知システム統合準備

### 保守性
- 共通型定義の一元管理
- API レスポンス形式の統一
- エラーハンドリングの標準化

---

**最終更新**: 2025-10-15
