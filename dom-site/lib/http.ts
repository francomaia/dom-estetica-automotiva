export class RequestError extends Error{
  constructor(message:string,public status:number){super(message);}
}
export async function readJson(request:Request,maxBytes=16000):Promise<unknown>{
  if(Number(request.headers.get('content-length'))>maxBytes)throw new RequestError('Solicitação muito grande.',413);
  if(!request.body)throw new RequestError('Envie os dados do formulário.',400);
  const reader=request.body.getReader();const decoder=new TextDecoder();let size=0;let text='';
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new RequestError('Solicitação muito grande.',413);}text+=decoder.decode(value,{stream:true});}
    text+=decoder.decode();
  }finally{reader.releaseLock();}
  try{return JSON.parse(text);}catch{throw new RequestError('Formato de dados inválido.',400);}
}
export function requestFailure(error:unknown,fallback:string){
  return Response.json({error:error instanceof RequestError?error.message:fallback},{status:error instanceof RequestError?error.status:503,headers:{'Cache-Control':'no-store'}});
}
