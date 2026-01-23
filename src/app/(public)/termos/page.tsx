import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso - Penochão",
  description: "Termos de uso e condições do Penochão. Leia nossos termos de serviço, políticas de cancelamento e garantias.",
  keywords: [
    "termos de uso penochão",
    "condições de uso",
    "termos de serviço",
    "política de cancelamento",
  ],
  openGraph: {
    title: "Termos de Uso - Penochão",
    description: "Termos de uso e condições do Penochão",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://penochao.app.br/termos",
  },
}

export default function TermosPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
      <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao acessar e usar o Penochão, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Descrição do Serviço</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Penochão é uma plataforma de controle financeiro pessoal que permite aos usuários:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>Registrar e categorizar receitas e despesas</li>
            <li>Visualizar relatórios e gráficos financeiros</li>
            <li>Enviar faturas para leitura automática por inteligência artificial</li>
            <li>Definir metas de reserva de emergência</li>
            <li>Exportar dados financeiros (plano Pro)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Cadastro e Conta</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para utilizar o Penochão, você deve criar uma conta fornecendo informações precisas e completas. 
            Você é responsável por manter a confidencialidade de sua conta e senha, e por todas as 
            atividades que ocorram em sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Planos e Pagamentos</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Penochão oferece planos gratuito e pago (Pro). O plano Pro é cobrado mensalmente ou anualmente, 
            conforme escolha do usuário. Os pagamentos são processados de forma segura através do Stripe.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            <strong>Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento. O acesso ao 
            plano Pro continuará até o final do período de faturamento atual.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            <strong>Reembolso:</strong> Oferecemos garantia de 7 dias para novas assinaturas. Após esse período, 
            não são oferecidos reembolsos por períodos parciais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Uso Aceitável</h2>
          <p className="text-muted-foreground leading-relaxed">
            Você concorda em usar o Penochão apenas para fins legais e de acordo com estes Termos. 
            É proibido:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>Usar o serviço para qualquer finalidade ilegal</li>
            <li>Tentar acessar dados de outros usuários</li>
            <li>Interferir ou interromper o serviço</li>
            <li>Enviar conteúdo malicioso ou vírus</li>
            <li>Revender ou redistribuir o serviço</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Propriedade Intelectual</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Penochão e todo o seu conteúdo, recursos e funcionalidades são de propriedade exclusiva 
            da empresa e estão protegidos por leis de direitos autorais, marcas registradas e outras 
            leis de propriedade intelectual.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Dados e Privacidade</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sua privacidade é importante para nós. Consulte nossa{" "}
            <a href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </a>{" "}
            para informações sobre como coletamos, usamos e protegemos seus dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Penochão é fornecido "como está" e "conforme disponível". Não garantimos que o serviço 
            será ininterrupto, seguro ou livre de erros. Não nos responsabilizamos por decisões 
            financeiras tomadas com base nas informações fornecidas pelo serviço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Modificações dos Termos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Reservamos o direito de modificar estes Termos a qualquer momento. Notificaremos os usuários 
            sobre alterações significativas por e-mail ou através do serviço. O uso continuado após 
            as alterações constitui aceitação dos novos Termos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Encerramento</h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por qualquer 
            violação destes Termos. Você pode excluir sua conta a qualquer momento nas configurações 
            do aplicativo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Lei Aplicável</h2>
          <p className="text-muted-foreground leading-relaxed">
            Estes Termos são regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa 
            será resolvida nos tribunais competentes da cidade de São Paulo, SP.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Contato</h2>
          <p className="text-muted-foreground leading-relaxed">
            Se você tiver dúvidas sobre estes Termos, entre em contato conosco pelo e-mail:{" "}
            <a href="mailto:contato@penochao.app.br" className="text-primary hover:underline">
              contato@penochao.app.br
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
