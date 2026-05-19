import { Metadata } from "next"
import { PrivacySettingsPanel } from "./privacy-settings-panel"

export const metadata: Metadata = {
  title: "Política de Privacidade - Penochão",
  description: "Política de privacidade e proteção de dados do Penochão. Conformidade com LGPD. Saiba como protegemos seus dados financeiros.",
  keywords: [
    "política de privacidade penochão",
    "LGPD",
    "proteção de dados",
    "privacidade financeira",
    "segurança de dados",
  ],
  openGraph: {
    title: "Política de Privacidade - Penochão",
    description: "Política de privacidade e proteção de dados do Penochão. Conformidade com LGPD.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://penochao.app.br/privacidade",
  },
}

export default function PrivacidadePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
      <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <PrivacySettingsPanel />

        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Penochão ("nós", "nosso" ou "serviço") está comprometido em proteger sua privacidade. 
            Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
            informações quando você usa nosso serviço de controle financeiro pessoal.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Dados que Coletamos</h2>
          
          <h3 className="text-lg font-medium mt-6 mb-3">2.1 Dados fornecidos por você</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, foto de perfil (opcional)</li>
            <li><strong>Dados financeiros:</strong> receitas, despesas, categorias, metas financeiras que você registra</li>
            <li><strong>Documentos:</strong> faturas em PDF enviadas para leitura automática</li>
            <li><strong>Comunicações:</strong> feedbacks, mensagens de suporte</li>
          </ul>

          <h3 className="text-lg font-medium mt-6 mb-3">2.2 Dados coletados automaticamente</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Dados de uso opcionais:</strong> páginas visitadas e funcionalidades utilizadas apenas se você permitir analytics</li>
            <li><strong>Dados técnicos:</strong> tipo de navegador, sistema operacional e dispositivo, quando necessários para segurança e funcionamento</li>
            <li><strong>Cookies/tokens essenciais:</strong> autenticação, segurança da sessão e preferências</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Como Usamos seus Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos seus dados para:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>Fornecer e manter o serviço de controle financeiro</li>
            <li>Processar faturas enviadas usando inteligência artificial</li>
            <li>Gerar relatórios e visualizações dos seus dados financeiros</li>
            <li>Processar pagamentos e gerenciar assinaturas</li>
            <li>Enviar comunicações importantes sobre o serviço</li>
            <li>Melhorar e personalizar sua experiência</li>
            <li>Garantir a segurança e prevenir fraudes</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Compartilhamento de Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Não vendemos seus dados.</strong> Compartilhamos informações apenas nas seguintes situações:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li><strong>Processadores de pagamento:</strong> Stripe, para processar pagamentos de forma segura</li>
            <li><strong>Serviços de infraestrutura:</strong> Vercel (hospedagem), Neon (banco de dados), Resend (e-mails)</li>
            <li><strong>Inteligência Artificial:</strong> Google Gemini, para processamento de faturas e sugestões quando você usa recursos de IA</li>
            <li><strong>Analytics opcional:</strong> Google Analytics e Vercel Analytics, somente após seu consentimento</li>
            <li><strong>Obrigação legal:</strong> quando exigido por lei ou ordem judicial</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Segurança dos Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>Criptografia em trânsito (HTTPS/TLS)</li>
            <li>Criptografia em repouso para dados sensíveis</li>
            <li>Autenticação segura com códigos de verificação</li>
            <li>Acesso restrito aos dados apenas por pessoal autorizado</li>
            <li>Monitoramento contínuo de segurança</li>
            <li>Backups regulares dos dados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Seus Direitos (LGPD)</h2>
          <p className="text-muted-foreground leading-relaxed">
            De acordo com a LGPD, você tem os seguintes direitos:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li><strong>Acesso:</strong> solicitar informações sobre seus dados pessoais</li>
            <li><strong>Correção:</strong> corrigir dados incompletos ou inexatos</li>
            <li><strong>Exclusão:</strong> solicitar a exclusão dos seus dados</li>
            <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
            <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
            <li><strong>Oposição:</strong> opor-se ao tratamento de dados</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Você pode excluir sua conta diretamente em <strong>Meu Perfil</strong>. Para exercer outros direitos, entre em contato pelo e-mail:{" "}
            <a href="mailto:privacidade@penochao.app.br" className="text-primary hover:underline">
              privacidade@penochao.app.br
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Retenção de Dados</h2>
          <p className="text-muted-foreground leading-relaxed">
            Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>Dados pessoais e financeiros da conta são removidos após confirmação de exclusão</li>
            <li>Backups são removidos em até 90 dias</li>
            <li>Dados anonimizados podem ser mantidos para análises estatísticas</li>
            <li>Dados necessários para obrigações legais são mantidos pelo período exigido</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies/tokens essenciais para:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
            <li>Manter você autenticado no serviço</li>
            <li>Lembrar suas preferências (tema, idioma)</li>
            <li>Garantir a segurança da sessão</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Analytics é opcional. Você pode permitir ou recusar nesta página ou no banner exibido no primeiro acesso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Menores de Idade</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Penochão não é destinado a menores de 18 anos. Não coletamos intencionalmente dados 
            de menores. Se tomarmos conhecimento de que coletamos dados de um menor, tomaremos 
            medidas para excluir essas informações.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Transferência Internacional</h2>
          <p className="text-muted-foreground leading-relaxed">
            Seus dados podem ser processados em servidores localizados fora do Brasil 
            (Estados Unidos). Garantimos que essas transferências são realizadas com proteções 
            adequadas, conforme exigido pela LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Alterações nesta Política</h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
            alterações significativas por e-mail ou através do serviço. Recomendamos revisar esta 
            política regularmente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Contato</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para questões sobre privacidade ou para exercer seus direitos, entre em contato:
          </p>
          <ul className="list-none mt-4 space-y-2 text-muted-foreground">
            <li><strong>E-mail:</strong>{" "}
              <a href="mailto:privacidade@penochao.app.br" className="text-primary hover:underline">
                privacidade@penochao.app.br
              </a>
            </li>
            <li><strong>Encarregado de Dados (DPO):</strong> contato@penochao.app.br</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
