# Raio-X Financeiro

## Status

Primeira versao implementada. Evolucao pendente para onboarding, entidade de
dividas e classificacao financeira expandida.

## Problema

Pessoas endividadas geralmente tentam resolver tudo ao mesmo tempo e nao sabem se
o problema esta na renda, no custo essencial, nas dividas antigas ou no consumo.
Isso gera caos mental e decisoes ruins, como pegar novo emprestimo sem o mes
atual fechar.

## Objetivo

Mostrar uma leitura simples e direta da situacao atual:

- minha vida basica fecha?
- quanto as dividas pesam?
- tenho sobra real?
- qual e o proximo passo?

## Usuarios

- Usuario Free: deve conseguir enxergar um diagnostico inicial.
- Usuario Pro: deve receber diagnostico completo, sugestoes e plano continuo.
- Usuario em cortesia: recebe Pro enquanto a cortesia estiver ativa.
- Usuario com poucos dados: recebe orientacao do que cadastrar/importar.

## Conceitos

### Renda Media

Media das entradas dos ultimos 3 a 4 meses. Se houver meses sem renda e outros
meses com renda, a media deve preferir os meses com renda para nao distorcer o
diagnostico inicial.

### Custo Essencial

Despesas necessarias para manter vida basica e estabilidade:

- moradia;
- mercado;
- agua;
- luz;
- gas;
- transporte essencial;
- saude;
- escola dos filhos;
- financiamento essencial com risco de perda de bem.

### Dividas E Cartao

Faturas, emprestimos, renegociacoes, parcelas, juros, cheque especial e valores
que representam buraco financeiro acumulado.

### Saldo De Sobrevivencia

`renda media - custo essencial`

Serve para responder: "sem o caos das dividas antigas, minha vida basica fecha?"

### Saldo Real

`renda media - todas as despesas`

Serve para responder: "olhando tudo, sobra dinheiro de verdade?"

## Fluxo

1. Usuario acessa `Raio-X`.
2. Sistema calcula renda media dos ultimos meses.
3. Sistema separa essenciais, dividas/cartao, dia a dia e estilo de vida.
4. Sistema mostra risco financeiro.
5. Sistema mostra saldo de sobrevivencia e saldo real.
6. Sistema entrega proximo passo recomendado.
7. Sistema orienta o que falta para melhorar o diagnostico.

## Regras De Negocio

- Usar ultimos 4 meses para reduzir distorcao de um mes isolado.
- Ignorar meses sem renda apenas no calculo de media de renda, quando houver outros meses com renda.
- Classificar como divida/cartao quando descricao ou categoria indicar fatura, cartao, emprestimo, financiamento, parcela, renegociacao ou juros.
- Saldo de sobrevivencia deve ignorar dividas/cartao temporariamente.
- Isolar dividas nao significa orientar a nao pagar; significa diagnosticar sem misturar tudo.
- Diagnostico deve ser direto e sem julgamento.
- Se nao houver renda registrada, o primeiro passo e registrar entradas.
- Se nao houver despesas, o primeiro passo e importar fatura/extrato ou cadastrar despesas essenciais.

## Niveis De Risco

### Estavel

Condicao:

- saldo real positivo;
- comprometimento total controlado.

Mensagem:

- "Existe folga para organizar reserva e atacar dividas com metodo."

### Apertado

Condicao:

- saldo real positivo, mas renda muito comprometida.

Mensagem:

- "Voce esta positivo, mas com pouca margem para imprevistos."

### Em Alerta

Condicao:

- saldo real negativo;
- dividas nao sao o unico fator dominante.

Mensagem:

- "O mes fecha negativo depois de colocar tudo na mesa."

### Critico

Condicao:

- saldo real negativo;
- dividas/cartao consomem parte alta da renda.

Mensagem:

- "Sua vida basica respira, mas as dividas estao puxando tudo para baixo."

### Emergencia

Condicao:

- renda ausente; ou
- saldo de sobrevivencia negativo.

Mensagem:

- "Mesmo tirando dividas antigas da mesa, o mes nao fecha."

## Dados

Usa dados existentes:

- `income`
- `expense`
- `category`

Campos principais:

- `description`
- `amount`
- `type`
- `category.name`
- `occurrenceDate`

Campos futuros:

- `expense.financialClass`
- `financial_profile`
- `debt`

## IA

Primeira versao pode ser deterministica, sem IA, para reduzir custo.
Versao Pro pode usar IA para transformar o diagnostico em explicacao mais humana.

Entrada recomendada para IA:

- diagnostico agregado;
- perfil financeiro;
- principais categorias;
- top recorrencias;
- dividas cadastradas.

Saida recomendada:

- resumo;
- causa provavel;
- proximo passo;
- ate 5 acoes.

## UX

- Mostrar risco como Estavel, Apertado, Em alerta, Critico ou Emergencia.
- Mostrar saldo de sobrevivencia e saldo real lado a lado.
- Explicar que dividas foram isoladas para diagnostico, nao ignoradas.
- Estado vazio deve orientar o usuario a registrar entradas e importar faturas.
- Mobile deve priorizar cards empilhados e textos curtos.
- Evitar graficos complexos na primeira dobra.

## Copy Principal

Titulo:

- "Raio-X Financeiro"

Subtitulo:

- "Uma visao crua para separar sobrevivencia, dividas e folga real antes de tomar decisoes."

## Criterios De Aceite

- [x] Usuario autenticado acessa `/raio-x`.
- [x] Menu desktop e mobile mostram `Raio-X`.
- [x] Tela mostra renda media, sobra de sobrevivencia e sobra real.
- [x] Tela mostra comprometimento da renda.
- [x] Usuario com cupom Pro expirado e sem Stripe volta para Free ao acessar area logada.
- [x] Nenhum valor sensivel e salvo descriptografado.
- [x] Regras puras de classificacao, risco e resumo possuem testes unitarios.
- [ ] Estado vazio especifico para usuario sem entradas.
- [ ] Estado vazio especifico para usuario sem despesas.
- [ ] Diagnostico usa perfil do onboarding quando existir.
- [ ] Diagnostico usa entidade `debt` quando existir.

## Metricas

- Usuarios que acessam Raio-X apos login.
- Usuarios que importam faturas apos ver Raio-X.
- Usuarios que voltam no mes seguinte.
- Usuarios que deixam saldo real negativo para positivo.
- Usuarios que completam onboarding apos ver estado de diagnostico incompleto.
