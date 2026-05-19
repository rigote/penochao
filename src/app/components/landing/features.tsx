import { 
  Sparkles, 
  Activity,
  FileText, 
  Shield, 
  Smartphone, 
  TrendingUp,
  CreditCard
} from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "Raio-X Financeiro",
    description: "Veja se sua vida básica fecha, quanto as dívidas consomem e qual é sua sobra real antes de tomar decisões.",
  },
  {
    icon: CreditCard,
    title: "Dívidas Fora do Caos",
    description: "Separe faturas, empréstimos e renegociações do custo essencial para entender o tamanho real do problema.",
  },
  {
    icon: Sparkles,
    title: "IA Com Contexto",
    description: "Receba sugestões inteligentes para cortar vazamentos, proteger reserva e negociar dívidas no momento certo.",
  },
  {
    icon: TrendingUp,
    title: "Plano de Recuperação",
    description: "Transforme entradas, despesas e dívidas em uma ordem simples: fechar o mês, criar folga, formar reserva e negociar.",
  },
  {
    icon: FileText,
    title: "Leitura de Faturas",
    description: "Envie PDFs de faturas e extratos para transformar movimentações em transações editáveis dentro do app.",
  },
  {
    icon: Smartphone,
    title: "Substitua a Planilha",
    description: "Registre entradas, despesas mensais e gastos do dia a dia com uma visão feita para decisão, não só anotação.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados financeiros protegidos com criptografia de ponta. Não compartilhamos informações com terceiros.",
  },
]

export function Features() {
  return (
    <section id="recursos" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Não é só controlar gastos. É{" "}
            <span className="text-primary">entender o que está te afundando</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            O Penochão parte do diagnóstico: renda real, custo essencial, dívidas, sobra e plano de ação.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 bg-background rounded-2xl border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
