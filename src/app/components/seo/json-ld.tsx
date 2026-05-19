import { PLAN_PRICES } from "@/config/plans"

export function OrganizationJsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Penochão',
    url: 'https://penochao.app.br',
    logo: 'https://penochao.app.br/icon-512.png',
    description: 'Controle financeiro inteligente com IA. Leitura automática de faturas e categorização de despesas.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contato@penochao.app.br',
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  )
}

export function SoftwareApplicationJsonLd() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Penochão',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'Controle financeiro inteligente com IA. Organize despesas, acompanhe receitas e leia faturas automaticamente.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'BRL',
        description: 'Plano gratuito com até 3 faturas/mês',
      },
      {
        '@type': 'Offer',
        name: 'Pro Mensal',
        price: PLAN_PRICES.proMonthly.amount.toFixed(2),
        priceCurrency: 'BRL',
        description: 'Plano Pro com faturas ilimitadas',
        priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
      },
      {
        '@type': 'Offer',
        name: 'Pro Anual',
        price: PLAN_PRICES.proAnnual.amount.toFixed(2),
        priceCurrency: 'BRL',
        description: 'Plano Pro anual com 20% de desconto',
        priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Leitura automática de faturas com IA',
      'Dashboard financeiro completo',
      'Categorização automática de despesas',
      'Acompanhamento de receitas e despesas',
      'Meta de reserva de emergência',
      'Sistema de conquistas',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
    />
  )
}

interface FAQItem {
  question: string
  answer: string
}

export function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  )
}

export function WebsiteJsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Penochão',
    url: 'https://penochao.app.br',
    description: 'Controle financeiro inteligente com IA',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://penochao.app.br/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  )
}
