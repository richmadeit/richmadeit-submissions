'use strict';
(() => {
  const config=window.RMIU_SUPABASE||{}, $=id=>document.getElementById(id);
  const status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
  function isPublicKey(key){
    if(typeof key!=='string')return false;
    if(key.startsWith('sb_publishable_')&&key.length>20)return true;
    try{const part=key.split('.')[1];const payload=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));return payload.role==='anon';}catch{return false;}
  }
  const configured=typeof config.url==='string' && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url) && isPublicKey(config.publishableKey);
  if(!configured || !window.supabase){status('Buyer access is not available yet. Contact RichMadeIt for help.',true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let revision=0,loading=false;
  function closeReader(){ $('reader').hidden=true; $('workbook').removeAttribute('srcdoc'); }
  async function approved(){const {data,error}=await client.rpc('workbook_access');if(error)throw error;return data===true;}
  async function refresh(){
    const version=++revision;
    try{
      const {data,error}=await client.auth.getUser();
      if(version!==revision)return;
      if(error||!data.user){closeReader();$('login').hidden=false;$('login').disabled=false;$('open').hidden=true;$('refresh').hidden=true;$('logout').hidden=true;status('Sign in with your approved Google account.');return;}
      $('login').hidden=true;$('refresh').hidden=false;$('logout').hidden=false;
      const access=await approved();if(version!==revision)return;
      $('open').hidden=!access;
      if(access)status('Approved: '+data.user.email+'. Open your workbook below.');
      else {closeReader();status('Signed in as '+data.user.email+'. This email is not approved yet. After RichMadeIt approves it, tap “Check approval again.”',true);}
    }catch{if(version===revision){closeReader();$('open').hidden=true;status('We could not verify access. Check your connection and try again.',true);}}
  }
  $('login').onclick=async()=>{
    $('login').disabled=true;status('Opening Google sign-in…');
    try{
      const redirectTo=new URL('workbook-login.html',location.href).href;
      const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}});
      if(error)throw error;
    }catch{$('login').disabled=false;status('Google sign-in could not start. Open this page in Safari or Chrome and try again.',true);}
  };
  $('open').onclick=async()=>{
    if(loading)return;loading=true;$('open').disabled=true;const version=++revision;status('Loading your approved workbook…');
    try{
      if(!await approved())throw new Error('not-approved');
      // Storage checks approval again through RLS; hiding a button is never the access control.
      const {data,error}=await client.storage.from(config.bucket).download(config.workbookFile);
      if(error||!data)throw error||new Error('missing-file');
      const html=await data.text();
      if(version!==revision)return;
      if(!await approved())throw new Error('not-approved');
      if(version!==revision)return;
      // Only the owner's trusted HTML belongs in this private bucket. It runs as this site's code.
      // Authenticated fetch avoids navigating to a Storage HTML response or a shareable signed URL.
      $('workbook').srcdoc=html;$('reader').hidden=false;status('Workbook open.');
    }catch{if(version===revision){closeReader();status('The workbook could not be opened. Check approval again or contact RichMadeIt.',true);}}
    finally{loading=false;$('open').disabled=false;}
  };
  async function logout(){++revision;closeReader();$('open').hidden=true;const {error}=await client.auth.signOut();if(error){status('Sign-out could not finish. Check your connection and try again.',true);return;}await refresh();}
  $('logout').onclick=logout;$('readerLogout').onclick=logout;$('closeReader').onclick=closeReader;$('refresh').onclick=refresh;
  client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){++revision;closeReader();}setTimeout(refresh,0);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(()=>{if(!document.hidden&&!loading)refresh();},60000);
  refresh();
})();
