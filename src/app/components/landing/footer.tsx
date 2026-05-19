import Link from "next/link"
import { LockKeyhole, PiggyBank } from "lucide-react"

const footerLinks = {
  produto: [
    { name: "Recursos", href: "#recursos" },
    { name: "Preços", href: "#precos" },
    { name: "FAQ", href: "#faq" },
  ],
  legal: [
    { name: "Termos de Uso", href: "/termos" },
    { name: "Privacidade", href: "/privacidade" },
  ],
  suporte: [
    { name: "Central de Ajuda", href: "#" },
    { name: "Contato", href: "mailto:contato@penochao.app.br" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <PiggyBank className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold">Penochão</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Controle financeiro simples e inteligente para organizar sua vida.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" />
              Dados financeiros criptografados
            </div>
          </div>

          {/* Produto */}
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-3">
              {footerLinks.suporte.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Penochão. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Dados criptografados. Clareza para decidir antes de assumir novas dívidas.
          </p>
        </div>
      </div>
    </footer>
  )
}
