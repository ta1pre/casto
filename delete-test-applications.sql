-- テスト用：特定ユーザーの応募を全削除
DELETE FROM public.audition_applications
WHERE talent_id = 'f851e129-85c6-45e3-a4d2-e8e9d446aac2';

-- 確認
SELECT COUNT(*) as remaining_applications
FROM public.audition_applications
WHERE talent_id = 'f851e129-85c6-45e3-a4d2-e8e9d446aac2';
