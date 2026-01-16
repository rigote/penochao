import { redirect } from 'next/navigation'

async function getUser() {
  // Aqui você implementaria sua lógica de verificação de autenticação
  // Por exemplo, verificar um token no localStorage, cookie ou fazer uma chamada à API
  return null // Por enquanto retorna null para simular usuário não autenticado
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login') // Redireciona para a página de login se não estiver autenticado
  }

  return (
    <div className="min-h-screen">
      {/* Aqui você pode adicionar um layout comum para todas as páginas autenticadas */}
      {/* Por exemplo, uma sidebar, header, etc */}
      {children}
    </div>
  )
} 