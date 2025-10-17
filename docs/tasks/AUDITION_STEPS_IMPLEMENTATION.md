# オーディションステップ機能 実装計画

**作成日**: 2025-10-17  
**ステータス**: 実装中

---

## 📋 要件定義

### 確定仕様
- ✅ **書類選考**: 必須の第1ステップ（オーディション公開時に自動作成）
- ✅ **カスタムステップ**: 主催者が任意で追加可能（複数OK）
- ✅ **採点方式**: 0～100点のスコア入力、合否判定は主催者が手動で実施
- ✅ **公開後制限**: オーディション公開後はステップ情報の変更不可
- ✅ **将来対応**: 投票ステップ（今回は型定義のみ考慮）

### 設計方針 [SF][CA][DRY]
- シンプルな構成（情報表示＋採点のみ）
- 既存パターンの踏襲（ジャンル・エリアの紐付けパターンを参考）
- ファイルを散らかさない（最小限の追加）
- メンテナンス性重視

---

## 🏗️ データベース設計

### 新規テーブル: `audition_steps`

```sql
-- オーディションステップ定義
CREATE TABLE public.audition_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  step_order INT NOT NULL,  -- 1=書類選考（必須）、2以降=追加ステップ
  step_type TEXT NOT NULL CHECK (step_type IN ('document_screening', 'custom', 'voting')),
  title TEXT NOT NULL,  -- 例: "書類選考", "二次面接", "最終選考"
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_audition_step_order UNIQUE(audition_id, step_order)
);

CREATE INDEX idx_audition_steps_audition_id ON public.audition_steps(audition_id);

COMMENT ON TABLE public.audition_steps IS 'オーディションの選考ステップ定義';
COMMENT ON COLUMN public.audition_steps.step_order IS 'ステップの順序（1=書類選考は必須）';
COMMENT ON COLUMN public.audition_steps.step_type IS 'ステップ種別（document_screening/custom/voting）';
```

### 新規テーブル: `audition_applications`

```sql
-- 応募エントリー
CREATE TABLE public.audition_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES public.audition_steps(id),
  overall_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (overall_status IN ('pending', 'in_progress', 'passed', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_audition_talent UNIQUE(audition_id, talent_id)
);

CREATE INDEX idx_audition_applications_audition_id ON public.audition_applications(audition_id);
CREATE INDEX idx_audition_applications_talent_id ON public.audition_applications(talent_id);
CREATE INDEX idx_audition_applications_current_step ON public.audition_applications(current_step_id);

COMMENT ON TABLE public.audition_applications IS 'オーディション応募エントリー';
COMMENT ON COLUMN public.audition_applications.current_step_id IS '現在の選考ステップ';
COMMENT ON COLUMN public.audition_applications.overall_status IS '全体ステータス（pending/in_progress/passed/rejected/withdrawn）';
```

### 新規テーブル: `audition_step_evaluations`

```sql
-- ステップごとの評価
CREATE TABLE public.audition_step_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.audition_applications(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.audition_steps(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES public.users(id),  -- 評価者（主催者/審査員）
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),  -- 0.00～100.00
  comments TEXT,  -- 評価コメント
  result TEXT CHECK (result IN ('pending', 'passed', 'rejected')),  -- 手動で設定する合否
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_application_step UNIQUE(application_id, step_id)
);

CREATE INDEX idx_evaluations_application_id ON public.audition_step_evaluations(application_id);
CREATE INDEX idx_evaluations_step_id ON public.audition_step_evaluations(step_id);

COMMENT ON TABLE public.audition_step_evaluations IS 'ステップごとの評価データ';
COMMENT ON COLUMN public.audition_step_evaluations.score IS '0～100点の採点';
COMMENT ON COLUMN public.audition_step_evaluations.result IS '合否判定（主催者が手動設定）';
```

### RLS設計

```sql
-- audition_steps
ALTER TABLE public.audition_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage their audition steps"
  ON public.audition_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_steps.audition_id
        AND auditions.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Public can view published audition steps"
  ON public.audition_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_steps.audition_id
        AND auditions.status = 'published'
    )
  );

-- audition_applications
ALTER TABLE public.audition_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view applications for their auditions"
  ON public.audition_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_applications.audition_id
        AND auditions.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Talents can view their own applications"
  ON public.audition_applications
  FOR SELECT
  USING (talent_id = auth.uid());

CREATE POLICY "Talents can create applications"
  ON public.audition_applications
  FOR INSERT
  WITH CHECK (talent_id = auth.uid());

-- audition_step_evaluations
ALTER TABLE public.audition_step_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage evaluations"
  ON public.audition_step_evaluations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.audition_applications
      JOIN public.auditions ON auditions.id = audition_applications.audition_id
      WHERE audition_applications.id = audition_step_evaluations.application_id
        AND auditions.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Talents can view their own evaluations"
  ON public.audition_step_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audition_applications
      WHERE audition_applications.id = audition_step_evaluations.application_id
        AND audition_applications.talent_id = auth.uid()
    )
  );
```

