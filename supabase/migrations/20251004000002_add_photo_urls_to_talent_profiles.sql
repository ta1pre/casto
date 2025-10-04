-- Add photo_urls column to talent_profiles table
-- Stores array of photo URLs (max 6 photos)
-- Index 0: Face photo, Index 1: Full body photo, Index 2-5: Other photos

ALTER TABLE talent_profiles
  ADD COLUMN photo_urls TEXT[] DEFAULT '{}' NOT NULL;

COMMENT ON COLUMN talent_profiles.photo_urls IS '写真URL配列（最大6枚、0:顔写真、1:全身写真、2-5:その他）';
