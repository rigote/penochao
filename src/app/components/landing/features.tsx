import { 
  Sparkles, 
  PieChart, 
  FileText, 
  Shield, 
  Smartphone, 
  TrendingUp 
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "Leitura de Faturas com IA",
    description: "Envie suas faturas em PDF e nossa inteligência artificial extrai automaticamente os dados e categoriza suas despesas.",
  },
  {
    icon: PieChart,
    title: "Dashboard Inteligente",
    description: "Visualize suas finanças com gráficos claros e insights sobre seus hábitos de consumo. Acompanhe sua evolução mês a mês.",
  },
  {
    icon: FileText,
    title: "Categorização Automática",
    description: "Organize despesas em categorias essenciais e não essenciais. Personalize subcategorias conforme sua necessidade.",
  },
  {
    icon: TrendingUp,
    title: "Reserva de Emergência",
    description: "Defina metas de reserva e acompanhe seu progresso. Saiba exatamente quanto falta para sua segurança financeira.",
  },
  {
    icon: Smartphone,
    title: "Acesso em Qualquer Lugar",
    description: "Interface responsiva que funciona perfeitamente no celular, tablet ou computador. Seus dados sempre acessíveis.",
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
            Tudo que você precisa para{" "}
            <span className="text-primary">controlar seu dinheiro</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ferramentas simples e poderosas para você entender para onde vai seu dinheiro 
            e tomar decisões financeiras mais inteligentes.
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
