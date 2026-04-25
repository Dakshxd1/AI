export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ChatUI from '@/components/ChatUI'

export default async function ChatPage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("SERVER USER:", user)

  // ✅ REAL PROTECTION (IMPORTANT)
  if (!user) {
    redirect('/auth/login')
  }

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, title, ai_provider, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <ChatUI
      user={{ id: user.id, email: user.email ?? '' }}
      initialConversations={conversations ?? []}
    />
  )
}