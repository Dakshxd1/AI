import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const SYSTEM_PROMPT = "You are Massai, a helpful, friendly, and knowledgeable AI assistant. Give clear, well-structured responses. Use markdown formatting (code blocks, lists, headers) when it improves clarity."

async function callGemini(messages: Array<{ role: string; content: string }>) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not configured')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gemini error: ${err?.error?.message || res.statusText}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
}

async function callGroq(messages: Array<{ role: string; content: string }>) {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_tokens: 1500,
      temperature: 0.7
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Groq error: ${err?.error?.message || res.statusText}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response.'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { messages, provider, conversationId, userMessage } = body

    if (!messages?.length || !provider || !userMessage) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Upsert conversation
    let convId = conversationId
    if (!convId) {
      const { data } = await supabase.from('conversations')
        .insert({ user_id: user.id, title: userMessage.slice(0, 55), ai_provider: provider })
        .select('id').single()
      convId = data?.id
    }

    // Save user message
    if (convId) {
      await supabase.from('messages').insert({ conversation_id: convId, role: 'user', content: userMessage })
    }

    // Get AI reply
    const reply = provider === 'groq' ? await callGroq(messages) : await callGemini(messages)

    // Save AI reply
    if (convId) {
      await supabase.from('messages').insert({ conversation_id: convId, role: 'assistant', content: reply })
    }

    return NextResponse.json({ reply, conversationId: convId })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
