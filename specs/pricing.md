# Pricing E Modelo Low Ticket

## Objetivo

Cobrar o suficiente para pagar IA, banco de dados e manutencao, mantendo o
produto acessivel para pessoas que estao tentando sair das dividas.

## Principios

- Preco nao pode virar mais uma pressao financeira.
- Free precisa gerar valor real.
- Pro precisa ser simples de entender.
- Limites de IA devem proteger margem.
- Garantia e cancelamento devem ser claros.

## Planos

### Free

Objetivo: ajudar a pessoa a comecar.

Inclui:

- dashboard financeiro;
- Raio-X financeiro inicial;
- ate 3 faturas/extratos por mes com IA;
- categorias base;
- registro manual de entradas e despesas.

### Pro

Objetivo: cobrir custos e entregar acompanhamento.

Preco de referencia:

- R$ 9,90 por mes;
- R$ 99,00 por ano.

Inclui:

- Raio-X completo;
- importacao ampliada de faturas/extratos;
- sugestoes inteligentes;
- plano de recuperacao;
- relatorios;
- categorias personalizadas.

## Custo De IA

O custo mensal deve ser monitorado por:

- quantidade de uploads;
- tokens de entrada;
- tokens de saida;
- custo estimado em BRL;
- plano do usuario.

## Limites Recomendados

Free:

- 3 uploads IA/mes.

Pro:

- Comecar com "uso justo" ou limite alto controlado internamente.
- Se o custo crescer, expor limite claro, como 30 ou 50 uploads/mes.

Cupons:

- Cupom cortesia pode ter `invoiceLimit`.
- Cortesia expirada deve remover beneficios Pro se nao houver Stripe ativo.

## Indicadores De Sustentabilidade

Monitorar:

- custo medio de IA por usuario Pro;
- custo medio de banco/blob por usuario ativo;
- taxa de conversao Free -> Pro;
- churn mensal;
- quantidade de usuarios em cortesia;
- usuarios Pro com uso muito acima da media.

## Regras De Comunicacao

Copy recomendada:

- "Low ticket para cobrir IA e infra sem pesar no bolso."
- "Comece gratis, evolua quando precisar de acompanhamento."

Evitar:

- "ilimitado" se houver risco de abuso sem controle;
- prometer que o Pro resolve dividas sozinho.
