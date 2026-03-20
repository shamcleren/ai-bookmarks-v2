'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Tool {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  stars: number
  created_at: string
}

interface FavoriteWithTool {
  id: string
  tool: any  // Supabase returns the joined tool data
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteWithTool[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (!user) {
          setLoading(false)
          return
        }

        // Get favorites with tool data
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            tool:tools(*)
          `)
          .eq('user_id', user.id)

        if (error) throw error
        setFavorites(data || [])
      } catch (e: any) {
        console.error('Error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  async function removeFavorite(favoriteId: string) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)

      if (error) throw error
      setFavorites(favorites.filter(f => f.id !== favoriteId))
    } catch (e) {
      console.error('Error removing favorite:', e)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', color: '#666', padding: 60 }}>
        加载中...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ marginBottom: 20 }}>登录后查看收藏</h2>
        <Link href="/auth/login" className="btn">登录</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.8rem', marginBottom: 30 }}>⭐ 我的收藏</h1>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: 60 }}>
          <p style={{ marginBottom: 20 }}>还没有收藏任何工具</p>
          <Link href="/" className="btn">去首页看看</Link>
        </div>
      ) : (
        <div>
          {favorites.map(fav => (
            <div key={fav.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 17, marginBottom: 8 }}>
                    <a href={fav.tool.url} target="_blank" rel="noopener noreferrer">
                      {fav.tool.name}
                    </a>
                  </h3>
                  <p style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>
                    {fav.tool.description?.slice(0, 100)}...
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(fav.tool.tags || []).map((tag: string, i: number) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(fav.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ff6b6b',
                    color: '#ff6b6b',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  取消收藏
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
