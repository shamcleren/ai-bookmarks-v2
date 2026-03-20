/**
 * 工具名转 slug
 * obra/superpowers → obra-superpowers
 * Claude Code Channels → claude-code-channels
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')  // 非字母数字中文都转成-
    .replace(/-+/g, '-')  // 多个横线合并
    .replace(/^-|-$/g, '')  // 去掉首尾横线
}

/**
 * slug 转回工具名（用于显示）
 */
export function slugToName(slug: string): string {
  return slug.replace(/-/g, ' ')
}

/**
 * 生成工具的完整 URL
 */
export function getToolUrl(id: string, name: string): string {
  const slug = nameToSlug(name)
  return `/tools/${id}-${slug}`
}

/**
 * 从 URL 中提取工具 ID
 * /tools/123-obra-superpowers → 123
 */
export function extractToolIdFromSlug(slug: string): string | null {
  const match = slug.match(/^([a-f0-9-]+)-/i)
  if (match) {
    // 检查第一个分段是否是 UUID 格式
    const possibleId = match[1]
    if (possibleId.includes('-') && possibleId.length > 20) {
      return possibleId
    }
  }
  // fallback: 整个 slug 当 ID（兼容旧版 URL）
  return slug
}
