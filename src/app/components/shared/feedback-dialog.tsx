"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { MessageSquarePlus, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

export function FeedbackDialog({ onOpen }: { onOpen?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState("suggestion")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (message.length < 10) {
      toast.error("Mensagem muito curta", {
        description: "Por favor, descreva com mais detalhes (mínimo 10 caracteres)."
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao enviar")
      }

      toast.success("Feedback enviado!", {
        description: "Obrigado por contribuir com o Penochão."
      })
      setOpen(false)
      setMessage("")
      setType("suggestion")
    } catch (error) {
      toast.error("Erro ao enviar", {
        description: "Tente novamente mais tarde."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (val && onOpen) onOpen()
    }}>
      <DialogTrigger asChild>
        <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-accent/50 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <MessageSquarePlus className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
          Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Enviar Feedback
          </DialogTitle>
          <DialogDescription>
            Encontrou um bug ou tem uma sugestão? Conte para nós para melhorarmos o Penochão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggestion">💡 Sugestão</SelectItem>
                <SelectItem value="bug">🐛 Bug / Erro</SelectItem>
                <SelectItem value="other">📝 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Descreva sua sugestão ou o erro encontrado..."
              className="min-h-[120px] resize-none"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/10 min
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || message.length < 10} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
