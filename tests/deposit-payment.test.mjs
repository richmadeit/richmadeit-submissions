import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import verify from '../netlify/functions/verify-payment.mjs';
const originalFetch=globalThis.fetch,originalKey=process.env.STRIPE_SECRET_KEY;
after(()=>{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=originalKey;});
const base={livemode:true,mode:'payment',currency:'usd',amount_subtotal:500,amount_total:500,status:'complete',payment_status:'paid',payment_link:{url:'https://buy.stripe.com/14AbJ25AF2GP4bJajp2wU0k'},client_reference_id:'RMI-D30-abc123',customer_details:{email:'buyer@example.com'},payment_intent:{latest_charge:{refunded:false,payment_method_details:{type:'card',card:{brand:'visa',last4:'4242'}}}}};
const request=()=>new Request('https://richmadeit.netlify.app/.netlify/functions/verify-payment',{method:'POST',headers:{origin:'https://richmadeit.netlify.app','content-type':'application/json'},body:JSON.stringify({session_id:'cs_live_1234567890123456'})});
async function run(p){process.env.STRIPE_SECRET_KEY='test-fixture';globalThis.fetch=async()=>new Response(JSON.stringify(p));const r=await verify(request());return {status:r.status,data:await r.json()};}
test('verified $5 deposit retains reference, masks email and identifies deposit',async()=>{const r=await run(base);assert.equal(r.status,200);assert.equal(r.data.deposit,true);assert.equal(r.data.amount,500);assert.equal(r.data.reference,'RMI-D30-abc123');assert.equal(r.data.email,'b•••@example.com');assert.ok(r.data.eventId);});
test('wrong amount is rejected even for correct deposit link',async()=>{for(const p of [{...base,amount_total:600},{...base,amount_subtotal:100},{...base,currency:'eur'}])assert.equal((await run(p)).status,404);});
test('unpaid checkout never becomes a purchase',async()=>{const r=await run({...base,status:'open',payment_status:'unpaid'});assert.equal(r.data.paid,false);assert.equal(r.data.eventId,undefined);});
test('unrelated payment link is rejected',async()=>assert.equal((await run({...base,payment_link:{url:'https://buy.stripe.com/unrelated'}})).status,404));
test('legacy $50 checkout is still recognized',async()=>{const r=await run({...base,payment_link:{url:'https://buy.stripe.com/dRm6oI4wB0yHaA7crx2wU03'},amount_total:5000,amount_subtotal:5000});assert.equal(r.status,200);assert.equal(r.data.deposit,false);assert.equal(r.data.duration,30);});
test('missing reference has a reusable deposit reference',async()=>{const r=await run({...base,client_reference_id:null});assert.match(r.data.reference,/^RMI-D-/);});
test('cross-origin and malformed requests are rejected',async()=>{assert.equal((await verify(new Request('https://richmadeit.netlify.app/api',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}))).status,403);assert.equal((await verify(new Request('https://richmadeit.netlify.app/api',{method:'POST',body:'{}'}))).status,400);});
