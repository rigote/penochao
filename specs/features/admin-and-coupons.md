# Admin E Cupons

## Status

Parcialmente implementada.

## Problema

O produto precisa operar cupons, cortesias e usuarios sem criar custo invisivel
ou deixar beneficios ativos para sempre por erro.

## Objetivo

Gerenciar cupons, acompanhar uso e garantir que plano efetivo seja correto.

## Regras De Negocio

- Apenas admins autorizados acessam admin.
- Cupom pode ser `discount` ou `courtesy`.
- Cupom pode ter limite de uso.
- Cupom pode ter email restrito.
- Cupom de cortesia pode ter limite mensal de faturas.
- Cortesia expirada deve rebaixar usuario para Free se nao houver Stripe ativo.
- Stripe ativo sempre prevalece sobre cortesia expirada.

## UX Admin

- Listar usuarios.
- Mostrar plano: Free, Pro Stripe, Pro Cortesia, Pro Manual.
- Mostrar dias restantes de cortesia.
- Mostrar limite de IA por cupom.
- Permitir criar, editar, ativar/desativar cupons.

## Criterios De Aceite

- [ ] Admin cria cupom.
- [ ] Usuario resgata cupom valido.
- [ ] Usuario nao resgata o mesmo cupom duas vezes.
- [ ] Cortesia expirada nao mantem Pro indevidamente.
- [x] Regra de plano efetivo possui teste unitario para cortesia expirada.
- [ ] Cupom com email restrito valida email.

## Metricas

- Cupons ativos.
- Resgates.
- Usuarios em cortesia.
- Cortesias expiradas.
- Conversao cortesia -> Pro pago.
