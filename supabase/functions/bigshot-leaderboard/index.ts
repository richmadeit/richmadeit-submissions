import {cleanName, verifyReplay} from './validation.js';
const hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
Deno.serve(async(request:Request)=>{
 const url=new URL(request.url),origin=request.headers.get('Origin');
 const allowed=['https://richmadeit.github.io','http://127.0.0.1:8765'];
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin&&allowed.includes(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Max-Age':'600'});
 const send=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{
  if(origin&&!allowed.includes(origin))return send({error:'Origin not allowed.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  const rpc=async(name:string,args:Record<string,unknown>)=>{
   const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}'))[0];
   if(!key)throw new Error('Service configuration unavailable.');
   const response=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:String(key),Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args)});
   if(!response.ok)throw new Error('Database request failed.');return response.json();
  };
  const route=url.pathname.split('/api/')[1];
  if(route==='health'&&request.method==='GET')return send({ok:true});
  if(route==='leaderboard'&&request.method==='GET')return send(await rpc('bigshot_board',{p_scope:url.searchParams.get('scope')==='today'?'today':'all'}));
  if(request.method!=='POST'||!['rounds','scores'].includes(route||''))return send({error:'Not found.'},404);
  // The browser holds a random player secret; only its hash is stored. Score writes
  // require a server-issued round belonging to that secret and a valid game replay.
  const auth=request.headers.get('Authorization')||'';
  if(!/^Bearer [a-f0-9]{48}$/.test(auth))return send({error:'Player session missing. Refresh and try again.'},401);
  const player=await hash(auth.slice(7));
  if(Number(request.headers.get('Content-Length')||0)>180000)return send({error:'Round data too large.'},413);
  const raw=await request.text();if(raw.length>180000)return send({error:'Round data too large.'},413);
  let body;try{body=JSON.parse(raw);}catch{return send({error:'Invalid request.'},400);}
  if(!body||typeof body!=='object')return send({error:'Invalid request.'},400);
  if(route==='rounds'){
   if(!Number.isInteger(body.seed)||body.seed<0||body.seed>4294967295)return send({error:'Invalid court.'},400);
   const id=hex(crypto.getRandomValues(new Uint8Array(24)).buffer);
   const network=await hash(request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'shared');
   const data=await rpc('bigshot_open_round',{p_id:id,p_player:player,p_seed:body.seed,p_network:network});return send(data,data.status||201);
  }
  const name=cleanName(body.name),social=typeof body.social==='string'?body.social.trim().replace(/^@/,''):'';
  if(name.length<2)return send({error:'Use a nickname with 2–20 letters or numbers.'},400);
  if(social&&!/^[A-Za-z0-9._]{1,30}$/.test(social))return send({error:'Use your Instagram username or leave it blank.'},400);
  if(!/^[a-f0-9]{48}$/.test(body.round||''))return send({error:'Play a fresh round to post a score.'},400);
  const round=await rpc('bigshot_get_round',{p_id:body.round,p_player:player});
  if(!round)return send({error:'This round is unavailable. Play another round.'},400);
  if(round.age<55||round.age>86400)return send({error:'Finish a fresh 60-second round first.'},400);
  const score=verifyReplay(Number(round.seed),body.shots,body.score);
  const data=await rpc('bigshot_save_score',{p_id:body.round,p_player:player,p_name:name,p_social:social,p_score:score});return send(data,data.status||200);
 }catch(error){return send({error:error.status?error.message:'The board could not connect. Your game still works—try again shortly.'},error.status||503);}
});
