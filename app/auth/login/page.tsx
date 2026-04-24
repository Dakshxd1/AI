'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setDebug(`URL: ${url ? url.slice(0,30)+'...' : 'MISSING'} | KEY: ${key ? key.slice(0,20)+'...' : 'MISSING'}`)
  }, []) // ❌ REMOVE params

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
  
    console.log("CLICKED LOGIN")
    console.log("EMAIL:", email)
    console.log("PASSWORD:", password)
  
    setLoading(true)
    setError('')
  
    try {
      const supabase = createClient()
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
  
      console.log("RESPONSE:", { data, error })
  
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data?.user) {
        console.log("SUCCESS LOGIN")
        window.location.href = '/chat'
      } else {
        setError('No user returned')
        setLoading(false)
      }
    } catch (err: any) {
      console.error("EXCEPTION:", err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Massai Chat
        </Link>
        <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
      </div>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
      <form onSubmit={handleLogin} noValidate className="space-y-4">
          {debug && (
            <div className="bg-gray-800 text-gray-400 text-xs rounded-lg px-3 py-2 break-all">
              {debug}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-gray-600 mt-4">
        No account? <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">Sign up free</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
