/* ============================================================
   GRAND FABLE GP — neon kart racing through space, open any time
   Pseudo-3D racer: rainbow roads over a galaxy, neon city skylines,
   holographic item boxes (🚀 boost, 🌀 homing orb, 🛡️ shield,
   🍌 banana), rival karts that fight back, a live leaderboard.
   Auto-accelerates so young players steer and use items.
   Keys: ← → (A/D) steer · ↓ (S) brake · Space/↑ use item · Esc quit
   Touch: hold left/right of the track, ⚡ uses the item.
   ============================================================ */
"use strict";
let RC=null;
const RACE_RIVALS=[{n:"Kofi",c:"#ff4d6d",e:"🐘"},{n:"Ama",c:"#b06bff",e:"🐆"},{n:"Esi",c:"#39e6a0",e:"🦓"},{n:"Kwame",c:"#4dd2ff",e:"🐊"}];
const RACE_ITEMS={rocket:{e:"🚀",n:"Rocket boost"},orb:{e:"🌀",n:"Homing orb"},shield:{e:"🛡️",n:"Shield"},banana:{e:"🍌",n:"Banana"}};
const RACE_TRACKS=[
 {id:"nebula",name:"Rainbow Nebula",laps:3,space:true,sky:["#05021a","#2a0a5e","#0b1f5c"],grass:["#120a33","#0c0724"],rainbow:true,city:true,
  curves:[[40,0],[60,3],[30,0],[50,-4],[30,0],[70,5],[40,0],[60,-3],[40,1],[60,4],[40,0]]},
 {id:"accra",name:"Neon Accra",laps:3,space:false,sky:["#0a0630","#3a0f6b","#ff5e8a"],grass:["#12163a","#0d1030"],rainbow:false,road:["#2b2f4a","#252940"],city:true,
  curves:[[30,0],[50,-4],[30,1],[60,4],[40,-1],[50,-4],[30,0],[70,3],[40,-3],[50,0]]},
 {id:"skybridge",name:"Sky Bridge Kumasi",laps:2,space:true,sky:["#020617","#0b3d91","#38bdf8"],grass:["#0a1a3a","#07132c"],rainbow:true,city:false,
  curves:[[50,0],[40,4],[40,-4],[40,4],[40,-4],[60,0],[50,6],[40,0],[60,-6],[50,0]]}
];
function raceStop(){
  if(!RC)return;
  if(RC.raf)cancelAnimationFrame(RC.raf);
  window.removeEventListener("keydown",RC.kd);window.removeEventListener("keyup",RC.ku);
  RC=null;
}
function raceFmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return m+":"+String(s%60).padStart(2,"0")+"."+String(Math.floor((ms%1000)/100));}
function raceOrdinal(n){return n+(["th","st","nd","rd"][(n%100>10&&n%100<14)?0:(n%10<4?n%10:0)]);}
function renderRace2D(){
  clearTimers();closeOverlay();defocus();showAnanseCorner(false);raceStop();
  document.body.classList.add("learningworld");
  const best=P&&P.race?P.race:{};
  const tracks=RACE_TRACKS.map(t=>'<button class="kh-tile gp-tile" style="--c:'+t.sky[2]+'" onclick="startRace2D(\''+t.id+'\')"><span class="kh-tic">'+(t.space?"🌌":"🌆")+'</span><span class="kh-tnm">'+esc(t.name)+'</span><span class="kh-tsub">'+t.laps+' laps'+(best[t.id]?' · best '+raceFmt(best[t.id].time)+' · '+raceOrdinal(best[t.id].place):' · not raced yet')+'</span></button>').join("");
  app.innerHTML='<div class="fadein gp-shell" style="max-width:760px;margin:0 auto">'
   +'<div class="gp-banner"><div class="gp-title">GRAND FABLE GP</div><div class="gp-sub">FORGING THE PATH OF AI RACING · with Ananse the Wise Lion</div></div>'
   +'<div class="center"><div class="speech" style="max-width:560px;margin:10px auto">Race Ananse\'s #7 kart on rainbow roads through space against Kofi, Ama, Esi and Kwame. Drive through holographic boxes to grab items: 🚀 rocket boost, 🌀 homing orb, 🛡️ shield, 🍌 banana. The kart accelerates itself — you steer and fire.</div></div>'
   +'<h2 style="color:#fff;font-size:18px;margin:14px 0 8px">Choose your circuit</h2><div class="kh-tiles">'+tracks+'</div>'
   +'<div class="card gp-card" style="margin-top:14px"><b>Controls</b><p class="muted" style="margin-top:6px">Keyboard: ← → steer (or A / D) · ↓ brake · Space or ↑ fires your item · Esc quits. Touch: hold the left or right side of the track, ⚡ fires. 1st place = 30 XP, 2nd = 20, 3rd = 10. Win once for the Grand Fable Champion trophy.</p></div>'
   +'<div class="btn-row" style="margin-top:14px"><button class="btn" onclick="'+(P?'renderHome()':'renderProfiles()')+'">⟵ Back</button></div><div class="spacer"></div></div>';
  say("Welcome to the Grand Fable GP! Choose your circuit and let's race.");
}
function startRace2D(tid){
  raceStop();clearTimers();closeOverlay();showAnanseCorner(false);
  const T=RACE_TRACKS.find(t=>t.id===tid)||RACE_TRACKS[0];
  app.innerHTML='<div class="fadein race-wrap">'
   +'<canvas id="rcCanvas" width="720" height="440"></canvas>'
   +'<div class="race-ctl"><button class="race-btn" id="rcL">◀</button><button class="race-btn" id="rcB">🛑</button><button class="race-btn gp-fire" id="rcF">⚡</button><button class="race-btn" id="rcR">▶</button></div>'
   +'<div class="center" style="margin-top:8px"><button class="readbtn" onclick="renderRace2D()">⟵ Quit race</button></div></div>';
  const c=$("rcCanvas");
  const SEG=200,RW=2200;const segs=[];
  T.curves.forEach(([n,curve])=>{for(let i=0;i<n;i++){const t=i/n;const ease=curve*(t<0.25?t*4:(t>0.75?(1-t)*4:1));segs.push({curve:ease,sprites:[]});}});
  const N=segs.length,LEN=N*SEG;
  const rnd2=n=>Math.floor(Math.random()*n);
  const deco=T.space?["🪐","✨","🛰️","🌠","💫","🛸"]:["🏙️","🌴","🏢","🎆","🌴","🏬"];
  for(let i=0;i<N;i+=4){const side=i%8<4?-1:1;segs[i].sprites.push({e:deco[rnd2(deco.length)],off:side*(1.7+Math.random()*0.9),size:1});if(i%40===0)segs[i].sprites.push({e:"🇬🇭",off:-side*1.6,size:.8});}
  // holographic item boxes + a few hazards
  const items=[];for(let i=25;i<N;i+=9){items.push({z:i*SEG+rnd2(SEG),x:(rnd2(3)-1)*0.55,kind:"box",alive:true});}
  for(let i=15;i<N;i+=23){items.push({z:i*SEG,x:(rnd2(3)-1)*0.55,kind:"banana",alive:true});}
  // stars for the space sky
  const stars=[];for(let i=0;i<90;i++)stars.push({x:Math.random(),y:Math.random()*0.55,r:Math.random()*1.8+0.4,tw:Math.random()*6});
  const cars=RACE_RIVALS.map((r,i)=>({name:r.n,e:r.e,c:r.c,z:(i+1)*SEG*3,x:(i%2?0.45:-0.45),speed:0,max:11700+i*500+rnd2(500),lap:0,total:0,spin:0,slow:0,wobble:Math.random()*6,fireIn:6+Math.random()*8}));
  RC={T,segs,N,LEN,SEG,RW,items,cars,stars,shots:[],place:5,board:[{name:"Kofi"},{name:"Ama"},{name:"Esi"},{name:"Kwame"},{name:"You"}],player:{z:0,x:0,speed:0,max:13000,lap:0,total:0,spin:0,boost:0,shield:0,item:null,coins:0},keys:{},t0:performance.now(),time:0,done:false,raf:null,cam:{h:1000,depth:1/Math.tan((80/2)*Math.PI/180)},last:performance.now(),touchDir:0,brake:false,flash:0,msg:"",msgT:0,hue:0};
  RC.kd=e=>{if(!RC)return;const k=e.key.toLowerCase();if(k==="escape"){renderRace2D();return;}if(k===" "||k==="arrowup"){raceUseItem();e.preventDefault();return;}RC.keys[k]=true;if(["arrowleft","arrowright","arrowdown"].includes(k))e.preventDefault();};
  RC.ku=e=>{if(!RC)return;RC.keys[e.key.toLowerCase()]=false;};
  window.addEventListener("keydown",RC.kd);window.addEventListener("keyup",RC.ku);
  const hold=(id,dir)=>{const b=$(id);const on=ev=>{ev.preventDefault();if(!RC)return;if(dir==="b")RC.brake=true;else RC.touchDir=dir;};const off=ev=>{ev.preventDefault();if(!RC)return;if(dir==="b")RC.brake=false;else if(RC.touchDir===dir)RC.touchDir=0;};["pointerdown","touchstart"].forEach(t=>b.addEventListener(t,on,{passive:false}));["pointerup","pointerleave","pointercancel","touchend"].forEach(t=>b.addEventListener(t,off));};
  hold("rcL",-1);hold("rcR",1);hold("rcB","b");
  $("rcF").addEventListener("pointerdown",ev=>{ev.preventDefault();raceUseItem();});
  c.addEventListener("pointerdown",ev=>{if(!RC)return;const r=c.getBoundingClientRect();RC.touchDir=(ev.clientX-r.left)<r.width/2?-1:1;});
  ["pointerup","pointerleave","pointercancel"].forEach(t=>c.addEventListener(t,()=>{if(RC)RC.touchDir=0;}));
  say("Grand Fable GP. Three, two, one, go!");
  RC.countdown=3.2;
  RC.raf=requestAnimationFrame(raceFrame);
}
function raceSay(m){if(!RC)return;RC.msg=m;RC.msgT=1.6;}
function raceUseItem(){
  if(!RC||RC.done||RC.countdown>0)return;const p=RC.player;if(!p.item)return;
  const it=p.item;p.item=null;
  if(it==="rocket"){p.boost=3;sfx("levelup");raceSay("🚀 Rocket boost!");}
  else if(it==="shield"){p.shield=8;sfx("tick");raceSay("🛡️ Shield up!");}
  else if(it==="banana"){RC.items.push({z:(p.z-RC.SEG*1.5+RC.LEN)%RC.LEN,x:p.x,kind:"banana",alive:true,dropped:true});sfx("tick");raceSay("🍌 Banana dropped!");}
  else if(it==="orb"){RC.shots.push({z:p.z,x:p.x,speed:p.speed+9000,from:"player",life:4});sfx("correct");raceSay("🌀 Homing orb away!");}
}
function raceFrame(now){
  if(!RC)return;
  const dt=Math.min(0.05,(now-RC.last)/1000);RC.last=now;
  RC.hue=(RC.hue+dt*40)%360;
  if(RC.countdown>0){RC.countdown-=dt;raceDraw();RC.raf=requestAnimationFrame(raceFrame);return;}
  if(!RC.done)RC.time=now-RC.t0-3200;
  raceUpdate(dt);raceDraw();
  RC.raf=requestAnimationFrame(raceFrame);
}
function raceHit(target,cause){
  if(target==="player"){const p=RC.player;if(p.shield>0){p.shield=0;sfx("tick");raceSay("🛡️ Shield blocked it!");return;}p.spin=1.1;p.boost=0;sfx("wrong");raceSay(cause==="orb"?"🌀 Hit by an orb!":"🍌 Banana spin!");}
  else{target.spin=1.2;}
}
function raceUpdate(dt){
  const p=RC.player,k=RC.keys;
  const left=k["arrowleft"]||k["a"]||RC.touchDir<0,right=k["arrowright"]||k["d"]||RC.touchDir>0,brake=k["arrowdown"]||k["s"]||RC.brake;
  const seg=RC.segs[Math.floor(p.z/RC.SEG)%RC.N];
  const maxNow=p.max*(p.boost>0?1.4:1)*(p.spin>0?0.3:1)*(Math.abs(p.x)>1?0.5:1);
  if(brake)p.speed=Math.max(0,p.speed-16000*dt);else p.speed+=(maxNow-p.speed)*Math.min(1,dt*1.4);
  if(Math.abs(p.x)>1)p.speed=Math.min(p.speed,maxNow);
  const spd=p.speed/p.max;
  if(p.spin>0){p.spin-=dt;p.x+=Math.sin(p.spin*20)*dt*0.5;}
  else{if(left)p.x-=dt*2.3*Math.max(.4,spd);if(right)p.x+=dt*2.3*Math.max(.4,spd);}
  p.x-=seg.curve*spd*dt*0.9;
  p.x=Math.max(-1.6,Math.min(1.6,p.x));
  if(p.boost>0)p.boost-=dt;if(p.shield>0)p.shield-=dt;if(RC.msgT>0)RC.msgT-=dt;if(RC.flash>0)RC.flash-=dt;
  const dz=p.speed*dt;p.z+=dz;p.total+=dz;
  if(p.z>=RC.LEN){p.z-=RC.LEN;p.lap++;if(p.lap>=RC.T.laps&&!RC.done)raceFinish();else{sfx("tick");raceSay(p.lap+1===RC.T.laps?"🏁 Final lap!":"Lap "+(p.lap+1)+"!");}}
  // items & boxes
  RC.items.forEach(it=>{if(!it.alive)return;const d=(it.z-p.z+RC.LEN)%RC.LEN;if(d<RC.SEG*0.6&&Math.abs(it.x-p.x)<0.35){
    if(it.kind==="box"){it.alive=false;setTimeout(()=>{it.alive=true;},7000);if(!p.item){const pool=RC.place>=4?["rocket","rocket","orb","shield"]:(RC.place===1?["banana","shield","orb","rocket"]:["rocket","orb","shield","banana"]);p.item=pool[Math.floor(Math.random()*pool.length)];RC.flash=0.5;sfx("correct");raceSay("🎁 "+RACE_ITEMS[p.item].n+"!");}p.coins++;}
    else if(it.kind==="banana"){it.alive=false;if(!it.dropped)setTimeout(()=>{it.alive=true;},9000);raceHit("player","banana");}
  }});
  // homing orbs
  RC.shots=RC.shots.filter(s=>{s.life-=dt;s.z=(s.z+s.speed*dt)%RC.LEN;
    if(s.from==="player"){let best=null,bd=1e9;RC.cars.forEach(car=>{const d=(car.z-s.z+RC.LEN)%RC.LEN;if(d<RC.SEG*40&&d<bd){bd=d;best=car;}});if(best){s.x+=(best.x-s.x)*dt*4;if(bd<RC.SEG*0.8&&Math.abs(best.x-s.x)<0.4){raceHit(best);sfx("correct");raceSay("🌀 Got "+best.name+"!");return false;}}}
    else{const d=(p.z-s.z+RC.LEN)%RC.LEN;s.x+=(p.x-s.x)*dt*3;if(d<RC.SEG*0.8&&Math.abs(p.x-s.x)<0.4){raceHit("player","orb");return false;}}
    return s.life>0;});
  // rivals
  RC.cars.forEach(car=>{
    const cmax=car.max*(car.spin>0?0.3:1);
    car.speed+=(cmax-car.speed)*Math.min(1,dt*1.2);
    if(car.spin>0)car.spin-=dt;
    car.wobble+=dt;const target=Math.sin(car.wobble*0.6)*0.55;car.x+=(target-car.x)*dt*1.2;
    const gap=(p.z-car.z+RC.LEN)%RC.LEN;if(gap<RC.SEG*3&&gap>0&&Math.abs(car.x-p.x)<0.3)car.x+=(car.x<p.x?-1:1)*dt*1.5;
    // rivals fire orbs at the player now and then when they are behind
    car.fireIn-=dt;if(car.fireIn<=0){car.fireIn=9+Math.random()*10;const behind=(p.z-car.z+RC.LEN)%RC.LEN;if(behind>RC.SEG&&behind<RC.SEG*30&&!RC.done){RC.shots.push({z:car.z,x:car.x,speed:car.speed+8000,from:car.name,life:4});raceSay("⚠️ "+car.name+" fired an orb!");}}
    // rivals hit bananas too
    RC.items.forEach(it=>{if(it.alive&&it.kind==="banana"){const d=(it.z-car.z+RC.LEN)%RC.LEN;if(d<RC.SEG*0.5&&Math.abs(it.x-car.x)<0.3&&car.spin<=0){raceHit(car);if(it.dropped)it.alive=false;}}});
    const cz=car.speed*dt;car.z+=cz;car.total+=cz;if(car.z>=RC.LEN){car.z-=RC.LEN;car.lap++;}
    const d=(car.z-p.z+RC.LEN)%RC.LEN;
    if(d<RC.SEG*0.7&&Math.abs(car.x-p.x)<0.4&&p.speed>car.speed){p.speed=car.speed*0.85;p.x+=(p.x<car.x?-1:1)*0.25;sfx("tick");}
  });
  const all=[{name:"You",total:p.total}].concat(RC.cars.map(c=>({name:c.name,total:c.total}))).sort((a,b)=>b.total-a.total);
  RC.board=all;RC.place=all.findIndex(a=>a.name==="You")+1;
}
function raceProject(px,py,pz,camX,camY,camZ,W,H){
  const dz=pz-camZ;const scale=RC.cam.depth/Math.max(1,dz);
  return{x:Math.round(W/2+scale*(px-camX)*W/2),y:Math.round(H/2-scale*(py-camY)*H/2),w:Math.round(scale*RC.RW*W/2),scale};
}
function racePoly(x,x1,y1,x2,y2,x3,y3,x4,y4){x.beginPath();x.moveTo(x1,y1);x.lineTo(x2,y2);x.lineTo(x3,y3);x.lineTo(x4,y4);x.closePath();x.fill();}
function raceSkyline(x,W,H,shift,hue){
  x.save();x.globalAlpha=0.9;
  for(let i=0;i<26;i++){const bw=18+((i*37)%40),bh=40+((i*53)%120);const bx=((i*61+shift*0.15)%(W+120))-60;const by=H*0.5-bh;
    x.fillStyle="rgba(10,6,40,.95)";x.fillRect(bx,by,bw,bh);
    x.fillStyle="hsla("+((hue+i*40)%360)+",100%,65%,.8)";for(let wy=by+6;wy<H*0.5-6;wy+=10)for(let wx=bx+4;wx<bx+bw-4;wx+=8)if((wx*7+wy*3+i)%5<2)x.fillRect(wx,wy,3,5);
    x.fillStyle="hsla("+((hue+i*40)%360)+",100%,60%,.9)";x.fillRect(bx,by,bw,2);}
  x.restore();
}
function raceDraw(){
  const c=$("rcCanvas");if(!c)return;const x=c.getContext("2d"),W=c.width,H=c.height,p=RC.player,T=RC.T;
  // sky / galaxy
  const g=x.createLinearGradient(0,0,0,H*0.55);g.addColorStop(0,T.sky[0]);g.addColorStop(0.6,T.sky[1]);g.addColorStop(1,T.sky[2]);x.fillStyle=g;x.fillRect(0,0,W,H*0.55);
  if(T.space){const neb=x.createRadialGradient(W*0.7,H*0.15,10,W*0.7,H*0.15,W*0.5);neb.addColorStop(0,"rgba(255,80,200,.35)");neb.addColorStop(0.5,"rgba(80,60,255,.18)");neb.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=neb;x.fillRect(0,0,W,H*0.55);
    RC.stars.forEach(s=>{const tw=0.5+0.5*Math.sin(RC.hue/10+s.tw);x.fillStyle="rgba(255,255,255,"+(0.4+0.6*tw)+")";x.beginPath();x.arc(((s.x*W)-(p.x*30)+W)%W,s.y*H,s.r,0,7);x.fill();});
    x.font="26px system-ui";x.fillText("🪐",W*0.82-p.x*20,H*0.12);x.font="18px system-ui";x.fillText("🌙",W*0.15-p.x*15,H*0.1);}
  if(T.city)raceSkyline(x,W,H,p.z/40+p.x*60,RC.hue);
  // ground glow line
  x.fillStyle="hsla("+RC.hue+",100%,60%,.6)";x.fillRect(0,H*0.55-2,W,3);
  const baseIdx=Math.floor(p.z/RC.SEG);const basePct=(p.z%RC.SEG)/RC.SEG;
  const camX=p.x*RC.RW,camY=RC.cam.h,camZ=p.z;
  let maxY=H,dx=-(RC.segs[baseIdx%RC.N].curve*basePct),xoff=0;
  const sprites=[];
  for(let n=0;n<110;n++){
    const idx=(baseIdx+n)%RC.N,seg=RC.segs[idx];
    const z1=(baseIdx+n)*RC.SEG,z2=z1+RC.SEG;
    const p1=raceProject(xoff,0,z1,camX,camY,camZ,W,H);
    xoff+=dx;dx+=seg.curve;
    const p2=raceProject(xoff,0,z2,camX,camY,camZ,W,H);
    if(p2.y<maxY&&p1.y>p2.y){
      const dark=Math.floor((baseIdx+n)/3)%2;
      x.fillStyle=T.grass[dark];x.fillRect(0,p2.y,W,p1.y-p2.y);
      const rumble=w=>w*1.12;
      x.fillStyle=dark?"hsl("+((RC.hue+idx*6)%360)+",100%,60%)":"#fff";racePoly(x,p1.x-rumble(p1.w),p1.y,p1.x+rumble(p1.w),p1.y,p2.x+rumble(p2.w),p2.y,p2.x-rumble(p2.w),p2.y);
      if(T.rainbow){const hue=(idx*9+RC.hue)%360;x.fillStyle="hsl("+hue+",90%,"+(dark?"52%":"58%")+")";}
      else x.fillStyle=T.road[dark];
      racePoly(x,p1.x-p1.w,p1.y,p1.x+p1.w,p1.y,p2.x+p2.w,p2.y,p2.x-p2.w,p2.y);
      if(T.rainbow){x.fillStyle="rgba(255,255,255,.12)";for(let b=1;b<6;b++){const bx1=p1.x-p1.w+p1.w*2*b/6,bx2=p2.x-p2.w+p2.w*2*b/6;racePoly(x,bx1-1,p1.y,bx1+1,p1.y,bx2+1,p2.y,bx2-1,p2.y);}}
      else if(dark){x.fillStyle="rgba(120,230,255,.75)";for(let l=1;l<3;l++){const lw1=p1.w*0.02,lw2=p2.w*0.02;const lx1=p1.x-p1.w+p1.w*2*l/3,lx2=p2.x-p2.w+p2.w*2*l/3;racePoly(x,lx1-lw1,p1.y,lx1+lw1,p1.y,lx2+lw2,p2.y,lx2-lw2,p2.y);}}
      if(idx===0){x.fillStyle="#fff";racePoly(x,p1.x-p1.w,p1.y,p1.x+p1.w,p1.y,p2.x+p2.w,p2.y,p2.x-p2.w,p2.y);x.fillStyle="#111";for(let k=0;k<8;k++)if(k%2)x.fillRect(p1.x-p1.w+(p1.w*2)*k/8,p2.y,(p1.w*2)/8,Math.max(1,p1.y-p2.y));}
      maxY=p2.y;
    }
    seg.sprites.forEach(s=>sprites.push({e:s.e,x:p1.x+p1.w*s.off,y:p1.y,s:p1.scale*RC.RW*W/2*0.5*s.size,d:n}));
    RC.items.forEach(it=>{if(it.alive&&Math.floor(it.z/RC.SEG)===idx)sprites.push({item:it,x:p1.x+p1.w*it.x,y:p1.y,s:p1.scale*RC.RW*W/2*0.38,d:n});});
    RC.shots.forEach(s=>{if(Math.floor(s.z/RC.SEG)===idx)sprites.push({e:"🌀",x:p1.x+p1.w*s.x,y:p1.y-p1.scale*RC.RW*W/2*0.1,s:p1.scale*RC.RW*W/2*0.3,d:n});});
    RC.cars.forEach(car=>{if(Math.floor(car.z/RC.SEG)===idx)sprites.push({car,x:p1.x+p1.w*car.x,y:p1.y,s:p1.scale*RC.RW*W/2*0.5,d:n});});
  }
  sprites.sort((a,b)=>b.d-a.d).forEach(s=>{
    const size=Math.max(6,Math.min(150,s.s));
    if(s.car)raceKart(x,s.x,s.y,size,s.car.c,s.car.e,false,s.car.spin>0);
    else if(s.item){if(s.item.kind==="box")raceBox(x,s.x,s.y,size);else{x.font=size+"px system-ui";x.textAlign="center";x.fillText("🍌",s.x,s.y);x.textAlign="left";}}
    else{x.font=size+"px system-ui";x.textAlign="center";x.fillText(s.e,s.x,s.y);x.textAlign="left";}
  });
  // speed lines when boosting
  if(p.boost>0){x.strokeStyle="rgba(255,255,255,.35)";x.lineWidth=2;for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2+RC.hue/20;x.beginPath();x.moveTo(W/2+Math.cos(a)*120,H*0.7+Math.sin(a)*60);x.lineTo(W/2+Math.cos(a)*W,H*0.7+Math.sin(a)*H);x.stroke();}}
  // player kart
  raceKart(x,W/2+(p.spin>0?Math.sin(p.spin*30)*10:0),H-16,120,"#f5a623","🦁",p.boost>0,p.spin>0,true);
  if(p.shield>0){x.strokeStyle="rgba(120,230,255,"+(0.5+0.4*Math.sin(RC.hue/5))+")";x.lineWidth=4;x.beginPath();x.ellipse(W/2,H-50,80,46,0,0,7);x.stroke();}
  // HUD: holographic panels
  raceHud(x,W,H);
  if(RC.countdown>0){x.fillStyle="rgba(0,0,0,.35)";x.fillRect(0,0,W,H);x.fillStyle="#fff";x.font="900 96px system-ui";x.textAlign="center";x.shadowColor="hsl("+RC.hue+",100%,60%)";x.shadowBlur=30;const n=Math.ceil(RC.countdown-0.2);x.fillText(n>0?String(n):"GO!",W/2,H/2+34);x.shadowBlur=0;x.textAlign="left";}
  if(RC.done){x.fillStyle="rgba(0,0,0,.5)";x.fillRect(0,0,W,H);x.textAlign="center";x.fillStyle="#fff";x.shadowColor="hsl("+RC.hue+",100%,60%)";x.shadowBlur=26;x.font="900 46px system-ui";x.fillText("🏁 "+raceOrdinal(RC.place)+" PLACE",W/2,H/2-6);x.shadowBlur=0;x.font="700 22px system-ui";x.fillText(raceFmt(RC.time)+" · 🎁 "+p.coins+" boxes"+(RC.xp?" · +"+RC.xp+" XP":""),W/2,H/2+32);x.textAlign="left";}
}
function raceHud(x,W,H){
  const p=RC.player;
  const panel=(px,py,pw,ph)=>{x.fillStyle="rgba(5,10,40,.62)";x.beginPath();x.roundRect(px,py,pw,ph,10);x.fill();x.strokeStyle="hsla("+RC.hue+",100%,70%,.8)";x.lineWidth=1.5;x.stroke();};
  // leaderboard (top right)
  const rows=(RC.board||[]).slice(0,5);panel(W-172,10,162,22+rows.length*20);
  x.font="900 12px system-ui";x.fillStyle="#9fd0ff";x.fillText("LEADERBOARD",W-160,26);
  rows.forEach((r,i)=>{const you=r.name==="You";x.fillStyle=you?"#ffd166":"#fff";x.font=(you?"900":"700")+" 14px system-ui";x.fillText((i+1)+". "+(you?"ANANSE #7":r.name.toUpperCase()),W-160,44+i*20);});
  // race panel (top left)
  panel(10,10,210,62);
  x.fillStyle="#ffd166";x.font="900 20px system-ui";x.fillText(raceOrdinal(RC.place).toUpperCase(),22,34);
  x.fillStyle="#fff";x.font="700 13px system-ui";x.fillText("LAP "+Math.min(RC.T.laps,p.lap+1)+"/"+RC.T.laps+"   ⏱ "+raceFmt(Math.max(0,RC.time)),22,54);
  x.fillStyle="#9fd0ff";x.fillText(RC.T.name.toUpperCase(),22,68);
  // item slot (bottom left)
  panel(10,H-72,62,62);
  if(p.item){x.font="34px system-ui";x.textAlign="center";x.fillText(RACE_ITEMS[p.item].e,41,H-28);x.textAlign="left";x.fillStyle="#ffd166";x.font="900 10px system-ui";x.fillText("⚡ USE",24,H-14);}
  else{x.fillStyle="#9fd0ff";x.font="900 10px system-ui";x.fillText("ITEM",29,H-38);x.fillText("—",36,H-22);}
  // speedometer (bottom right)
  panel(W-96,H-72,86,62);x.fillStyle="#fff";x.font="900 22px system-ui";x.fillText(Math.round(p.speed/60),W-84,H-40);x.fillStyle="#9fd0ff";x.font="900 10px system-ui";x.fillText("KM/H"+(p.boost>0?" 🚀":""),W-84,H-22);
  if(RC.flash>0){x.fillStyle="rgba(255,255,255,"+RC.flash*0.4+")";x.fillRect(0,0,W,H);}
  if(RC.msgT>0){x.textAlign="center";x.fillStyle="#fff";x.font="900 24px system-ui";x.shadowColor="#000";x.shadowBlur=8;x.fillText(RC.msg,W/2,90);x.shadowBlur=0;x.textAlign="left";}
}
function raceBox(x,cx,by,size){
  const s=size*0.7,r=RC.hue/40;
  x.save();x.translate(cx,by-s*0.6);x.rotate(Math.sin(r)*0.4);
  x.shadowColor="hsl("+RC.hue+",100%,70%)";x.shadowBlur=size*0.4;
  x.fillStyle="hsla("+((RC.hue+180)%360)+",100%,60%,.55)";x.fillRect(-s/2,-s/2,s,s);
  x.strokeStyle="#fff";x.lineWidth=Math.max(1,size*0.04);x.strokeRect(-s/2,-s/2,s,s);
  x.shadowBlur=0;x.fillStyle="#fff";x.font="900 "+(s*0.7)+"px system-ui";x.textAlign="center";x.fillText("?",0,s*0.25);x.textAlign="left";x.restore();
}
function raceKart(x,cx,by,size,color,driver,flame,spinning,isPlayer){
  const w=size,h=size*0.55;
  x.save();x.translate(cx,by);if(spinning)x.rotate(Math.sin(RC.hue/3)*0.5);
  if(flame){x.font=(size*0.4)+"px system-ui";x.textAlign="center";x.fillText("🔥",-w*0.2,h*0.35);x.fillText("🔥",w*0.2,h*0.35);}
  x.shadowColor=color;x.shadowBlur=size*0.25;
  x.fillStyle="#0b0f2a";x.beginPath();x.roundRect(-w/2,-h*0.35,w*0.22,h*0.45,4);x.fill();x.beginPath();x.roundRect(w/2-w*0.22,-h*0.35,w*0.22,h*0.45,4);x.fill();
  x.fillStyle=color;x.beginPath();x.roundRect(-w*0.42,-h*0.78,w*0.84,h*0.62,Math.max(4,size*0.09));x.fill();
  x.shadowBlur=0;
  x.fillStyle="rgba(255,255,255,.3)";x.fillRect(-w*0.32,-h*0.72,w*0.64,h*0.1);
  x.strokeStyle="rgba(120,230,255,.9)";x.lineWidth=Math.max(1,size*0.02);x.strokeRect(-w*0.42,-h*0.78,w*0.84,h*0.62);
  if(isPlayer){x.fillStyle="#fff";x.font="900 "+(size*0.22)+"px system-ui";x.textAlign="center";x.fillText("7",0,-h*0.3);x.textAlign="left";}
  x.font=(size*0.42)+"px system-ui";x.textAlign="center";x.fillText(driver,0,-h*0.66);x.textAlign="left";
  x.restore();
}
function raceFinish(){
  RC.done=true;RC.player.speed*=0.5;
  const place=RC.place;const xp=[0,30,20,10,5,5][place]||5;RC.xp=P?xp:0;
  sfx(place===1?"levelup":"correct");if(place===1)confetti();
  say(place===1?"You win the Grand Fable GP! Champion of "+RC.T.name+"!":"You finished "+raceOrdinal(place)+". Great driving!");
  if(P){
    P.xp+=xp;P.race=P.race||{};const prev=P.race[RC.T.id];
    P.race[RC.T.id]={time:prev&&prev.time<RC.time?prev.time:RC.time,place:Math.min(place,prev?prev.place:9),date:today()};
    if(place===1&&!P.trophies.some(t=>t.type==="race")&&typeof awardTrophy==="function")awardTrophy({type:"race",icon:"🏎️",label:"Grand Fable Champion",color:"#ffd166",detail:"Won a race on "+RC.T.name+"."});
    save();
  }
  setTimeout(()=>{if(!RC)return;const wrap=document.querySelector(".race-wrap");if(wrap)wrap.insertAdjacentHTML("beforeend",'<div class="center fadein" style="margin-top:10px"><div class="btn-row"><button class="btn big" onclick="startRace2D(\''+RC.T.id+'\')">Race again 🔁</button><button class="btn secondary big" onclick="renderRace2D()">Circuits 🏁</button><button class="btn secondary big" onclick="'+(P?'renderHome()':'renderProfiles()')+'">Home 🏠</button></div></div>');},1200);
}
