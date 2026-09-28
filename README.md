# DOM Estética Automotiva

Landing page e painel administrativo da DOM, com catálogo, solicitação de agendamento e mensagem pronta de WhatsApp. A aplicação usa **Next.js e Node.js**, com **MySQL em produção** e SQLite para desenvolvimento local.

O código está em **[dom-site](dom-site/README.md)**. Consulte **[a configuração da Hostinger](HOSTINGER.md)** e **[a revisão técnica](REVISAO-DOM.md)**.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

```sh
cd dom-site
npm ci
npm run dev
```

A prévia abre em http://localhost:5173. Configure o acesso administrativo a partir de `dom-site/.env.example`. Credenciais, banco local e arquivos privados de publicação não estão no repositório.

## Produção

```sh
npm run build
npm run start
```

Na Hostinger, use a configuração **Next.js**, Node **22.x** e a pasta **dom-site** quando conectar este repositório pelo GitHub. Configure o MySQL e as variáveis administrativas seguindo [HOSTINGER.md](HOSTINGER.md). O envio ao GitHub não publica automaticamente o site.
