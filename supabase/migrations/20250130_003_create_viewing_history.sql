-- viewing_history テーブル作成
-- ユーザーのオーディション閲覧履歴を記録

CREATE TABLE IF NOT EXISTS viewing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audition_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL DEFAULT 'view', -- 'view', 'apply', 'vote'
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 重複防止のための複合ユニーク制約（同じユーザーが同じオーディションを複数回閲覧した場合は最新のみ保持）
  UNIQUE(user_id, audition_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_viewing_history_user_id ON viewing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_viewing_history_audition_id ON viewing_history(audition_id);
CREATE INDEX IF NOT EXISTS idx_viewing_history_viewed_at ON viewing_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_viewing_history_user_viewed ON viewing_history(user_id, viewed_at DESC);

-- RLS (Row Level Security) 有効化
ALTER TABLE viewing_history ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分の履歴のみ閲覧・作成可能
CREATE POLICY viewing_history_select_own
  ON viewing_history
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY viewing_history_insert_own
  ON viewing_history
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPSERT用のポリシー（既存レコードがある場合は更新）
CREATE POLICY viewing_history_update_own
  ON viewing_history
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- コメント
COMMENT ON TABLE viewing_history IS 'ユーザーのオーディション閲覧履歴';
COMMENT ON COLUMN viewing_history.action IS '行動種別: view（閲覧）, apply（応募）, vote（投票）';
COMMENT ON COLUMN viewing_history.viewed_at IS '最終閲覧日時（UPSERTで更新される）';
