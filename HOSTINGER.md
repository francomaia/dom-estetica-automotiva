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
| Compilação | `npm run build` |
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
| `APP_ORIGIN` | Endereço HTTPS exato do site, incluindo `https://`, sem caminho: domínio próprio ou endereço temporário fornecido pela Hostinger |
| `DB_HOST` | Host informado pela Hostinger, normalmente `localhost` |
| `DB_PORT` | `3306`, salvo indicação diferente da hospedagem |
| `DB_USER` | Nome completo do usuário MySQL |
| `DB_PASSWORD` | Senha do usuário MySQL |
| `DB_NAME` | Nome completo do banco MySQL |

`APP_ORIGIN` precisa corresponder ao endereço usado pelo visitante. Ao trocar de domínio, atualize essa variável e reinicie o aplicativo. Não use valores de exemplo como credenciais reais. Não configure `ALLOW_LOCAL_SQLITE` na Hostinger: em produção o banco deve ser MySQL, para preservar os leads entre publicações.

O aplicativo cria suas três tabelas automaticamente no primeiro acesso que utiliza o banco. O usuário MySQL precisa ter permissão para criar e consultar tabelas nesse banco. As tabelas existentes não são apagadas ao reiniciar ou republicar.

## Publicação e conferência

Clique em publicar após preencher as variáveis. Abra o site e `/painel`; o usuário e a senha continuam os mesmos do acesso local. Envie um pedido identificado como teste, confirme seu registro no painel, altere o status e saia do painel. A mensagem pronta abre o WhatsApp; seu envio depende do visitante. Nenhum disparo automático está configurado.

O banco local não é enviado no ZIP. Pedidos reais recebidos antes da hospedagem, se existirem, precisam de uma importação separada; não se misturam automaticamente ao banco novo.

Se o site abrir e o painel apresentar erro de conexão, confira os cinco valores `DB_*`, a vinculação do usuário ao banco e reinicie o aplicativo. Se o formulário informar origem inválida, corrija `APP_ORIGIN`. Para falha de compilação, consulte o log da publicação.

## Validação desta adaptação

Compilação Next.js e TypeScript aprovados; lint sem erros, com oito avisos das imagens nativas já otimizadas. O servidor de produção foi testado localmente com SQLite apenas como banco de teste: persistência, pedidos simultâneos, duplicação, origem, login, cookie seguro, filtros literais, paginação, atualização e logout. A conexão com o MySQL da sua conta precisa ser conferida após configurar as credenciais e publicar; não foi testada remotamente.

Referências oficiais: [publicação Node.js na Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) e [conexão MySQL na Hostinger](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).
