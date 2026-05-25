#!/usr/bin/env node
/**
 * AI 工具每日数据管道 (v2)
 * 
 * 1. GitHub Search API 搜索近期热门 AI 仓库
 * 2. Hacker News API 获取热帖
 * 3. 筛选 + 同步到 Supabase（v2 数据库）
 * 
 * 用法: node daily-pipeline.mjs [--dry-run] [--date 2026-05-14]
 */

import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcamsqvyibqzbphxutvc.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const TODAY = process.argv.find(a => a.startsWith('--date='))?.split('=')[1]
  || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
const DRY_RUN = process.argv.includes('--dry-run');

// 计算 3 天前的日期，用于 GitHub 搜索
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ========== GitHub Search API ==========
async function fetchGitHubTrending() {
  log('📡 搜索 GitHub 近期热门 AI 仓库...');
  const queries = [
    `created:>${THREE_DAYS_AGO} stars:>100 (ai OR llm OR agent OR copilot OR coding OR inference)`,
    `created:>${THREE_DAYS_AGO} stars:>100 (chatbot OR rag OR embedding OR transformer OR diffusion)`,
  ];

  const seen = new Set();
  const repos = [];

  for (const q of queries) {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=15`;
      const resp = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ai-bookmarks-pipeline/2.0',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) { log(`⚠️ GitHub API ${resp.status}`); continue; }
      const data = await resp.json();
      for (const r of data.items || []) {
        if (seen.has(r.full_name)) continue;
        seen.add(r.full_name);
        repos.push({
          name: r.name,
          fullName: r.full_name,
          url: r.html_url,
          desc: r.description || '',
          stars: r.stargazers_count,
          language: r.language || '',
          topics: r.topics || [],
          license: r.license?.spdx_id || '',
        });
      }
    } catch (e) {
      log(`⚠️ GitHub 搜索失败: ${e.message}`);
    }
  }

  log(`📊 GitHub: 找到 ${repos.length} 个仓库`);
  return repos;
}

// ========== Hacker News ==========
async function fetchHNTopStories() {
  log('📡 抓取 Hacker News...');
  try {
    const resp = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      signal: AbortSignal.timeout(10000),
    });
    const ids = await resp.json();
    const stories = await Promise.all(
      ids.slice(0, 50).map(async id => {
        try {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            signal: AbortSignal.timeout(5000),
          });
          return r.json();
        } catch { return null; }
      })
    );
    return stories.filter(Boolean).map(s => ({
      id: s.id,
      title: s.title || '',
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      score: s.score || 0,
      hnUrl: `https://news.ycombinator.com/item?id=${s.id}`,
    }));
  } catch (e) {
    log(`❌ HN 抓取失败: ${e.message}`);
    return [];
  }
}

// ========== AI 关键词 ==========
const AI_KEYWORDS = [
  'ai', 'llm', 'gpt', 'claude', 'gemini', 'copilot', 'agent', 'rag',
  'coding', 'code', 'developer', 'programming', 'terminal', 'cli',
  'openai', 'anthropic', 'deepseek', 'transformer', 'model',
  'automation', 'bot', 'assistant', 'chat', 'prompt', 'embedding',
  'vector', 'fine-tune', 'inference', 'api', 'sdk', 'framework',
  'machine learning', 'ml', 'deep learning', 'neural', 'diffusion',
  'image generation', 'text-to', 'speech', 'whisper', 'stable diffusion',
  'cursor', 'copilot', 'devin', 'codex', 'replit',
];

function isAITool(text) {
  const lower = text.toLowerCase();
  const matches = AI_KEYWORDS.filter(kw => lower.includes(kw));
  return matches.length >= 2 || (matches.length >= 1 && lower.includes('tool'));
}

