"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Como funciona a leitura de faturas com IA?",
    answer: "Você envia o PDF da sua fatura (de cartão, conta de luz, etc) e nossa inteligência artificial extrai automaticamente os valores, datas e descrições. Em segundos, seus gastos são categorizados e adicionados ao seu controle financeiro.",
  },
  {
    question: "Meus dados financeiros estão seguros?",
    answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados com terceiros e você pode excluir sua conta a qualquer momento.",
  },
  {
    question: "Posso usar o Penochão gratuitamente?",
    answer: "Sim! O plano Free oferece todas as funcionalidades essenciais para controlar suas finanças. Você pode fazer upgrade para o Pro quando precisar de recursos avançados como faturas ilimitadas com IA e exportação de relatórios.",
  },
  {
    question: "Como funciona a cobrança do plano Pro?",
    answer: "Você pode escolher entre pagamento mensal (R$ 19,90/mês) ou anual (R$ 190,00/ano, equivalente a R$ 15,83/mês). O pagamento é processado de forma segura pelo Stripe. Você pode cancelar a qualquer momento.",
  },
  {
    question: "Posso cancelar minha assinatura?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento diretamente nas configurações da sua conta. Não há fidelidade ou multas. Após o cancelamento, você continua com acesso até o fim do período já pago.",
  },
  {
    question: "O Penochão funciona no celular?",
    answer: "Sim! Nossa interface é totalmente responsiva e funciona perfeitamente em smartphones, tablets e computadores. Você pode acessar suas finanças de qualquer dispositivo com navegador.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o Penochão
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-background border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      openIndex === index && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    openIndex === index ? "max-h-96" : "max-h-0"
                  )}
                >
                  <p className="px-6 pb-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
