const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://rcamsqvyibqzbphxutvc.supabase.co',
  'sb_publishable_kebMZEckbfkzVw-tFxWMgQ_CHoVpWx0'
)

async function dedupe() {
  console.log('🔍 获取所有工具...')

  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, url, created_at')
    .order('created_at', { ascending: true }) // 最早的优先保留

  if (error) {
    console.error('❌ 查询失败:', error)
    return
  }

  console.log(`总工具数: ${tools?.length || 0}`)

  // 按 name+url 分组
  const groups = new Map()
  tools?.forEach(tool => {
    const key = `${tool.name}|${tool.url}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(tool)
  })

  // 找出有重复的组
  const toDelete = []
  groups.forEach((group, key) => {
    if (group.length > 1) {
      console.log(`\n🔁 重复 (${group.length}个): ${group[0].name}`)
      // 保留第一个（created_at 最早），删除其余
      group.slice(1).forEach(t => {
        console.log(`   🗑️ 删除: ${t.id} (${t.created_at})`)
        toDelete.push(t.id)
      })
    }
  })

  console.log(`\n共 ${toDelete.length} 个重复待删除`)

  if (toDelete.length === 0) {
    console.log('✅ 没有重复！')
    return
  }

  // 批量删除
  const { error: deleteError } = await supabase
    .from('tools')
    .delete()
    .in('id', toDelete)

  if (deleteError) {
    console.error('❌ 删除失败:', deleteError)
  } else {
    console.log(`✅ 成功删除 ${toDelete.length} 个重复工具`)
  }

  // 验证
  const { count } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 清理后剩余: ${count} 个工具`)
}

dedupe().catch(console.error)
