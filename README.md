# Next.js Boilerplate

Um boilerplate moderno e completo para projetos Next.js, com todas as ferramentas necessárias para desenvolvimento profissional.

## 🚀 Tecnologias

- [Next.js 14](https://nextjs.org/)
- [React 19](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Next Auth](https://next-auth.js.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [SWR](https://swr.vercel.app/)
- [React Email](https://react.email/)
- [Resend](https://resend.com/)
- [Jest](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Storybook](https://storybook.js.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Husky](https://typicode.github.io/husky/)
- [Commitlint](https://commitlint.js.org/)
- [pnpm](https://pnpm.io/) (Gerenciador de pacotes)

## 📦 Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Entre no diretório
cd [nome-do-diretorio]

# Instale o pnpm caso não tenha
npm install -g pnpm

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

## 🔧 Configuração

1. Configure suas variáveis de ambiente no arquivo `.env.local`
2. Configure o banco de dados PostgreSQL
3. Execute as migrações do Drizzle:
   ```bash
   pnpm db:push
   ```

## 🚀 Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
pnpm dev

# Execute os testes
pnpm test

# Execute o Storybook
pnpm storybook

# Verifique a tipagem
pnpm type-check

# Formate o código
pnpm format
```

## 📝 Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Cria a build de produção
- `pnpm start` - Inicia o servidor de produção
- `pnpm lint` - Executa o linter
- `pnpm test` - Executa os testes
- `pnpm test:watch` - Executa os testes em modo watch
- `pnpm test:coverage` - Executa os testes com cobertura
- `pnpm storybook` - Inicia o Storybook
- `pnpm build-storybook` - Cria a build do Storybook
- `pnpm format` - Formata o código com Prettier
- `pnpm format:check` - Verifica a formatação do código
- `pnpm type-check` - Verifica a tipagem TypeScript
- `pnpm db:generate` - Gera as migrações do Drizzle
- `pnpm db:push` - Aplica as migrações no banco de dados
- `pnpm db:studio` - Abre o Drizzle Studio
- `pnpm email` - Inicia o servidor de preview de emails

## 📁 Estrutura de Diretórios

```
src/
  ├── app/                 # App Router do Next.js
  │   ├── api/             # Rotas da API
  │   ├── components/      # Componentes da aplicação
  │   │   ├── ui/          # Componentes de UI (shadcn)
  │   │   └── ...          # Outros componentes
  │   ├── login/           # Página de login
  │   └── dashboard/       # Página do dashboard
  ├── db/                  # Configuração do banco de dados
  │   ├── migrations/      # Migrações do Drizzle
  │   └── schema/          # Schema do banco de dados
  ├── emails/              # Templates de email com React Email
  ├── lib/                 # Utilitários e configurações
  │   ├── utils.ts         # Funções utilitárias
  │   └── ...              # Outras configurações
  └── stories/             # Stories do Storybook
```

## 🤝 Contribuindo

1. Faça o fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Convenções de Commit

Este projeto segue as convenções do [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Alterações que não afetam o código (espaços em branco, formatação, etc)
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição ou modificação de testes
- `build`: Alterações no processo de build ou dependências
- `ci`: Alterações nos arquivos de CI
- `chore`: Outras alterações que não modificam src ou test

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ⚡ Por que pnpm?

O pnpm foi escolhido como gerenciador de pacotes por suas vantagens significativas:

- **Eficiência de espaço em disco**: Usa um armazenamento único para todos os pacotes
- **Performance superior**: Instalação de dependências mais rápida
- **Estrutura determinística**: Evita problemas de "módulos fantasma"
- **Menor uso de memória**: Processo de instalação mais eficiente
- **Compatibilidade**: Funciona bem com Node.js e todas as principais ferramentas
