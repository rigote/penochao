#!/bin/bash

# 🚀 Next.js Boilerplate Setup Script
# Este script configura um novo projeto a partir do boilerplate

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🚀 Next.js Boilerplate - Setup Wizard 🚀          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  Este script deve ser executado na raiz do projeto!${NC}"
    exit 1
fi

# Perguntar o nome do projeto
echo -e "${BLUE}📝 Qual o nome do seu projeto?${NC}"
read -p "Nome do projeto: " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}⚠️  Nome do projeto não pode ser vazio!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Configurando projeto: ${PROJECT_NAME}${NC}"
echo ""

# 1. Atualizar package.json
echo -e "${BLUE}[1/7] 📦 Atualizando package.json...${NC}"
if command -v jq &> /dev/null; then
    # Se jq estiver disponível, usar para manipular JSON
    jq --arg name "$PROJECT_NAME" '.name = $name | .version = "0.1.0"' package.json > package.json.tmp && mv package.json.tmp package.json
else
    # Fallback usando sed
    sed -i "s/\"name\": \".*\"/\"name\": \"$PROJECT_NAME\"/" package.json
fi
echo -e "${GREEN}✓ package.json atualizado${NC}"

# 2. Atualizar README
echo -e "${BLUE}[2/7] 📝 Criando README.md personalizado...${NC}"
cat > README.md << EOF
# ${PROJECT_NAME}

> Projeto criado a partir do [Next.js Boilerplate](https://github.com/rigote/boilerplate-nextjs)

## 🚀 Stack

- **Framework:** Next.js 15.5.4
- **React:** 19.2.0
- **TypeScript:** 5.9.3
- **Styling:** Tailwind CSS 3.4.18
- **UI Components:** shadcn/ui
- **Database ORM:** Drizzle ORM
- **Authentication:** NextAuth.js
- **Testing:** Jest 30 + Testing Library
- **Storybook:** 8.6.14

## 📦 Instalação

\`\`\`bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações
\`\`\`

## 🔧 Desenvolvimento

\`\`\`bash
# Servidor de desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Testes
pnpm test
pnpm test:watch
pnpm test:coverage

# Linting
pnpm lint

# Type checking
pnpm type-check

# Storybook
pnpm storybook
\`\`\`

## 🗄️ Database

\`\`\`bash
# Gerar migrations
pnpm db:generate

# Push schema para database
pnpm db:push

# Abrir Drizzle Studio
pnpm db:studio
\`\`\`

## 📧 Email Development

\`\`\`bash
# Servidor de desenvolvimento de emails
pnpm email
\`\`\`

## 📁 Estrutura do Projeto

\`\`\`
${PROJECT_NAME}/
├── src/
│   ├── app/              # App Router (Next.js 13+)
│   │   ├── api/          # API Routes
│   │   ├── components/   # Componentes da aplicação
│   │   │   └── ui/       # Componentes shadcn/ui
│   │   ├── context/      # React Context providers
│   │   └── ...
│   └── lib/              # Utilitários e helpers
├── public/               # Arquivos estáticos
├── emails/               # Templates de email
└── ...
\`\`\`

## 🎨 Temas

O projeto suporta modo claro e escuro usando \`next-themes\`. O toggle de tema está disponível no canto superior direito.

## 🔐 Autenticação

Configure as variáveis de ambiente para NextAuth.js:

\`\`\`env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-aqui
\`\`\`

## 📝 Licença

MIT

---

**Criado com ❤️ usando [Next.js Boilerplate](https://github.com/rigote/boilerplate-nextjs)**
EOF
echo -e "${GREEN}✓ README.md criado${NC}"

# 3. Criar .env.example se não existir
echo -e "${BLUE}[3/7] 🔐 Verificando .env.example...${NC}"
if [ ! -f ".env.example" ]; then
    cat > .env.example << EOF
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EOF
    echo -e "${GREEN}✓ .env.example criado${NC}"
else
    echo -e "${GREEN}✓ .env.example já existe${NC}"
fi

# 4. Criar .env.local se não existir
echo -e "${BLUE}[4/7] 🔐 Criando .env.local...${NC}"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓ .env.local criado (configure suas variáveis)${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local já existe, mantendo configurações existentes${NC}"
fi

# 5. Limpar histórico Git (se existir)
echo -e "${BLUE}[5/7] 🗑️  Limpando histórico do Git...${NC}"
if [ -d ".git" ]; then
    rm -rf .git
    echo -e "${GREEN}✓ Histórico do Git removido${NC}"
else
    echo -e "${GREEN}✓ Nenhum histórico do Git encontrado${NC}"
fi

# 6. Inicializar novo repositório Git
echo -e "${BLUE}[6/7] 📚 Inicializando novo repositório Git...${NC}"
git init
git add .
git commit -m "chore: initial commit from boilerplate"
echo -e "${GREEN}✓ Repositório Git inicializado${NC}"

# 7. Instalar dependências
echo -e "${BLUE}[7/7] 📦 Instalando dependências...${NC}"
echo -e "${YELLOW}Isso pode levar alguns minutos...${NC}"

if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              ✅ Setup Concluído com Sucesso! ✅           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}🎉 Próximos passos:${NC}"
echo ""
echo -e "  1. ${YELLOW}Configure suas variáveis de ambiente:${NC}"
echo -e "     ${GREEN}nano .env.local${NC}"
echo ""
echo -e "  2. ${YELLOW}Inicie o servidor de desenvolvimento:${NC}"
echo -e "     ${GREEN}pnpm dev${NC}"
echo ""
echo -e "  3. ${YELLOW}Abra seu navegador:${NC}"
echo -e "     ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📚 Comandos úteis:${NC}"
echo -e "  ${GREEN}pnpm test${NC}       - Executar testes"
echo -e "  ${GREEN}pnpm lint${NC}       - Verificar código"
echo -e "  ${GREEN}pnpm build${NC}      - Build de produção"
echo -e "  ${GREEN}pnpm storybook${NC}  - Abrir Storybook"
echo ""
echo -e "${BLUE}🚀 Boa sorte com seu projeto!${NC}"
echo ""

