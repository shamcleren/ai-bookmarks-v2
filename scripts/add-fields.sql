-- P0 数据库字段扩展
-- 运行方式：Supabase Dashboard > SQL Editor > 粘贴执行

ALTER TABLE tools ADD COLUMN IF NOT EXISTS deploy_type TEXT DEFAULT 'unknown';  -- local/cloud/api/browser
ALTER TABLE tools ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'unknown';       -- macos/linux/windows
ALTER TABLE tools ADD COLUMN IF NOT EXISTS license TEXT DEFAULT 'unknown';       -- MIT/Apache/proprietary
ALTER TABLE tools ADD COLUMN IF NOT EXISTS price_model TEXT DEFAULT 'free';     -- free/freemium/paid
ALTER TABLE tools ADD COLUMN IF NOT EXISTS last_commit_at TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS commit_frequency TEXT DEFAULT 'unknown'; -- high/medium/low
ALTER TABLE tools ADD COLUMN IF NOT EXISTS screenshot_urls TEXT[];
ALTER TABLE tools ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS suitable_for TEXT[] DEFAULT '{}'; -- indie-dev/team/enterprise
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS test_environment TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS overall_score INT DEFAULT 0; -- 综合评分 0-100

SELECT '✅ P0 字段扩展完成' AS status;
