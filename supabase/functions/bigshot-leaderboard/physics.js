const Rules=(()=>{'use strict';
  const WIDTH=360,HEIGHT=470,GRAVITY=800,RIM_Y=145,RIM_HALF=31,BALL_RADIUS=12,FLOOR=428;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function random(seed,index){let x=(seed+Math.imul(index+1,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x85ebca6b);x^=x>>>13;x=Math.imul(x,0xc2b2ae35);x^=x>>>16;return(x>>>0)/4294967296;}
  function scene(seed,index){const r=n=>random(seed,index*5+n),right=r(3)>.7,hoopX=index===0?222:Math.round(166+r(1)*(right?42:94)),ballX=index===0?78:right?Math.max(Math.round(262+r(0)*52),hoopX+95):Math.min(Math.round(52+r(0)*95),hoopX-95);const base=ballX<hoopX?Math.max((ballX+hoopX)/2+14,ballX+90):Math.min((ballX+hoopX)/2-14,ballX-90);return{ballX,ballY:395,hoopX,wind:index===0?0:Math.round((r(2)-.5)*34),number:index+1,opening:index===0,defenderEnabled:true,defenderBase:base,defenderAmplitude:14,defenderPhase:r(4)*Math.PI*2,defenderTime:0};}
  function launch(s,dragX,dragUp,firstAssist){const helped=firstAssist&&dragUp>45;const power=helped?clamp(dragUp,98,145):clamp(dragUp,60,165);const vy=-(540+power*1.8);const disc=vy*vy-2*GRAVITY*(s.ballY-RIM_Y);const t=(-vy+Math.sqrt(Math.max(0,disc)))/GRAVITY;let target=222+clamp(dragX,-115,115)*.73;if(helped)target=s.hoopX;return{x:s.ballX,y:s.ballY,vx:(target-s.ballX-.5*s.wind*t*t)/t,vy,r:BALL_RADIUS,age:0,scored:false,settled:false,bounces:0};}
  function canScore(previous,ball,hoopX){if(ball.scored||ball.blocked||ball.vy<=0||previous.y>=RIM_Y||ball.y<RIM_Y)return false;const t=(RIM_Y-previous.y)/(ball.y-previous.y);const crossingX=previous.x+(ball.x-previous.x)*t;return Math.abs(crossingX-hoopX)<=RIM_HALF-BALL_RADIUS-1;}
  function defenderAt(s,time){return{x:s.opening?286:(s.defenderBase===undefined?180:s.defenderBase)+(s.defenderAmplitude===undefined?14:s.defenderAmplitude)*Math.sin((s.defenderPhase||0)+(time===undefined?s.defenderTime||0:time)*1.75),top:175,width:120,height:180};}
  function advanceDefender(s,dt,active,paused){if(active&&!paused)s.defenderTime=(s.defenderTime||0)+Math.max(0,dt);return defenderAt(s);}
  const defenderShapes=[
    {name:'left hand',a:{x:-42,y:188},b:{x:-42,y:202},r:8},
    {name:'right hand',a:{x:42,y:192},b:{x:42,y:207},r:8},
    {name:'left arm',a:{x:-42,y:204},b:{x:-39,y:225},r:8},
    {name:'left shoulder',a:{x:-39,y:225},b:{x:-17,y:233},r:10},
    {name:'right arm',a:{x:42,y:207},b:{x:41,y:228},r:8},
    {name:'right shoulder',a:{x:41,y:228},b:{x:18,y:233},r:10},
    {name:'head',a:{x:1,y:205},b:{x:1,y:221},r:12},
    {name:'body',a:{x:0,y:241},b:{x:0,y:281},r:19},
    {name:'left leg',a:{x:-14,y:292},b:{x:-34,y:332},r:10},
    {name:'right leg',a:{x:14,y:292},b:{x:34,y:332},r:10},
    {name:'left foot',a:{x:-34,y:338},b:{x:-45,y:348},r:8},
    {name:'right foot',a:{x:34,y:338},b:{x:45,y:348},r:8}
  ];
  function closestPoint(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return{x:a.x+dx*t,y:a.y+dy*t};}
  function pointDistance(p,a,b){const q=closestPoint(p,a,b);return Math.hypot(p.x-q.x,p.y-q.y);}
  function segmentDistance(a,b,c,d){const ax=b.x-a.x,ay=b.y-a.y,cx=d.x-c.x,cy=d.y-c.y,den=ax*cy-ay*cx;if(Math.abs(den)>.000001){const px=c.x-a.x,py=c.y-a.y,u=(px*cy-py*cx)/den,v=(px*ay-py*ax)/den;if(u>=0&&u<=1&&v>=0&&v<=1)return 0;}return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));}
  function sweepDefender(previous,ball,before,after){const a={x:previous.x-before.x,y:previous.y},b={x:ball.x-after.x,y:ball.y};let earliest=null;for(const shape of defenderShapes){const radius=ball.r+shape.r;if(segmentDistance(a,b,shape.a,shape.b)>radius)continue;let low=0,high=1;if(pointDistance(a,shape.a,shape.b)>radius){for(let i=0;i<18;i++){const mid=(low+high)/2,p={x:a.x+(b.x-a.x)*mid,y:a.y+(b.y-a.y)*mid};if(segmentDistance(a,p,shape.a,shape.b)<=radius)high=mid;else low=mid;}}else high=0;const t=high;if(earliest&&earliest.t<=t)continue;const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},q=closestPoint(p,shape.a,shape.b),len=Math.hypot(p.x-q.x,p.y-q.y)||1;earliest={t,nx:(p.x-q.x)/len,ny:(p.y-q.y)/len,part:shape.name};}return earliest;}
  function collidePoint(b,x,y,r){const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy),sum=b.r+r;if(d>=sum||d<.001)return false;const nx=dx/d,ny=dy/d;b.x=x+nx*(sum+.1);b.y=y+ny*(sum+.1);const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.62*vn*nx;b.vy-=1.62*vn*ny;}return true;}
  function step(ball,s,dt){if(ball.settled)return{score:false,hit:false,blocked:false};let score=false,hit=false,blocked=false;const count=Math.max(1,Math.ceil(dt/(1/180))),h=dt/count;for(let i=0;i<count;i++){const p={x:ball.x,y:ball.y},before=defenderAt(s);advanceDefender(s,h,true,false);const after=defenderAt(s);ball.vx+=s.wind*h;ball.vy+=GRAVITY*h;ball.x+=ball.vx*h;ball.y+=ball.vy*h;ball.age+=h;
    const scoring=canScore(p,ball,s.hoopX),scoreTime=scoring?(RIM_Y-p.y)/(ball.y-p.y):Infinity,contact=s.defenderEnabled&&!ball.blocked&&!ball.scored?sweepDefender(p,ball,before,after):null;
    if(contact&&contact.t<scoreTime){ball.x=p.x+(ball.x-p.x)*contact.t+contact.nx*.4;ball.y=p.y+(ball.y-p.y)*contact.t+contact.ny*.4;const defenderVX=(after.x-before.x)/(h||1),vn=(ball.vx-defenderVX)*contact.nx+ball.vy*contact.ny;ball.vx=(ball.vx-1.5*Math.min(0,vn)*contact.nx)*.45+contact.nx*45;ball.vy=Math.max(90,Math.abs(ball.vy)*.38);ball.blocked=true;ball.blockedAge=0;ball.blockPart=contact.part;blocked=true;hit=true;}
    else if(scoring){ball.scored=true;score=true;}
    if(ball.blocked)ball.blockedAge+=h;
    if(!ball.scored){hit=collidePoint(ball,s.hoopX-RIM_HALF,RIM_Y,3)||hit;hit=collidePoint(ball,s.hoopX+RIM_HALF,RIM_Y,3)||hit;}
    const boardX=s.hoopX+43;if(ball.y>78-ball.r&&ball.y<150+ball.r&&p.x+ball.r<boardX&&ball.x+ball.r>=boardX&&ball.vx>0){ball.x=boardX-ball.r-1;ball.vx*=-.7;hit=true;}
    if(ball.y>FLOOR-ball.r&&ball.vy>0){ball.y=FLOOR-ball.r;ball.vy*=-.39;ball.vx*=.75;ball.bounces++;hit=true;}
    if(ball.bounces>=2||ball.age>3.35||ball.x<-60||ball.x>WIDTH+60||(ball.blocked&&(ball.bounces>=1||ball.blockedAge>1.1))||(ball.scored&&ball.y>330&&ball.age>1.2)){ball.settled=true;break;}
  }return{score,hit,blocked};}
  function points(streak,s){return 2+(Math.abs(s.hoopX-s.ballX)>150?1:0)+(streak>=3?Math.min(3,Math.floor(streak/3)):0);}
  function checksum(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(36).slice(-3).toUpperCase().padStart(3,'0');}
  function makeChallenge(seed,score){const core=(seed>>>0).toString(36).toUpperCase()+'-'+clamp(Math.floor(score),0,9999).toString(36).toUpperCase();return'BSB-'+core+'-'+checksum(core);}
  function parseChallenge(value){const code=String(value).trim().toUpperCase();const m=/^BSB-([0-9A-Z]{1,7})-([0-9A-Z]{1,3})-([0-9A-Z]{3})$/.exec(code);if(!m||checksum(m[1]+'-'+m[2])!==m[3])return null;const seed=parseInt(m[1],36),target=parseInt(m[2],36);if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295||target>9999)return null;return{seed:seed>>>0,target,code};}
  function parseChallengeInput(value){const direct=parseChallenge(value);if(direct)return direct;try{const url=new URL(String(value).trim());return /^https?:$/.test(url.protocol)?parseChallenge(url.searchParams.get('challenge')):null;}catch(e){return null;}}
  function publicChallengeURL(href,code){const challenge=parseChallenge(code);if(!challenge)return null;try{const url=new URL(href),host=url.hostname.toLowerCase().replace(/\.$/,'');if(!/^https?:$/.test(url.protocol)||url.username||url.password||!host.includes('.')||/\.(localhost|local|lan|home|internal|test|invalid|example)$/.test(host)||host==='localhost')return null;if(/^\d+\.\d+\.\d+\.\d+$/.test(host)){const [a,b,c]=host.split('.').map(Number);if(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19))||(a===192&&b===0)||(a===198&&b===51&&c===100)||(a===203&&b===0&&c===113))return null;}url.search='';url.hash='';url.searchParams.set('challenge',challenge.code);return url.href;}catch(e){return null;}}
  function advanceTurn(currentPlayer,completedShots,limit){if(completedShots<limit)return'continue';return currentPlayer===0?'pass':'finished';}
  function advanceClock(time,dt,active,paused){return active&&!paused?Math.max(0,time-Math.max(0,dt)):time;}
  return{WIDTH,HEIGHT,GRAVITY,RIM_Y,RIM_HALF,BALL_RADIUS,FLOOR,clamp,random,scene,launch,canScore,step,points,makeChallenge,parseChallenge,parseChallengeInput,publicChallengeURL,advanceTurn,advanceClock,defenderAt,advanceDefender,sweepDefender,defenderShapes};
})();
export default Rules;
