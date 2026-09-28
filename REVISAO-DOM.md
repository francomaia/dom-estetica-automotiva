# Revisão DOM — 27 de setembro de 2026

## Entrega visual

Hero mais baixa no desktop, imagem horizontal com os três carros, imagem vertical no celular e remoção das três frases decorativas. Tipografia e botões maiores; CTAs em maiúsculas. Cards com fotografia inteira, texto sobre fade escuro e área de clique ampliada. Fotos tratadas com luz quente, arquivos originais preservados. Ícone oficial do WhatsApp.

Faixa contínua com Ninetea Regular, o peso mais leve fornecido, e três setas luminosas em sequência. Texturas com grain e manchas de luz no laranja DOM, movimento lento e resposta ao mouse. Entrada das seções com deslocamento, fade e blur. Animações automáticas e sem botões de play, conforme pedido.

## Correções funcionais

- Rejeição de datas inexistentes e de horários fora do intervalo permitido.
- Protocolo reutilizado com dados diferentes retorna conflito; reenvio idêntico usa o registro salvo.
- Telefone aceita formato nacional ou +55 e é normalizado antes de salvar.
- JSON inválido e corpos grandes recebem resposta controlada.
- Busca e paginação administrativa no servidor; métricas consideram toda a base.
- Busca com caracteres especiais tratada como texto literal.
- Erros de entrada, logout e atualização apresentados ao usuário; sessões expiradas limpas no login.
- CSV identifica que exporta a página atual e protege campos que podem ser interpretados como fórmulas.

## Evidência

Build, TypeScript e ESLint sem erros; oito avisos sobre uso intencional de imagens nativas previamente comprimidas. Fluxo de API validado com salvamento, reenvio, login, filtros, 52 registros de paginação, atualização e logout. Testes descartáveis removidos. Desktop e celular sem rolagem horizontal; seleção do serviço por teclado validada.

Hero horizontal: cerca de 320 KB. As 14 miniaturas de serviços: cerca de 1,30 MB no total, carregadas sob demanda. Texturas produzidas em CSS/SVG e animações sem nova biblioteca. Versões PNG e prompt preservados em assets-generated/cinematic/README.md.

## Limites atuais

Disponível em http://localhost:5173/. Mensagem WhatsApp pronta, envio manual; API automática ainda não configurada. Preferências de horário exigem confirmação humana. Publicação na Hostinger depende de configurar banco, variáveis e domínio na conta do usuário. Nenhuma matriz completa de browsers nem medição de desempenho em hospedagem pública foi executada. Tratamento generativo pode reinterpretar detalhes finos das fotos; as originais continuam disponíveis. Movimento permanece automático mesmo com preferência de redução do navegador, seguindo a solicitação desta versão.

## Adaptação para Hostinger

Runtime de produção alterado para Next.js em Node.js, com conexão MySQL em pool e criação automática das tabelas. Credenciais do servidor usam variáveis de ambiente; origem pública configurável para o proxy da hospedagem. Cookies administrativos Secure em produção. Busca literal e métricas compatíveis com MySQL e SQLite; atualização repetida não reporta incorretamente um lead inexistente. A base local foi preservada e continua fora do repositório.

Build Next.js e TypeScript aprovados. Lint sem erros, oito avisos conhecidos sobre imagens nativas. Servidor Next.js de produção validado localmente com SQLite: páginas e mídia, corpos inválidos/grandes, origem, calendário, quatro pedidos concorrentes com o mesmo protocolo e apenas um registro, três logins concorrentes, persistência, busca com `%`, `_` e `!`, 53 registros em duas páginas sem repetição, atualização repetida, agenda e logout. Dados de teste removidos. Conexão MySQL remota ainda não validada, pois as credenciais da Hostinger não estão configuradas neste ambiente.
