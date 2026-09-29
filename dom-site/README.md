# DOM Estética Automotiva

Landing page em português, com Ninetea local, identidade DOM, 30 serviços, solicitação de agendamento e painel de leads persistido em MySQL. Executa Next.js em Node.js; o desenvolvimento local usa SQLite.

## Operação local

- Desenvolvimento: `npm run dev`; prévia em http://localhost:5173.
- Compilação: `npm run build`.
- Produção: `npm run start`; usa a porta `PORT` definida pela hospedagem.
- `/painel`: acesso por nome de usuário e senha, métricas gerais, busca e filtros no servidor, 50 registros por página, agenda, status, notas, edição de preferência e CSV da página atual.
- `/texturas`: estudo com três texturas animadas; não aparece na navegação pública.
- `/privacidade`: descrição dos dados coletados e contato da DOM.
- WhatsApp: mensagem pronta para 5564996546936, enviada pelo visitante. A API de disparos fica para configuração posterior.
- App da equipe: `/painel` pode ser instalado na tela inicial do iPhone e Android. Com `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` no servidor, o administrador ativa avisos de novos leads em cada aparelho. As notificações mostram apenas uma chamada genérica.
- Assistente por voz: personagem chibi no canto do site, conversa falada em português via áudio processado pela API Gemini. Precisa de `GEMINI_API_KEY` e de um banco disponível no servidor. Revisa nome, veículo, categoria, serviços, WhatsApp, data, horário e observações antes da autorização. Após salvar a reserva, desliga o microfone, fala “Está agendado, ok! Te esperamos lá!” e encerra. Serviços sem duração definida recebem a mensagem de pedido recebido, sujeito à confirmação da equipe.

O formulário tradicional registra uma preferência de horário, que a equipe confirma. O assistente por voz pode reservar automaticamente quando o serviço tem duração definida e há menos de dois carros simultâneos, de segunda a sexta 8h–18h e sábado 8h–12h. Serviços sob avaliação dependem da equipe. Não há sincronização com Minha Auto Agenda.

## Visual e mídia

Hero com composição horizontal da capa no desktop e imagem vertical original no celular. Fotos dos serviços receberam 14 tratamentos cinematográficos de luz e contraste; as versões são reutilizadas entre os 30 serviços. Originais preservados. Os PNGs de edição e o prompt estão na pasta irmã assets-generated/cinematic.

As versões generativas mantêm a cena como referência e podem reinterpretar detalhes finos. Não são documentação pericial de resultados. As versões públicas são WebP comprimidas; cards carregam miniaturas sob demanda. A hero horizontal tem aproximadamente 320 KB; as 14 miniaturas totalizam aproximadamente 1,30 MB. Texturas grain e luz são CSS/SVG, sem vídeos ou biblioteca de animação adicional.

Ninetea Regular é o peso mais leve incluído no arquivo de fonte fornecido; a faixa usa esse peso. O ícone WhatsApp vem do pacote oficial da Meta: https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/.

Movimento automático solicitado pelo usuário: marquee contínuo, setas sequenciais, luz ambiente lenta, resposta suave ao mouse e entrada dos elementos com blur/fade. A configuração automática desta versão também mantém movimento quando o navegador informa preferência de redução. Não há controles de ativação ou play, conforme solicitado.

## Acesso e segurança

Credenciais no arquivo privado fora do repositório. ADMIN_USERNAME, ADMIN_SALT e ADMIN_PASSWORD_HASH pertencem ao ambiente privado. A senha inicial aleatória de alta entropia é verificada por hash com salt. Sessões opacas expiram em oito horas, cookie HttpOnly/SameSite e Secure em HTTPS; logout revoga o token. APIs privadas exigem sessão, gravações exigem origem correspondente. Limitação persistida de solicitações e login, honeypot, tamanho máximo de corpo e validação no servidor. Nenhuma credencial entra no cliente.

## Validação realizada

Build de produção, TypeScript e ESLint sem erros. O lint ainda informa dez avisos sobre imagens nativas: a otimização é feita previamente nos arquivos WebP e picture permite composições distintas entre desktop e celular.

Testes locais: JSON malformado, corpo excedente, calendário real, normalização de +55, duplicação idêntica, conflito de protocolo com payload alterado, proteção por origem e sessão, filtros de agenda/status, busca SQL literal, 52 registros de paginação sem repetição, métricas globais, atualização e logout. Registros descartáveis removidos. Nenhuma mensagem WhatsApp enviada pelos testes.

Verificação visual no navegador integrado em desktop 1440×900 e celular 390×844; movimento automático ativo, fotos carregadas, ausência de rolagem horizontal e seleção de serviço por teclado. Não foi realizada uma matriz completa de navegadores/dispositivos nem medição de Core Web Vitals em hospedagem pública.

## Hospedagem

A versão atual foi adaptada para a Hostinger: configuração Next.js, Node 22.x, saída `.next` e MySQL. Consulte [o guia de configuração](../HOSTINGER.md). Credenciais administrativas e do banco são variáveis de ambiente do servidor; `APP_ORIGIN` define o endereço HTTPS autorizado para as gravações. Tabelas são criadas automaticamente sem apagar os dados existentes.

Em produção não existe fallback automático para SQLite. A base `.data/dom.sqlite` atende apenas o desenvolvimento local e não entra no ZIP ou GitHub. A prévia anterior em D1 foi preservada localmente durante a adaptação. Arquivos antigos de Sites/Vinext e migrações D1 permanecem como referência histórica e não são usados pelos comandos Next.js atuais.

A conexão MySQL da Hostinger foi configurada e validada em `https://domautomotiva.com.br`: login, áudio WAV enviado ao Gemini, revisão dos dados, autorização, reserva confirmada e leitura no painel. A reserva fictícia foi cancelada após a verificação e não ocupa capacidade. O teste de ciclo de vida `node tests/voice-lifecycle.mjs` cobre cancelamento de requests, permissão tardia do microfone, conversas isoladas, recuperação com o mesmo protocolo, contexto de áudio iniciado no clique e reutilizado, liberação do microfone e encerramento automático. O áudio real dos aparelhos e a entrega de push em iPhone/Android ainda dependem de teste nesses dispositivos.

## Fontes

- Catálogo DOM revisado fornecido pelo usuário: imagens, descrições e valor inicial da manutenção.
- https://minhaautoagenda.com/p/domautoagenda: serviços adicionais, durações, endereço e avaliações atribuídas.
- Logo e fonte Ninetea fornecidos pelo usuário.
