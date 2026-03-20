#!/usr/bin/env node
/**
 * 数据同步脚本：从 ai-bookmarks 仓库同步工具数据到 Supabase
 * 
 * 用法：
 *   node sync-to-supabase.js
 * 
 * 推荐通过 cron 每天自动运行
 */

const REPO_PATH = '/tmp/ai-bookmarks'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const fs = require('fs')
const path = require('path')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY')
  process.exit(1)
}

async function syncTools() {
  console.log('🚀 开始同步数据到 Supabase...')

  // 检查仓库是否存在
  if (!fs.existsSync(REPO_PATH)) {
    console.log('📥 克隆 ai-bookmarks 仓库...')
    const { execSync } = require('child_process')
    try {
      execSync(`git clone --depth 1 https://github.com/shamcleren/ai-bookmarks.git ${REPO_PATH}`, {
        stdio: 'inherit'
      })
    } catch (e) {
      console.error('❌ 克隆失败:', e.message)
      process.exit(1)
    }
  } else {
    // 更新仓库
    console.log('📂 更新仓库...')
    const { execSync } = require('child_process')
    try {
      execSync('git pull origin main', { cwd: REPO_PATH, stdio: 'pipe' })
    } catch (e) {
      console.log('⚠️ 更新失败，使用本地版本')
    }
  }

  // 读取 available-dates.json
  const datesPath = path.join(REPO_PATH, 'available-dates.json')
  if (!fs.existsSync(datesPath)) {
    console.error('❌ 找不到 available-dates.json')
    process.exit(1)
  }

  const datesData = JSON.parse(fs.readFileSync(datesPath, 'utf8'))
  const dates = datesData.dates || []

  console.log(`📅 发现 ${dates.length} 期数据`)

  let totalSynced = 0
  let totalErrors = 0

  for (const entry of dates) {
    const date = entry.date
    const toolsPath = path.join(REPO_PATH, date, 'tools.json')
    
    if (!fs.existsSync(toolsPath)) {
      console.log(`   ⚠️ ${date}: 无 tools.json，跳过`)
      continue
    }

    const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'))
    console.log(`\n📦 ${date}: ${toolsData.tools.length} 个工具`)

    for (const tool of toolsData.tools) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: crypto.randomUUID(), // 会用新的 ID，让 upsert 自己处理
            name: tool.name,
            url: tool.url || null,
            description: tool.desc || null,
            source: tool.sourceUrl?.includes('ycombinator') ? 'Hacker News' : 'GitHub Trending',
            source_url: tool.sourceUrl || null,
            tags: tool.tags || [],
            can_test: tool.canTest || false,
            status: 'pending',
            ease_score: tool.easeScore || 0,
            useful_score: tool.usefulScore || 0,
            hype_score: tool.hypeScore || 0,
            stars: tool.stars || 0,
            verdict: tool.verdict || null,
            created_at: new Date(date).toISOString()
          })
        })

        if (response.ok) {
          totalSynced++
        } else {
          const err = await response.text()
          console.error(`   ❌ ${tool.name}: ${err}`)
          totalErrors++
        }
      } catch (e) {
        console.error(`   ❌ ${tool.name}: ${e.message}`)
        totalErrors++
      }
    }
  }

  console.log(`\n✅ 同步完成！成功: ${totalSynced}, 失败: ${totalErrors}`)
}

// 运行
syncTools().catch(e => {
  console.error('❌ 同步失败:', e)
  process.exit(1)
})
