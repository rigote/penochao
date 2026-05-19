# Sugestoes Inteligentes

## Status

Parcialmente implementada.

## Problema

Listas genericas de cortes nao ajudam. O usuario precisa saber o que mais pesa
no contexto dele e o que fazer primeiro.

## Objetivo

Gerar sugestoes praticas para estabilizar o mes, criar folga, proteger reserva
e reduzir dividas.

## Regras De Negocio

- Se saldo real for positivo, IA deve reforcar consistencia e reserva.
- Se saldo de sobrevivencia for negativo, IA deve priorizar renda/custo fixo.
- Se dividas pesam muito, IA deve sugerir isolamento e negociacao planejada.
- Sugestoes devem ser limitadas para nao gerar sobrecarga.
- Sugestoes devem ser cacheadas por hash de dados.

## Entrada Para IA

- diagnostico deterministico;
- perfil financeiro;
- top categorias;
- gastos recorrentes;
- dividas cadastradas, quando houver.

## Saida Esperada

- resumo curto;
- 3 a 5 sugestoes;
- prioridade;
- impacto estimado;
- motivo.

## UX

- Mostrar se sugestao veio de cache.
- Botao para regenerar apenas no Pro ou com limite.
- Mostrar "faltam dados" quando necessario.

## Criterios De Aceite

- [ ] Usuario Pro recebe sugestoes.
- [ ] Usuario Free entende bloqueio e valor do Pro.
- [ ] Sugestao respeita ordem de recuperacao.
- [ ] Resposta da IA e validada.

## Metricas

- Sugestoes geradas.
- Sugestoes visualizadas.
- Regeneracoes.
- Custo por sugestao.
