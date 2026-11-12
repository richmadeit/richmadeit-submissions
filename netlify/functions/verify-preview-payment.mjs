const LINK='plink_1Ub2tOJM9upNSRp4Gf7BLoHX';
const ACCOUNT='acct_1UHXZ9JM9upNSRp4';
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async function handler(request){
 if(request.method!=='POST')return reply(405,{paid:false});
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return reply(403,{paid:false});
 let id;try{({session_id:id}=await request.json());}catch{return reply(400,{paid:false});}
 if(typeof id!=='string'||!/^cs_live_[A-Za-z0-9]{12,200}$/.test(id))return reply(400,{paid:false});
 const key=process.env.STRIPE_SECRET_KEY;
 if(!key)return reply(503,{paid:false,unavailable:true});
 try{
  const headers={Authorization:'Bearer '+key};
  const a=await fetch('https://api.stripe.com/v1/account',{headers,signal:AbortSignal.timeout(10000)});
  if(!a.ok||(await a.json()).id!==ACCOUNT)return reply(503,{paid:false,unavailable:true});
  const r=await fetch('https://api.stripe.com/v1/checkout/sessions/'+id+'?expand[]=payment_intent.latest_charge',{headers,signal:AbortSignal.timeout(10000)});
  if(!r.ok)return reply(404,{paid:false});
  const s=await r.json();
  const matched=s.payment_link===LINK&&s.livemode===true&&s.mode==='payment'&&s.currency==='usd'&&s.amount_subtotal===500&&s.amount_total===500&&s.metadata?.offer==='preview-5-noncredited'&&s.metadata?.brand==='richmadeit';
  const c=s.payment_intent?.latest_charge;
  return reply(200,{paid:!!(matched&&s.status==='complete'&&s.payment_status==='paid'&&c&&c.paid===true&&!c.refunded&&!c.disputed&&!(c.amount_refunded>0))});
 }catch{return reply(503,{paid:false,unavailable:true});}
}