---

## 🔌 API設計

### Organizer向けエンドポイント

#### ステップ管理
```typescript
POST   /api/v1/organizer/auditions/:id/steps
GET    /api/v1/organizer/auditions/:id/steps
PATCH  /api/v1/organizer/auditions/:id/steps/:stepId
DELETE /api/v1/organizer/auditions/:id/steps/:stepId
```

#### 応募者管理
```typescript
GET /api/v1/organizer/auditions/:id/applications
GET /api/v1/organizer/auditions/:id/steps/:stepId/applications
GET /api/v1/organizer/applications/:appId
```

#### 評価管理
```typescript
POST  /api/v1/organizer/applications/:appId/steps/:stepId/evaluate
PATCH /api/v1/organizer/applications/:appId/steps/:stepId/evaluate
GET   /api/v1/organizer/applications/:appId/evaluations
```

### Talent向けエンドポイント

```typescript
POST /api/v1/talent/auditions/:id/apply         // 応募
GET  /api/v1/talent/applications/:id             // 応募詳細
GET  /api/v1/talent/applications/:id/evaluations // 評価一覧
```

---

## 🎨 UI設計

### Organizer側: ステップ設定画面

**パス**: `/organizer/auditions/[id]/steps`

```
┌─────────────────────────────────────────┐
│ オーディション: [タイトル]              │
│ タブ: [基本情報] [ステップ設定] [応募者]│
└─────────────────────────────────────────┘

📋 選考ステップ

┌────────────────────────────────────────┐
│ 1. 📄 書類選考 [必須・自動作成]        │
│    └ 応募フォーム送信後に自動適用       │
├────────────────────────────────────────┤
│ 2. 🎤 一次面接                [編集][削除]│
│    └ オンライン面接による審査           │
├────────────────────────────────────────┤
│ 3. 🏆 最終選考                [編集][削除]│
│    └ 対面面接・最終判断                │
└────────────────────────────────────────┘

[+ ステップを追加]  ※公開後は追加不可

⚠️ オーディション公開後はステップの追加・編集・削除ができません
```

### Organizer側: 応募者一覧（ステップ別表示）

**パス**: `/organizer/auditions/[id]/applications`

```
┌─────────────────────────────────────────┐
│ ステップ: [▼ すべて ▼]                 │
│ ステータス: [▼ すべて ▼]               │
└─────────────────────────────────────────┘

応募者一覧 (15件)

┌───────────────────────────────────────┐
│ 山田太郎                              │
│ 現在: 2. 一次面接 | 審査中            │
│ スコア: 85.0点 | 合否: 未判定   [詳細]│
├───────────────────────────────────────┤
│ 佐藤花子                              │
│ 現在: 1. 書類選考 | 通過              │
│ スコア: 92.5点 | 合否: 合格     [詳細]│
└───────────────────────────────────────┘
```

### Organizer側: 評価画面

**パス**: `/organizer/applications/[appId]/evaluate`

```
┌─────────────────────────────────────┐
│ 応募者: 山田太郎                    │
│ ステップ: 2. 一次面接                │
└─────────────────────────────────────┘

スコア (0～100点)
[_______] 点

コメント (任意)
[____________________________]
[____________________________]

合否判定
○ 未判定  ○ 合格  ○ 不合格

        [キャンセル] [保存]
```

### Talent側: 応募進捗表示（LIFF）

**パス**: `/liff/applications/[id]`

```
┌────────────────────────────┐
│ 【オーディション名】        │
│ あなたの応募状況            │
└────────────────────────────┘

┌────────────────────────────┐
│ ✅ 1. 書類選考              │
│    スコア: 92.5点           │
│    結果: 合格               │
│    └ (2024/10/15)          │
├────────────────────────────┤
│ 🔄 2. 一次面接              │
│    スコア: 85.0点           │
│    結果: 審査中...          │
│    └ (2024/10/16)          │
├────────────────────────────┤
│ ⏳ 3. 最終選考              │
│    └ 前ステップ通過後に進行 │
└────────────────────────────┘
```

---

## 📁 ファイル構成

### 新規作成ファイル

```
supabase/migrations/
└── {timestamp}_create_audition_steps.sql          # ステップ機能マイグレーション

packages/shared/src/
├── types/
│   ├── auditionStep.ts                            # ステップ型定義
│   ├── auditionApplication.ts                     # 応募型定義
│   └── auditionEvaluation.ts                      # 評価型定義
└── validators/
    ├── auditionStep.ts                            # ステップバリデーション
    ├── auditionApplication.ts                     # 応募バリデーション
    └── auditionEvaluation.ts                      # 評価バリデーション

apps/workers/src/features/
├── organizer/auditions/
│   ├── steps.service.ts                           # ステップCRUD
│   └── steps.routes.ts                            # ステップAPI
└── organizer/applications/
    ├── applications.service.ts                    # 応募管理
    ├── applications.routes.ts                     # 応募API
    ├── evaluations.service.ts                     # 評価管理
    └── evaluations.routes.ts                      # 評価API

apps/workers/src/features/talent/
└── applications/
    ├── applications.service.ts                    # Talent応募機能
    └── applications.routes.ts                     # Talent応募API

apps/web/src/app/organizer/auditions/[id]/
├── steps/
│   └── page.tsx                                   # ステップ設定UI
└── applications/
    ├── page.tsx                                   # 応募者一覧
    └── [appId]/
        └── page.tsx                               # 応募者詳細・評価UI

apps/web/src/app/liff/
├── auditions/[id]/
│   └── apply/
│       └── page.tsx                               # 応募フォーム
└── applications/[id]/
    └── page.tsx                                   # 応募進捗表示
```

