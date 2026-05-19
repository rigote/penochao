# Importacao E Categorizacao

## Status

Parcialmente implementada.

## Problema

Registrar tudo manualmente e cansativo. Pessoas endividadas precisam transformar
faturas e extratos em clareza rapidamente.

## Objetivo

Importar PDFs de faturas/extratos, extrair transacoes e classificar em entradas,
essenciais, dividas/cartao, dia a dia e estilo de vida.

## Fluxo

1. Usuario envia PDF.
2. Sistema valida arquivo.
3. Sistema extrai texto.
4. IA extrai transacoes.
5. Sistema mostra lista editavel.
6. Usuario revisa e salva.

## Regras De Negocio

- Free possui limite mensal.
- Pro/cortesia respeitam plano efetivo.
- Cada upload deve registrar uso de IA.
- Usuario sempre revisa antes de salvar.
- Valores negativos em extratos devem ser convertidos com cuidado para tipo correto.

## Classificacao

Detectar:

- entrada;
- compra;
- fatura paga;
- emprestimo;
- parcela;
- assinatura;
- conta essencial;
- transferencia enviada/recebida.

## IA

Usar schema estruturado.
Fallback: se IA falhar, criar item de erro editavel.

## UX

- Drag and drop.
- Estados de carregamento por arquivo.
- Mostrar confianca quando disponivel.
- Acao "salvar todos".
- Avisar limite antes do upload.

## Criterios De Aceite

- [ ] PDF valido e processado.
- [ ] PDF sem texto retorna erro claro.
- [ ] Limite Free respeitado.
- [ ] Cortesia expirada nao permite beneficio Pro.
- [ ] Usuario revisa transacoes antes de salvar.

## Metricas

- Uploads por plano.
- Taxa de sucesso de extracao.
- Transacoes salvas apos upload.
- Custo medio por upload.
