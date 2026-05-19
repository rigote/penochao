# Onboarding Financeiro

## Status

Proposta.

## Problema

Sem contexto, o app so enxerga numeros. Duas pessoas com o mesmo saldo negativo
podem precisar de solucoes completamente diferentes: uma teve imprevisto, outra
tem renda baixa, outra esta presa em consumo/cartao.

## Objetivo

Capturar o minimo de contexto para orientar diagnostico, IA e plano de
recuperacao.

## Usuarios

- Novo usuario.
- Usuario existente sem perfil financeiro.
- Usuario que quer refazer diagnostico.

## Fluxo

1. Usuario cria conta ou acessa dashboard pela primeira vez.
2. Sistema pergunta se ele quer fazer diagnostico inicial.
3. Usuario responde perguntas simples.
4. Sistema salva perfil financeiro.
5. Sistema direciona para importar dados ou registrar manualmente.

## Perguntas

- Voce esta endividado hoje?
- Tem parcelas atrasadas?
- Usa cartao ou limite para fechar o mes?
- Sua renda e fixa ou varia?
- Voce tem reserva de emergencia?
- A divida veio mais de imprevisto, consumo, renda baixa, questao emocional ou mistura?
- Hoje sua maior angustia e pagar dividas, fechar o mes, entender gastos ou aumentar renda?

## Regras De Negocio

- Onboarding nao deve bloquear uso do app.
- Usuario pode pular e responder depois.
- Usuario pode editar respostas.
- Respostas devem influenciar diagnostico e IA.
- Se usuario declara renda baixa, IA nao deve focar apenas em cortes.

## Dados

Criar `financial_profile` conforme `data-model.md`.

## IA

Nao precisa de IA para salvar onboarding.
IA pode usar respostas para explicar diagnostico com mais humanidade.

## UX

- Perguntas curtas.
- Linguagem acolhedora.
- Progresso visivel.
- Opcao "nao sei".
- Mobile-first.

## Criterios De Aceite

- [ ] Usuario pode responder onboarding.
- [ ] Usuario pode pular.
- [ ] Usuario pode editar depois.
- [ ] Respostas persistem.
- [ ] Raio-X usa perfil quando disponivel.

## Metricas

- Taxa de conclusao do onboarding.
- Usuarios que concluem onboarding e importam dados.
- Usuarios que voltam ao Raio-X apos onboarding.
