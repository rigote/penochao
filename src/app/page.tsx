import { Metadata } from "next"
import { Header, Hero, Features, Pricing, FAQ, CTA, Footer } from "@/app/components/landing"
import { FAQJsonLd } from "@/app/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Penochão - Controle Financeiro Inteligente com IA",
  description: "Organize suas finanças sem complicação. Gerencie despesas, acompanhe receitas e tenha uma visão clara do seu dinheiro. Nossa IA lê suas faturas automaticamente.",
  keywords: [
    "controle financeiro",
    "organizar finanças",
    "leitura de faturas com IA",
    "dashboard financeiro",
    "gestão de despesas",
    "categorização automática",
    "finanças pessoais",
    "app financeiro",
  ],
  alternates: {
    canonical: "https://penochao.app.br",
  },
}

const faqItems = [
  {
    question: "Como funciona a leitura de faturas com IA?",
    answer: "Basta fazer upload do PDF da sua fatura (cartão de crédito, contas de consumo, etc) e nossa IA extrai automaticamente todas as transações, categorizando cada uma delas.",
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Sim! Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são tratados com total confidencialidade.",
  },
  {
    question: "Posso usar o Penochão gratuitamente?",
    answer: "Sim! O plano gratuito inclui dashboard completo, categorias personalizadas e até 3 leituras de faturas com IA por mês.",
  },
  {
    question: "Qual a diferença do plano Pro?",
    answer: "O plano Pro oferece leitura ilimitada de faturas com IA, exportação de relatórios em PDF e Excel, suporte prioritário e acesso antecipado a novos recursos.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Você pode cancelar sua assinatura a qualquer momento. Se cancelar nos primeiros 7 dias, reembolsamos 100% do valor.",
  },
  {
    question: "Funciona em dispositivos móveis?",
    answer: "Sim! O Penochão é totalmente responsivo e funciona perfeitamente em smartphones, tablets e computadores.",
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <FAQJsonLd faqs={faqItems} />
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
