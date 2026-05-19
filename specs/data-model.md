# Modelo De Dados

## Estado Atual

O app usa Drizzle com Postgres/Neon. As tabelas principais estao em
`src/db/schema/*`.

### Usuario

Tabela: `user`

Campos relevantes:

- `id`
- `name`
- `email`
- `image`
- `plan`
- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `stripeCurrentPeriodEnd`

### Categorias

Tabela: `category`

Campos relevantes:

- `id`
- `userId`
- `parentId`
- `name`
- `type`: `income`, `essential`, `non_essential`
- `icon`
- `color`
- `isDefault`
- `archived`

### Entradas

Tabela: `income`

Campos relevantes:

- `id`
- `userId`
- `categoryId`
- `description`
- `amount`
- `occurrenceDate`
- `recurrence`

Observacao: `description` e `amount` sao armazenados criptografados.

### Despesas

Tabela: `expense`

Campos relevantes:

- `id`
- `userId`
- `categoryId`
- `description`
- `amount`
- `occurrenceDate`
- `type`: `essential` ou `non_essential`
- `recurrence`

Observacao: `description` e `amount` sao armazenados criptografados.

### Faturas/Uploads

Tabela: `invoice`

Campos relevantes:

- `id`
- `userId`
- `fileName`
- `fileUrl`
- `extractedData`
- `status`
- `processedAt`

### Configuracoes

Tabela: `user_setting`

Campos relevantes:

- `emergencyFundTarget`
- `emergencyFundMonths`
- `currentSavings`

### Sugestoes IA

Tabela: `expense_suggestion`

Campos relevantes:

- `month`
- `suggestions`
- `totalPotentialSavings`
- `summary`
- `expensesHash`
- `monthlyBalance`
- `totalIncomes`
- `totalExpenses`

### Cupons

Tabelas:

- `coupon`
- `coupon_redemption`

Usadas para desconto e cortesia Pro.

## Lacunas Atuais

- `expense.type` ainda nao separa divida, dia a dia, estilo de vida e assinatura.
- Nao existe entidade explicita de divida/credor.
- Nao existe onboarding financeiro persistido.
- Nao existe plano de recuperacao persistido por etapa.
- Categorias default misturam tipo financeiro e categoria operacional.

## Evolucao Proposta

### `financial_profile`

Armazena respostas do onboarding.

Campos sugeridos:

- `id`
- `userId`
- `debtOrigin`: `unexpected`, `consumption`, `low_income`, `psychological`, `mixed`, `unknown`
- `hasOverdueDebt`
- `usesCreditToCloseMonth`
- `incomeIsVariable`
- `hasEmergencyReserve`
- `mainConcern`
- `createdAt`
- `updatedAt`

### `debt`

Representa dividas isoladas.

Campos sugeridos:

- `id`
- `userId`
- `creditorName`
- `description`
- `originalAmount`
- `currentAmount`
- `minimumPayment`
- `interestRate`
- `dueDate`
- `status`: `active`, `overdue`, `negotiating`, `settled`, `ignored_for_now`
- `priority`
- `createdAt`
- `updatedAt`

### `recovery_plan`

Representa plano ativo.

Campos sugeridos:

- `id`
- `userId`
- `status`: `active`, `paused`, `completed`
- `currentStep`
- `targetMonthlySurplus`
- `minimumReserveTarget`
- `createdAt`
- `updatedAt`

### `recovery_plan_step`

Etapas do plano.

Campos sugeridos:

- `id`
- `planId`
- `stepKey`
- `title`
- `description`
- `targetAmount`
- `currentAmount`
- `status`: `pending`, `active`, `completed`, `skipped`
- `order`

### Evolucao De Classificacao

Adicionar campo em `expense`:

- `financialClass`: `essential`, `day_to_day`, `debt`, `lifestyle`, `subscription`, `investment`, `unexpected`

Manter `type` atual temporariamente para compatibilidade e migrar gradualmente.

## Politica De Criptografia

Devem continuar criptografados:

- descricao de entradas/despesas;
- valores financeiros sensiveis;
- dados extraidos de faturas;
- detalhes de dividas quando forem adicionados.

Podem ficar em claro:

- ids;
- datas;
- tipos/classificacoes;
- nomes de categorias;
- flags de status.
