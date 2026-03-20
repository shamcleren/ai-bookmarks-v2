-- 修复分数约束，使其更宽松（允许 0-100 分）
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_ease_score_check;
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_useful_score_check;
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_hype_score_check;

ALTER TABLE tools ADD CONSTRAINT tools_ease_score_check CHECK (ease_score >= 0 AND ease_score <= 100);
ALTER TABLE tools ADD CONSTRAINT tools_useful_score_check CHECK (useful_score >= 0 AND useful_score <= 100);
ALTER TABLE tools ADD CONSTRAINT tools_hype_score_check CHECK (hype_score >= 0 AND hype_score <= 100);

SELECT '✅ 约束已修复' AS status;
