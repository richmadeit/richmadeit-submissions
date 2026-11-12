(()=>{
  const $=id=>document.getElementById(id),seconds=$('videoSeconds'),slider=$('videoSecondsSlider'),preview=$('includePreview'),full=$('fullPayment'),link=$('requestVideo'),error=$('lengthError');
  if(!seconds||!slider||!preview||!link||!error)return;
  const money=n=>'$'+n.toLocaleString('en-US');
  const presets=[...document.querySelectorAll('[data-seconds]')];
  function update(){
    const raw=seconds.value.trim(),n=Number(raw);
    const valid=/^\d+$/.test(raw)&&Number.isSafeInteger(n)&&n>=30&&n<=999999;
    error.hidden=valid;
    seconds.setAttribute('aria-invalid',String(!valid));
    seconds.setCustomValidity(valid?'':'Enter a whole number of seconds, at least 30.');
    if(!valid){
      error.textContent='Enter a whole number of seconds, at least 30.';
      link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.textContent='Choose at least 30 seconds';
      $('videoPriceLabel').textContent='Choose a valid length';$('videoPrice').textContent='—';$('previewPrice').textContent=preview.checked?'$5':'Not selected';$('videoTotal').textContent='—';$('firstPayment').textContent='—';
      presets.forEach(p=>p.setAttribute('aria-pressed','false'));return;
    }
    error.textContent='';link.removeAttribute('aria-disabled');
    slider.max=String(Math.max(180,n));slider.value=String(n);
    slider.setAttribute('aria-valuetext',n+' seconds, '+money(n)+' video price');
    presets.forEach(p=>p.setAttribute('aria-pressed',String(Number(p.dataset.seconds)===n)));
    const extra=preview.checked?5:0,total=n+extra;
    $('videoPriceLabel').textContent=n.toLocaleString('en-US')+' seconds × $1';$('videoPrice').textContent=money(n);$('previewPrice').textContent=preview.checked?'$5':'Not selected';$('videoTotal').textContent=money(total);
    $('firstPayment').textContent=preview.checked?'$5':money(n);
    $('totalLabel').textContent=preview.checked?'Total if you continue to the video':'Video total';
    $('paymentExplanation').textContent=preview.checked?'Start with the $5 preview. If you continue, the full '+money(n)+' video price is still due. The $5 is separate and not credited.':'Pay the full selected video price. No preview fee is added.';
    link.textContent=preview.checked?'Pay $5 to start ↗':'Pay in full · '+money(n)+' ↗';
    link.href='#packages';

  }
  seconds.addEventListener('input',update);
  slider.addEventListener('input',()=>{seconds.value=slider.value;update();});
  preview.addEventListener('change',update);
  full?.addEventListener('change',update);
  presets.forEach(p=>p.addEventListener('click',()=>{seconds.value=p.dataset.seconds;update();}));
  let busy=false,memoryAttempt=null;
  const key='richmadeit.checkout-attempt.v1';
  link.addEventListener('click',async e=>{
    e.preventDefault();
    if(busy)return;
    if(link.getAttribute('aria-disabled')==='true'){seconds.focus();return;}
    const selection={seconds:Number(seconds.value),kind:preview.checked?'preview':'full'};
    let attempt=memoryAttempt;
    try{attempt=JSON.parse(sessionStorage.getItem(key))||memoryAttempt;}catch{}
    if(!attempt||attempt.seconds!==selection.seconds||attempt.kind!==selection.kind||attempt.created<Date.now()-23*60*60*1000){attempt={...selection,request_id:crypto.randomUUID(),created:Date.now()};}
    memoryAttempt=attempt;
    try{sessionStorage.setItem(key,JSON.stringify(attempt));}catch{}
    busy=true;link.setAttribute('aria-disabled','true');link.textContent='Opening secure Stripe checkout…';
    try{
      const response=await fetch('/.netlify/functions/create-length-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...selection,request_id:attempt.request_id}),signal:AbortSignal.timeout(30000)});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||'Checkout could not open. Please retry.');
      const url=new URL(result.url);
      if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Unexpected checkout address. Please contact us.');
      location.assign(url.href);
    }catch(err){busy=false;update();error.textContent=err.message||'Checkout is temporarily unavailable. Retry with the same selection; do not pay twice.';error.hidden=false;}
  });
  window.addEventListener('pageshow',()=>{busy=false;update();});
  update();
})();
