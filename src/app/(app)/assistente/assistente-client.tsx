"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Sparkles, Send, Bot, Trash2, ArrowDownCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "model"
  content: string
  timestamp: string
}

const QUICK_SUGGESTIONS = [
  "Como cortar gastos supérfluos este mês?",
  "Minhas finanças estão sob controle? Dê um diagnóstico.",
  "Dicas para eu criar minha reserva de emergência.",
  "Estou gastando muito. Onde posso reduzir?"
]

const ASSISTANT_NAME = "Pézinho"

interface AssistenteClientProps {
  userName: string | null
  userImage: string | null
  userEmail: string | null
}

function getFirstName(userName: string | null) {
  return userName?.trim().split(" ")[0] || "tudo bem"
}

function getUserInitials(userName: string | null, userEmail: string | null) {
  const source = userName?.trim() || userEmail?.trim() || "?"
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

function createWelcomeMessage(userName: string | null) {
  return `Olá, ${getFirstName(userName)}! Sou o **${ASSISTANT_NAME}**, seu consultor financeiro pessoal com IA. Consigo ver seu panorama consolidado de entradas e gastos por categoria deste mês. Como posso te ajudar hoje?`
}

function replaceLegacyAssistantName(content: string, userName: string | null) {
  return content
    .replace(/Pé no Chão GPB/g, ASSISTANT_NAME)
    .replace(
      /^Olá! Histórico apagado\. Sou o \*\*Pézinho\*\*/,
      `Olá, ${getFirstName(userName)}! Sou o **${ASSISTANT_NAME}**`
    )
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-7">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-3 list-disc space-y-2 pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-3 list-decimal space-y-2 pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="pl-1 leading-7">{children}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
}

export function AssistenteClient({ userName, userImage, userEmail }: AssistenteClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userNameRef = useRef(userName)
  const userInitials = getUserInitials(userName, userEmail)

  // Hydration safety: only read from localStorage on client-side mount
  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem("penochao-assistant-chat")
    if (saved) {
      try {
        const parsedMessages = JSON.parse(saved) as Message[]
        setMessages(
          parsedMessages.map((message) => ({
            ...message,
            content: replaceLegacyAssistantName(message.content, userNameRef.current),
          }))
        )
      } catch (e) {
        console.error("Failed to parse saved chat messages", e)
      }
    } else {
      // First welcome message
      setMessages([
        {
          role: "model",
          content: createWelcomeMessage(userNameRef.current),
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }
      ])
    }
  }, [])

  // Save messages to localStorage when updated
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("penochao-assistant-chat", JSON.stringify(messages))
    }
  }, [messages, isMounted])

  // Scroll to bottom automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return

    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const historyToSend = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyToSend })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro no assistente")
      }

      const data = await response.json()
      
      const assistantMsg: Message = {
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
      console.error("Chat error:", error)
      toast.error(error.message || "Houve um erro ao conversar com a IA. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    if (window.confirm("Deseja apagar o histórico de conversas com o assistente?")) {
      const defaultWelcome: Message[] = [
        {
          role: "model",
          content: createWelcomeMessage(userName),
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }
      ]
      setMessages(defaultWelcome)
      localStorage.setItem("penochao-assistant-chat", JSON.stringify(defaultWelcome))
      toast.success("Histórico limpo!")
    }
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              Assistente IA
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-sm">Seu consultor financeiro pessoal</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={clearChat}
          className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:text-red-500"
          title="Limpar Histórico"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Chat Interface */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col h-[60vh] sm:h-[65vh]">
        
        {/* Messages Body */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${
                  msg.role === "user"
                    ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                    : "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600"
                }`}
              >
                {msg.role === "user" ? (
                  userImage ? (
                    <Image
                      src={userImage}
                      alt={userName ? `Foto de ${userName}` : "Foto do usuário"}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold">{userInitials}</span>
                  )
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Content Bubble */}
              <div className="space-y-1">
                <div
                  className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-zinc-800 text-foreground border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none"
                  }`}
                >
                  <div className={`prose prose-sm dark:prose-invert max-w-none 
                      ${msg.role === "user" ? "prose-headings:text-white prose-p:text-white" : "prose-p:text-foreground"}
                      text-sm leading-7
                    `}>
                    <ReactMarkdown components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <p className={`text-[10px] text-muted-foreground ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[75%] mr-auto">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800 text-foreground border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none shadow-sm flex items-center gap-1.5 py-3">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggestion Quick Pills - Only visible when conversation is quiet */}
        {messages.length <= 2 && !loading && (
          <div className="px-6 pb-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Sugestões Rápidas:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  className="text-xs px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 text-muted-foreground font-medium border border-zinc-200 dark:border-zinc-800 rounded-full transition-all text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer input form */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(input)
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao assistente... (ex: Como economizar no cartão?)"
              className="flex-1 rounded-xl h-11 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-visible:ring-purple-500/20 focus-visible:ring-2 focus-visible:border-purple-600"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="rounded-xl h-11 w-11 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/10 hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
