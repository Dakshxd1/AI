"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };
type Conv = {
  id: string;
  title: string;
  ai_provider: string;
  created_at: string;
};

function md(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /```(\w*)\n?([\s\S]*?)```/g,
      (_: string, lang: string, code: string) =>
        `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
    )
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>");
}

interface Props {
  user: { id: string; email: string };
  initialConversations: Conv[];
}

export default function ChatUI({ user, initialConversations }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "groq">("gemini");
  const [convId, setConvId] = useState<string | null>(null);
  const [convs, setConvs] = useState<Conv[]>(initialConversations);
  const [sidebar, setSidebar] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const loadConv = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("messages")
        .select("role,content")
        .eq("conversation_id", id)
        .order("created_at");
      if (data) {
        setMsgs(data as Msg[]);
        setConvId(id);
        setMobileMenu(false);
      }
    },
    [supabase]
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const newChat = () => {
    setMsgs([]);
    setConvId(null);
    setMobileMenu(false);
  };

  const refreshConvs = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id,title,ai_provider,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setConvs(data);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    setTyping(true);
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(history);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setTyping(false);
        setLoading(false);
        setMsgs((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Session expired. Please login again.",
          },
        ]);
        return;
      }
      console.log("TOKEN:", session?.access_token)
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`, // ✅ CRITICAL FIX
        },
        body: JSON.stringify({
          messages: history,
          provider,
          conversationId: convId,
          userMessage: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setTyping(false);
      setMsgs((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.conversationId && !convId) {
        setConvId(data.conversationId);
        await refreshConvs();
      }
    } catch (e) {
      setTyping(false);
      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${
            e instanceof Error ? e.message : "Something went wrong"
          }`,
        },
      ]);
    } finally {
      setLoading(false);
      textRef.current?.focus();
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2 px-1 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            M
          </div>
          <span className="font-bold text-white text-sm">Massai Chat</span>
        </div>
        <button
          onClick={newChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
        {convs.length === 0 ? (
          <p className="text-xs text-gray-700 px-2 py-2">No chats yet</p>
        ) : (
          convs.map((c) => (
            <button
              key={c.id}
              onClick={() => loadConv(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate mb-0.5 transition ${
                convId === c.id
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <span className="block truncate">{c.title || "Untitled"}</span>
              <span className="text-xs opacity-60 capitalize">
                {c.ai_provider}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
            {user.email[0].toUpperCase()}
          </div>
          <span className="text-xs text-gray-500 truncate flex-1">
            {user.email}
          </span>
          <button
            onClick={signOut}
            title="Sign out"
            className="text-gray-700 hover:text-gray-400 transition flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-gray-900 border-r border-white/5 flex-shrink-0 transition-all duration-200 ${
          sidebar ? "w-60" : "w-0 overflow-hidden"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenu(false)}
          />
          <aside className="relative flex flex-col w-64 bg-gray-900 border-r border-white/5 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 bg-gray-950 flex-shrink-0">
          <button
            onClick={() => {
              setSidebar(!sidebar);
              setMobileMenu(!mobileMenu);
            }}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          <span className="text-sm font-semibold text-white hidden sm:block">
            Massai Chat
          </span>
          <div className="flex-1" />

          {/* Provider toggle */}
          <div className="flex items-center bg-gray-900 border border-white/10 rounded-full p-0.5 text-xs">
            <button
              onClick={() => setProvider("gemini")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                provider === "gemini"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ✦ Gemini
            </button>
            <button
              onClick={() => setProvider("groq")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                provider === "groq"
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ⚡ Groq
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {msgs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                Ask Massai anything
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Using{" "}
                {provider === "gemini" ? "Google Gemini Flash" : "Groq Llama 3"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  "Explain async/await in JS",
                  "Write a Python web scraper",
                  "What is RAG in AI?",
                  "Debug my React code",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0 mt-0.5">
                      M
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5"
                        : "text-gray-200"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div
                        className="prose-chat"
                        dangerouslySetInnerHTML={{ __html: md(m.content) }}
                      />
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                </div>
              ))}

              {typing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                    M
                  </div>
                  <div className="bg-gray-800 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-1" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-3" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/5 bg-gray-950 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex gap-2 items-end bg-gray-900 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-indigo-500/50 transition">
            <textarea
              ref={textRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              disabled={loading}
              placeholder={`Message Massai via ${
                provider === "gemini" ? "Gemini" : "Groq"
              }…`}
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none max-h-28 leading-relaxed"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-700 text-center mt-1.5">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
