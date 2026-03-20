'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function ToolDetail() {
  const params = useParams()
  const id = params.id as string
  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const supabase = createClient()

    async function fetchTool() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setTool(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTool()
  }, [id])

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>
        加载中...
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div className="container" style={{ textAlign: 'center', color: '#ff6b6b', padding: 60 }}>
        {error || '工具不存在'}
      </div>
    )
  }

  const avgScore = Math.round(((tool.ease_score + tool.useful_score + tool.hype_score) / 3) / 20)
  const rating = avgScore > 0 ? '★'.repeat(avgScore) + '☆'.repeat(5 - avgScore) : '☆☆☆☆☆'

  return (
    <div className="container">
      <Link href="/" style={{ color: '#666', fontSize: 14, display: 'inline-block', marginBottom: 30 }}>
        ← 返回首页
      </Link>

      <div className="card" style={{ padding: 30 }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 15 }}>{tool.name}</h1>

        <div style={{ margin: '15px 0', display: 'flex', gap: 15, flexWrap: 'wrap' }}>
          {tool.url && (
            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn">
              🔗 访问工具
            </a>
          )}
          {tool.source_url && (
            <a href={tool.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              📰 {tool.source || '来源'}
            </a>
          )}
        </div>

        <div className="stars" style={{ fontSize: 28, letterSpacing: 4, margin: '20px 0' }}>
          {rating}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 25 }}>
          {(tool.tags || []).map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
          {tool.can_test && <span className="badge badge-test">🤖 可评测</span>}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 25, marginTop: 25 }}>
          <h2 style={{ color: '#00d9ff', fontSize: '1.15rem', marginBottom: 15 }}>📝 简介</h2>
          <p style={{ color: '#ccc', lineHeight: 1.8 }}>{tool.description}</p>
        </div>

        {tool.status === 'rated' && tool.verdict && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 25, marginTop: 25 }}>
            <h2 style={{ color: '#00d9ff', fontSize: '1.15rem', marginBottom: 15 }}>📊 评测结论</h2>
            <p style={{ color: '#ccc', lineHeight: 1.8 }}>{tool.verdict}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, marginTop: 25, color: '#666', fontSize: 13 }}>
          {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()} stars</span>}
          {tool.source && <span>来源: {tool.source}</span>}
          <span>评分: {tool.ease_score + tool.useful_score + tool.hype_score > 0 ? '已评分' : '待评测'}</span>
        </div>
      </div>
    </div>
  )
}
