import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

const SYSTEM_PROMPT =
  "You are Massai, a helpful, friendly, and knowledgeable AI assistant. Give clear, well-structured responses. Use markdown formatting (code blocks, lists, headers) when it improves clarity."

/* ---------------- GEMINI ---------------- */
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
    throw new Error(err?.error?.message || res.statusText)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
}

/* ---------------- GROQ ---------------- */
async function callGroq(messages: Array<{ role: string; content: string }>) {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 1500,
      temperature: 0.7
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || res.statusText)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response.'
}

/* ---------------- API ---------------- */
export async function POST(req: NextRequest) {
  try {
    // ✅ GET TOKEN FROM HEADER
    const authHeader = headers().get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // ✅ CREATE SUPABASE WITH TOKEN
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`, // 🔥 IMPORTANT
          },
        },
      }
    )

    // ✅ GET USER
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("API USER:", user)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ BODY
    const body = await req.json()
    const { messages, provider, conversationId, userMessage } = body

    if (!messages?.length || !provider || !userMessage) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // ✅ CREATE CONVERSATION
    let convId = conversationId

    if (!convId) {
      const { data } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: userMessage.slice(0, 55),
          ai_provider: provider,
        })
        .select('id')
        .single()

      convId = data?.id
    }

    // ✅ SAVE USER MESSAGE
    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'user',
        content: userMessage,
      })
    }

    // ✅ AI RESPONSE
    const reply =
      provider === 'groq'
        ? await callGroq(messages)
        : await callGemini(messages)

    // ✅ SAVE AI MESSAGE
    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: reply,
      })
    }

    return NextResponse.json({ reply, conversationId: convId })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}