'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { nameToSlug } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

interface Tool {
  id: string
  name: string
  url: string
  description: string
  source: string
  tags: string[]
  can_test: boolean
  status: string
  ease_score: number
  useful_score: number
  hype_score: number
  stars: number
  verdict: string
  created_at: string
  deploy_type: string
  platform: string
  license: string
  price_model: string
  commit_frequency: string
  overall_score: number
  pros: string[]
  cons: string[]
  suitable_for: string[]
}

const COMPARE_KEY = 'ai-bookmarks-compare'

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

function getCommitBadge(freq: string) {
  switch (freq) {
    case 'high': return { label: '活跃', color: '#00ff88' }
    case 'medium': return { label: '一般', color: '#ffc107' }
    case 'low': return { label: '冷清', color: '#ff6b6b' }
    default: return { label: '未知', color: '#888' }
  }
}

function ToolCard({ tool, selected, onToggle }: { tool: Tool; selected: boolean; onToggle: (id: string) => void }) {
  const score = tool.overall_score || Math.round((tool.ease_score + tool.useful_score + tool.hype_score) / 3)
  const level = getLevelBadge(score)
  const commitBadge = getCommitBadge(tool.commit_frequency || 'unknown')

  return (
    <div className="card" style={{
      marginBottom: 16,
      border: selected ? '1px solid rgba(0,217,255,0.5)' : undefined,
      boxShadow: selected ? '0 0 20px rgba(0,217,255,0.15)' : undefined
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(tool.id)}
            style={{ marginTop: 4, cursor: 'pointer', width: 16, height: 16, accentColor: '#00d9ff' }}
          />
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 8 }}>
              <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d9ff' }}>
                {tool.name}
              </a>
            </h3>
          </div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: level.bg, color: level.color }}>
          {level.label}
        </span>
      </div>

      <p style={{ color: '#999', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
        {tool.description?.slice(0, 120)}{tool.description?.length > 120 ? '...' : ''}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {(tool.tags || []).slice(0, 3).map((tag, i) => (
          <span key={i} className="tag">{tag}</span>
        ))}
        <span style={{ padding: '4px 10px', background: 'rgba(0,217,255,0.1)', color: '#00d9ff', borderRadius: 12, fontSize: 12 }}>
          {getDeployIcon(tool.deploy_type)} {tool.deploy_type || '未知'}
        </span>
      </div>

      {tool.verdict && (
        <div style={{
          background: 'rgba(0,255,136,0.05)',
          border: '1px solid rgba(0,255,136,0.1)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
          fontSize: 13,
          color: '#ccc',
          fontStyle: 'italic'
        }}>
          💬 {tool.verdict}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, flexWrap: 'wrap', gap: 8, color: '#666' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
          <span style={{ color: commitBadge.color }}>📊 {commitBadge.label}</span>
          {tool.price_model && <span>💰 {tool.price_model}</span>}
        </div>
        <Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: '#00d9ff', fontSize: 13 }}>
          查看详情 →
        </Link>
      </div>
    </div>
  )
}

function FeaturedCard({ tool }: { tool: Tool }) {
  const score = tool.overall_score || Math.round((tool.ease_score + tool.useful_score + tool.hype_score) / 3)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,217,255,0.15) 0%, rgba(0,255,136,0.1) 100%)',
      border: '1px solid rgba(0,217,255,0.3)',
      borderRadius: 16,
      padding: 24,
      flex: 1,
      minWidth: 240
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(0,255,136,0.2)', color: '#00ff88' }}>
          ⭐ 精选
        </span>
        <span style={{ fontSize: 28, fontWeight: 'bold', color: '#ffc107' }}>{score}</span>
      </div>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>
        <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
          {tool.name}
        </a>
      </h3>
      <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
        {tool.description?.slice(0, 80)}...
      </p>
      <Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: '#00d9ff', fontSize: 13 }}>
        阅读评测 →
      </Link>
    </div>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
}

function Nav({ user }: { user: any }) {
  return (
    <div className="nav">
      <a href="/" className="active">🏠 首页</a>
      <a href="/search">🔍 搜索</a>
      <a href="/rank">🏆 榜单</a>
      {user ? (
        <>
          <a href="/favorites">⭐ 收藏</a>
          <span style={{ color: '#666', padding: '12px 0' }}>|</span>
          <span style={{ color: '#00ff88', padding: '12px 0' }}>
            👤 {user.user_metadata?.full_name || user.email?.split('@')[0] || '已登录'}
          </span>
        </>
      ) : (
        <a href="/auth/login">登录</a>
      )}
    </div>
  )
}

