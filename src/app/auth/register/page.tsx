'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      setMessage('注册成功！请查收验证邮件')
    } catch (e: any) {
      setError(e.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, paddingTop: 80 }}>
      <h1 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: 40 }}>注册</h1>

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

      <form onSubmit={handleRegister}>
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
            minLength={6}
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
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 30, color: '#666' }}>
        已有账号？<Link href="/auth/login">登录</Link>
      </p>
    </div>
  )
}
