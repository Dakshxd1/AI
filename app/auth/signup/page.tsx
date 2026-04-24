'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    // First try to sign in — if account already exists this works directly
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (!signInError) {
      router.push('/chat')
      router.refresh()
      return
    }

    // Account doesn't exist — create it
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      // 422 = user exists with different password
      if (signUpError.message.includes('already registered') || signUpError.status === 422) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // If we have a session immediately, email confirm is disabled
    if (data.session) {
      router.push('/chat')
      router.refresh()
      return
    }

    // Email confirmation required
    router.push('/auth/check-email?email=' + encodeURIComponent(email))
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Massai Chat
          </Link>
          <p className="text-gray-500 text-sm mt-2">Create your free account</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2">
                {error}
                {error.includes('already exists') && (
                  <Link href="/auth/login" className="block mt-1 text-indigo-400 underline">→ Go to sign in</Link>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="Min 6 characters"
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