const DEPLOY_FILTERS = ['全部', '本地', '云端', 'API', '浏览器']
const SORT_OPTIONS = [
  { value: 'overall_score', label: '综合评分' },
  { value: 'stars', label: 'GitHub Stars' },
  { value: 'created_at', label: '最新收录' },
  { value: 'commit_frequency', label: '活跃度' },
]

export default function Home() {
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [featuredTools, setFeaturedTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, loading: authLoading } = useAuth()
  const [deployFilter, setDeployFilter] = useState('全部')
  const [sortBy, setSortBy] = useState('overall_score')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Load compare ids from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPARE_KEY)
      if (saved) setCompareIds(JSON.parse(saved))
    } catch {}
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(i => i !== id)
        : prev.length < 3 ? [...prev, id] : prev
      try { localStorage.setItem(COMPARE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const goCompare = useCallback(() => {
    if (compareIds.length >= 2) {
      router.push(`/compare?ids=${compareIds.join(',')}`)
    }
  }, [compareIds, router])

  const clearCompare = useCallback(() => {
    setCompareIds([])
    try { localStorage.removeItem(COMPARE_KEY) } catch {}
  }, [])

  useEffect(() => {
    async function fetchTools() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .order('overall_score', { ascending: false, nullsFirst: false })

        if (error) throw error
        const tools = data || []

        setFeaturedTools(tools.filter(t => (t.overall_score || 0) > 0).slice(0, 3))
        setAllTools(tools)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [])

  const filteredTools = allTools
    .filter(tool => {
      if (deployFilter === '全部') return true
      const map: Record<string, string> = { '本地': 'local', '云端': 'cloud', 'API': 'api', '浏览器': 'browser' }
      return tool.deploy_type === map[deployFilter]
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'overall_score': return (b.overall_score || 0) - (a.overall_score || 0)
        case 'stars': return b.stars - a.stars
        case 'created_at': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'commit_frequency': {
          const order: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1, 'unknown': 0 }
          return (order[b.commit_frequency || 'unknown'] || 0) - (order[a.commit_frequency || 'unknown'] || 0)
        }
        default: return 0
      }
    })

  const groupedTools: { date: string; tools: Tool[] }[] = []
  const dateMap: Record<string, Tool[]> = {}
  filteredTools.forEach(tool => {
    const date = tool.created_at?.split('T')[0] || 'unknown'
    if (!dateMap[date]) dateMap[date] = []
    dateMap[date].push(tool)
  })
  Object.entries(dateMap).sort(([a], [b]) => b.localeCompare(a)).forEach(([date, tools]) => {
    groupedTools.push({ date, tools })
  })

  return (
    <div className="container">
      <h1 style={{
        textAlign: 'center',
        fontSize: '2.5rem',
        marginBottom: 10,
        background: 'linear-gradient(90deg, #00d9ff, #00ff88)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🛠️ AI 工具评测
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: 30 }}>
        拒绝云评测，实测才是真
      </p>

      <Nav user={user} />

      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(0,217,255,0.15)',
          border: '1px solid rgba(0,217,255,0.3)',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{ color: '#fff', fontSize: 14 }}>
            已选择 {compareIds.length}/3 个工具
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={clearCompare} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
              清除
            </button>
            <button
              onClick={goCompare}
              disabled={compareIds.length < 2}
              className="btn"
              style={{ padding: '8px 20px', fontSize: 13, opacity: compareIds.length < 2 ? 0.5 : 1 }}
            >
              🔍 对比
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DEPLOY_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setDeployFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                background: deployFilter === f ? 'rgba(0,217,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: deployFilter === f ? '#00d9ff' : '#888',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: 13 }}>排序：</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading || authLoading ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: 60 }}>加载失败: {error}</div>
      ) : (
        <>
          {featuredTools.length > 0 && deployFilter === '全部' && sortBy === 'overall_score' && (
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 20, color: '#00d9ff' }}>⭐ 本期精选</h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {featuredTools.map(tool => <FeaturedCard key={tool.id} tool={tool} />)}
              </div>
            </div>
          )}

          <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>
            共 {filteredTools.length} 款工具（勾选工具后可对比）
          </p>

          {groupedTools.map(group => (
            <div key={group.date} style={{ marginBottom: 40 }}>
              <h2 style={{
                fontSize: '1.2rem',
                marginBottom: 20,
                paddingBottom: 10,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: '#00d9ff'
              }}>
                📅 {formatDate(group.date)}
                <span style={{ color: '#666', fontSize: 14, marginLeft: 12 }}>{group.tools.length} 款工具</span>
              </h2>
              {group.tools.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  selected={compareIds.includes(tool.id)}
                  onToggle={toggleCompare}
                />
              ))}
            </div>
          ))}

          {groupedTools.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>暂无匹配的工具</div>
          )}
        </>
      )}
    </div>
  )
}
