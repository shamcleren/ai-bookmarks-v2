'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (e: any) {
      setError(e.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleGitHubLogin() {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (e: any) {
      setError(e.message || '登录失败')
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, paddingTop: 80 }}>
      <h1 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: 40 }}>登录</h1>

      {error && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b', borderRadius: 10, padding: 15, marginBottom: 20, color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff88', borderRadius: 10, padding: 15, marginBottom: 20, color: '#00ff88' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#888' }}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 16,
            }}
          />
        </div>

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#888' }}>密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 16,
            }}
          />
        </div>

        <button type="submit" disabled={loading} className="btn" style={{ width: '100%' }}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div style={{ margin: '30px 0', textAlign: 'center', color: '#666' }}>或</div>

      <button onClick={handleGitHubLogin} disabled={loading} className="btn btn-outline" style={{ width: '100%' }}>
        🐙 GitHub 登录
      </button>

      <p style={{ textAlign: 'center', marginTop: 30, color: '#666' }}>
        还没有账号？<Link href="/auth/register">注册</Link>
      </p>
    </div>
  )
}