// ========== 构建工具数据 ==========
function buildTools(ghRepos, hnStories) {
  const tools = [];
  let id = 1;

  // GitHub 仓库（优先，质量更高）
  for (const repo of ghRepos) {
    const text = `${repo.name} ${repo.desc} ${repo.topics.join(' ')}`;
    if (!isAITool(text)) continue;
    if (tools.length >= 7) break;

    tools.push({
      id: String(id).padStart(3, '0'),
      name: repo.name,
      url: repo.url,
      sourceUrl: 'https://github.com/trending',
      desc: repo.desc || `${repo.name} - GitHub 热门项目`,
      tags: buildTags(repo),
      canTest: true,
      status: 'pending',
      easeScore: 0, usefulScore: 0, hypeScore: 0,
      stars: repo.stars,
      verdict: '',
    });
    id++;
  }

  // HN 工具帖子
  for (const story of hnStories) {
    if (tools.length >= 10) break;
    const text = `${story.title} ${story.url}`;
    if (!isAITool(text)) continue;
    if (tools.some(t => t.url === story.url)) continue;

    const name = story.title.length > 50 ? story.title.slice(0, 50) + '…' : story.title;
    tools.push({
      id: String(id).padStart(3, '0'),
      name,
      url: story.url,
      sourceUrl: story.hnUrl,
      desc: story.title,
      tags: ['Hacker News', ...guessTags(story.title)],
      canTest: false,
      status: 'pending',
      easeScore: 0, usefulScore: 0, hypeScore: 0,
      stars: 0,
      verdict: '',
    });
    id++;
  }

  return tools;
}

function buildTags(repo) {
  const tags = [];
  if (repo.language) tags.push(repo.language);
  tags.push('开源');
  if (repo.stars > 500) tags.push('热门');
  const text = `${repo.name} ${repo.desc} ${repo.topics.join(' ')}`.toLowerCase();
  if (text.includes('agent')) tags.push('Agent');
  if (text.includes('llm') || text.includes('gpt')) tags.push('LLM');
  if (text.includes('cli') || text.includes('terminal')) tags.push('终端工具');
  if (text.includes('api') || text.includes('sdk')) tags.push('API');
  if (text.includes('code') || text.includes('coding')) tags.push('AI编程');
  if (text.includes('inference')) tags.push('推理');
  return [...new Set(tags)].slice(0, 5);
}

function guessTags(title) {
  const tags = [];
  const lower = title.toLowerCase();
  if (lower.includes('agent')) tags.push('Agent');
  if (lower.includes('llm') || lower.includes('gpt')) tags.push('LLM');
  if (lower.includes('code') || lower.includes('coding')) tags.push('AI编程');
  if (lower.includes('open source')) tags.push('开源');
  return tags;
}

// ========== Supabase 同步 ==========
async function syncToSupabase(tools) {
  if (!SUPABASE_KEY) { log('⚠️ 未配置 SUPABASE_KEY'); return 0; }
  if (DRY_RUN) { log('🔍 [DRY RUN] 跳过 Supabase'); return 0; }

  log('📤 同步到 Supabase...');
  let synced = 0;
  for (const tool of tools) {
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          name: tool.name,
          url: tool.url,
          description: tool.desc,
          source: tool.sourceUrl?.includes('github') ? 'GitHub Trending' : 'Hacker News',
          source_url: tool.sourceUrl,
          tags: tool.tags,
          can_test: tool.canTest,
          status: 'pending',
          ease_score: 0, useful_score: 0, hype_score: 0,
          stars: tool.stars,
          verdict: '',
          created_at: `${TODAY}T00:00:00+00:00`,
        }),
      });
      if (resp.ok) synced++;
      else log(`⚠️ ${tool.name}: ${resp.status}`);
    } catch (e) {
      log(`⚠️ ${tool.name}: ${e.message}`);
    }
  }
  log(`✅ Supabase: ${synced}/${tools.length}`);
  return synced;
}

// ========== 主流程 ==========
async function main() {
  log(`🚀 每日数据管道 v2 — ${TODAY}`);

  const [ghRepos, hnStories] = await Promise.all([
    fetchGitHubTrending(),
    fetchHNTopStories(),
  ]);

  const tools = buildTools(ghRepos, hnStories);
  if (tools.length === 0) {
    log('⚠️ 没有找到 AI 工具，跳过');
    return;
  }

  log(`🔧 筛选出 ${tools.length} 个 AI 工具`);
  tools.forEach(t => log(`   ${t.id}. ${t.name} ⭐${t.stars}`));

  const synced = await syncToSupabase(tools);

  // 写一份本地备份（可选，方便排查）
  const backupDir = '/Users/shamcle/.openclaw/workspace/scripts/pipeline-backup';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(
    `${backupDir}/${TODAY}.json`,
    JSON.stringify({ date: TODAY, tools, synced }, null, 2)
  );

  log(`✅ 管道完成！(${synced} 条写入 Supabase)`);
}

main().catch(e => {
  log(`❌ 失败: ${e.message}`);
  process.exit(1);
});
