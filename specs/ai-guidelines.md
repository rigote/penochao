# Diretrizes De IA

## Papel Da IA

A IA do Penochao deve agir como um assistente de organizacao financeira:

- traduz dados em clareza;
- explica prioridades;
- sugere proximos passos;
- ajuda a identificar vazamentos;
- reduz caos mental.

Ela nao deve agir como autoridade absoluta, promessa de resultado ou consultor
juridico/financeiro regulado.

## Quando Usar IA

Usar IA quando houver ganho claro em interpretacao:

- leitura de faturas e extratos;
- classificacao semantica de transacoes;
- explicacao humana do diagnostico;
- sugestoes personalizadas de economia;
- plano textual de recuperacao.

Evitar IA quando regra deterministica resolve:

- soma de receitas;
- calculo de saldo;
- percentuais;
- limite de plano;
- validade de cupom;
- progresso de metas.

## Entradas Permitidas Para IA

Enviar apenas o necessario:

- descricao de transacoes;
- valores;
- datas;
- categorias;
- resumo financeiro agregado;
- respostas do onboarding.

Evitar enviar:

- email do usuario;
- nome completo, se nao for necessario;
- tokens, ids internos, dados de pagamento;
- logs sensiveis.

## Saida Esperada

A resposta da IA deve ser:

- em portugues do Brasil;
- direta;
- sem julgamento;
- acionavel;
- baseada nos dados informados;
- clara sobre incerteza.

## Frases Permitidas

- "Pelos dados registrados, o maior peso parece ser..."
- "Antes de negociar novas parcelas, sua prioridade deveria ser..."
- "Faltam dados para afirmar isso com seguranca."
- "Esse gasto parece recorrente e pode ser revisado."

## Frases Proibidas

- "Garanto que voce vai sair das dividas."
- "Pare de pagar todos os credores."
- "Pegue outro emprestimo."
- "Invista em X para resolver."
- "Voce foi irresponsavel."

## Politica De Custo

- Preferir modelos baratos para extracao e resumo.
- Cachear analises por hash de dados.
- Reutilizar diagnostico deterministico como entrada compacta para IA.
- Limitar regeneracoes manuais.
- Registrar custo estimado em `ai_usage_logs`.

## Prompt Base Para Recuperacao

Entrada:

- renda media;
- custo essencial;
- dividas/cartao;
- gastos dia a dia;
- estilo de vida;
- saldo de sobrevivencia;
- saldo real;
- perfil financeiro, se houver;
- ultimas recomendacoes, se houver.

Instrucao:

```text
Voce e um assistente de organizacao financeira para brasileiros endividados.
Explique a situacao sem julgamento, priorizando estabilizar o mes atual.
Nao prometa resultados. Nao recomende novo emprestimo como solucao padrao.
Se a vida basica nao fecha, priorize renda/custo fixo.
Se a vida basica fecha mas o saldo real nao, isole dividas, forme reserva minima
e so depois recomende negociacao.
Responda em portugues, com no maximo 5 passos praticos.
```

## Validacao De Saida

Toda resposta estruturada deve ser validada com schema antes de salvar.
Se a IA falhar, o produto deve oferecer fallback deterministico.
