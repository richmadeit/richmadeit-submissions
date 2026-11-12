import {randomUUID} from 'node:crypto';
// References are labels only. They never grant record access or prove payment.
export default async function handler(request) {
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(request.method!=='POST')return new Response('{}',{status:405,headers});
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin)return new Response('{}',{status:403,headers});
  return new Response(JSON.stringify({reference:'RMI-'+randomUUID()}),{status:200,headers});
}
