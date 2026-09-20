import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../preview/index.html',import.meta.url),'utf8');
const admin=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
for(const file of [html,admin])for(const m of file.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
function setup(preview){
 const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,textContent:'',classList:{toggle(){}}});return elements.get(id);};
 $('intentPreview').checked=preview;$('intentReady').checked=!preview;$('email').value='test@example.com';$('creativeIdea').value='Reflective rooftop';$('eligible').checked=true;
 const ctx=vm.createContext({$,document:{querySelector:()=>({value:'realistic'})},photos:[1,2,3],song:{},checkWindow:()=>true,submitting:false});
 vm.runInContext(html.slice(html.indexOf('function validEmail()'),html.indexOf('["eligible"]')),ctx);return {$,ctx};
}
test('upfront defaults to $25, no artist name or social profile needed',()=>{const h=setup(false);h.ctx.updateOffer();assert.equal(h.ctx.tally(),true);assert.equal(h.$('artistProfile').required,false);assert.match(h.$('go').textContent,/\$25/);});
test('preview requires social profile; all three platforms accepted',()=>{const h=setup(true);h.ctx.updateOffer();assert.equal(h.ctx.tally(),false);assert.equal(h.$('artistProfile').required,true);for(const v of ['Instagram @artist','TikTok @artist','Facebook @artist']){h.$('artistProfile').value=v;assert.equal(h.ctx.tally(),true);}h.$('artistProfile').value=' ';assert.equal(h.ctx.tally(),false);});
test('both routes require mood, three photos, song and exact section',()=>{for(const preview of [true,false]){const h=setup(preview);h.$('artistProfile').value='Facebook @artist';h.$('creativeIdea').value=' ';assert.equal(h.ctx.tally(),false);h.$('creativeIdea').value='Confident';h.ctx.photos=[1,2];assert.equal(h.ctx.tally(),false);h.ctx.photos=[1,2,3];h.ctx.song=null;assert.equal(h.ctx.tally(),false);}});
test('admin recognizes hybrid offer and payment details',()=>{const ctx=vm.createContext({});vm.runInContext(admin.slice(admin.indexOf('const parseContact ='),admin.indexOf('const socialUrl ='))+';this.parse=parseContact;',ctx);const info=ctx.parse('Email: test@example.com | Offer: $35 preview-first unlock | Payment: not required for preview | Artist profile: Facebook @artist');assert.equal(info.details.find(d=>d.k==='Offer').v,'$35 preview-first unlock');assert.equal(info.details.find(d=>d.k==='Artist profile').v,'Facebook @artist');});
