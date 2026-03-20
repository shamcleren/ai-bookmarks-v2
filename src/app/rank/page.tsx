'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { nameToSlug } from '@/lib/utils'

interface Tool {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  stars: number
  ease_score: number
  useful_score: number
  hype_score: number
}

type SortKey = 'stars' | 'score'

export default function Rank() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>('stars')
  const supabase = createClient()

  useEffect(() => {
    async function fetchTools() {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setTools(data || [])
      } catch (e) {
        console.error('Error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [])

  const sortedTools = [...tools].sort((a, b) => {
    if (sortBy === 'stars') {
      return b.stars - a.stars
    } else {
      const scoreA = a.ease_score + a.useful_score + a.hype_score
      const scoreB = b.ease_score + b.useful_score + b.hype_score
      return scoreB - scoreA
    }
  }).filter(t => t.stars > 0 || t.ease_score + t.useful_score + t.hype_score > 0)

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>
        加载中...
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.8rem', marginBottom: 30 }}>🏆 排行榜</h1>

      <div style={{ display: 'flex', gap: 15, marginBottom: 30 }}>
        <button
          onClick={() => setSortBy('stars')}
          className={sortBy === 'stars' ? 'btn' : 'btn btn-outline'}
        >
          ⭐ GitHub Stars
        </button>
        <button
          onClick={() => setSortBy('score')}
          className={sortBy === 'score' ? 'btn' : 'btn btn-outline'}
        >
          📊 评测评分
        </button>
      </div>

      {sortedTools.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          暂无数据
        </div>
      ) : (
        <div>
          {sortedTools.slice(0, 20).map((tool, idx) => {
            const totalScore = tool.ease_score + tool.useful_score + tool.hype_score
            const avgScore = totalScore > 0 ? Math.round(totalScore / 3) : 0

            return (
              <div key={tool.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: idx < 3 ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: idx < 3 ? '#ffc107' : '#666',
                  }}>
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 6 }}>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer">
                        {tool.name}
                      </a>
                    </h3>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666' }}>
                      {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
                      {totalScore > 0 && <span className="stars">★ {avgScore}/5</span>}
                    </div>
                  </div>

                  <Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: '#00d9ff', fontSize: 13 }}>
                    查看 →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
