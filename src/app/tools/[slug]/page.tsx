'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { extractToolIdFromSlug } from '@/lib/utils'

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
  tested_at: string
  test_environment: string
}

function ScoreBar({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100)
  const color = pct > 80 ? '#00ff88' : pct > 60 ? '#ffc107' : '#ff6b6b'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span>{label}</span>
        <span style={{ color }}>{score}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  )
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          style={{
            fontSize: 24,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= value ? '#ffc107' : '#444',
            transition: 'color 0.2s'
          }}
        >
          {star <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  )
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

export default function ToolDetail() {
  const params = useParams()
  const slug = params.slug as string
  const toolId = extractToolIdFromSlug(slug)
  const { user } = useAuth()
  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorited, setFavorited] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!toolId) {
      setError('工具不存在')
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .eq('id', toolId)
          .single()

        if (error) throw error
        setTool(data)

        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('id')
            .eq('tool_id', toolId)
            .eq('user_id', user.id)
            .single()
          setFavorited(!!favData)

          const { data: ratingData } = await supabase
            .from('user_ratings')
            .select('rating')
            .eq('tool_id', toolId)
            .eq('user_id', user.id)
            .single()
          if (ratingData) setUserRating(ratingData.rating)
        }

        const { data: ratingsData } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('tool_id', toolId)
        if (ratingsData && ratingsData.length > 0) {
          const avg = Math.round(ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length)
          setAvgRating(avg)
          setRatingCount(ratingsData.length)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toolId, user])

  async function handleRate(rating: number) {
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    try {
      await supabase
        .from('user_ratings')
        .upsert({ tool_id: toolId, user_id: user.id, rating, updated_at: new Date().toISOString() }, {
          onConflict: 'user_id,tool_id'
        })
      setUserRating(rating)

      const { data: ratingsData } = await supabase.from('user_ratings').select('rating').eq('tool_id', toolId)
      if (ratingsData && ratingsData.length > 0) {
        const avg = Math.round(ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length)
        setAvgRating(avg)
        setRatingCount(ratingsData.length)
      }
    } catch (e) {
      console.error('评分失败:', e)
    }
  }

  async function toggleFavorite() {
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    try {
      if (favorited) {
        await supabase.from('favorites').delete().eq('tool_id', toolId).eq('user_id', user.id)
        setFavorited(false)
      } else {
        await supabase.from('favorites').insert({ tool_id: toolId, user_id: user.id })
        setFavorited(true)
      }
    } catch (e) {
      console.error('收藏失败:', e)
    }
  }

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>
  }

  if (error || !tool) {
    return <div className="container" style={{ textAlign: 'center', color: '#ff6b6b', padding: 60 }}>{error || '工具不存在'}</div>
  }

  const score = tool.overall_score || Math.round((tool.ease_score + tool.useful_score + tool.hype_score) / 3)

  return (
    <div className="container">
      <Link href="/" style={{ color: '#666', fontSize: 14, display: 'inline-block', marginBottom: 30 }}>
        ← 返回首页
      </Link>

      <div className="card" style={{ padding: 30 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 15 }}>{tool.name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              <button onClick={toggleFavorite} className={favorited ? 'btn' : 'btn btn-outline'} style={{ cursor: 'pointer' }}>
                {favorited ? '⭐ 已收藏' : '☆ 收藏'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: score >= 80 ? '#00ff88' : score >= 60 ? '#ffc107' : '#ff6b6b' }}>
              {score}
            </div>
            <div style={{ color: '#666', fontSize: 12 }}>综合评分</div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 25 }}>
          {(tool.tags || []).map((tag, i) => (
            <Link key={i} href={`/search?q=${encodeURIComponent(tag)}`} className="tag" style={{ textDecoration: 'none' }}>
              {tag}
            </Link>
          ))}
          {tool.deploy_type && (
            <span style={{ padding: '4px 12px', background: 'rgba(0,217,255,0.1)', color: '#00d9ff', borderRadius: 12, fontSize: 12 }}>
              {getDeployIcon(tool.deploy_type)} {tool.deploy_type}
            </span>
          )}
          {(tool.suitable_for || []).map((s, i) => (
            <span key={i} style={{ padding: '4px 12px', background: 'rgba(255,193,7,0.1)', color: '#ffc107', borderRadius: 12, fontSize: 12 }}>
              👤 {s}
            </span>
          ))}
        </div>

        {/* Meta info */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 25, color: '#666', fontSize: 13, flexWrap: 'wrap' }}>
          {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()} stars</span>}
          {tool.license && <span>📜 {tool.license}</span>}
          {tool.price_model && <span>💰 {tool.price_model}</span>}
          {tool.commit_frequency && <span>📊 {tool.commit_frequency === 'high' ? '活跃' : tool.commit_frequency === 'medium' ? '一般' : '冷清'}</span>}
          {tool.platform && <span>💻 {tool.platform}</span>}
        </div>

        {/* 用户评分 */}
        <div style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: 12, padding: 20, marginBottom: 25 }}>
          <h3 style={{ color: '#ffc107', fontSize: '1rem', marginBottom: 12 }}>⭐ 你的评分</h3>
          {avgRating > 0 && (
            <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>当前平均 {avgRating} 分（{ratingCount} 人评分）</p>
          )}
          <StarRating value={userRating} onChange={handleRate} />
          {userRating > 0 && <p style={{ color: '#00ff88', fontSize: 12, marginTop: 8 }}>✓ 已提交 {userRating} 星评分</p>}
          {!user && <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>登录后可参与评分</p>}
        </div>

        {/* 实测信息 */}
        {tool.tested_at && (
          <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 8, padding: '12px 16px', marginBottom: 25, fontSize: 13, color: '#888' }}>
            🧪 实测时间：{new Date(tool.tested_at).toLocaleDateString('zh-CN')}
            {tool.test_environment && <> | 测试环境：{tool.test_environment}</>}
          </div>
        )}

        {/* 5维评分 */}
        {(tool.ease_score > 0 || tool.useful_score > 0 || tool.hype_score > 0) && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 25 }}>
            <h3 style={{ color: '#00d9ff', fontSize: '1rem', marginBottom: 16 }}>📊 五维评分</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <ScoreBar label="易用性" score={tool.ease_score} />
                <ScoreBar label="有用性" score={tool.useful_score} />
                <ScoreBar label="热度" score={tool.hype_score} />
              </div>
            </div>
          </div>
        )}

        {/* 优缺点 */}
        {(tool.pros?.length > 0 || tool.cons?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 25 }}>
            {tool.pros?.length > 0 && (
              <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ color: '#00ff88', fontSize: '0.95rem', marginBottom: 12 }}>✅ 优点</h3>
                <ul style={{ paddingLeft: 16, color: '#ccc', fontSize: 14, lineHeight: 1.8 }}>
                  {tool.pros.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {tool.cons?.length > 0 && (
              <div style={{ background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ color: '#ff6b6b', fontSize: '0.95rem', marginBottom: 12 }}>❌ 缺点</h3>
                <ul style={{ paddingLeft: 16, color: '#ccc', fontSize: 14, lineHeight: 1.8 }}>
                  {tool.cons.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 简介 */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 25, marginTop: 25 }}>
          <h2 style={{ color: '#00d9ff', fontSize: '1.15rem', marginBottom: 15 }}>📝 简介</h2>
          <p style={{ color: '#ccc', lineHeight: 1.8 }}>{tool.description}</p>
        </div>

        {/* 评测结论 */}
        {tool.verdict && (
          <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid rgba(0,217,255,0.15)', borderRadius: 12, padding: 20, marginTop: 25 }}>
            <h2 style={{ color: '#00d9ff', fontSize: '1.15rem', marginBottom: 15 }}>💬 评测结论</h2>
            <p style={{ color: '#ccc', lineHeight: 1.8, fontStyle: 'italic' }}>{tool.verdict}</p>
          </div>
        )}
      </div>
    </div>
  )
}
