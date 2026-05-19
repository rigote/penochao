# Gestao De Dividas

## Status

Proposta.

## Problema

Hoje dividas ficam misturadas com despesas. Isso impede ver o custo essencial e
planejar negociacao com clareza.

## Objetivo

Permitir que o usuario liste dividas, entenda prioridade e acompanhe negociacao
sem misturar tudo com o mes atual.

## Usuarios

- Pessoa com fatura atrasada.
- Pessoa com emprestimos.
- Pessoa com renegociacoes.
- Pessoa usando cheque especial/limite.

## Fluxo

1. Usuario acessa `Dividas`.
2. Cadastra credor, valor atual, parcela minima, vencimento e status.
3. Sistema mostra total devido e impacto mensal.
4. Sistema sugere prioridade.
5. Usuario marca negociacao, acordo ou quitacao.

## Regras De Negocio

- Divida antiga pode ficar fora do saldo de sobrevivencia.
- Pagamento mensal de divida entra no saldo real.
- Divida com risco de perda de bem essencial pode ter prioridade alta.
- Divida com juros alto deve ser destacada.
- Usuario nao deve ser incentivado a pegar nova divida para pagar antiga sem estabilidade mensal.

## Dados

Criar tabela `debt`.
Opcionalmente relacionar pagamentos de divida com `expense`.

## IA

IA pode:

- explicar prioridade;
- sugerir perguntas para credor;
- montar roteiro de negociacao;
- alertar quando renegociacao piora fluxo mensal.

IA nao pode:

- garantir desconto;
- instruir calote;
- tomar decisao juridica.

## UX

- Lista simples por credor.
- Badges: atrasada, em negociacao, quitada.
- Mostrar "fora da mesa por enquanto" como diagnostico, nao abandono.
- Mostrar impacto mensal da parcela.

## Criterios De Aceite

- [ ] Usuario cadastra divida.
- [ ] Usuario edita status.
- [ ] Raio-X considera dividas.
- [ ] Plano de Recuperacao usa dividas para priorizar etapa.

## Metricas

- Total de dividas cadastradas.
- Dividas marcadas como quitadas.
- Usuarios que reduzem valor total devido.
