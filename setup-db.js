const { Client } = require('pg');

const client = new Client({
  host: 'db.rcamsqvyibqzbphxutvc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'RynItpvnwEIgYcn6',
  ssl: { rejectUnauthorized: false, secure: true }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL');

  // Check existing tables
  const res = await client.query('\dt');
  console.log('Existing tables:', res.rows.map(r => r.tablename));

  // Create tools table
  await client.query(`
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
  `);
  console.log('✅ Created tools table');

  // Create favorites table
  await client.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, tool_id)
    );
  `);
  console.log('✅ Created favorites table');

  // Create reviews table
  await client.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('✅ Created reviews table');

  // Enable Row Level Security
  await client.query('ALTER TABLE tools ENABLE ROW LEVEL SECURITY;');
  await client.query('ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;');
  await client.query('ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;');
  console.log('✅ Enabled RLS');

  // Create policies - tools: public read, authenticated write
  await client.query(`
    CREATE POLICY "Anyone can view tools" ON tools FOR SELECT USING (true);
    CREATE POLICY "Anyone can insert tools" ON tools FOR INSERT WITH CHECK (true);
    CREATE POLICY "Anyone can update tools" ON tools FOR UPDATE USING (true);
  `);

  // Favorites: users manage their own
  await client.query(`
    CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
  `);

  // Reviews: public read, users manage their own
  await client.query(`
    CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
    CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);
  `);
  console.log('✅ Created RLS policies');

  // Insert some sample data
  const sampleTools = [
    {
      name: 'obra/superpowers — Agentic Skills Framework',
      url: 'https://github.com/obra/superpowers',
      description: '一套 Agent 技能框架+软件开发方法论，让 AI Agent 能像专业开发者一样自主完成复杂任务，总计 9.4 万 star。',
      source: 'GitHub Trending',
      source_url: 'https://github.com/trending',
      tags: ['AI编程', 'Agent', '自动化', '框架'],
      can_test: true,
      stars: 94416
    },
    {
      name: 'unslothai/unsloth — 本地训练大模型Web UI',
      url: 'https://github.com/unslothai/unsloth',
      description: '在本地网页界面上训练和运行 Qwen、DeepSeek、Gemma 等开源大模型，总计 5.5 万 star。',
      source: 'GitHub Trending',
      source_url: 'https://github.com/trending',
      tags: ['大模型', '本地部署', '微调', '开源'],
      can_test: true,
      stars: 55088
    },
    {
      name: 'jarrodwatts/claude-hud — Claude Code 实时透视插件',
      url: 'https://github.com/jarrodwatts/claude-hud',
      description: 'Claude Code 的插件，实时显示 AI 的思考过程：上下文 token 用量、激活的工具、运行的 agents、todo 进度。',
      source: 'GitHub Trending',
      source_url: 'https://github.com/trending',
      tags: ['Claude', 'AI编程', '工具', '开发者体验'],
      can_test: true,
      stars: 6157
    },
    {
      name: 'Astral to Join OpenAI',
      url: 'https://astral.sh/blog/openai',
      description: 'Rust 生态明星项目 Astral（uv、ruff 背后团队）宣布加入 OpenAI。',
      source: 'Hacker News',
      source_url: 'https://news.ycombinator.com/item?id=47438723',
      tags: ['AI行业', 'Rust', 'Python工具', 'OpenAI'],
      can_test: false,
      stars: 0
    },
    {
      name: 'Kitten TTS – 最小模型不到 25MB',
      url: 'https://github.com/KittenML/KittenTTS',
      description: '全新的开源 Text-to-Speech 模型系列，最小的不到 25MB，可以直接在树莓派、手机甚至浏览器上跑。',
      source: 'Hacker News',
      source_url: 'https://news.ycombinator.com/item?id=47441546',
      tags: ['TTS语音合成', '开源模型', '本地部署', '端侧AI'],
      can_test: true,
      stars: 0
    }
  ];

  for (const tool of sampleTools) {
    await client.query(
      `INSERT INTO tools (name, url, description, source, source_url, tags, can_test, stars)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [tool.name, tool.url, tool.description, tool.source, tool.source_url, tool.tags, tool.can_test, tool.stars]
    );
  }
  console.log('✅ Inserted sample tools');

  // Final check
  const final = await client.query('\dt');
  console.log('\n📋 Final tables:', final.rows.map(r => r.tablename));

  await client.end();
  console.log('\n🎉 Database setup complete!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
