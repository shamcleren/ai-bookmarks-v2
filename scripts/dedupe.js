const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://rcamsqvyibqzbphxutvc.supabase.co',
  'sb_publishable_kebMZEckbfkzVw-tFxWMgQ_CHoVpWx0'
)

async function dedupe() {
  console.log('🔍 查找重复工具...')

  // 获取所有工具
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, url, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ 查询失败:', error)
    return
  }

  console.log(`总工具数: ${tools?.length || 0}`)

  // 按 name + url 找重复
  const seen = new Map()
  const duplicates = []

  tools?.forEach(tool => {
    const key = `${tool.name}|${tool.url}`
    if (seen.has(key)) {
      duplicates.push({ ...tool, original_id: seen.get(key) })
    } else {
      seen.set(key, tool.id)
    }
  })

  console.log(`找到 ${duplicates.length} 个重复`)

  if (duplicates.length === 0) {
    console.log('✅ 没有重复')
    return
  }

  // 显示重复的工具
  duplicates.forEach(dup => {
    console.log(`  ❌ ${dup.name} (${dup.id})`)
  })

  // 删除重复的（保留最早创建的）
  console.log('\n🗑️ 删除重复工具...')
  for (const dup of duplicates) {
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', dup.id)

    if (error) {
      console.log(`  ❌ 删除失败: ${dup.name} - ${error.message}`)
    } else {
      console.log(`  ✅ 已删除: ${dup.name}`)
    }
  }

  // 验证
  const { data: remaining } = await supabase
    .from('tools')
    .select('id', { count: 'exact', head: true })

  console.log(`\n✅ 清理完成，剩余工具数: ${remaining?.length || 0}`)
}

dedupe().catch(console.error)
