'use client'
export const dynamic = 'force-dynamic'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CheckEmailPage() {
  const params = useSearchParams()
  const email = params.get('email') || ''

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400 text-sm mb-2">
          Confirmation sent to <strong className="text-white">{email}</strong>
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Click the link in the email to activate your account. Check spam if you don't see it.
        </p>
        <Link href="/auth/login" className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
