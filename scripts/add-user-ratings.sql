-- P1: 用户评分功能
-- 用户可以对工具打1-5星

CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- RLS
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能管理自己的评分，任何人可以查看
CREATE POLICY "Anyone can view ratings" ON user_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own ratings" ON user_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON user_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON user_ratings FOR DELETE USING (auth.uid() = user_id);

-- 触发器：评分变更时更新 tools 表的 avg_rating
CREATE OR REPLACE FUNCTION update_tool_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tools
  SET overall_score = (
    SELECT COALESCE(AVG(rating) * 20, 0) FROM user_ratings WHERE tool_id = NEW.tool_id
  )
  WHERE id = NEW.tool_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON user_ratings
FOR EACH ROW EXECUTE FUNCTION update_tool_avg_rating();

SELECT '✅ P1 用户评分功能已添加' AS status;
