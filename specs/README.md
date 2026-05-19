# Penochao Specs

Este diretorio e a fonte de verdade para evoluir o Penochao com spec-driven
design. Antes de implementar uma mudanca relevante, a spec correspondente deve
estar clara o suficiente para responder:

- qual problema real do usuario estamos resolvendo?
- qual comportamento o produto deve ter?
- quais dados entram e quais dados saem?
- qual parte e regra deterministica e qual parte usa IA?
- como saberemos que ficou pronto?

## Mapa Das Specs

### Fundacao

- `product-vision.md`: posicionamento, publico, promessa e principios.
- `business-rules.md`: regras transversais de planos, cortesia, diagnostico, IA e seguranca.
- `data-model.md`: entidades atuais, lacunas e evolucao proposta.
- `ai-guidelines.md`: como a IA deve agir, limites e politica de custo.
- `pricing.md`: estrategia low ticket e limites por plano.
- `roadmap.md`: ordem sugerida de implementacao.
- `testing-strategy.md`: onde testes sao obrigatorios e como priorizar cobertura.

### Features

- `features/onboarding.md`: diagnostico inicial e perfil financeiro.
- `features/financial-diagnosis.md`: Raio-X Financeiro.
- `features/recovery-plan.md`: Plano de Recuperacao Financeira.
- `features/debt-management.md`: cadastro e negociacao de dividas.
- `features/imports-and-categorization.md`: importacao de PDFs/extratos/faturas.
- `features/ai-suggestions.md`: sugestoes inteligentes.
- `features/reports.md`: relatorios e exportacao.
- `features/admin-and-coupons.md`: admin, cupons e cortesia.
- `features/lgpd-privacy.md`: consentimento, privacidade e exclusao de conta.

## Workflow Para Uma Mudanca

1. Identifique a spec afetada.
2. Atualize a spec antes do codigo quando a regra ainda nao existir.
3. Implemente o menor corte funcional.
4. Rode verificacoes.
5. Marque criterios de aceite implementados quando aplicavel.

## Regra Obrigatoria

Toda implementacao relevante deve atualizar a spec correspondente no mesmo
trabalho. Se nao existir spec para a area alterada, crie uma antes ou junto da
implementacao.

Exemplos:

- Mudou regra de plano ou cupom: atualize `business-rules.md` e/ou `features/admin-and-coupons.md`.
- Mudou IA: atualize `ai-guidelines.md` e a feature afetada.
- Mudou diagnostico: atualize `features/financial-diagnosis.md`.
- Mudou testes de regra critica: atualize `testing-strategy.md`.

## Template De Feature

```md
# Nome Da Feature

## Status

Proposta | Em implementacao | Implementada | Revisar

## Problema

Qual dor real do usuario esta sendo resolvida?

## Objetivo

O que deve mudar na vida financeira da pessoa?

## Usuarios

Quem usa? Pessoa endividada, usuario Free, usuario Pro, admin?

## Fluxo

1. Passo do usuario.
2. Resposta do sistema.
3. Resultado esperado.

## Regras De Negocio

- Regra verificavel.

## Dados

- Campos existentes usados.
- Campos novos, se houver.

## IA

- Quando usar IA.
- Entrada esperada.
- Saida esperada.
- Limites.

## UX

- Estado vazio.
- Estado de erro.
- Mobile.
- Copy principal.

## Criterios De Aceite

- [ ] Criterio verificavel.

## Metricas

- Metrica de uso.
- Metrica de impacto financeiro.
```
