'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { nameToSlug } from '@/lib/utils'

interface Tool {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  stars: number
  overall_score: number
  verdict: string
  deploy_type: string
  commit_frequency: string
}

function getDeployIcon(type: string) {
  switch (type) {
    case 'local': return '🖥️'
    case 'cloud': return '☁️'
    case 'api': return '🔌'
    case 'browser': return '🌐'
    default: return '📦'
  }
}

function getLevelBadge(score: number) {
  if (score >= 80) return { label: '✅ 推荐', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' }
  if (score >= 60) return { label: '🔧 一般', color: '#ffc107', bg: 'rgba(255,193,7,0.1)' }
  if (score >= 40) return { label: '⏳ 观望', color: '#ff9800', bg: 'rgba(255,152,0,0.1)' }
  return { label: '❓ 待测', color: '#888', bg: 'rgba(136,136,136,0.1)' }
}

function TagContent() {
  const searchParams = useSearchParams()
  const initialTag = searchParams.get('tag') || ''
  const [tag, setTag] = useState(initialTag)
  const [inputVal, setInputVal] = useState(initialTag)
  const [tools, setTools] = useState<Tool[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initialTag)
  const supabase = createClient()

  useEffect(() => {
    if (initialTag) {
      doSearch(initialTag)
      loadAllTags()
    } else {
      loadAllTags()
    }
  }, [initialTag])

  async function loadAllTags() {
    const { data } = await supabase
      .from('tools')
      .select('tags')

    const tagCount: Record<string, number> = {}
    data?.forEach((t: any) => {
      (t.tags || []).forEach((tg: string) => {
        tagCount[tg] = (tagCount[tg] || 0) + 1
      })
    })

    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)

    setAllTags(sorted)
  }

  async function doSearch(t: string) {
    if (!t.trim()) return
    setLoading(true)
    setSearched(true)

    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, url, description, tags, stars, overall_score, verdict, deploy_type, commit_frequency')
        .contains('tags', [t])
        .order('overall_score', { ascending: false, nullsFirst: false })
        .limit(50)

      if (error) throw error
      setTools(data || [])
    } catch (e) {
      console.error(e)
      setTools([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!tag.trim()) return
    doSearch(tag)
    setInputVal(tag)
    const url = new URL(window.location.href)
    url.searchParams.set('tag', tag)
    window.history.pushState({}, '', url.toString())
  }

  function handleTagClick(t: string) {
    setTag(t)
    setInputVal(t)
    doSearch(t)
    const url = new URL(window.location.href)
    url.searchParams.set('tag', t)
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>🏷️ 标签筛选</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 30 }}>
        按标签查找同类工具
      </p>

      {/* 搜索框 */}
      <form onSubmit={handleSearch} style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setTag(e.target.value) }}
            placeholder="输入标签名称..."
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15
            }}
          />
          <button type="submit" className="btn" style={{ padding: '12px 24px' }}>
            搜索
          </button>
        </div>
      </form>

      {/* 热门标签云 */}
      {!searched && allTags.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: 16 }}>🔥 热门标签</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allTags.slice(0, 30).map(t => (
              <button
                key={t}
                onClick={() => handleTagClick(t)}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(0,217,255,0.08)',
                  border: '1px solid rgba(0,217,255,0.2)',
                  borderRadius: 20,
                  color: '#00d9ff',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 当前标签 */}
      {searched && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', color: '#00d9ff' }}>
              标签「{tag}」— {tools.length} 个工具
            </h2>
            <button
              onClick={() => { setSearched(false); setTools([]); setTag(''); setInputVal('') }}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13 }}
            >
              清除
            </button>
          </div>
        </div>
      )}

      {/* 结果 */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>搜索中...</div>
      ) : tools.length > 0 ? (
        <div>
          {tools.map(tool => {
            const score = tool.overall_score || 0
            const level = getLevelBadge(score)
            return (
              <div key={tool.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, marginBottom: 6 }}>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                        {tool.name}
                      </a>
                    </h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(tool.tags || []).map(t => (
                        <button
                          key={t}
                          onClick={() => handleTagClick(t)}
                          style={{
                            padding: '2px 8px',
                            background: t === tag ? 'rgba(0,217,255,0.2)' : 'rgba(0,255,136,0.08)',
                            border: 'none',
                            borderRadius: 8,
                            color: t === tag ? '#00d9ff' : '#00ff88',
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: level.bg,
                    color: level.color,
                    flexShrink: 0,
                    marginLeft: 12
                  }}>
                    {level.label}
                  </span>
                </div>

                <p style={{ color: '#999', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                  {tool.description?.slice(0, 120)}...
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#666', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
                    {tool.deploy_type && <span>{getDeployIcon(tool.deploy_type)} {tool.deploy_type}</span>}
                  </div>
                  <Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: '#00d9ff', fontSize: 13 }}>
                    查看详情 →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : searched ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          暂无标签为「{tag}」的工具
        </div>
      ) : null}
    </div>
  )
}

export default function TagsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>}>
      <TagContent />
    </Suspense>
  )
}
