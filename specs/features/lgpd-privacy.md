# LGPD E Privacidade

## Status

Em implementacao.

## Problema

O Penochao lida com dados financeiros sensiveis. O usuario precisa conseguir
controlar consentimentos, entender quais dados sao tratados e excluir sua conta
quando desejar.

## Objetivo

Aplicar controles praticos de LGPD:

- consentimento explicito para analytics/tokens nao essenciais;
- pagina publica clara sobre privacidade;
- exclusao de conta e dados pessoais pelo usuario;
- documentacao das bases de tratamento.

## Regras De Negocio

- Cookies/tokens essenciais podem funcionar sem consentimento porque sustentam login, seguranca e preferencias.
- Analytics e scripts de medicao so podem carregar apos aceite.
- Usuario pode recusar analytics e continuar usando o produto.
- Usuario pode alterar consentimento apagando/redefinindo preferencia.
- Usuario autenticado pode solicitar exclusao da propria conta.
- Exclusao da conta deve remover dados financeiros, sessoes, tokens, uploads vinculados quando possivel e dados pessoais do usuario.
- Se usuario tiver assinatura Stripe ativa, o sistema deve tentar cancelar antes de excluir dados locais.
- Registros necessarios para obrigacao legal ou antifraude podem ser mantidos apenas quando houver base legal documentada e preferencialmente minimizados.

## Dados Removidos Na Exclusao

- usuario;
- contas OAuth;
- sessoes;
- verification tokens vinculados ao email;
- entradas;
- despesas;
- faturas;
- configuracoes;
- sugestoes IA;
- resgates de cupom;
- logs de IA vinculados ao usuario;
- avatar no Vercel Blob quando hospedado ali.

## UX

- Perfil deve ter uma zona de perigo para exclusao.
- Fluxo deve exigir confirmacao textual.
- Copy deve deixar claro que a acao e irreversivel.
- Apos exclusao, usuario deve ser desconectado e enviado para a home.
- Banner de consentimento deve ser claro e ter opcoes "Aceitar" e "Recusar".
- Politica de privacidade deve explicar cookies essenciais e analytics opcionais.

## Criterios De Aceite

- [x] Analytics nao carrega antes do aceite.
- [x] Usuario pode recusar analytics.
- [x] Preferencia de consentimento fica salva no navegador.
- [x] Perfil permite excluir conta com confirmacao.
- [x] API de exclusao exige usuario autenticado.
- [x] API remove dados associados ao usuario.
- [x] Politica de privacidade explica LGPD, cookies e exclusao.

## Testes

- Testar helper de consentimento.
- Testar validacao de confirmacao de exclusao.
- Testar fluxo de API com mocks em etapa posterior.
