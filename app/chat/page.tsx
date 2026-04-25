'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ChatUI from '@/components/ChatUI'

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth/login')
      } else {
        setUser(data.user)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>
  }

  return (
    <ChatUI
      user={{ id: user.id, email: user.email }}
      initialConversations={[]}
    />
  )
}