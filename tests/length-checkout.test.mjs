import test from 'node:test';
import assert from 'node:assert/strict';
import {quote,matchSession,OFFER,ACCOUNT} from '../netlify/lib/length-offer.mjs';
import handler from '../netlify/functions/create-length-checkout.mjs';
const request_id='12345678-1234-1234-1234-123456789abc';
test('server quotes full length and separate preview',()=>{for(const seconds of [30,47,60,180,3600]){assert.equal(quote({seconds,kind:'full',request_id}).amount,seconds*100);assert.equal(quote({seconds,kind:'preview',request_id}).amount,500);}});
test('reject invalid lengths and client price injection',()=>{for(const seconds of [0,29,30.1,'30',NaN,Infinity,1000000])assert.throws(()=>quote({seconds,kind:'full',request_id}));assert.throws(()=>quote({seconds:30,kind:'full',request_id,amount:1}));});
test('match exact paid-session order metadata and amounts',()=>{const q=quote({seconds:47,kind:'full',request_id});const s={metadata:{offer:OFFER,seconds:'47',kind:'full',request_id,expected_account:ACCOUNT},client_reference_id:q.reference,currency:'usd',amount_total:4700,amount_subtotal:4700,mode:'payment'};assert.equal(matchSession(s).seconds,47);for(const patch of [{amount_total:500},{currency:'eur'},{client_reference_id:'wrong'},{metadata:{...s.metadata,expected_account:'wrong'}}])assert.equal(matchSession({...s,...patch}),null);});
test('endpoint fails closed until deployment readiness is verified',async()=>{delete process.env.RMI_LENGTH_CHECKOUT_READY;const res=await handler(new Request('https://example.com/.netlify/functions/create-length-checkout',{method:'POST',headers:{origin:'https://example.com'}}));assert.equal(res.status,503);});
test('reject cross-origin checkout',async()=>{const res=await handler(new Request('https://example.com/.netlify/functions/create-length-checkout',{method:'POST',headers:{origin:'https://evil.example'}}));assert.equal(res.status,403);});

test('live endpoint verifies account and creates selected amount without charging',async()=>{
 const old=globalThis.fetch;process.env.RMI_LENGTH_CHECKOUT_READY='true';process.env.RMI_CHECKOUT_MODE='live';process.env.STRIPE_SECRET_KEY='fixture';let posted;
 globalThis.fetch=async(url,options)=>url.endsWith('/account')?new Response(JSON.stringify({id:ACCOUNT})): (posted=options,new Response(JSON.stringify({livemode:true,url:'https://checkout.stripe.com/c/pay/example'})));
 try{const r=await handler(new Request('https://example.com/api',{method:'POST',headers:{origin:'https://example.com'},body:JSON.stringify({seconds:47,kind:'full',request_id})}));assert.equal(r.status,200);assert.equal(posted.body.get('line_items[0][price_data][unit_amount]'),'4700');assert.equal(posted.body.get('payment_method_types'),null);assert.equal(posted.body.get('managed_payments[enabled]'),'false');assert.equal(posted.headers['Idempotency-Key'],OFFER+'-'+request_id);assert.match(posted.body.get('success_url'),/payment-confirmation/);}finally{globalThis.fetch=old;delete process.env.RMI_LENGTH_CHECKOUT_READY;delete process.env.RMI_CHECKOUT_MODE;delete process.env.STRIPE_SECRET_KEY;}
});
