(()=>{
const $=id=>document.getElementById(id);
const recoveryKey='richmadeit.payment-confirmation';
const recoveryLifetime=24*60*60*1000;
const validSession=id=>typeof id==='string'&&/^cs_(test|live)_[A-Za-z0-9]{12,200}$/.test(id);
const incomingSession=new URLSearchParams(location.search).get('session_id');
let recovery=null;
if(incomingSession!==null){
  if(validSession(incomingSession))recovery={session:incomingSession,expiresAt:Date.now()+recoveryLifetime};
}else{
  // Only retain the checkout reference, never a cached payment verdict. Reloads
  // must verify the current payment status with Stripe again.
  try{recovery=JSON.parse(sessionStorage.getItem(recoveryKey));}catch{}
  if(!recovery)recovery=history.state?.richmadeitPayment;
  if(!recovery||!validSession(recovery.session)||!Number.isFinite(recovery.expiresAt)||recovery.expiresAt<=Date.now()||recovery.expiresAt>Date.now()+recoveryLifetime)recovery=null;
}
const session=recovery?.session;
try{if(recovery)sessionStorage.setItem(recoveryKey,JSON.stringify(recovery));else sessionStorage.removeItem(recoveryKey);}catch{}
// Strip the reference before loading analytics. History state also permits a
// refresh when the browser has disabled sessionStorage.
history.replaceState(recovery?{richmadeitPayment:recovery}:null,'',location.pathname);
function packageSummary(duration){
  if(duration===180)return 'Your full cinematic AI music video: up to 3 minutes, one artist, up to six scene concepts, one minor revision round, and one 15-second teaser cut from the finished video.';
  const scenes={15:'one scene concept',30:'up to two scene concepts',60:'up to three scene concepts'};
  if(scenes[duration])return `Your ${duration}-second cinematic AI music video includes one artist, ${scenes[duration]}, and a clean vertical MP4. Extras and revisions are quoted separately.`;
  return 'Your custom Rich Madeit video package is listed on your Stripe receipt.';
}
function purchase(p){
  if(!p.paid||!p.eventId)return;
  if(p.test||p.refunded||window.navigator.globalPrivacyControl===true||window.richmadeitAnalyticsConsent===false)return;
  const key='richmadeit.purchase.'+p.eventId;
  try{if(localStorage.getItem(key))return;}catch{}
  const f=window;
  if(!f.fbq){const n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s);f.fbq('init','1066699776252161');}
  f.fbq('track','Purchase',{value:p.amount/100,currency:p.currency.toUpperCase(),content_name:(p.deposit?'Rich Madeit $5 Video Deposit':p.duration===180?'Rich Madeit Full AI Music Video — Up to 3 Minutes':'Rich Madeit '+(p.duration||'custom')+'-second AI music video')},{eventID:p.eventId});
  try{localStorage.setItem(key,'queued');}catch{}
}
async function check(){
  $('retry').hidden=true;
  for(const id of ['details','status','receipt','uploadMaterials','manualHandoff'])$(id).hidden=true;
  if(!session){$('title').textContent='Your payment confirmation';$('message').textContent='After checkout, Stripe will bring you here with your payment details. If you already paid, keep your Stripe receipt—do not pay again.';return;}
  $('title').textContent='Checking your payment…';
  try{
    const r=await fetch('/.netlify/functions/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:session})});
    const p=await r.json();if(!r.ok)throw new Error(p.error||'Unable to verify payment. Please try again.');
    if(!p.paid){$('title').textContent=p.status==='expired'?'Checkout expired':'Payment not yet confirmed';$('message').textContent='We have not confirmed a successful payment for this checkout. If you submitted payment, wait and check again before paying again.';$('retry').hidden=false;return;}
    const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:p.currency}).format(n/100);
    $('title').textContent=p.test?'Test payment confirmed':p.refunded?'Payment refunded':p.deposit?'Your $5 deposit is confirmed!':'Payment confirmed. Thank you!';
    $('message').textContent=p.test?'Sandbox test only. No real money was charged and no video order is being placed.':'Your payment details are verified with Stripe. Keep your receipt for your records.';
    $('status').hidden=false;$('status').textContent=p.test?'SANDBOX':p.refunded?'REFUNDED':'PAID';
    for(const [id,value]of Object.entries({amount:money(p.amount),tax:money(p.tax),method:p.method,email:p.email||'See your Stripe receipt',reference:p.reference}))$(id).textContent=value;
    $('details').hidden=false;
    $('packageSummary').textContent=p.deposit?'Your $5 deposit is credited toward your package. After sending your materials, you receive a custom 15-second watermarked preview. Choose 30 seconds ($50 total; $45 remaining), 1 minute ($90; $85 remaining), or 3 minutes ($250; $245 remaining). The balance is due after preview approval, before we finish your video.':packageSummary(p.duration);
    if(p.receipt){$('receipt').href=p.receipt;$('receipt').hidden=false;}
    $('next').textContent=p.deposit?'Next: send your photo and song using the button below. Choose your package in your notes. Keep this reference to return and add materials later. We begin your preview after receiving your materials.':'Send your photos and song below so we can begin. If you already sent them, keep this order reference. We will email delivery updates after we have your complete materials.';
    $('uploadMaterials').href='/submit/?ref='+encodeURIComponent(p.reference);
    $('uploadMaterials').hidden=!!(p.test||p.refunded);
    if(p.test||p.refunded)$('next').textContent=p.test?'Sandbox verification is complete. Test payments are excluded from live advertising Purchase tracking.':'Contact Rich Madeit if you have questions about this refunded payment.';
    purchase(p);
  }catch(e){
    $('title').textContent='Send your song and photos';
    $('message').textContent='We can’t confirm your payment automatically right now. If Stripe charged you, keep your receipt and do not pay again.';
    let ref='RMI-D-'+session.slice(-10);
    try{const saved=JSON.parse(localStorage.getItem('richmadeit.pending-order'));if(saved?.expiresAt>Date.now()&&/^RMI-D(?:30|60|180)?-[a-zA-Z0-9]{8,32}$/.test(saved.reference))ref=saved.reference;}catch{}
    $('manualUpload').href='/submit/?ref='+encodeURIComponent(ref);
    $('manualHandoff').hidden=false;
    $('retry').hidden=false;
  }
}
$('retry').addEventListener('click',check);check();
})();
