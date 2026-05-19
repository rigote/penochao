# Relatorios

## Status

Parcialmente implementada.

## Problema

O usuario precisa enxergar progresso e, muitas vezes, compartilhar ou guardar um
resumo do mes.

## Objetivo

Gerar relatorios mensais que mostrem evolucao, nao apenas uma tabela de gastos.

## Conteudo Do Relatorio

- periodo;
- renda total;
- despesas essenciais;
- dividas/cartao;
- dia a dia;
- estilo de vida;
- saldo de sobrevivencia;
- saldo real;
- progresso de reserva;
- progresso de dividas;
- recomendacao do mes.

## Regras De Negocio

- Exportacao detalhada e Pro.
- Relatorio deve pertencer ao usuario autenticado.
- Dados descriptografados apenas durante geracao.
- PDF deve evitar caracteres que quebrem fonte, ou usar fonte com suporte adequado.

## UX

- Botao no dashboard e no Raio-X.
- Indicar que e Pro quando bloqueado.
- Mostrar loading claro.

## Criterios De Aceite

- [ ] PDF mensal gera sem erro.
- [ ] Dados pertencem ao usuario.
- [ ] Relatorio inclui diagnostico.
- [ ] Free ve upsell claro.

## Metricas

- Exportacoes por mes.
- Conversao por tentativa de exportacao Free.
