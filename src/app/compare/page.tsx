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
  license: string
  price_model: string
  deploy_type: string
  platform: string
  commit_frequency: string
  overall_score: number
  ease_score: number
  useful_score: number
  hype_score: number
  verdict: string
  suitable_for: string[]
}

const COMPARE_KEYS: { key: string; label: string; format: (v: any) => string }[] = [
  { key: 'stars', label: 'GitHub Stars', format: (v) => v > 0 ? v.toLocaleString() : '-' },
  { key: 'overall_score', label: '综合评分', format: (v) => v > 0 ? `${v}/100` : '-' },
  { key: 'license', label: '许可证', format: (v) => v || '-' },
  { key: 'price_model', label: '价格模式', format: (v) => v || '-' },
  { key: 'deploy_type', label: '部署方式', format: (v) => v || '-' },
  { key: 'platform', label: '支持平台', format: (v) => v || '-' },
  { key: 'commit_frequency', label: '活跃度', format: (v) => v === 'high' ? '🟢 活跃' : v === 'medium' ? '🟡 一般' : v === 'low' ? '🔴 冷清' : '-' },
  { key: 'ease_score', label: '易用性', format: (v) => v > 0 ? `${v}/100` : '-' },
  { key: 'useful_score', label: '有用性', format: (v) => v > 0 ? `${v}/100` : '-' },
  { key: 'hype_score', label: '热度', format: (v) => v > 0 ? `${v}/100` : '-' },
]

function getDeployIcon(type: string) {
  switch (type) {
    case 'local': return '🖥️'
    case 'cloud': return '☁️'
    case 'api': return '🔌'
    case 'browser': return '🌐'
    default: return '📦'
  }
}

function CompareContent() {
  const searchParams = useSearchParams()
  const toolIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (toolIds.length === 0) {
      setLoading(false)
      return
    }

    async function fetchTools() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .in('id', toolIds)

        if (error) throw error
        const sorted = toolIds.map(id => data?.find((t: any) => t.id === id)).filter(Boolean) as Tool[]
        setTools(sorted)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [toolIds])

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>
  }

  if (tools.length < 2) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ marginBottom: 20 }}>请至少选择 2 个工具进行对比</h2>
        <Link href="/" className="btn">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Link href="/" style={{ color: '#666', fontSize: 14 }}>← 返回首页</Link>
        <h1 style={{ fontSize: '1.5rem' }}>🔍 工具对比</h1>
        <div />
      </div>

      {/* Tool Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${tools.length}, 1fr)`, gap: 2, marginBottom: 2 }}>
        <div />
        {tools.map(tool => (
          <div key={tool.id} style={{
            background: 'rgba(0,217,255,0.1)',
            border: '1px solid rgba(0,217,255,0.2)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 8, color: '#00d9ff' }}>{tool.name}</h3>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffc107' }}>
              {tool.overall_score || '-'}
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>综合评分</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(tool.tags || []).slice(0, 2).map(tag => (
                <span key={tag} className="tag" style={{ fontSize: 11 }}>{tag}</span>
              ))}
            </div>
            {tool.deploy_type && <span style={{ fontSize: 16, marginTop: 8, display: 'block' }}>{getDeployIcon(tool.deploy_type)}</span>}
          </div>
        ))}
      </div>

      {/* Compare Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, overflow: 'hidden' }}>
        {COMPARE_KEYS.map(({ key, label, format }) => (
          <div key={key} style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${tools.length}, 1fr)`,
            gap: 2,
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ paddingLeft: 20, color: '#888', fontSize: 13, display: 'flex', alignItems: 'center' }}>
              {label}
            </div>
            {tools.map(tool => {
              const value = (tool as any)[key]
              const isHigh = value && typeof value === 'number' && value >= 80
              const isLow = value && typeof value === 'number' && value < 40 && value > 0
              return (
                <div key={tool.id} style={{
                  textAlign: 'center',
                  fontSize: 14,
                  color: isHigh ? '#00ff88' : isLow ? '#ff6b6b' : '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {format(value)}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 适合人群 */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ color: '#ffc107', marginBottom: 16 }}>👤 适合人群</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${tools.length}, 1fr)`, gap: 2 }}>
          <div />
          {tools.map(tool => (
            <div key={tool.id} style={{ textAlign: 'center', fontSize: 13, color: '#ccc' }}>
              {(tool.suitable_for || []).join(', ') || '-'}
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ color: '#00d9ff', marginBottom: 16 }}>💬 评测结论</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tools.length}, 1fr)`, gap: 16 }}>
          {tools.map(tool => (
            <div key={tool.id} style={{
              background: 'rgba(0,217,255,0.05)',
              border: '1px solid rgba(0,217,255,0.1)',
              borderRadius: 12,
              padding: 16,
              fontSize: 13,
              color: '#aaa',
              fontStyle: 'italic'
            }}>
              {tool.verdict || '暂无评测结论'}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 40,
        background: 'linear-gradient(135deg, rgba(0,217,255,0.1) 0%, rgba(0,255,136,0.05) 100%)',
        border: '1px solid rgba(0,217,255,0.2)',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#00d9ff', marginBottom: 16 }}>📝 对比总结</h3>
        <p style={{ color: '#ccc', lineHeight: 1.8 }}>
          {tools.length === 2 ? (
            <>
              {tools[0].name} 和 {tools[1].name} 各有优势：
              {(tools[0].overall_score || 0) > (tools[1].overall_score || 0) ? ` ${tools[0].name} 综合评分更高，` : ` ${tools[1].name} 综合评分更高，`}
              {tools[0].stars > tools[1].stars ? `但 ${tools[0].name} 更受欢迎。` : `但 ${tools[1].name} 更受欢迎。`}
            </>
          ) : (
            `三个工具综合来看，${tools.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0].name} 评分最高。`
          )}
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {tools.map(tool => (
            <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="btn">
              🔗 {tool.name.split('/')[0]}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Compare() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>加载中...</div>}>
      <CompareContent />
    </Suspense>
  )
}
