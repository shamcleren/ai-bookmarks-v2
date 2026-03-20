#!/usr/bin/env node
/**
 * 数据同步脚本 v2：从 ai-bookmarks 仓库同步工具数据到 Supabase
 * 使用 upsert 模式，避免重复插入
 */

const REPO_PATH = '/tmp/ai-bookmarks'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const fs = require('fs')
const path = require('path')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

async function syncTools() {
  console.log('🚀 开始同步...')

  if (!fs.existsSync(REPO_PATH)) {
    console.log('📥 克隆仓库...')
    const { execSync } = require('child_process')
    execSync(`git clone --depth 1 https://github.com/shamcleren/ai-bookmarks.git ${REPO_PATH}`, { stdio: 'inherit' })
  } else {
    console.log('📂 更新仓库...')
    const { execSync } = require('child_process')
    try {
      execSync('git pull origin main', { cwd: REPO_PATH, stdio: 'pipe' })
    } catch (e) {
      console.log('⚠️ 更新失败，使用本地版本')
    }
  }

  const datesPath = path.join(REPO_PATH, 'available-dates.json')
  if (!fs.existsSync(datesPath)) {
    console.error('❌ 找不到 available-dates.json')
    process.exit(1)
  }

  const datesData = JSON.parse(fs.readFileSync(datesPath, 'utf8'))
  const dates = datesData.dates || []
  console.log(`📅 发现 ${dates.length} 期数据`)

  let totalUpserted = 0
  let totalSkipped = 0

  for (const entry of dates) {
    const date = entry.date
    const toolsPath = path.join(REPO_PATH, date, 'tools.json')

    if (!fs.existsSync(toolsPath)) continue

    const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'))
    console.log(`\n📦 ${date}: ${toolsData.tools.length} 个工具`)

    for (const tool of toolsData.tools) {
      try {
        // 用 name+url 作为唯一键，避免重复
        const payload = {
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
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
            'Upsert': `name=eq.${tool.name}`  // 按 name 去重
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          totalUpserted++
        } else {
          const err = await response.text()
          console.log(`   ⚠️ ${tool.name}: ${err.slice(0, 80)}`)
          totalSkipped++
        }
      } catch (e) {
        console.log(`   ❌ ${tool.name}: ${e.message}`)
        totalSkipped++
      }
    }
  }

  console.log(`\n✅ 完成！新增/更新: ${totalUpserted}, 跳过: ${totalSkipped}`)
}

syncTools().catch(e => {
  console.error('❌ 失败:', e)
  process.exit(1)
})
