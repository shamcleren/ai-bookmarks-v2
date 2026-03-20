import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://ai-bookmarks-v2.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  
  // 获取所有工具
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  const toolUrls: MetadataRoute.Sitemap = (tools || []).map(tool => ({
    url: `${BASE_URL}/tools/${tool.id}-${tool.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`,
    lastModified: new Date(tool.created_at),
    changeFrequency: 'weekly',
    priority: tool.created_at && new Date(tool.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 0.8 : 0.6,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/rank`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...toolUrls,
  ]
}