### 変更ファイル

```
packages/shared/src/types/audition.ts              # Audition型にsteps追加
packages/shared/src/types/index.ts                 # 新規型のexport追加
apps/workers/src/app.ts                            # ルーティング追加
apps/workers/src/features/organizer/auditions/service.ts  # 公開時の自動ステップ作成
```

---

## 🚀 実装ステップ

### Phase 1: データ基盤 [SF][REH]
- [ ] マイグレーションファイル作成
- [ ] RLS設定
- [ ] 型定義（`packages/shared/src/types/`）
- [ ] バリデーション（`packages/shared/src/validators/`）

### Phase 2: Workers API - ステップ管理 [CA][DRY]
- [ ] `steps.service.ts` 実装（CRUD）
- [ ] `steps.routes.ts` 実装
- [ ] オーディション公開時の書類選考自動作成
- [ ] 公開後の変更制限ロジック

### Phase 3: Workers API - 応募管理 [REH]
- [ ] `applications.service.ts` 実装（Organizer）
- [ ] `applications.routes.ts` 実装（Organizer）
- [ ] `applications.service.ts` 実装（Talent）
- [ ] `applications.routes.ts` 実装（Talent）

### Phase 4: Workers API - 評価管理 [SF]
- [ ] `evaluations.service.ts` 実装
- [ ] `evaluations.routes.ts` 実装
- [ ] スコアバリデーション（0～100）

### Phase 5: Organizer UI [CA]
- [ ] ステップ設定画面（`/steps/page.tsx`）
- [ ] 応募者一覧（`/applications/page.tsx`）
- [ ] 応募者詳細・評価UI（`/applications/[appId]/page.tsx`）

### Phase 6: Talent UI [UX]
- [ ] 応募フォーム（`/liff/auditions/[id]/apply/page.tsx`）
- [ ] 応募進捗表示（`/liff/applications/[id]/page.tsx`）

### Phase 7: テスト・最適化 [TDT]
- [ ] 書類選考の自動作成テスト
- [ ] ステップCRUDのテスト
- [ ] 公開後の制限テスト
- [ ] 採点・合否判定のテスト
- [ ] RLSポリシーのテスト

---

## ✅ テスト項目

### 機能テスト
- [ ] オーディション公開時に書類選考が自動作成される
- [ ] カスタムステップの追加・編集・削除（下書き時のみ）
- [ ] 公開後はステップの変更が不可
- [ ] 応募時に書類選考ステップに自動的に進む
- [ ] スコア入力（0～100点）
- [ ] 合否判定（手動で設定）
- [ ] 応募者一覧のフィルタリング（ステップ別・ステータス別）

### UI/UXテスト
- [ ] ステップ設定UIの操作性
- [ ] 評価画面のバリデーション
- [ ] Talent側の進捗表示
- [ ] エラーメッセージ表示
- [ ] レスポンシブ対応

### セキュリティテスト
- [ ] RLSポリシーの動作確認
- [ ] 他人の応募データへのアクセス拒否
- [ ] 公開後の不正な変更の拒否

---

## 📝 実装時の注意点 [SF][CA][REH]

### シンプルさの維持
- ✅ 既存のCRUDパターンを踏襲
- ✅ 複雑な自動判定は避ける（合否は手動）
- ✅ 最小限のファイル追加

### エラーハンドリング
- ✅ ユーザーフレンドリーなメッセージ
- ✅ 適切なHTTPステータスコード
- ✅ バリデーションエラーの詳細表示

### パフォーマンス
- ✅ インデックス最適化
- ✅ N+1問題の回避
- ✅ 適切なページネーション

### データ整合性
- ✅ トランザクション管理
- ✅ 外部キー制約
- ✅ カスケード削除の設定

---

## 🔄 将来拡張ポイント

### 投票ステップ対応（Phase 2以降）
- `step_type = 'voting'` の実装
- `audition_votes` テーブル新設
- 投票集計ロジック
- 投票期間・公開設定

### その他考慮事項
- ステップごとの締切日設定
- 複数審査員による評価の平均化
- 通知機能（ステップ進行時・結果確定時）
- ステップのスキップ機能
- 自動進行ルール（スコア閾値による自動合格など）

---

**次のアクション**: Phase 1（データ基盤）の実装開始
