'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'

interface Tool {
  id: string
  name: string
  url: string
  description: string
  source: string
  source_url: string
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

function ToolCard({ tool }: { tool: Tool }) {
  const score = tool.overall_score || Math.round((tool.ease_score + tool.useful_score + tool.hype_score) / 3)
  const level = getLevelBadge(score)
  const commitBadge = getCommitBadge(tool.commit_frequency || 'unknown')

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 17, marginBottom: 8 }}>
          <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d9ff' }}>
            {tool.name}
          </a>
        </h3>
        <span style={{
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: level.bg,
          color: level.color
        }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#666' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
          <span style={{ color: commitBadge.color }}>📊 {commitBadge.label}</span>
          {tool.price_model && <span>💰 {tool.price_model}</span>}
        </div>
        <Link href={`/tools/${tool.id}`} style={{ color: '#00d9ff', fontSize: 13 }}>
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
      minWidth: 280
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: 'rgba(0,255,136,0.2)',
          color: '#00ff88'
        }}>
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
      <Link href={`/tools/${tool.id}`} style={{ color: '#00d9ff', fontSize: 13 }}>
        阅读评测 →
      </Link>
    </div>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

function Nav({ user }: { user: any }) {
  return (
    <div className="nav">
      <a href="/" className="active">🏠 首页</a>
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

interface GroupedTools {
  date: string
  tools: Tool[]
}

export default function Home() {
  const [groupedTools, setGroupedTools] = useState<GroupedTools[]>([])
  const [featuredTools, setFeaturedTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    async function fetchTools() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .order('overall_score', { ascending: false })
          .limit(50)

        if (error) throw error

        // 精选：综合评分最高的3个
        const featured = (data || [])
          .filter(t => (t.overall_score || 0) > 0)
          .slice(0, 3)
        setFeaturedTools(featured)

        // 按日期分组
        const groups: { [key: string]: Tool[] } = {}
        ;(data || []).forEach(tool => {
          const date = tool.created_at?.split('T')[0] || 'unknown'
          if (!groups[date]) groups[date] = []
          groups[date].push(tool)
        })

        const result = Object.entries(groups)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, tools]) => ({ date, tools }))

        setGroupedTools(result)
      } catch (e: any) {
        console.error('Error fetching tools:', e)
        setError(e.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [])

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

      {loading || authLoading ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: 60 }}>加载失败: {error}</div>
      ) : (
        <>
          {featuredTools.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 20, color: '#00d9ff' }}>
                ⭐ 本期精选
              </h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {featuredTools.map(tool => (
                  <FeaturedCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {groupedTools.length === 0 && featuredTools.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>暂无数据</div>
          )}

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
                <span style={{ color: '#666', fontSize: 14, marginLeft: 12 }}>
                  {group.tools.length} 款工具
                </span>
              </h2>
              {group.tools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
