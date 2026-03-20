-- =============================================
-- AI Bookmarks V2 - Supabase 数据库初始化 SQL
-- 运行方式：Supabase Dashboard > SQL Editor > 粘贴执行
-- =============================================

-- 1. 创建 tools 表
CREATE TABLE IF NOT EXISTS tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  source TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  can_test BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'rated')),
  ease_score INT DEFAULT 0 CHECK (ease_score >= 0 AND ease_score <= 5),
  useful_score INT DEFAULT 0 CHECK (useful_score >= 0 AND useful_score <= 5),
  hype_score INT DEFAULT 0 CHECK (hype_score >= 0 AND hype_score <= 5),
  stars INT DEFAULT 0,
  verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- 3. 创建评测表
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 开启行级安全策略
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 5. tools 表策略：公开读写
CREATE POLICY "Anyone can view tools" ON tools FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tools" ON tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tools" ON tools FOR UPDATE USING (true);

-- 6. favorites 表策略：用户只能操作自己的收藏
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 7. reviews 表策略：公开查看，用户管理自己的评测
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- 8. 插入示例数据
INSERT INTO tools (name, url, description, source, source_url, tags, can_test, stars) VALUES
  ('obra/superpowers — Agentic Skills Framework', 'https://github.com/obra/superpowers', '一套 Agent 技能框架+软件开发方法论，让 AI Agent 能像专业开发者一样自主完成复杂任务，总计 9.4 万 star。', 'GitHub Trending', 'https://github.com/trending', ARRAY['AI编程', 'Agent', '自动化', '框架'], true, 94416),
  ('unslothai/unsloth — 本地训练大模型Web UI', 'https://github.com/unslothai/unsloth', '在本地网页界面上训练和运行 Qwen、DeepSeek、Gemma 等开源大模型，总计 5.5 万 star。', 'GitHub Trending', 'https://github.com/trending', ARRAY['大模型', '本地部署', '微调', '开源'], true, 55088),
  ('jarrodwatts/claude-hud — Claude Code 实时透视插件', 'https://github.com/jarrodwatts/claude-hud', 'Claude Code 的插件，实时显示 AI 的思考过程：上下文 token 用量、激活的工具、运行的 agents、todo 进度。', 'GitHub Trending', 'https://github.com/trending', ARRAY['Claude', 'AI编程', '工具', '开发者体验'], true, 6157),
  ('Astral to Join OpenAI', 'https://astral.sh/blog/openai', 'Rust 生态明星项目 Astral（uv、ruff 背后团队）宣布加入 OpenAI。', 'Hacker News', 'https://news.ycombinator.com/item?id=47438723', ARRAY['AI行业', 'Rust', 'Python工具', 'OpenAI'], false, 0),
  ('Kitten TTS – 最小模型不到 25MB', 'https://github.com/KittenML/KittenTTS', '全新的开源 Text-to-Speech 模型系列，最小的不到 25MB，可以直接在树莓派、手机甚至浏览器上跑。', 'Hacker News', 'https://news.ycombinator.com/item?id=47441546', ARRAY['TTS语音合成', '开源模型', '本地部署', '端侧AI'], true, 0)
ON CONFLICT DO NOTHING;

-- 完成
SELECT '🎉 数据库初始化完成！' AS status;
