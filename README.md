# DOM Estética Automotiva

Landing page e painel administrativo da DOM, com catálogo de serviços, solicitação de agendamento e mensagem pronta de WhatsApp.

O projeto está em **[dom-site](dom-site/README.md)**. Consulte **[a revisão técnica](REVISAO-DOM.md)** para as melhorias e validações realizadas.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

```sh
cd dom-site
npm ci
node scripts/run-framework.mjs dev
```

Configure as variáveis administrativas a partir de `dom-site/.env.example`. Senhas, variáveis privadas e banco local não estão no repositório.

## Hospedagem

Esta versão usa Vinext e Cloudflare D1. O envio ao GitHub armazena o projeto; não publica automaticamente o site. Para hospedar em outro ambiente, como Hostinger, será necessário configurar um backend e banco compatíveis, mantendo o painel protegido.
