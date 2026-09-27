export type Service={id:string;name:string;group:string;description:string;image:string;duration:string;price?:number};
export const services:Service[]=[
{id:'manutencao',name:'Manutenção estética',group:'Lavagem',description:'Pré-lavagem química, produtos de pH neutro e cuidado técnico com cada superfície.',image:'catalog-2-1-cinematic',duration:'Aprox. 3h30',price:190},
{id:'polimento',name:'Tratamento de pintura',group:'Pintura',description:'Corte, refino e lustro para recuperar o brilho e a profundidade da pintura.',image:'catalog-5-0-cinematic',duration:'Aprox. 12h30'},
{id:'vitrificacao',name:'Vitrificação',group:'Proteção',description:'Revestimento cerâmico sobre o verniz para proteger e preservar o acabamento.',image:'catalog-6-0-cinematic',duration:'Aprox. 10h30'},
{id:'higienizacao',name:'Higienização interna',group:'Interior',description:'Limpeza profunda de bancos, carpetes e acabamentos com produtos específicos.',image:'catalog-13-0-cinematic',duration:'Aprox. 1 dia'},
{id:'pelicula-hd',name:'Película UltraVision HD',group:'Proteção',description:'Tecnologia nanocerâmica para conforto térmico e visibilidade. Aplicação conforme legislação.',image:'catalog-12-0-cinematic',duration:'Aprox. 6h'},
{id:'motor',name:'Tratamento técnico do motor',group:'Detalhamento',description:'Limpeza minuciosa do cofre do motor com técnicas de baixa umidade.',image:'catalog-8-0-cinematic',duration:'Aprox. 2h30'},
{id:'vidros',name:'Descontaminação de vidros',group:'Detalhamento',description:'Remove resíduos e manchas para restaurar a transparência dos vidros.',image:'catalog-3-0-cinematic',duration:'30min a 1h'},
{id:'cera',name:'Enceramento técnico',group:'Proteção',description:'Preparação da superfície e cera de alta performance para realçar o brilho.',image:'catalog-4-0-cinematic',duration:'30min a 1h'},
{id:'cristalizacao',name:'Cristalização de vidros',group:'Proteção',description:'Tratamento repelente à água para facilitar a limpeza e a visibilidade.',image:'catalog-7-0-cinematic',duration:'Aprox. 1h30'},
{id:'black-piano',name:'Tratamento de black piano',group:'Pintura',description:'Micropolimento e proteção para colunas, molduras e acabamentos brilhantes.',image:'catalog-9-0-cinematic',duration:'Aprox. 1h'},
{id:'funilaria',name:'Funilaria e micropintura',group:'Pintura',description:'Correção de avarias e recuperação do acabamento após avaliação técnica.',image:'catalog-10-0-cinematic',duration:'Sob avaliação'},
{id:'pelicula-fusion',name:'Película Fusion Eclipse',group:'Proteção',description:'Película Across Fusion para privacidade e durabilidade, conforme legislação.',image:'catalog-11-0-cinematic',duration:'Aprox. 6h'},
{id:'motor-seco',name:'Lavagem a seco do motor',group:'Detalhamento',description:'Limpeza componente por componente, sem lavadora de alta pressão.',image:'catalog-14-0-cinematic',duration:'3h a 4h30'},
{id:'oxi',name:'Oxi-sanitização',group:'Interior',description:'Tratamento com ozônio para controle de odores no interior do veículo.',image:'catalog-15-0-cinematic',duration:'Aprox. 2h30'},
...[
['ppf-full','PPF · Full body','Proteção','Proteção da pintura com película de aplicação completa.','2 dias'],
['ppf-front','PPF · Full front','Proteção','Kit de proteção para a parte frontal do veículo.','2 dias'],
['ppf-starter','PPF · Alto contato','Proteção','Proteção para áreas de maior atrito no uso diário.','2 dias'],
['one-step','Polimento One Step','Pintura','Correção de marcas superficiais e recuperação de brilho.','6h30 a 7h30'],
['rodas','Polimento de rodas','Detalhamento','Tratamento para rodas pintadas, envernizadas, de alumínio ou diamantadas.','2h a 3h30'],
['farol','Tratamento de faróis','Detalhamento','Recuperação do acabamento e transparência dos faróis.','30min a 2h'],
['couro','Revitalização de couro','Interior','Cuidado específico para limpeza e conservação do couro.','Aprox. 30min'],
['capota','Tratamento de capota marítima','Detalhamento','Limpeza e conservação da capota da sua picape.','Aprox. 2h30'],
['chassi','Tratamento do chassi','Detalhamento','Limpeza técnica da parte inferior, inclusive veículos off-road.','3h a 10h30'],
['plasticos','Tratamento de plásticos','Detalhamento','Cuidado dos plásticos externos e caixas de roda.','Sob avaliação'],
['moto','Manutenção de motocicletas','Lavagem','Limpeza técnica e tratamentos específicos para motocicletas.','Aprox. 4h30'],
['frota','Lavagem de frota','Lavagem','Cuidado para veículos de trabalho e com carroceria.','Sob avaliação'],
['motor-simples','Higienização simples do motor','Detalhamento','Limpeza com pincéis e produtos específicos.','Aprox. 1h30'],
['vidro-polimento','Polimento de vidros','Detalhamento','Tratamento de vidro frontal ou traseiro, por peça.','Aprox. 1 dia'],
['metais','Tratamento de peças metálicas','Detalhamento','Descontaminação e polimento de peças de motocicletas.','Aprox. 3h30'],
['pacote','Pacote de manutenção estética','Lavagem','Pacote com quatro serviços de manutenção para o seu veículo.','Sob avaliação']
].map(([id,name,group,description,duration])=>({id,name,group,description,duration,image:({Proteção:'catalog-6-0-cinematic',Pintura:'catalog-5-0-cinematic',Interior:'catalog-13-0-cinematic',Detalhamento:'catalog-8-0-cinematic',Lavagem:'catalog-2-1-cinematic'} as Record<string,string>)[group]||'catalog-9-0-cinematic'}))];
export const categories=['Compacto','Médio','SUV / sedan / picape média','Clássico / premium','Grande porte','Motocicleta'];
export const statuses=['Novo','Em atendimento','Confirmado','Concluído','Cancelado'] as const;
export const wa=(text:string,phone='5564996546936')=>`https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
export const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

