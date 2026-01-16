import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { ArrowRight, Github, Star, Code2, Puzzle, Zap, Palette, Shield, Terminal } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
        <div className="container px-4 mx-auto relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block text-transparent bg-clip-text bg-gradient-primary">
                  Next.js Boilerplate
                </span>
                <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-muted-foreground">
                  Seu próximo projeto incrível começa aqui
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-3xl">
                Um template moderno e completo para desenvolvimento web profissional, combinando as melhores práticas e ferramentas do mercado em uma estrutura pronta para uso.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="group">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="group">
                  <Github className="mr-2 h-4 w-4" />
                  Ver no GitHub
                </Button>
              </div>
              
              {/* Stats */}
              <dl className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Tecnologias</dt>
                  <dd className="mt-2 text-3xl font-bold">10+</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Componentes</dt>
                  <dd className="mt-2 text-3xl font-bold">30+</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Stars</dt>
                  <dd className="mt-2 text-3xl font-bold flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" fill="currentColor" />
                    100+
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Atualizações</dt>
                  <dd className="mt-2 text-3xl font-bold">Weekly</dd>
                </div>
              </dl>
            </div>
            
            <div className="hidden lg:block lg:col-span-5">
              {/* Placeholder para uma possível ilustração ou preview do código */}
              <div className="rounded-xl bg-card p-8 border shadow-lg">
                <pre className="text-sm text-muted-foreground">
                  <code>{`// Seu código incrível começa aqui
import { NextPage } from 'next'
import { Button } from '@/components/ui'

const Home: NextPage = () => {
  return (
    <div className="container">
      <h1>Hello, World!</h1>
    </div>
  )
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa para desenvolver
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Code2 />}
              title="TypeScript"
              description="Desenvolvimento seguro e produtivo com tipagem estática e autocompletion avançado"
            />
            <FeatureCard
              icon={<Palette />}
              title="Tailwind CSS"
              description="Estilização moderna e responsiva com utility-first CSS e tema customizável"
            />
            <FeatureCard
              icon={<Puzzle />}
              title="Componentes Shadcn/ui"
              description="Biblioteca de componentes acessíveis, customizáveis e com design system consistente"
            />
            <FeatureCard
              icon={<Terminal />}
              title="ESLint & Prettier"
              description="Código limpo e padronizado automaticamente com as melhores práticas"
            />
            <FeatureCard
              icon={<Shield />}
              title="Jest & Testing Library"
              description="Suite completa de testes unitários e de integração configurada e pronta para uso"
            />
            <FeatureCard
              icon={<Zap />}
              title="Performance"
              description="Otimizações automáticas de performance, SEO e acessibilidade"
            />
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Comece em segundos</h2>
          <div className="max-w-3xl mx-auto">
            <pre className="text-left rounded-lg bg-card p-6 border mb-8">
              <code>npx create-next-app@latest -e https://github.com/seu-usuario/boilerplate-nextjs</code>
            </pre>
            <Button size="lg" className="group">
              Ver Documentação Completa
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string; 
  description: string;
}) {
  return (
    <Card className="hover:border-primary/50 transition-all hover:shadow-lg">
      <CardContent>
        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
