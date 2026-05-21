import { Metadata } from "next"
import { Header, Hero, Features, Pricing, FAQ, CTA, Footer } from "@/app/components/landing"
import { FAQJsonLd } from "@/app/components/seo/json-ld"
import { PRO_TRIAL_DAYS } from "@/config/plans"

export const metadata: Metadata = {
  title: "Penochão - Saia das Dívidas com Diagnóstico Financeiro e IA",
  description: "Organize entradas, despesas e dívidas. Veja o que está travando sua vida financeira e receba um plano realista para sair do aperto.",
  keywords: [
    "sair das dívidas",
    "controle financeiro",
    "organizar finanças",
    "leitura de faturas com IA",
    "diagnóstico financeiro",
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
    answer: "Sim! O plano gratuito inclui os recursos essenciais para organizar receitas, despesas e acompanhar seu diagnóstico financeiro básico. Os recursos com IA ficam disponíveis no plano Pro.",
  },
  {
    question: "Qual a diferença do plano Pro?",
    answer: "O plano Pro libera os recursos com IA, como leitura de faturas, assistente financeiro e análises inteligentes, além de exportação de relatórios em PDF e Excel e suporte prioritário.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: `Sim! Você tem ${PRO_TRIAL_DAYS} dias grátis antes da primeira cobrança e pode cancelar a qualquer momento pelo portal Stripe. Depois da cobrança, o acesso continua até o fim do período contratado.`,
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
