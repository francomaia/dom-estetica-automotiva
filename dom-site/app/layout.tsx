import type { Metadata } from 'next';
import './globals.css';
import './refinement.css';
export const metadata: Metadata = {title:'DOM | Estética Automotiva em Jataí',description:'Cuidado que valoriza o seu carro. Estética, proteção e lavagem automotiva em Jataí. Agende sua avaliação com a DOM.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><head><link rel="preload" href="/fonts/Ninetea-ExtraBold.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body>{children}</body></html>}
