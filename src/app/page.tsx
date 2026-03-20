'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
}

function starRating(ease: number, useful: number, hype: number) {
  const avg = (ease + useful + hype) / 3
  if (avg === 0) return '☆☆☆☆☆'
  const full = Math.round(avg / 20)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

function ToolCard({ tool }: { tool: Tool }) {
  const rating = starRating(tool.ease_score, tool.useful_score, tool.hype_score)
  const isRated = tool.status === 'rated'

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 17, marginBottom: 8 }}>
          <a href={tool.url} target="_blank" rel="noopener noreferrer">
            {tool.name}
          </a>
        </h3>
        <span style={{ color: '#888', fontSize: 12 }}>
          {isRated ? '⭐ 已评测' : '待评测'}
        </span>
      </div>

      <p style={{ color: '#999', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
        {tool.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {(tool.tags || []).map((tag, i) => (
          <span key={i} className="tag">{tag}</span>
        ))}
        {tool.can_test && <span className="badge badge-test">🤖 可评测</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666' }}>
          {tool.source && <span>{tool.source}</span>}
          {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
        </div>
        <div className="stars" style={{ fontSize: 14 }}>{rating}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Link
          href={`/tools/${tool.id}`}
          style={{ color: '#00d9ff', fontSize: 13 }}
        >
          查看详情 →
        </Link>
      </div>
    </div>
  )
}

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function fetchTools() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setTools(data || [])
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

      <div className="nav">
        <a href="/" className="active">🏠 首页</a>
        <a href="/rank">🏆 榜单</a>
        <a href="/favorites">⭐ 收藏</a>
        <a href="/auth/login">登录</a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          加载中...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: 60 }}>
          加载失败: {error}
        </div>
      ) : tools.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          暂无数据
        </div>
      ) : (
        <div>
          <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>
            共收录 {tools.length} 款 AI 工具
          </p>
          {tools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  )
}
