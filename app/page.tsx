export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/chat')

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Powered by Gemini &amp; Groq
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
          Massai{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Chat
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Your personal AI assistant. Smart, fast, and always available. Switch between Gemini and Groq anytime.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Start for free →
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '⚡', label: 'Groq Llama 3', sub: 'Ultra fast' },
            { icon: '✦', label: 'Gemini Flash', sub: 'Most capable' },
            { icon: '🔒', label: 'Secure', sub: 'Auth + history' },
          ].map(f => (
            <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm font-medium text-white">{f.label}</div>
              <div className="text-xs text-gray-500">{f.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
