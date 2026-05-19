# Plano De Recuperacao Financeira

## Status

Proposta.

## Problema

O usuario pode ate entender os numeros, mas ainda fica perdido sobre o que fazer
primeiro. Sem ordem de execucao, ele tenta pagar tudo, fica sem reserva e volta
para a divida no primeiro imprevisto.

## Objetivo

Criar um plano cronologico e acompanhavel para sair do aperto.

## Usuarios

- Pessoa com saldo real negativo.
- Pessoa com saldo de sobrevivencia negativo.
- Pessoa com dividas/cartao pesando.
- Pessoa que esta positiva, mas sem reserva.

## Etapas Do Plano

### 1. Fechar O Mes Atual

Objetivo: renda do mes precisa cobrir custo essencial e gastos correntes.

Quando usar:

- saldo de sobrevivencia negativo;
- usuario usa cartao/limite para fechar mes;
- renda insuficiente.

Acoes:

- registrar renda real;
- cortar ou renegociar custo fixo quando possivel;
- buscar renda extra;
- pausar gastos de estilo de vida.

### 2. Criar Folga Mensal

Objetivo: gerar sobra recorrente.

Quando usar:

- saldo de sobrevivencia positivo;
- saldo real perto de zero;
- usuario sem margem para imprevistos.

Acoes:

- definir meta de sobra;
- revisar recorrencias;
- reduzir vazamentos;
- ajustar padrao de vida.

### 3. Montar Reserva Minima

Objetivo: evitar nova divida no proximo imprevisto.

Quando usar:

- mes atual fecha positivo;
- usuario ainda nao tem reserva.

Meta inicial sugerida:

- R$ 500,00;
- depois R$ 1.000,00;
- depois 1 mes de custo essencial.

### 4. Listar E Isolar Dividas Antigas

Objetivo: tirar o caos da cabeca e colocar em ordem.

Quando usar:

- existem faturas, emprestimos, atrasos ou renegociacoes.

Acoes:

- cadastrar credor;
- valor atual;
- parcela minima;
- status;
- risco;
- juros, se conhecido.

### 5. Negociar Com Dinheiro Real

Objetivo: negociar sem criar nova parcela impagavel.

Quando usar:

- existe folga;
- reserva minima esta encaminhada;
- usuario tem dinheiro para proposta ou entrada segura.

Acoes:

- priorizar juros alto e risco alto;
- buscar desconto a vista;
- evitar trocar varias dividas por parcela maior que a folga.

### 6. Acelerar Com Ativos Ou Renda Extra

Objetivo: reduzir buraco mais rapido.

Quando usar:

- usuario tem ativos parados;
- usuario pode fazer renda extra temporaria;
- divida tem desconto agressivo.

## Regras De Negocio

- Se saldo de sobrevivencia for negativo, nao recomendar renegociacao como primeiro passo.
- Se saldo real for negativo por dividas, recomendar isolamento e reserva minima.
- Se houver sobra real, dividir entre reserva e estrategia de negociacao.
- Plano deve ser mensal e revisavel.
- Usuario deve entender por que esta naquela etapa.
- Etapas podem coexistir, mas sempre deve haver uma prioridade atual.

## Logica De Escolha Da Etapa Atual

1. Sem renda suficiente registrada: etapa "descobrir renda real".
2. Saldo de sobrevivencia negativo: etapa "fechar mes atual".
3. Saldo real negativo e dividas altas: etapa "isolar dividas e criar folga".
4. Saldo real positivo sem reserva: etapa "reserva minima".
5. Reserva minima ok e dividas ativas: etapa "negociar credores".
6. Sem dividas e reserva ok: etapa "reconstrucao patrimonial".

## Dados

V1:

- usar diagnostico existente;
- usar `userSettings.currentSavings`;
- usar heuristica de dividas em despesas.

V2:

- `recovery_plan`;
- `recovery_plan_step`;
- `debt`;
- `financial_profile`.

## IA

IA deve gerar explicacao e sugestoes com base no diagnostico, mas a ordem das
etapas deve vir de regras do produto.

Entrada:

- etapa atual;
- diagnostico;
- perfil;
- top gastos;
- dividas.

Saida:

- resumo da etapa;
- 3 acoes da semana;
- alerta de risco;
- meta numerica.

## UX

- Uma etapa principal por vez.
- Checklist simples.
- Meta numerica visivel.
- Progresso mensal.
- Linguagem sem culpa.
- CTA para acao concreta: cadastrar renda, importar fatura, criar reserva, cadastrar divida.

## Criterios De Aceite

- [ ] Usuario ve etapa atual.
- [ ] Usuario entende por que essa etapa foi escolhida.
- [ ] Usuario tem uma meta numerica simples.
- [ ] Usuario consegue acompanhar progresso.
- [ ] Usuario pode marcar tarefa como feita.
- [ ] Plano atualiza quando diagnostico muda.

## Metricas

- Usuarios que visualizam plano.
- Usuarios que completam primeira tarefa.
- Usuarios que fecham mes positivo.
- Usuarios que criam reserva minima.
- Usuarios que reduzem dividas cadastradas.
