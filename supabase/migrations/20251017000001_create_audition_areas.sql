/**
 * オーディションエリア機能
 * [SF][CA] 全国・都道府県の管理
 */

-- エリアマスタテーブル
CREATE TABLE IF NOT EXISTS audition_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 中間テーブル（オーディション ⇔ エリア）
CREATE TABLE IF NOT EXISTS audition_area_map (
  audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES audition_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (audition_id, area_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audition_area_map_audition ON audition_area_map(audition_id);
CREATE INDEX IF NOT EXISTS idx_audition_area_map_area ON audition_area_map(area_id);

-- RLS有効化
ALTER TABLE audition_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audition_area_map ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: エリアマスタは誰でも読取可能
DROP POLICY IF EXISTS "Anyone can read areas" ON audition_areas;
CREATE POLICY "Anyone can read areas"
  ON audition_areas
  FOR SELECT
  USING (true);

-- RLSポリシー: 中間テーブルは誰でも読取可能（オーディション情報と一緒に使う）
DROP POLICY IF EXISTS "Anyone can read area map" ON audition_area_map;
CREATE POLICY "Anyone can read area map"
  ON audition_area_map
  FOR SELECT
  USING (true);

-- RLSポリシー: 主催者のみ自分のオーディションのエリアを編集可能
DROP POLICY IF EXISTS "Organizers can manage their audition areas" ON audition_area_map;
CREATE POLICY "Organizers can manage their audition areas"
  ON audition_area_map
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.id = audition_area_map.audition_id
        AND auditions.organizer_id = auth.uid()
    )
  );
