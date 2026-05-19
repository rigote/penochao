# Estrategia De Testes

## Objetivo

Manter a aplicacao assistida nos pontos em que regressao causa prejuizo real:

- acesso indevido a plano Pro;
- cobranca, cupom e cortesia;
- diagnostico financeiro incorreto;
- validacao fraca de entradas financeiras;
- IA consumindo custo sem controle;
- vazamento ou mau uso de dados sensiveis.

## Regra De Spec

Toda nova implementacao relevante deve atualizar a spec correspondente. Quando a
mudanca cria ou altera uma regra critica, deve incluir teste unitario ou
justificar por que sera coberta por teste de integracao/e2e.

## Piramide De Testes

### Unitarios

Usar para:

- regras financeiras puras;
- validacoes Zod;
- classificadores;
- regras de plano efetivo;
- formatadores e calculos;
- fallback de IA quando possivel.

### Integracao

Usar para:

- API routes com autenticacao;
- leitura/escrita no banco;
- Stripe webhook;
- upload/processamento de arquivo;
- permissao admin.

### E2E

Usar para:

- login;
- onboarding;
- importar fatura e salvar transacao;
- acessar Raio-X;
- fluxo Free -> Pro;
- resgate de cupom.

## Cobertura Prioritaria Atual

- [x] Classificacao de despesas para Raio-X.
- [x] Calculo de risco financeiro.
- [x] Sumario financeiro com media de renda.
- [x] Validacoes de entradas, despesas, categorias e configuracoes.
- [x] Plano efetivo com cortesia Pro expirada.
- [x] Consentimento LGPD para analytics.
- [ ] API de processamento de faturas respeitando plano efetivo.
- [ ] API de sugestoes IA bloqueando Free.
- [ ] Stripe webhook atualizando plano.
- [ ] Admin criando/editando cupom.
- [ ] Relatorio mensal gerando dados do usuario autenticado.

## Padroes

- Testes unitarios devem evitar banco real.
- Regras puras devem ficar em helpers exportados e testaveis.
- Testes de banco/API devem usar mocks ou ambiente isolado.
- Dados sensiveis em testes devem ser ficticios.
- Quando houver bug corrigido, adicionar teste de regressao.

## Comandos

- `pnpm test --runInBand`
- `pnpm test:unit`
- `pnpm type-check`
- `pnpm precommit`

## Pre-commit

Todo commit deve rodar automaticamente:

1. `pnpm type-check`
2. `pnpm test --runInBand`

O hook fica em `.husky/pre-commit`. Ele nao deve formatar arquivos
automaticamente por padrao, para evitar alterar o staging sem intencao. Lint e
format podem entrar depois quando a base de ESLint estiver estabilizada.

## Criterio De Pronto

Uma mudanca critica so esta pronta quando:

- spec atualizada;
- testes relevantes adicionados/ajustados;
- `pnpm type-check` passa;
- `pnpm test --runInBand` passa, salvo bloqueio documentado.
