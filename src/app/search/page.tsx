'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Tool[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery])

  async function doSearch(q: string) {
    if (!q.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, url, description, tags, stars, overall_score, verdict, deploy_type')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .order('overall_score', { ascending: false })
        .limit(20)

      if (error) throw error
      setResults(data || [])
    } catch (e) {
      console.error(e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    doSearch(query)
    const url = new URL(window.location.href)
    url.searchParams.set('q', query)
    window.history.pushState({}, '', url.toString())
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.5rem', marginBottom: 30 }}>🔍 搜索工具</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索工具名称、描述..."
            style={{
              flex: 1,
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 16
            }}
          />
          <button type="submit" className="btn" style={{ padding: '14px 24px' }}>
            搜索
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>搜索中...</div>
      ) : searched && results.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          未找到相关工具
        </div>
      ) : results.length > 0 ? (
        <>
          <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>
            找到 {results.length} 个结果
          </p>
          <div>
            {results.map(tool => (
              <div key={tool.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16 }}>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d9ff' }}>
                      {tool.name}
                    </a>
                  </h3>
                  <span style={{ color: '#ffc107', fontSize: 20, fontWeight: 'bold' }}>
                    {tool.overall_score || '?'}
                  </span>
                </div>
                <p style={{ color: '#999', fontSize: 13, marginBottom: 8 }}>
                  {tool.description?.slice(0, 150)}...
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {(tool.tags || []).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  {tool.deploy_type && (
                    <span style={{ padding: '4px 10px', background: 'rgba(0,217,255,0.1)', color: '#00d9ff', borderRadius: 12, fontSize: 12 }}>
                      {getDeployIcon(tool.deploy_type)} {tool.deploy_type}
                    </span>
                  )}
                  {tool.stars > 0 && (
                    <span style={{ color: '#888', fontSize: 12 }}>⭐ {tool.stars.toLocaleString()}</span>
                  )}
                </div>
                {tool.verdict && (
                  <p style={{ color: '#aaa', fontSize: 13, fontStyle: 'italic', borderLeft: '2px solid rgba(0,217,255,0.3)', paddingLeft: 12 }}>
                    💬 {tool.verdict.slice(0, 80)}...
                  </p>
                )}
                <Link href={`/tools/${tool.id}`} style={{ color: '#00d9ff', fontSize: 13, marginTop: 8, display: 'inline-block' }}>
                  查看详情 →
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          输入关键词搜索 AI 工具
        </div>
      )}
    </div>
  )
}

export default function Search() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>}>
      <SearchContent />
    </Suspense>
  )
}
