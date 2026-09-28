import type {Metadata,Viewport} from 'next';
import Panel from './panel';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Painel da equipe | DOM',robots:{index:false,follow:false},manifest:'/painel-admin.webmanifest',icons:{icon:'/favicon.svg',apple:'/admin-icon-180.png'},appleWebApp:{capable:true,title:'DOM Admin',statusBarStyle:'black-translucent'},other:{'apple-mobile-web-app-capable':'yes'}};
export const viewport:Viewport={themeColor:'#0b0c0e'};
export default function Page(){return <Panel/>}
