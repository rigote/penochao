# Regras De Negocio

## Planos

### Free

- Pode usar o dashboard financeiro.
- Pode acessar o Raio-X financeiro inicial.
- Pode processar ate 3 faturas/extratos com IA por mes.
- Deve receber valor real antes de qualquer bloqueio de upgrade.
- Deve entender claramente o que falta para melhorar o diagnostico.

### Pro

- Pode processar faturas/extratos com IA conforme limite comercial vigente.
- Pode acessar sugestoes inteligentes e plano de recuperacao.
- Pode exportar relatorios.
- Pode criar categorias personalizadas.
- Deve receber valor suficiente para justificar o preco low ticket.

## Cortesia Pro

- Cupom de cortesia pode ativar plano Pro por periodo limitado.
- Quando a cortesia expira, o usuario deve voltar para Free se nao tiver assinatura Stripe ativa.
- Usuario com assinatura Stripe ativa continua Pro mesmo se a cortesia expirar.
- Limite mensal de IA definido por cupom de cortesia deve valer apenas enquanto a cortesia estiver ativa.
- O sistema deve validar plano efetivo em areas sensiveis, nao apenas confiar no campo `user.plan`.

## Diagnostico Financeiro

- Renda real deve preferir media dos ultimos 3 a 4 meses com entradas registradas.
- Custo essencial deve ser separado de dividas/cartao.
- Dividas, faturas, emprestimos, renegociacoes e parcelas devem poder ser isolados do calculo de sobrevivencia.
- Saldo de sobrevivencia = renda media - custo essencial.
- Saldo real = renda media - todas as despesas.
- Se saldo de sobrevivencia for negativo, a prioridade e reduzir custo fixo ou aumentar renda.
- Se saldo de sobrevivencia for positivo e saldo real negativo, a prioridade e isolar dividas, criar reserva minima e negociar com metodo.
- Se saldo real for positivo mas margem for baixa, prioridade e aumentar folga e formar reserva.

## Classificacao Financeira

Classificacoes recomendadas para evolucao:

- `income`: entrada.
- `essential`: custo essencial.
- `day_to_day`: gasto recorrente ou operacional do dia a dia.
- `debt`: divida, emprestimo, fatura, parcela ou renegociacao.
- `lifestyle`: consumo, lazer e padrao de vida.
- `subscription`: assinatura recorrente.
- `investment`: reserva, investimento ou patrimonio.
- `unexpected`: imprevisto.

Enquanto o schema nao tiver todas as classificacoes, o produto pode inferir por
descricao e categoria.

## Ordem De Recuperacao

1. Entender renda media.
2. Separar custo essencial.
3. Isolar dividas antigas para diagnostico.
4. Fazer mes atual fechar positivo.
5. Criar folga mensal.
6. Formar reserva minima.
7. Negociar dividas com dinheiro real.
8. Acelerar quitacao com renda extra ou ativos parados.

## IA

- IA pode sugerir cortes, alertas, prioridades e explicacoes.
- IA nao deve prometer quitar dividas, garantir descontos ou substituir aconselhamento profissional.
- Toda recomendacao sensivel deve ser apresentada como orientacao pratica, nao como garantia.
- Quando o usuario esta no vermelho, a IA deve priorizar estabilizacao do mes atual antes de renegociacao agressiva.
- IA deve preferir linguagem simples e acionavel.
- IA deve explicar quando faltam dados.

## Limites De IA E Custo

- Free deve ter limite mensal baixo e transparente.
- Pro deve ter limite suficiente para uso normal, mas protegido contra abuso.
- Operacoes deterministicas devem ser preferidas quando nao houver ganho claro de IA.
- IA deve ser cacheada quando a entrada financeira nao mudou.
- Logs de uso devem registrar custo estimado, modelo, usuario e tipo de entrada.

## Segurança

- Descricoes e valores financeiros sensiveis devem continuar criptografados.
- Dados financeiros nao devem aparecer em logs.
- Acesso a dados deve sempre validar usuario autenticado.
- Acesso admin deve ser restrito por lista/role definida.
- Upload de arquivo deve validar tipo, tamanho e usuario.

## LGPD E Privacidade

- Analytics e tokens nao essenciais dependem de consentimento explicito.
- Cookies essenciais de login, seguranca e preferencias podem ser usados sem consentimento adicional.
- Usuario deve poder recusar analytics sem perder acesso ao produto.
- Usuario autenticado deve poder excluir a propria conta.
- Exclusao deve remover dados pessoais e financeiros associados, respeitando obrigacoes legais quando existirem.
- Politica de privacidade deve explicar finalidades, bases legais, compartilhamento, retencao e direitos do titular.

## Relatorios

- Relatorio deve deixar claro o periodo analisado.
- Relatorio deve separar essenciais, dividas e demais gastos.
- Exportacao Pro nao deve expor dados de outro usuario.
- Valores exportados devem ser descriptografados apenas no momento de gerar resposta autorizada.

## Testes E Spec

- Toda mudanca relevante deve atualizar a spec correspondente.
- Regras financeiras, plano/cortesia, validacoes e IA devem ter testes de regressao quando alteradas.
- Bug corrigido deve entrar acompanhado de teste ou justificativa documentada.
