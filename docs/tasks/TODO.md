# オーディション機能 TODO

## 1. 背景と方針
- 主催者が `/organizer/auditions/new` からオーディション／求人を作成できるが、フォーム項目は最低限のみで種別ごとの違いが表現できていない @apps/web/src/app/organizer/auditions/new/page.tsx#120-303
- データベースでは `project_type` が `audition` / `job` の2種類のみ定義されており、新しい分類を扱う準備が必要 @supabase/migrations/20251015000004_create_auditions.sql#30-42
- Todo管理は [SF][CA][DRY] を遵守し、段階的に安全な移行を行う

## 2. 現状整理（2025-11-03 時点）

### 2.1 データモデル
- `auditions` テーブル: 募集期間・定員・説明文・プロジェクト種別などの基本情報を保持。`project_type` は `audition` / `job` / `extra` をサポートし、`extra_details JSONB` で種別固有データを格納する @supabase/migrations/20251103210000_add_extra_recruitment_support.sql#8-134 @packages/shared/src/types/audition.ts#19-124
- `audition_genres` テーブルでジャンル紐付け済み（最大3件 UI で選択） @apps/web/src/app/organizer/auditions/new/page.tsx#253-307
- 地域情報 (`audition_areas`) は別テーブルで管理済みだが、フォームからの入力導線は未整備 @packages/shared/src/types/auditionArea.ts#6-33

### 2.2 画面/UI
- 新規作成フォームは種別ごとに入力セクションを切り替え、エキストラ募集専用項目（実施日時、所要時間、集合場所、想定人数など）を追加済み @apps/web/src/app/organizer/auditions/new/page.tsx#133-416
- `projectType` ラジオボタンは「オーディション」「求人」「エキストラ募集」を表示し、選択に応じて必須項目とバリデーションを制御 @apps/web/src/app/organizer/auditions/new/page.tsx#138-200 @packages/shared/src/validators/audition.ts#96-152
- 主催者向けの入力ガイド（テンプレート表示など）は未着手

### 2.3 種別ごとの要求イメージ

| 種別 | 想定ユースケース | 必須にしたい項目案 | 任意・補足項目案 | 備考 |
| --- | --- | --- | --- | --- |
| オーディション | タレント・声優等の本選考 | タイトル、概要、応募条件、応募期間、応募方法 | 審査フロー、提出物、報酬、備考 | 既存仕様をベースに強化 |
| 求人 | 長期雇用・スタッフ募集 | 勤務地、勤務形態、報酬区分、応募期間 | 勤務時間、休日、福利厚生 | 募集フォームに勤務地系フィールドが不足 |
| エキストラ募集 | 短期・大量動員（例: 撮影エキストラ） | 募集エリア、集合場所、開催日程（複数可）、集合時間、想定人数 | 役柄メモ、衣装支給有無、交通費、備考 | `docs/memo/エキストラ募集` を参照した簡易プロフィール運用 |

### 2.4 無料閲覧数設定（新仕様）
- 種別ごとに「最初のN人まで無料閲覧」枠を設定し、超過分は既存の閲覧課金ルールを適用する [SF][CA]
- マスタテーブル `audition_types` に `free_view_count INTEGER NOT NULL DEFAULT 0` を追加し、0の場合は従来どおり全件課金 
- 初期値案（管理画面から変更可能）
  - オーディション: 5人
  - 求人: 10人
  - エキストラ募集: 50人
- 主催者の応募者閲覧数をWorkersでカウントし、閲覧APIで無料枠判定→課金有無を決定する @apps/workers/src/features/points/

