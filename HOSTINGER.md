# Publicar a DOM na Hostinger

Esta versão executa Next.js em Node.js e grava leads, sessões e limites de acesso em MySQL. A aparência e o painel por usuário e senha foram preservados.

## Arquivo ou GitHub

Use o novo **DOM-HOSTINGER.zip** gerado após a adaptação. Ele contém a pasta `dom-estetica-automotiva-master/dom-site`. O ZIP antigo com a versão Vinext/Cloudflare deve ser substituído.

Também é possível conectar o repositório privado `francomaia/dom-estetica-automotiva`, selecionar a branch `master` e usar `dom-site` como diretório raiz.

## Campos da tela de publicação

| Campo | Valor |
| --- | --- |
| Configuração predefinida | **Next.js** |
| Versão do Node | **22.x** |
| Diretório raiz, ao enviar o novo ZIP | `dom-estetica-automotiva-master/dom-site` |
| Diretório raiz, pela integração GitHub | `dom-site` |
| Instalação, se houver campo | `npm ci` |
| Compilação | `npm run build` (executa `next build --webpack`) |
| Diretório de saída | `.next` |
| Inicialização, se houver campo | `npm run start` |

Mantenha a porta definida pela Hostinger. `next start` lê a variável `PORT` automaticamente. Não configure saída estática: as APIs do agendamento e do painel precisam do servidor Node.js.

## Banco e variáveis

No painel da Hostinger, abra **Sites → Painel de controle → Bancos de dados → Gerenciamento** e crie um banco MySQL e seu usuário. Anote os nomes completos que a Hostinger mostrar, incluindo os prefixos, e a senha do banco.

Na tela de publicação, clique em **Variáveis de ambiente → Adicionar**. O arquivo privado **HOSTINGER-ENV-DOM.txt**, fora do GitHub e do ZIP, já contém os três valores administrativos que mantêm o acesso atual. Adicione cada variável separadamente:

| Nome | Valor |
| --- | --- |
| `ADMIN_USERNAME` | O usuário atual, `dom` |
| `ADMIN_SALT` | Copiar do arquivo privado |
| `ADMIN_PASSWORD_HASH` | Copiar do arquivo privado |
| `APP_ORIGIN` | `https://domautomotiva.com.br` |
| `GEMINI_API_KEY` | Copiar do arquivo privado para ativar o agendamento por voz |
| `VAPID_PUBLIC_KEY` | Copiar do arquivo privado para os avisos do app da equipe |
| `VAPID_PRIVATE_KEY` | Copiar do arquivo privado para os avisos do app da equipe |
| `DB_HOST` | Host informado pela Hostinger, normalmente `localhost` |
| `DB_PORT` | `3306`, salvo indicação diferente da hospedagem |
| `DB_USER` | Nome completo do usuário MySQL |
| `DB_PASSWORD` | Senha do usuário MySQL |
| `DB_NAME` | Nome completo do banco MySQL |

`APP_ORIGIN` deve ser `https://domautomotiva.com.br`. O login aceita também `https://www.domautomotiva.com.br` para corrigir o erro de origem observado na publicação. Ao trocar de domínio, atualize a configuração. Use `https://domautomotiva.com.br/painel` para abrir o painel após a publicação. Não use valores de exemplo como credenciais reais. Não configure `ALLOW_LOCAL_SQLITE` na Hostinger: em produção o banco deve ser MySQL, para preservar os leads entre publicações.

O aplicativo cria suas tabelas automaticamente no primeiro acesso que utiliza o banco. O usuário MySQL precisa ter permissão para criar e consultar tabelas nesse banco. As tabelas existentes não são apagadas ao reiniciar ou republicar.

## App da equipe e avisos

No iPhone, abra `/painel` no Safari, toque em **Compartilhar → Adicionar à Tela de Início**, entre pelo ícone DOM e toque em **Ativar avisos** no painel. No Android, abra `/painel` no Chrome, escolha **Instalar app** no menu, entre e ative os avisos. A permissão precisa ser aceita no próprio aparelho. Cada dispositivo é ativado separadamente. O aviso na tela bloqueada é genérico; nome e telefone continuam dentro do painel. A página deve estar em HTTPS e as duas variáveis `VAPID_*` precisam estar configuradas na Hostinger. A chave privada nunca entra no frontend.

## Agendamento por voz

O personagem chibi aparece no canto da página. Ao clicar, ele pede os dados por voz, escuta cada resposta, mostra um resumo e pergunta se pode enviar o pedido e entrar em contato pelo WhatsApp. A chave `GEMINI_API_KEY` fica somente no servidor. O áudio é enviado ao Gemini durante a conversa e não é armazenado pela DOM. O agendamento automático usa dois espaços de atendimento: segunda a sexta das 8h às 18h; sábado das 8h às 12h. A duração de cada serviço do catálogo bloqueia o espaço necessário, inclusive quando o trabalho atravessa mais de um dia. Serviços "sob avaliação" geram pedido para confirmação manual. O assistente só diz "Está agendado" depois que o pedido tiver sido salvo como **Confirmado**. Se os dois espaços estiverem ocupados, ele pede outra preferência.

## Publicação e conferência

Clique em publicar após preencher as variáveis. Abra o site e `/painel`; o usuário e a senha continuam os mesmos do acesso local. Envie um pedido identificado como teste, confirme seu registro no painel, altere o status e saia do painel. A mensagem pronta abre o WhatsApp; seu envio depende do visitante. Nenhum disparo automático está configurado.

O banco local não é enviado no ZIP. Pedidos reais recebidos antes da hospedagem, se existirem, precisam de uma importação separada; não se misturam automaticamente ao banco novo.

Se o site abrir e o painel apresentar erro de conexão, confira os cinco valores `DB_*`, a vinculação do usuário ao banco e reinicie o aplicativo. Se o formulário informar origem inválida após esta atualização, confira o domínio exato no navegador e `APP_ORIGIN`. Para falha de compilação, consulte o log da publicação. Esta versão usa a configuração `next.config.mjs` e Webpack para permitir o fallback WebAssembly do compilador SWC em servidores cuja versão de `glibc` não carrega o binário nativo. Um aviso sobre esse binário pode aparecer, mas a publicação precisa terminar com build concluído.

## Validação desta adaptação

Compilação Next.js e TypeScript aprovados; lint sem erros, com oito avisos das imagens nativas já otimizadas. O servidor de produção foi testado localmente com SQLite apenas como banco de teste: persistência, pedidos simultâneos, duplicação, origem, login, cookie seguro, filtros literais, paginação, atualização e logout. A conexão com o MySQL da sua conta precisa ser conferida após configurar as credenciais e publicar; não foi testada remotamente.

Referências oficiais: [publicação Node.js na Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) e [conexão MySQL na Hostinger](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).
