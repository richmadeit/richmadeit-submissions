import {quote,OFFER,ACCOUNT} from '../lib/length-offer.mjs';
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async function handler(req){
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
 const origin=new URL(req.url).origin;
 if(req.headers.get('origin')!==origin)return reply(403,{error:'Invalid origin'});
 // Explicit live gate. Production and email fulfillment are manually reconciled;
 // automated webhook/outbox fulfillment is not enabled by this endpoint.
 if(process.env.RMI_LENGTH_CHECKOUT_READY!=='true')return reply(503,{error:'Checkout setup is not complete. No payment was taken.'});
 let q,input;try{input=await req.json();q=quote(input);}catch(e){return reply(400,{error:e.message});}
 const test=process.env.RMI_CHECKOUT_MODE==='test';
 if(!test&&process.env.RMI_CHECKOUT_MODE!=='live')return reply(503,{error:'Checkout mode not configured'});
 const key=process.env[test?'STRIPE_TEST_SECRET_KEY':'STRIPE_SECRET_KEY'];
 if(!key)return reply(503,{error:'Checkout unavailable. No payment was taken.'});
 try{
 const headers={Authorization:`Bearer ${key}`,'Stripe-Version':'2026-09-30.endive'};
 const account=await fetch('https://api.stripe.com/v1/account',{headers,signal:AbortSignal.timeout(10000)});
 if(!account.ok||(await account.json()).id!==ACCOUNT)return reply(503,{error:'Payment account verification failed'});
 const body=new URLSearchParams({mode:'payment','managed_payments[enabled]':'false',integration_identifier:'rmi_length_pzqkmarv',success_url:origin+'/payment-confirmation.html?session_id={CHECKOUT_SESSION_ID}',cancel_url:origin+'/#packages',client_reference_id:q.reference,'line_items[0][price_data][currency]':'usd','line_items[0][price_data][unit_amount]':String(q.amount),'line_items[0][quantity]':'1','line_items[0][price_data][product_data][name]':q.kind==='preview'?'Rich Made It — separate $5 preview (not credited)':`Rich Made It — ${q.seconds}-second video`});
 for(const[k,v]of Object.entries({offer:OFFER,seconds:q.seconds,kind:q.kind,request_id:input.request_id,expected_account:ACCOUNT}))body.set(`metadata[${k}]`,String(v));
 const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':OFFER+'-'+input.request_id},body,signal:AbortSignal.timeout(15000)});
 if(!res.ok)return reply(502,{error:'Checkout could not start. Please retry with the same selection.'});
 const s=await res.json();
 if(s.livemode!==!test||!s.url?.startsWith('https://checkout.stripe.com/'))return reply(502,{error:'Unexpected checkout response'});
 return reply(200,{url:s.url,reference:q.reference});
 }catch{return reply(502,{error:'Checkout is unavailable. Please retry; do not pay twice.'});}
}
