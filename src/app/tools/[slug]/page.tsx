'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { extractToolIdFromSlug } from '@/lib/utils'

interface Tool {
  id: string; name: string; url: string; description: string
  source: string; source_url: string; tags: string[]; can_test: boolean
  status: string; ease_score: number; useful_score: number; hype_score: number
  stars: number; verdict: string; created_at: string; deploy_type: string
  platform: string; license: string; price_model: string; commit_frequency: string
  overall_score: number; pros: string[]; cons: string[]; suitable_for: string[]
  tested_at: string; test_environment: string
}

function parseVerdict(verdict: string) {
  const blocks: { title: string; content: string }[] = []
  const parts = verdict.split('【')
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf('】')
    if (end > 0) blocks.push({ title: parts[i].slice(0, end), content: parts[i].slice(end + 1).trim() })
  }
  return blocks
}

function ScoreBar({ label, score, max = 10, accent = '#00c8e8' }: { label: string; score: number; max?: number; accent?: string }) {
  const pct = Math.min((score / max) * 100, 100)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
        <span style={{ color: '#a09baa' }}>{label}</span>
        <span style={{ color: pct > 80 ? '#00e676' : pct > 60 ? '#ffab00' : '#ff5252', fontWeight: 700 }}>
          {score}<span style={{ fontSize: 10, opacity: 0.6 }}>/{max}</span>
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 6, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${accent}, ${accent}dd)`, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: `0 0 8px ${accent}44` }} />
      </div>
    </div>
  )
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} onClick={() => !readonly && onChange?.(star)}
          style={{ fontSize: 28, cursor: readonly ? 'default' : 'pointer', color: star <= value ? '#ffab00' : '#3a3545', transition: 'color 0.15s, transform 0.15s' }}
          onMouseEnter={e => { if (!readonly) (e.target as HTMLElement).style.transform = 'scale(1.15)' }}
          onMouseLeave={e => { if (!readonly) (e.target as HTMLElement).style.transform = 'scale(1)' }}
        >★</span>
      ))}
    </div>
  )
}

const deployIcons: Record<string, string> = { local: '🖥️', cloud: '☁️', api: '🔌', browser: '🌐' }

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
  const [relatedTools, setRelatedTools] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!toolId) { setError('工具不存在'); setLoading(false); return }
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('tools').select('*').eq('id', toolId).single()
        if (error) throw error
        setTool(data)
        const promises: any[] = [supabase.from('user_ratings').select('rating').eq('tool_id', toolId)]
        if (user) {
          promises.push(
            supabase.from('favorites').select('id').eq('tool_id', toolId).eq('user_id', user.id).maybeSingle(),
            supabase.from('user_ratings').select('rating').eq('tool_id', toolId).eq('user_id', user.id).maybeSingle(),
          )
        }
        if (data?.tags?.length) {
          promises.push(supabase.from('tools').select('id, name, url, description, tags, stars, overall_score, deploy_type')
            .neq('id', toolId).overlaps('tags', data.tags).order('overall_score', { ascending: false }).limit(4))
        }
        const results = await Promise.all(promises)
        if (results[0].data?.length) {
          setAvgRating(Math.round(results[0].data.reduce((s: number, r: any) => s + r.rating, 0) / results[0].data.length))
          setRatingCount(results[0].data.length)
        }
        if (user) {
          setFavorited(!!results[1]?.data)
          if (results[2]?.data) setUserRating(results[2].data.rating)
        }
        if (results[user ? 3 : 1]?.data) setRelatedTools(results[user ? 3 : 1].data)
      } catch (e: any) { setError(e.message) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [toolId, user])

  async function handleRate(rating: number) {
    if (!user) { window.location.href = '/auth/login'; return }
    await supabase.from('user_ratings').upsert({ tool_id: toolId, user_id: user.id, rating, updated_at: new Date().toISOString() }, { onConflict: 'user_id,tool_id' })
    setUserRating(rating)
    const { data: rd } = await supabase.from('user_ratings').select('rating').eq('tool_id', toolId)
    if (rd?.length) { setAvgRating(Math.round(rd.reduce((s, r) => s + r.rating, 0) / rd.length)); setRatingCount(rd.length) }
  }

  async function toggleFavorite() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (favorited) { await supabase.from('favorites').delete().eq('tool_id', toolId).eq('user_id', user.id); setFavorited(false) }
    else { await supabase.from('favorites').insert({ tool_id: toolId, user_id: user.id }); setFavorited(true) }
  }

  if (loading) return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 60 }}>
      <div className="skeleton" style={{ height: 48, width: '60%' }} />
      <div className="skeleton" style={{ height: 24, width: '40%' }} />
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  )
  if (error || !tool) return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ color: '#a09baa', fontWeight: 500 }}>{error || '工具不存在'}</h2>
    </div>
  )

  const score = tool.overall_score || Math.round((tool.ease_score + tool.useful_score + tool.hype_score) / 3)
  const verdictBlocks = tool.verdict ? parseVerdict(tool.verdict) : []
  const evalImages = [
    { src: `/eval/${tool.name}/test-ui-input.png`, label: '📸 测试输入图', sub: '2240×1840 CodePal 仪表盘' },
    { src: `/eval/${tool.name}/bbox_preview.png`, label: '🔍 bbox 标注预览', sub: '8 个区域精确标注' },
    { src: `/eval/${tool.name}/code-preview.png`, label: '🖥️ 代码还原效果', sub: 'HTML/CSS 完整还原预览' },
  ]

  return (
    <div className="container fade-in" style={{ maxWidth: 960 }}>
      <Link href="/" style={{ color: '#6e6878', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#a09baa')}
        onMouseLeave={e => (e.currentTarget.style.color = '#6e6878')}>← 返回首页</Link>

      {/* HEADER */}
      <div className="card" style={{ marginBottom: 32, padding: '36px 32px', background: 'linear-gradient(135deg, rgba(0,200,232,0.04) 0%, rgba(0,230,118,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.02em' }}>{tool.name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {tool.url && <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn">🔗 访问工具</a>}
              {tool.source_url && <a href={tool.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">📰 {tool.source || '来源'}</a>}
              <button onClick={toggleFavorite} className={favorited ? 'btn' : 'btn btn-outline'} style={{ cursor: 'pointer' }}>{favorited ? '⭐ 已收藏' : '☆ 收藏'}</button>
            </div>
          </div>
          <div style={{ textAlign: 'center', background: `linear-gradient(135deg, ${score >= 8 ? 'rgba(0,230,118,0.1)' : 'rgba(255,171,0,0.1)'}, transparent)`, border: `1px solid ${score >= 8 ? 'rgba(0,230,118,0.2)' : 'rgba(255,171,0,0.2)'}`, borderRadius: 20, padding: '20px 32px', minWidth: 110 }}>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, background: `linear-gradient(135deg, ${score >= 8 ? '#00e676' : '#ffab00'}, ${score >= 8 ? '#00c8e8' : '#ff6d00'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score}</div>
            <div style={{ color: '#6e6878', fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.02em' }}>综合评分 / 10</div>
            {avgRating > 0 && <div style={{ color: '#ffab00', fontSize: 12, fontWeight: 600, marginTop: 8 }}>⭐ {avgRating} ({ratingCount} 人)</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
          {(tool.tags || []).map((tag, i) => <Link key={i} href={`/search?q=${encodeURIComponent(tag)}`} className="tag" style={{ textDecoration: 'none', border: '1px solid rgba(0,230,118,0.15)' }}>{tag}</Link>)}
          {tool.deploy_type && <span style={{ padding: '4px 12px', background: 'rgba(0,200,232,0.08)', color: '#00c8e8', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>{deployIcons[tool.deploy_type] || '📦'} {tool.deploy_type}</span>}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16, color: '#6e6878', fontSize: 13, fontWeight: 500, flexWrap: 'wrap' }}>
          {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()} stars</span>}
          {tool.license && <span>📜 {tool.license}</span>}
          {tool.price_model && <span>💰 {tool.price_model}</span>}
          {tool.commit_frequency && <span>📊 {tool.commit_frequency === 'high' ? '活跃更新' : tool.commit_frequency === 'medium' ? '稳健更新' : '低频更新'}</span>}
        </div>
      </div>

      {/* TWO COLUMN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 简介 */}
          <div className="card" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f0edf5', marginBottom: 12 }}>📝 工具简介</h2>
            <p style={{ color: '#a09baa', lineHeight: 1.8, fontSize: 14 }}>{tool.description}</p>
          </div>

          {/* 适用场景 */}
          {(tool.suitable_for || []).length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(255,171,0,0.12)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffab00', marginBottom: 12 }}>🎯 适用场景</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(tool.suitable_for || []).map((s, i) => (
                  <span key={i} style={{ padding: '8px 16px', background: 'rgba(255,171,0,0.06)', border: '1px solid rgba(255,171,0,0.15)', borderRadius: 20, color: '#ffab00', fontSize: 13, fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* 评测详情 */}
          {verdictBlocks.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(0,200,232,0.12)', background: 'linear-gradient(180deg, rgba(0,200,232,0.03) 0%, transparent 200px)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0edf5', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 32, height: 32, borderRadius: 8, background: 'rgba(0,200,232,0.12)', textAlign: 'center', lineHeight: '32px', fontSize: 16 }}>🔬</span> 评测详情
              </h2>
              {verdictBlocks.map((block, i) => {
                const isProcess = block.title.includes('流程'), isResult = block.title.includes('结果'), isTestImg = block.title.includes('测试图')
                const steps = isProcess ? block.content.split(/[;；]\s*(?=\d+\))/).filter(Boolean) : null
                return (
                  <div key={i} style={{ marginBottom: i < verdictBlocks.length - 1 ? 28 : 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', color: isProcess ? '#ffab00' : isResult ? '#00e676' : isTestImg ? '#ff9100' : '#a09baa' }}>
                      {isTestImg ? '📸' : isProcess ? '🔄' : isResult ? '✅' : '📋'} {block.title}
                    </h3>
                    {steps ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {steps.map((step, si) => {
                          const match = step.match(/^(\d+)\)(.+)/)
                          return (
                            <div key={si} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(255,171,0,0.1)', color: '#ffab00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{match?.[1] || si + 1}</div>
                              <span style={{ color: '#ccc', lineHeight: 1.7, fontSize: 14, paddingTop: 4 }}>{match?.[2] || step}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : <p style={{ color: '#ccc', lineHeight: 1.85, fontSize: 14 }}>{block.content}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* 测试截图 */}
          {tool.tested_at && (
            <div className="card" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0edf5', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 32, height: 32, borderRadius: 8, background: 'rgba(0,230,118,0.1)', textAlign: 'center', lineHeight: '32px', fontSize: 16 }}>🖼️</span> 测试截图
              </h2>
              <p style={{ color: '#6e6878', fontSize: 12, marginBottom: 20 }}>实测过程中全部截图 · 点击可查看原图</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {evalImages.map((img, i) => (
                  <a key={i} href={img.src} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', background: '#16161f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', textDecoration: 'none', transition: 'border-color 0.2s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c8e8'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                    <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative', background: 'repeating-conic-gradient(rgba(255,255,255,0.02) 0% 25%, transparent 0% 50%) 50% / 20px 20px' }}>
                      <img src={img.src} alt={img.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                    </div>
                    <div style={{ padding: '8px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f0edf5' }}>{img.label}</div>
                      <div style={{ fontSize: 10, color: '#6e6878', marginTop: 2 }}>{img.sub}</div>
                    </div>
                  </a>
                ))}
              </div>

              {/* 在线还原预览 — 整张卡片可点击 */}
              <a href={`/eval/${tool.name}/dashboard-code.html`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 20, textDecoration: 'none', border: '1px solid rgba(0,200,232,0.15)', borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s', background: '#0a0c0e' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#00c8e8')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,200,232,0.15)')}>
                <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,232,0.06)', borderBottom: '1px solid rgba(0,200,232,0.08)' }}>
                  <span style={{ fontSize: 16 }}>🖥️</span>
                  <span style={{ color: '#00c8e8', fontWeight: 600, fontSize: 13, flex: 1 }}>在线预览 · 点击新标签打开完整页面</span>
                  <span style={{ color: '#6e6878', fontSize: 11 }}>↗ 打开</span>
                </div>
                <iframe src={`/eval/${tool.name}/dashboard-code.html`}
                  style={{ width: '100%', height: 400, border: 'none', display: 'block', pointerEvents: 'none' }}
                  title="代码还原预览" loading="lazy" />
              </a>
            </div>
          )}

          {/* 优缺点 */}
          {(tool.pros?.length > 0 || tool.cons?.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: `${(tool.pros?.length && tool.cons?.length) ? '1fr 1fr' : '1fr'}`, gap: 16 }}>
              {tool.pros?.length > 0 && (
                <div className="card" style={{ border: '1px solid rgba(0,230,118,0.15)', background: 'linear-gradient(180deg, rgba(0,230,118,0.03) 0%, transparent 60px)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#00e676', marginBottom: 14 }}>✅ 实测优点</h3>
                  <ul style={{ paddingLeft: 16, color: '#ccc', fontSize: 13, lineHeight: 2, margin: 0 }}>{tool.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              )}
              {tool.cons?.length > 0 && (
                <div className="card" style={{ border: '1px solid rgba(255,82,82,0.15)', background: 'linear-gradient(180deg, rgba(255,82,82,0.02) 0%, transparent 60px)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ff5252', marginBottom: 14 }}>❌ 不足</h3>
                  <ul style={{ paddingLeft: 16, color: '#ccc', fontSize: 13, lineHeight: 2, margin: 0 }}>{tool.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* 用户评分 */}
          <div className="card" style={{ border: '1px solid rgba(255,171,0,0.12)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffab00', marginBottom: 12 }}>⭐ 你的评分</h3>
            {avgRating > 0 && <p style={{ color: '#6e6878', fontSize: 12, marginBottom: 10 }}>当前平均 {avgRating} 分（{ratingCount} 人评分）</p>}
            <StarRating value={userRating} onChange={handleRate} />
            {userRating > 0 && <p style={{ color: '#00e676', fontSize: 12, fontWeight: 500, marginTop: 10 }}>✓ 已提交 {userRating} 星评分</p>}
            {!user && <p style={{ color: '#6e6878', fontSize: 12, marginTop: 10 }}><Link href="/auth/login" style={{ color: '#00c8e8', textDecoration: 'underline' }}>登录</Link> 后可参与评分</p>}
          </div>

          {/* 分享 */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: '#6e6878', fontSize: 12, fontWeight: 500 }}>分享：</span>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tool.name + ' - AI 工具评测')}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '6px 14px', background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.2)', borderRadius: 6, color: '#1da1f2', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>𝕏 Twitter</a>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); alert('链接已复制！') }}
              style={{ padding: '6px 14px', background: 'rgba(0,200,232,0.08)', border: '1px solid rgba(0,200,232,0.15)', borderRadius: 6, color: '#00c8e8', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif' }}>📋 复制链接</button>
          </div>
        </div>

        {/* 右侧栏 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>
          {(tool.ease_score > 0 || tool.useful_score > 0 || tool.hype_score > 0) && (
            <div className="card" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0edf5', marginBottom: 16 }}>📊 多维评分</h3>
              <ScoreBar label="🟢 易用性" score={tool.ease_score} accent="#00c8e8" />
              <ScoreBar label="🔵 实用性" score={tool.useful_score} accent="#00e676" />
              <ScoreBar label="🟡 热度" score={tool.hype_score} accent="#ffab00" />
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
                <ScoreBar label="⭐ 综合" score={score} accent={score >= 8 ? '#00e676' : '#ffab00'} />
              </div>
            </div>
          )}
          {tool.tested_at && (
            <div className="card" style={{ border: '1px solid rgba(0,230,118,0.12)', background: 'linear-gradient(135deg, rgba(0,230,118,0.04), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧪</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#00e676', marginBottom: 2 }}>已实测验证</div>
                  <div style={{ color: '#6e6878', fontSize: 11, lineHeight: 1.4 }}>{new Date(tool.tested_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          )}
          {relatedTools.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0edf5', marginBottom: 14 }}>🔗 相关工具</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {relatedTools.map((rt: any) => (
                  <Link key={rt.id} href={`/tools/${rt.name}-${rt.id.slice(0, 8)}`}
                    style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', color: '#ccc', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#00c8e8')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{rt.name}</div>
                    <div style={{ fontSize: 11, color: '#6e6878', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rt.description?.slice(0, 50)}...</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: '#6e6878' }}>
                      {rt.stars > 0 && <span>⭐ {rt.stars}</span>}
                      {rt.overall_score > 0 && <span style={{ color: '#00e676', fontWeight: 600 }}>📊 {rt.overall_score}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