### 2.5 種別別閲覧単価設定（新仕様）
- 閲覧単価の優先順位を「オーディション個別 > 種別 > ジャンル > デフォルト」に統一し、種別設定が第二優先となるよう拡張する [SF][CA]
- `audition_types` に `viewing_point_cost INTEGER` を追加し、`NULL` の場合はジャンル/デフォルトへフォールバックする
- 管理画面 `/admin/points` の「種別設定の編集」モーダルから閲覧単価（pt/人）を入力可能にする（0以上の整数、空欄でNULL） @apps/web/src/app/admin/points/page.tsx
- Workersの閲覧判定ロジックで `audition.free_viewing_quota -> audition.type_viewing_point_cost -> genre.viewing_point_cost -> default` の順に適用する @apps/workers/src/features/points/service.ts
- ドキュメント `/admin/points/settings` 画面の説明文を更新し、種別優先を明記する @apps/web/src/app/admin/points/settings/page.tsx


## 3. TODO一覧（フェーズ別）

### Phase 0: 現状理解と設計確定
- [x] 種別拡張の影響範囲調査（API、Supabase型、Zodスキーマ、UI）
- [x] `docs/memo/エキストラ募集` を整理して共通仕様に落とし込む（用語統一・入力ルール定義） @docs/tasks/EXTRA_RECRUITMENT_DECISION_SHEET.md#1-272 @docs/memo/エキストラ募集#1-46

### Phase 1: データモデル対応（[SF][REH])
- [x] `auditions.project_type` に `extra`（エキストラ募集）を追加し、Enum制約・型定義・APIレスポンスを更新
- [x] エキストラ募集で必要となるカラム設計（例: `event_dates`, `meeting_place`, `expected_headcount`）。JSONBで柔軟な拡張を許容するか検討
- [x] 既存データ移行計画を策定（`project_type='job'` 等への影響確認） @supabase/migrations/20251103210000_add_extra_recruitment_support.sql#8-134
- [ ] `audition_types` に閲覧単価カラムを追加し、初期値と移行方針を策定

### Phase 2: フロントエンド実装（フォーム拡張）
- [x] 種別ラジオに「エキストラ募集」を追加し、選択時に追加セクションを表示
- [x] 種別ごとの入力セクション（求人: 勤務地/雇用条件、エキストラ: 集合情報/日程）を動的に切り替え
- [x] Zodバリデーションを種別別に適用（必須項目の差異を整理）
- [x] UIガイド（入力例・テンプレート）を表示して主催者の迷いを減らす @apps/web/src/app/organizer/auditions/new/page.tsx#133-416
- [ ] 「種別設定の編集」モーダルで閲覧単価を編集できるようにする

### Phase 3: 応募者UX・審査フロー調整
- [ ] 応募フォームの表示内容を種別に応じて最適化（例: エキストラは簡易プロフィール入力のみ）
- [ ] ステップ管理やポイント課金との整合性チェック（大量応募を想定した処理改善）
- [ ] 通知テンプレート（応募受付/採用連絡）を種別別にカスタマイズ @docs/tasks/pendding/POINTS_FEATURE_SPECIFICATION.md#34-76

### Phase 4: 運用ドキュメント・モニタリング
- [ ] 主催者向けガイド（種別選択の基準、推奨入力項目）を docs/setup/ へ追加
- [ ] 成約率/応募率などの指標を種別別にトラッキングできるよう分析要件を整理
- [ ] 初期リリース後のフィードバック収集フロー（問い合わせフォーム/ヒアリング会）を設計

## 4. 検討メモ（フォーム設計アイデア）
- 共通部分（タイトル・説明・応募期間）は維持しつつ、種別ごとに「おすすめ項目テンプレート」を提示し、不要なら削除できる柔軟さを確保する [SF][RP]
- 入力負担を減らすため「主催者テンプレート保存機能」を中長期検討。業界別フォーマットに対応 [DRY]
- エキストラ募集は開催日が複数になるケースが多いため、日程を複数登録できるUI（カレンダー or テーブル）を検討
- 求人種別では勤務地の地図連携、報酬の入力フォーマット（時給/日給/月給）切り替えなどのUI拡張案
- 主催者に委ねる項目は「任意」表示 + 推奨タグ例（例: #交通費支給、#衣装支給）を用意すると入力の均質化に寄与

---

更新日: 2025-11-04
