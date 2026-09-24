/* ============================================================
   GRAND FABLE GP v2 — 3D kart racing (Three.js r128), built for iPad
   Real-time sun shadows, gradient sky with sun glow, sky reflections
   on the paint, distant hills, ad walls and tyre stacks, instanced
   trees and crowds. Detailed Speed GT cars with spinning, steering
   wheels, body roll and pitch. Drift (hold DRIFT while turning) charges
   a mini-turbo shown by blue → orange → purple sparks. Boost flames,
   dust off the grass, speed lines, FOV kick, camera shake on hits.
   WebAudio engine that follows speed, screech, whoosh, chimes, bonks,
   countdown beeps and a finish fanfare, with a mute button.
   Big iPad touch pads, no page scroll/zoom mid-race, and automatic
   resolution drop if the frame rate falls.
   Same entry points as v1: renderRace / renderCircuits / startRace3D.
   Falls back to the 2D racer when WebGL or Three.js is unavailable.
   ============================================================ */
"use strict";
let R3=null;
const GP_RACERS=[
 {id:"ananse",n:"Ananse",e:"🦁",c:0xf5a623,css:"#f5a623",helmet:0xc9a84c,speed:4,handle:4,accel:4,bio:"The Wise Lion. Balanced, clever, never gives up."},
 {id:"kofi",n:"Kofi",e:"🐘",c:0xff4d6d,css:"#ff4d6d",helmet:0x8b1e3f,speed:5,handle:2,accel:2,bio:"Big engine, big heart. Slow to turn, fast on straights."},
 {id:"ama",n:"Ama",e:"🐆",c:0xb06bff,css:"#b06bff",helmet:0x5b2a9e,speed:5,handle:3,accel:4,bio:"Quick as a leopard. Top speed to burn."},
 {id:"esi",n:"Esi",e:"🦓",c:0x39e6a0,css:"#39e6a0",helmet:0x1b8f5e,speed:3,handle:5,accel:4,bio:"Hugs every corner. Best handling on the grid."},
 {id:"kwame",n:"Kwame",e:"🐊",c:0x4dd2ff,css:"#4dd2ff",helmet:0x1a6fa0,speed:4,handle:3,accel:5,bio:"Snappy starts. Launches off the line like a rocket."}
];
/* look: sky colours, sun direction/colour, fog and hill colour give each circuit its own time of day */
const GP_CIRCUITS=[
 {id:"palm",name:"Palm Cove Circuit",laps:3,tree:"palm",grass:0x58b85a,sky:0x8fd3ff,
  look:{top:"#1f7ae0",hor:"#d4f0ff",glow:"#fff3c4",sun:"#fff6e5",sunI:1.35,hemi:0.62,dir:[0.45,0.8,0.35],fog:"#cfe9fb",hill:"#4c9a5a",time:"Sunny morning"},
  pts:[[0,0],[70,-8],[125,25],[135,85],[95,125],[30,118],[-35,140],[-95,105],[-115,45],[-70,-5]]},
 {id:"stadium",name:"Accra Stadium Loop",laps:3,tree:"round",grass:0x4faf52,sky:0x7cc4ff,
  look:{top:"#2d5fc4",hor:"#ffe2b8",glow:"#ffd08a",sun:"#ffe0b5",sunI:1.3,hemi:0.55,dir:[0.8,0.5,-0.25],fog:"#f2dcc0",hill:"#6c9a4e",time:"Golden afternoon"},
  pts:[[0,0],[90,0],[130,40],[110,95],[40,110],[-10,80],[-60,110],[-120,80],[-125,25],[-70,-10]]},
 {id:"hills",name:"Kumasi Hillside",laps:2,tree:"round",grass:0x6cae4a,sky:0xa9dcff,
  look:{top:"#27388f",hor:"#ffa77a",glow:"#ff9a5c",sun:"#ffba8a",sunI:1.15,hemi:0.5,dir:[-0.85,0.32,0.2],fog:"#eeb59a",hill:"#5a8a47",time:"Sunset"},
  pts:[[0,0],[60,-20],[120,10],[140,70],[100,110],[60,80],[10,120],[-60,130],[-120,90],[-110,30],[-50,-15]]}
];
const GP_ITEMS={rocket:{e:"🚀",n:"Rocket boost"},orb:{e:"🌀",n:"Homing orb"},shield:{e:"🛡️",n:"Shield"},banana:{e:"🍌",n:"Banana"}};
function gpOrd(n){return n+(["th","st","nd","rd"][(n%100>10&&n%100<14)?0:(n%10<4?n%10:0)]);}
function gpSuf(n){return gpOrd(n).slice(String(n).length);}
function gpFmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return m+":"+String(s%60).padStart(2,"0")+"."+String(Math.floor((ms%1000)/100));}
function gpLin(c){return new THREE.Color(c).convertSRGBToLinear();}

/* ---------- sound: everything synthesised with WebAudio (no files) ---------- */
const GPA={ctx:null,master:null,eng:null,muted:false,
  init(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:0.9;this.master.connect(this.ctx.destination);}
    if(this.ctx.state==="suspended")this.ctx.resume();}catch(e){}},
  setMute(m){this.muted=m;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(m?0:0.9,this.ctx.currentTime,0.02);},
  startEngine(){if(!this.ctx||this.eng)return;try{const c=this.ctx;
    const o1=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o1.type="sawtooth";o2.type="square";o1.frequency.value=55;o2.frequency.value=28;f.type="lowpass";f.frequency.value=450;f.Q.value=3;g.gain.value=0;
    o1.connect(f);o2.connect(f);f.connect(g);g.connect(this.master);o1.start();o2.start();
    const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const ns=c.createBufferSource();ns.buffer=nb;ns.loop=true;const bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=2400;bp.Q.value=5;const ng=c.createGain();ng.gain.value=0;
    ns.connect(bp);bp.connect(ng);ng.connect(this.master);ns.start();
    this.noiseBuf=nb;this.eng={o1,o2,f,g,ng,ns};}catch(e){}},
  engine(spd,boost,drift,idle){const e=this.eng;if(!e)return;const t=this.ctx.currentTime;const base=idle?50+spd*40:46+spd*125+(boost?40:0);
    e.o1.frequency.setTargetAtTime(base,t,0.07);e.o2.frequency.setTargetAtTime(base/2+0.8,t,0.07);
    e.f.frequency.setTargetAtTime(320+spd*1500+(boost?700:0),t,0.08);e.g.gain.setTargetAtTime(0.03+spd*0.05,t,0.1);e.ng.gain.setTargetAtTime(drift?0.045:0,t,0.05);},
  stopEngine(){const e=this.eng;if(!e)return;try{e.g.gain.setTargetAtTime(0,this.ctx.currentTime,0.05);e.ng.gain.setTargetAtTime(0,this.ctx.currentTime,0.05);const s=this.ctx.currentTime+0.3;e.o1.stop(s);e.o2.stop(s);e.ns.stop(s);}catch(x){}this.eng=null;},
  tone(freq,dur,type,vol,slideTo,delay){if(!this.ctx)return;try{const c=this.ctx,t=c.currentTime+(delay||0);const o=c.createOscillator(),g=c.createGain();o.type=type||"sine";o.frequency.setValueAtTime(freq,t);if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+0.05);}catch(e){}},
  noise(dur,vol,freq,delay){if(!this.ctx||!this.noiseBuf)return;try{const c=this.ctx,t=c.currentTime+(delay||0);const s=c.createBufferSource();s.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type="bandpass";f.frequency.value=freq||1000;f.Q.value=1.2;const g=c.createGain();
    g.gain.setValueAtTime(vol||0.2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+dur+0.05);}catch(e){}},
  play(n){switch(n){
    case"beep":this.tone(660,0.2,"square",0.14);break;
    case"go":this.tone(1320,0.5,"square",0.16);break;
    case"chime":this.tone(880,0.12,"triangle",0.2);this.tone(1320,0.22,"triangle",0.2,null,0.09);break;
    case"bonk":this.tone(190,0.28,"square",0.2,70);this.noise(0.22,0.3,500);break;
    case"whoosh":this.noise(0.55,0.28,1400);this.tone(260,0.5,"sawtooth",0.06,900);break;
    case"fire":this.tone(480,0.22,"sawtooth",0.1,1500);break;
    case"shield":this.tone(520,0.35,"sine",0.18,1040);break;
    case"drop":this.tone(300,0.15,"triangle",0.15,180);break;
    case"hop":this.tone(420,0.1,"sine",0.1,640);break;
    case"lap":this.tone(990,0.15,"triangle",0.2);this.tone(1320,0.28,"triangle",0.2,null,0.12);break;
    case"fanfare":[523,659,784,1047].forEach((f,i)=>this.tone(f,0.3,"triangle",0.22,null,i*0.14));this.tone(1047,1.0,"triangle",0.2,null,0.62);this.tone(784,1.0,"triangle",0.12,null,0.62);break;}}
};

/* ---------- one-time CSS for the v2 layout (iPad-first) ---------- */
function gpCss(){if(document.getElementById("gpV2Css"))return;const s=document.createElement("style");s.id="gpV2Css";s.textContent=`
.gp3-wrap.v2{max-width:min(1600px,calc((100vh - 70px)*16/9));width:100%;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
@supports (height:100dvh){.gp3-wrap.v2{max-width:min(1600px,calc((100dvh - 70px)*16/9))}}
.gp3-wrap.v2 *{-webkit-tap-highlight-color:transparent}
.gp3-wrap.v2 .gp3-touch{z-index:1}
.gp3-lines{position:absolute;inset:-25%;pointer-events:none;opacity:0;z-index:2;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,0) 0deg 4deg,rgba(255,255,255,.5) 4deg 4.35deg);-webkit-mask-image:radial-gradient(circle at 50% 50%,transparent 36%,#000 72%);mask-image:radial-gradient(circle at 50% 50%,transparent 36%,#000 72%);animation:gpLines .14s steps(2) infinite}
@keyframes gpLines{0%{transform:rotate(0deg)}100%{transform:rotate(2.2deg)}}
.gp3-flash{position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0;background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.0) 30%,rgba(255,170,60,.55));transition:opacity .35s}
.gp3-wrap.v2 .gp3-hud{z-index:3}
.gp3-wrap.v2 .gp3-lap{font-size:clamp(14px,1.6vw,18px)}
.gp3-wrap.v2 .gp3-time{font-size:clamp(18px,2.2vw,26px)}
.gp3-pos{position:absolute;left:50%;top:6px;transform:translateX(-50%);z-index:3;font-size:clamp(40px,6.5vw,76px);font-weight:900;font-style:italic;color:#fff;line-height:1;pointer-events:none;text-shadow:0 4px 0 #0b1f5c,0 0 22px rgba(255,209,102,.85)}
.gp3-pos small{font-size:.42em;margin-left:2px}
.gp3-pos.p1{color:#ffd166}
.gp3-map.v2{left:10px;top:auto;right:auto;bottom:auto;top:clamp(78px,9vw,92px);width:clamp(110px,12vw,150px);height:auto;aspect-ratio:150/110;z-index:3}
.gp3-bc{left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:12px;align-items:center}
.gp3-wrap.v2 .gp3-item{width:clamp(54px,6vw,70px);height:clamp(54px,6vw,70px);font-size:clamp(26px,3vw,34px)}
.gp3-wrap.v2 .gp3-card{left:50%;top:24%;bottom:auto;transform:translateX(-50%);text-align:center;z-index:3}
.gp3-wrap.v2 .gp3-msg{z-index:3}
.gp3-wrap.v2 .gp3-count{z-index:4}
.gp3-mute{position:absolute;right:10px;bottom:auto;top:clamp(140px,15vw,160px);z-index:6;width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(10,20,50,.72);color:#fff;font-size:24px;display:grid;place-items:center;cursor:pointer;touch-action:manipulation}
.gp3-pad{position:absolute;bottom:12px;display:flex;gap:clamp(8px,1.2vw,14px);z-index:5;align-items:flex-end}
.gp3-pad.l{left:12px}.gp3-pad.r{right:12px}
.gp3-wrap.v2 .race-btn{width:clamp(70px,7.8vw,94px);height:clamp(70px,7.8vw,94px);border-radius:50%;font-size:clamp(26px,3.3vw,40px);background:rgba(6,29,55,.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);touch-action:none;display:grid;place-items:center;padding:0}
.gp3-wrap.v2 .race-btn.small{width:clamp(58px,6.8vw,80px);height:clamp(58px,6.8vw,80px);font-size:clamp(22px,2.6vw,30px)}
.gp3-wrap.v2 .race-btn.drift{background:linear-gradient(135deg,rgba(77,210,255,.85),rgba(176,107,255,.85));font-size:clamp(13px,1.6vw,18px);font-weight:900;letter-spacing:.04em}
.gp3-wrap.v2 .race-btn.on{background:#f5a623;color:#071b35}
.gp3-wrap.v2 .race-btn.drift.on{background:linear-gradient(135deg,#ffd166,#ff8c42);color:#071b35}
.gp3-wrap.v2 .gp3-finish{z-index:8}
.gp3-wrap.v2.done .gp3-pad,.gp3-wrap.v2.done .gp3-mute{display:none}
@media (max-width:700px){.gp3-wrap.v2 .gp3-tr{font-size:11px;min-width:96px}.gp3-map.v2{display:none}}

/* ---- phones: landscape (short screen) ---- */
@media (orientation:landscape) and (max-height:520px){
.gp3-wrap.v2{max-width:calc((100vh - 34px)*16/9);border-radius:10px;border-width:2px}
@supports (height:100dvh){.gp3-wrap.v2{max-width:calc((100dvh - 34px)*16/9)}}
.gp3-wrap.v2 .gp3-hud{padding:5px 8px;border-radius:9px}
.gp3-wrap.v2 .gp3-tl{left:6px;top:6px}
.gp3-wrap.v2 .gp3-lap{font-size:11px}.gp3-wrap.v2 .gp3-time{font-size:15px}
.gp3-map.v2{top:54px;left:6px;width:78px}
.gp3-pos{font-size:34px;top:4px}
.gp3-wrap.v2 .gp3-tr{display:none}
.gp3-mute{top:6px;right:6px;width:36px;height:36px;font-size:17px}
.gp3-pad{bottom:8px;gap:8px}.gp3-pad.l{left:8px}.gp3-pad.r{right:8px}
.gp3-wrap.v2 .race-btn{width:54px;height:54px;font-size:22px;border-width:2px}
.gp3-wrap.v2 .race-btn.small{width:44px;height:44px;font-size:18px}
.gp3-wrap.v2 .race-btn.drift{font-size:10px}
.gp3-bc{bottom:8px;gap:8px}
.gp3-wrap.v2 .gp3-item{width:40px;height:40px;font-size:20px}.gp3-wrap.v2 .gp3-item small{font-size:7px}
.gp3-wrap.v2 .gp3-speed{font-size:13px}
.gp3-wrap.v2 .gp3-msg{font-size:16px;top:22%}
.gp3-wrap.v2 .gp3-count{font-size:64px}
.gp3-wrap.v2 .gp3-card{top:30%;padding:6px 12px}.gp3-wrap.v2 .gp3-card b{font-size:15px}
.gp3-wrap.v2 .gp3-fin-title{font-size:26px}.gp3-wrap.v2 .gp-pod span{font-size:24px}.gp3-wrap.v2 .gp3-finish .btn.big{padding:8px 12px;font-size:14px}
}
/* ---- phones: portrait — the race fills the screen, controls along the bottom ---- */
@media (orientation:portrait) and (max-width:600px){
.gp3-wrap.v2{aspect-ratio:auto;height:calc(100vh - 64px);max-width:none;border-radius:12px;border-width:2px}
@supports (height:100dvh){.gp3-wrap.v2{height:calc(100dvh - 64px)}}
.gp3-wrap.v2 .gp3-hud{padding:5px 8px;border-radius:9px}
.gp3-wrap.v2 .gp3-tl{left:6px;top:6px}
.gp3-wrap.v2 .gp3-lap{font-size:12px}.gp3-wrap.v2 .gp3-time{font-size:16px}
.gp3-map.v2{display:block!important;top:58px;left:6px;width:84px}
.gp3-pos{font-size:44px;top:6px}
.gp3-wrap.v2 .gp3-tr{display:none}
.gp3-mute{top:8px;right:6px;width:40px;height:40px;font-size:18px}
.gp3-pad{bottom:12px;gap:8px}.gp3-pad.l{left:8px}.gp3-pad.r{right:8px}
.gp3-wrap.v2 .race-btn{width:58px;height:58px;font-size:22px;border-width:2px}
.gp3-wrap.v2 .race-btn.small{width:46px;height:46px;font-size:18px}
.gp3-wrap.v2 .race-btn.drift{font-size:10px}
.gp3-bc{bottom:82px;gap:8px}
.gp3-wrap.v2 .gp3-item{width:44px;height:44px;font-size:22px}.gp3-wrap.v2 .gp3-item small{font-size:7px}
.gp3-wrap.v2 .gp3-speed{font-size:14px}
.gp3-wrap.v2 .gp3-msg{font-size:17px;top:20%}
.gp3-wrap.v2 .gp3-count{font-size:72px}
.gp3-wrap.v2 .gp3-card{top:26%;padding:6px 12px;white-space:nowrap}.gp3-wrap.v2 .gp3-card b{font-size:15px}
.gp3-wrap.v2 .gp3-fin-title{font-size:28px}.gp3-wrap.v2 .gp3-finish .btn-row{flex-direction:column;gap:8px}
}

/* ---- phones: the race takes over the whole screen like a real mobile game ---- */
@media (max-height:520px),(orientation:portrait) and (max-width:600px){
.gp3-wrap.v2{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;aspect-ratio:auto!important;margin:0!important;border:0!important;border-radius:0!important;z-index:9000}
@supports (height:100dvh){.gp3-wrap.v2{height:100dvh!important}}
.gp3-wrap.v2 ~ .center .readbtn{display:none}
.gp3-quit{display:grid!important}
.gp3-wrap.v2 .gp3-tl{left:calc(6px + env(safe-area-inset-left));top:calc(6px + env(safe-area-inset-top))}
.gp3-map.v2{top:calc(66px + env(safe-area-inset-top))!important;left:calc(6px + env(safe-area-inset-left))}
.gp3-mute{right:calc(52px + env(safe-area-inset-right));top:calc(6px + env(safe-area-inset-top))}
.gp3-pad.l{left:calc(10px + env(safe-area-inset-left))}.gp3-pad.r{right:calc(10px + env(safe-area-inset-right))}
.gp3-pad{bottom:calc(10px + env(safe-area-inset-bottom))}
}
@media (orientation:portrait) and (max-width:600px){.gp3-bc{bottom:calc(84px + env(safe-area-inset-bottom))}}
@media (max-height:520px){.gp3-bc{bottom:calc(10px + env(safe-area-inset-bottom))}}
.gp3-quit{display:none;position:absolute;top:calc(6px + env(safe-area-inset-top));right:calc(6px + env(safe-area-inset-right));z-index:6;width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(10,20,50,.72);color:#fff;font-size:18px;place-items:center;cursor:pointer}
`;document.head.appendChild(s);}

/* ---------- entry: racer select → circuit select → race ---------- */
function gpStop(){
  if(!R3)return;
  if(R3.raf)cancelAnimationFrame(R3.raf);
  window.removeEventListener("keydown",R3.kd);window.removeEventListener("keyup",R3.ku);window.removeEventListener("resize",R3.onResize);
  window.removeEventListener("orientationchange",R3.onOrient);document.removeEventListener("visibilitychange",R3.onVis);
  if(R3.blockTouch){document.removeEventListener("touchmove",R3.blockTouch);document.removeEventListener("gesturestart",R3.blockTouch);}
  GPA.stopEngine();
  try{const seen=new Set();R3.scene.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}
    const ms=Array.isArray(o.material)?o.material:(o.material?[o.material]:[]);ms.forEach(m=>{if(seen.has(m))return;seen.add(m);["map","emissiveMap"].forEach(k=>{if(m[k]&&!seen.has(m[k])){seen.add(m[k]);m[k].dispose();}});m.dispose();});});}catch(e){}
  try{if(R3.envRT)R3.envRT.dispose();}catch(e){}
  try{R3.renderer.dispose();R3.renderer.forceContextLoss();}catch(e){}
  R3=null;
}
function renderRace(){
  clearTimers();closeOverlay();defocus();showAnanseCorner(false);gpStop();
  if(typeof kdWebgl==="function"&&!kdWebgl()){renderRace2D();return;}
  document.body.classList.add("learningworld");
  const sel=(P&&P.gpRacer)||window._gpRacer||"ananse";
  const cards=GP_RACERS.map(r=>'<button class="gp-racer'+(r.id===sel?" on":"")+'" style="--c:'+r.css+'" onclick="gpPickRacer(\''+r.id+'\')"><span class="gp-face">'+r.e+'</span><b>'+r.n+'</b>'
    +'<span class="gp-stat"><i>Speed</i><em style="width:'+(r.speed*20)+'%"></em></span><span class="gp-stat"><i>Turning</i><em style="width:'+(r.handle*20)+'%"></em></span><span class="gp-stat"><i>Start</i><em style="width:'+(r.accel*20)+'%"></em></span>'
    +'<small>'+esc(r.bio)+'</small></button>').join("");
  app.innerHTML='<div class="fadein gp-shell" style="max-width:820px;margin:0 auto">'
   +'<div class="gp-banner"><div class="gp-title">GRAND FABLE GP</div><div class="gp-sub">Choose your driver · everyone races the Speed GT supercar</div></div>'
   +'<div class="gp-grid" id="gpRacers">'+cards+'</div>'
   +'<div class="center" style="margin-top:14px"><button class="btn big" onclick="renderCircuits()">Next: choose a circuit ▶</button></div>'
   +'<div class="btn-row" style="margin-top:12px"><button class="btn secondary" onclick="'+(P?'renderHome()':'renderProfiles()')+'">⟵ Back</button><button class="btn secondary" style="font-size:14px" onclick="renderRace2D()">Classic 2D racer</button></div><div class="spacer"></div></div>';
  say("Grand Fable GP! Choose your racer.");
}
function gpPickRacer(id){if(P){P.gpRacer=id;save();}else window._gpRacer=id;document.querySelectorAll(".gp-racer").forEach(b=>b.classList.toggle("on",b.getAttribute("onclick").indexOf("'"+id+"'")>0));sfx("tick");}
function gpRacer(){const id=(P&&P.gpRacer)||window._gpRacer||"ananse";return GP_RACERS.find(r=>r.id===id)||GP_RACERS[0];}
function renderCircuits(){
  clearTimers();closeOverlay();showAnanseCorner(false);gpStop();
  const best=P&&P.race?P.race:{};
  app.innerHTML='<div class="fadein gp-shell" style="max-width:820px;margin:0 auto">'
   +'<div class="gp-banner"><div class="gp-title">GRAND FABLE GP</div><div class="gp-sub">'+esc(gpRacer().n)+' · choose a circuit</div></div>'
   +'<div class="gp-grid">'+GP_CIRCUITS.map((c,i)=>'<button class="gp-circuit" onclick="startRace3D(\''+c.id+'\')"><canvas id="gpMini'+i+'" width="220" height="150"></canvas><b>'+esc(c.name)+'</b><small>'+esc(c.look.time)+' · '+c.laps+' laps'+(best[c.id]?' · best '+gpFmt(best[c.id].time)+' · '+gpOrd(best[c.id].place):'')+'</small></button>').join("")+'</div>'
   +'<div class="card gp-card" style="margin-top:14px"><b>How to drive</b><p class="muted" style="margin-top:6px">iPad: ◀ ▶ steer · 🛑 brake · hold <b>DRIFT</b> while turning, then let go for a turbo (blue sparks = boost, orange = bigger, purple = biggest!) · ⚡ uses your item. Keyboard: ← → steer, ↓ brake, Shift drift, Space item, M mute, Esc quit. 1st = 30 XP, 2nd = 20, 3rd = 10. Win once for the Grand Fable Champion trophy.</p></div>'
   +'<div class="btn-row" style="margin-top:12px"><button class="btn secondary" onclick="renderRace()">⟵ Racers</button></div><div class="spacer"></div></div>';
  GP_CIRCUITS.forEach((c,i)=>gpDrawMini($("gpMini"+i),c,null));
  say("Choose a circuit.");
}
function gpCurveFor(c){return new THREE.CatmullRomCurve3(c.pts.map(p=>new THREE.Vector3(p[0],0,p[1])),true,"centripetal",0.6);}
function gpDrawMini(cv,c,karts){
  if(!cv)return;const x=cv.getContext("2d");x.clearRect(0,0,cv.width,cv.height);
  const xs=c.pts.map(p=>p[0]),zs=c.pts.map(p=>p[1]);const minX=Math.min(...xs)-15,maxX=Math.max(...xs)+15,minZ=Math.min(...zs)-15,maxZ=Math.max(...zs)+15;
  const sx=cv.width/(maxX-minX),sz=cv.height/(maxZ-minZ),s=Math.min(sx,sz);const ox=(cv.width-(maxX-minX)*s)/2,oz=(cv.height-(maxZ-minZ)*s)/2;
  const map=(px,pz)=>[ox+(px-minX)*s,oz+(pz-minZ)*s];
  if(!c._mini){const P0=c.pts,n=P0.length,pts=[];for(let i=0;i<n;i++){const a=P0[(i-1+n)%n],b=P0[i],cc=P0[(i+1)%n],d=P0[(i+2)%n];for(let t=0;t<1;t+=0.1){const t2=t*t,t3=t2*t;pts.push([0.5*((2*b[0])+(-a[0]+cc[0])*t+(2*a[0]-5*b[0]+4*cc[0]-d[0])*t2+(-a[0]+3*b[0]-3*cc[0]+d[0])*t3),0.5*((2*b[1])+(-a[1]+cc[1])*t+(2*a[1]-5*b[1]+4*cc[1]-d[1])*t2+(-a[1]+3*b[1]-3*cc[1]+d[1])*t3)]);}}c._mini=pts;}
  const pts=c._mini;
  x.fillStyle="rgba(60,160,80,.35)";x.fillRect(0,0,cv.width,cv.height);
  x.lineCap="round";x.lineJoin="round";x.strokeStyle="#2b2f3a";x.lineWidth=9;x.beginPath();pts.forEach((p,i)=>{const m=map(p[0],p[1]);i?x.lineTo(m[0],m[1]):x.moveTo(m[0],m[1]);});x.closePath();x.stroke();
  x.strokeStyle="#ffd166";x.lineWidth=1.5;x.setLineDash([4,4]);x.stroke();x.setLineDash([]);
  const P0=c.pts;const st=map(P0[0][0],P0[0][1]);x.fillStyle="#fff";x.fillRect(st[0]-4,st[1]-4,8,8);x.fillStyle="#111";x.fillRect(st[0]-4,st[1]-4,4,4);x.fillRect(st[0],st[1],4,4);
  if(karts)karts.forEach(k=>{const p=k.pos;const m=map(p.x,p.z);x.fillStyle=k.player?"#fff":k.racer.css;x.beginPath();x.arc(m[0],m[1],k.player?5:4,0,7);x.fill();if(k.player){x.strokeStyle="#111";x.lineWidth=1.5;x.stroke();}});
}
/* ---------- textures drawn on canvases ---------- */
function gpCanvasTex(w,h,draw,repeat){const cv=document.createElement("canvas");cv.width=w;cv.height=h;draw(cv.getContext("2d"),w,h);const t=new THREE.CanvasTexture(cv);if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=(R3&&R3.aniso)||window._gpAniso||4;if(THREE.sRGBEncoding)t.encoding=THREE.sRGBEncoding;return t;}
function gpFaceTex(emoji,skin){return gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle=skin||"#ffe0b2";x.beginPath();x.arc(64,64,62,0,7);x.fill();x.font="84px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText(emoji,64,70);});}
function gpTextTex(text,bg,fg,w,h,size){return gpCanvasTex(w||512,h||128,(x,W,H)=>{x.fillStyle=bg;x.fillRect(0,0,W,H);x.fillStyle="rgba(255,255,255,.12)";for(let i=0;i<W;i+=40)x.fillRect(i,0,20,H);x.fillStyle=fg;x.font="900 "+(size||64)+"px system-ui";x.textAlign="center";x.textBaseline="middle";x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=8;x.fillText(text,W/2,H/2);});}
function gpSoftDot(){return gpCanvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.35,"rgba(255,255,255,.7)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,h);});}
/* ---------- particle pools (sparks, flames, dust) ---------- */
function gpParticles(T,scene,n,size,additive,opacity){
  const g=new T.BufferGeometry();const pos=new Float32Array(n*3),col=new Float32Array(n*3);for(let i=0;i<n;i++)pos[i*3+1]=-999;
  g.setAttribute("position",new T.BufferAttribute(pos,3));g.setAttribute("color",new T.BufferAttribute(col,3));
  const m=new T.PointsMaterial({size,map:gpSoftDot(),vertexColors:true,transparent:true,opacity:opacity||1,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending,sizeAttenuation:true});
  const pts=new T.Points(g,m);pts.frustumCulled=false;scene.add(pts);
  return{pts,g,pos,col,n,additive,life:new Float32Array(n),max:new Float32Array(n),vel:new Float32Array(n*3),c0:new Float32Array(n*3),next:0,live:0,
    emit(x,y,z,vx,vy,vz,r,gg,b,life){const i=this.next;this.next=(i+1)%this.n;const k=i*3;this.pos[k]=x;this.pos[k+1]=y;this.pos[k+2]=z;this.vel[k]=vx;this.vel[k+1]=vy;this.vel[k+2]=vz;this.c0[k]=r;this.c0[k+1]=gg;this.c0[k+2]=b;this.col[k]=r;this.col[k+1]=gg;this.col[k+2]=b;this.life[i]=life;this.max[i]=life;this.live=1;},
    update(dt,grav){if(!this.live)return;let any=0;for(let i=0;i<this.n;i++){if(this.life[i]<=0)continue;this.life[i]-=dt;const k=i*3;if(this.life[i]<=0){this.pos[k+1]=-999;continue;}any=1;
      this.vel[k+1]-=grav*dt;this.pos[k]+=this.vel[k]*dt;this.pos[k+1]+=this.vel[k+1]*dt;this.pos[k+2]+=this.vel[k+2]*dt;if(this.pos[k+1]<0.05){this.pos[k+1]=0.05;this.vel[k+1]*=-0.3;}
      if(this.additive){const f=this.life[i]/this.max[i];this.col[k]=this.c0[k]*f;this.col[k+1]=this.c0[k+1]*f;this.col[k+2]=this.c0[k+2]*f;}}
      this.live=any;this.g.attributes.position.needsUpdate=true;this.g.attributes.color.needsUpdate=true;}};
}
/* ---------- the race ---------- */
async function startRace3D(cid){
  clearTimers();closeOverlay();showAnanseCorner(false);gpStop();
  GPA.init(); // this runs inside the tap on a circuit card, which is what iOS needs to allow sound
  const C=GP_CIRCUITS.find(c=>c.id===cid)||GP_CIRCUITS[0];
  app.innerHTML='<div class="fadein center" style="padding-top:20vh"><div class="ananse-wrap">'+ananseSVG(100,"idle")+'</div><h2 style="color:#fff">Warming up the engines…</h2><p class="muted" style="color:#c9e6ff">Loading the 3D circuit…</p></div>';
  try{await loadThree();}catch(e){toast("3D engine could not load — using the classic racer");startRace2D(cid==="palm"?"accra":(cid==="stadium"?"nebula":"skybridge"));return;}
  try{gpBuild(C);}catch(e){console.error(e);gpStop();toast("3D racer hit a problem — using the classic racer");startRace2D(cid==="palm"?"accra":(cid==="stadium"?"nebula":"skybridge"));}
}
function gpBuild(C){
  gpCss();R3_balloons.length=0;
  const me=gpRacer(),L=C.look;
  if(P&&typeof P.gpMute==="boolean")GPA.muted=P.gpMute;GPA.setMute(GPA.muted);
  app.innerHTML='<div class="fadein gp3-wrap v2" id="gp3">'
   +'<canvas id="gp3c"></canvas>'
   +'<div class="gp3-lines" id="gp3Lines"></div><div class="gp3-flash" id="gp3Flash"></div>'
   +'<div class="gp3-touch" id="gp3L"></div><div class="gp3-touch right" id="gp3R"></div>'
   +'<div class="gp3-hud gp3-tl"><div class="gp3-lap" id="gp3Lap">LAP 1/'+C.laps+'</div><div class="gp3-time" id="gp3Time">0:00.0</div></div>'
   +'<canvas class="gp3-map v2" id="gp3Map" width="150" height="110"></canvas>'
   +'<div class="gp3-pos" id="gp3Pos">5<small>th</small></div>'
   +'<div class="gp3-hud gp3-tr" id="gp3Board"></div>'
   +'<button class="gp3-quit" id="gp3Quit" aria-label="Quit race" onclick="renderCircuits()">✕</button>'
   +'<button class="gp3-mute" id="gp3Mute" aria-label="Sound on or off">'+(GPA.muted?"🔇":"🔊")+'</button>'
   +'<div class="gp3-hud gp3-bc"><div class="gp3-item" id="gp3Item">—</div><div class="gp3-speed" id="gp3Speed">0</div></div>'
   +'<div class="gp3-msg" id="gp3Msg"></div>'
   +'<div class="gp3-card" id="gp3Card"><b>'+esc(C.name)+'</b><small>'+esc(L.time)+' · '+C.laps+' laps · '+esc(me.n)+'</small></div>'
   +'<div class="gp3-count" id="gp3Count"></div>'
   +'<div class="gp3-pad l"><button class="race-btn" id="rcL" aria-label="Steer left">◀</button><button class="race-btn" id="rcR" aria-label="Steer right">▶</button></div>'
   +'<div class="gp3-pad r"><button class="race-btn small" id="rcB" aria-label="Brake">🛑</button><button class="race-btn drift" id="rcD" aria-label="Drift">DRIFT</button><button class="race-btn gp-fire" id="rcF" aria-label="Use item">⚡</button></div>'
   +'</div>'
   +'<div class="center" style="margin-top:8px"><button class="readbtn" onclick="renderCircuits()">⟵ Quit race</button></div>';
  const T=THREE,canvas=$("gp3c");
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  const pr0=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(pr0);
  if(T.sRGBEncoding)renderer.outputEncoding=T.sRGBEncoding;
  if(T.ACESFilmicToneMapping){renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;}
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():4);window._gpAniso=aniso;
  const scene=new T.Scene();scene.fog=new T.Fog(gpLin(L.fog),170,900);
  const camera=new T.PerspectiveCamera(60,16/9,0.5,1600);
  // lights
  const sunDir=new T.Vector3(L.dir[0],L.dir[1],L.dir[2]).normalize();
  const hemi=new T.HemisphereLight(gpLin(L.hor),gpLin(C.grass),L.hemi);scene.add(hemi);
  const sun=new T.DirectionalLight(gpLin(L.sun),L.sunI);sun.castShadow=true;
  const phone=Math.min(window.screen.width||999,window.screen.height||999,Math.max(innerWidth,innerHeight))<600||Math.min(innerWidth,innerHeight)<520;sun.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);const sc=sun.shadow.camera;sc.left=-48;sc.right=48;sc.top=48;sc.bottom=-48;sc.near=5;sc.far=400;sun.shadow.bias=-0.0005;if("normalBias" in sun.shadow)sun.shadow.normalBias=0.04;
  scene.add(sun);scene.add(sun.target);
  // sky dome: vertical gradient with a sun disc and glow
  const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new T.Color(L.top)},hor:{value:new T.Color(L.hor)},glow:{value:new T.Color(L.glow)},sunDir:{value:sunDir}},
    vertexShader:"varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:"uniform vec3 top;uniform vec3 hor;uniform vec3 glow;uniform vec3 sunDir;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.0,1.0);vec3 c=mix(hor,top,pow(h,0.5));float s=max(dot(d,sunDir),0.0);c+=glow*(smoothstep(0.9985,0.9993,s)*2.2+pow(s,60.0)*0.5+pow(s,6.0)*0.18);if(d.y<0.0)c=hor;gl_FragColor=vec4(c,1.0);}"});
  const sky=new T.Mesh(new T.SphereGeometry(1200,32,16),skyMat);sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);
  // sky reflections on the paint (environment map made from the sky)
  // sky reflections on the paint: a small painted panorama (sky over grass) turned into an environment map
  let envRT=null;try{const pm=new T.PMREMGenerator(renderer);
    const eq=gpCanvasTex(256,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,L.top);g.addColorStop(0.47,L.hor);g.addColorStop(0.5,L.hor);g.addColorStop(0.53,"#"+C.grass.toString(16).padStart(6,"0"));g.addColorStop(1,"#2a3a22");x.fillStyle=g;x.fillRect(0,0,w,h);
      const sx=((Math.atan2(sunDir.x,-sunDir.z)/(Math.PI*2))+0.5)*w,sy=(0.5-Math.asin(sunDir.y)/Math.PI)*h;const sg=x.createRadialGradient(sx,sy,0,sx,sy,22);sg.addColorStop(0,"rgba(255,255,240,1)");sg.addColorStop(1,"rgba(255,255,240,0)");x.fillStyle=sg;x.fillRect(0,0,w,h);});
    eq.mapping=T.EquirectangularReflectionMapping;envRT=pm.fromEquirectangular(eq);pm.dispose();eq.dispose();
    const tex=envRT&&envRT.texture;if(tex)scene.environment=tex;}catch(e){envRT=null;}
  // ground with mowing stripes
  const gh="#"+C.grass.toString(16).padStart(6,"0");
  const grassTex=gpCanvasTex(256,256,(x,w,h)=>{x.fillStyle=gh;x.fillRect(0,0,w,h);x.fillStyle="rgba(255,255,255,.07)";x.fillRect(0,0,w,h/2);for(let i=0;i<1400;i++){x.fillStyle=Math.random()<0.5?"rgba(0,0,0,.07)":"rgba(255,255,160,.06)";x.fillRect(Math.random()*w,Math.random()*h,2,3);}},true);grassTex.repeat.set(70,70);
  const ground=new T.Mesh(new T.PlaneGeometry(2400,2400),new T.MeshStandardMaterial({map:grassTex,roughness:1,metalness:0}));ground.rotation.x=-Math.PI/2;ground.position.y=-0.02;ground.receiveShadow=true;scene.add(ground);
  // track curve + road ribbons
  const curve=gpCurveFor(C);const M=700,W=7.5;const len=curve.getLength();
  const samples=[];for(let i=0;i<=M;i++){const t=i/M;const pos=curve.getPointAt(t%1);const tan=curve.getTangentAt(t%1).normalize();const nor=new T.Vector3(-tan.z,0,tan.x);samples.push({pos,tan,nor});}
  const ribbon=(inner,outer,mat,y,vScale)=>{const g=new T.BufferGeometry();const v=[],uv=[],idx=[];for(let i=0;i<=M;i++){const s=samples[i];const a=s.pos.clone().addScaledVector(s.nor,inner),b=s.pos.clone().addScaledVector(s.nor,outer);v.push(a.x,y,a.z,b.x,y,b.z);uv.push(0,i*vScale,1,i*vScale);if(i<M){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.receiveShadow=true;return m;};
  const wall=(off,hgt,mat,vScale,flip)=>{const g=new T.BufferGeometry();const v=[],uv=[],idx=[];for(let i=0;i<=M;i++){const s=samples[i];const a=s.pos.clone().addScaledVector(s.nor,off);v.push(a.x,0,a.z,a.x,hgt,a.z);const u=(flip?-1:1)*i*vScale;uv.push(u,0,u,1);if(i<M){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;return m;};
  const roadTex=gpCanvasTex(512,512,(x,w,h)=>{x.fillStyle="#4a4d56";x.fillRect(0,0,w,h);for(let i=0;i<7000;i++){const v=55+Math.random()*60|0;x.fillStyle="rgba("+v+","+v+","+(v+5)+",.55)";x.fillRect(Math.random()*w,Math.random()*h,2,2);}
    const gr=x.createLinearGradient(0,0,w,0);[[0,0],[.26,.2],[.4,0],[.6,0],[.74,.2],[1,0]].forEach(s=>gr.addColorStop(s[0],"rgba(10,10,14,"+s[1]+")"));x.fillStyle=gr;x.fillRect(0,0,w,h);
    x.fillStyle="#efefef";x.fillRect(8,0,12,h);x.fillRect(w-20,0,12,h);x.fillStyle="#f6c343";x.fillRect(w/2-5,0,10,h*0.5);},true);
  const rumbleTex=gpCanvasTex(64,128,(x,w,h)=>{x.fillStyle="#f5f5f5";x.fillRect(0,0,w,h);x.fillStyle="#e0412f";x.fillRect(0,0,w,h/2);x.fillStyle="rgba(0,0,0,.12)";x.fillRect(0,h/2-3,w,3);x.fillRect(0,h-3,w,3);},true);
  const vRoad=(len/M)/(2*W);
  scene.add(ribbon(-W,W,new T.MeshStandardMaterial({map:roadTex,roughness:0.82,metalness:0}),0.02,vRoad));
  const rumMat=new T.MeshStandardMaterial({map:rumbleTex,roughness:0.6});scene.add(ribbon(-W-1.4,-W,rumMat,0.04,0.5));scene.add(ribbon(W,W+1.4,rumMat,0.04,0.5));
  // run-off strip + advertising walls on both sides
  const sandTex=gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle="#d9c08a";x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=Math.random()<0.5?"rgba(120,90,40,.15)":"rgba(255,255,255,.12)";x.fillRect(Math.random()*w,Math.random()*h,2,2);}},true);
  const sandMat=new T.MeshStandardMaterial({map:sandTex,roughness:1});scene.add(ribbon(-W-3.3,-W-1.4,sandMat,0.01,0.3));scene.add(ribbon(W+1.4,W+3.3,sandMat,0.01,0.3));
  const adTex=gpCanvasTex(1024,64,(x,w,h)=>{const ads=[["GRAND FABLE GP","#c62828","#fff"],["ANANSE LEARNING","#0b1f5c","#ffd166"],["READ • THINK • WIN","#1b8f5e","#fff"],["SPEED GT","#111","#ff5a1f"]];ads.forEach((a,i)=>{x.fillStyle=a[1];x.fillRect(i*w/4,0,w/4,h);x.fillStyle=a[2];x.font="900 30px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText(a[0],i*w/4+w/8,h/2+2);});x.fillStyle="rgba(255,255,255,.8)";x.fillRect(0,0,w,4);},true);
  const adMat=new T.MeshStandardMaterial({map:adTex,roughness:0.55,side:T.DoubleSide});
  scene.add(wall(-(W+3.4),1.1,adMat,len/M/28,false));scene.add(wall(W+3.4,1.1,adMat,len/M/28,true));
  // start arch
  const s0=samples[0];const archMat=new T.MeshStandardMaterial({color:0xd94141,roughness:0.45,metalness:0.2});
  [-1,1].forEach(side=>{const py=new T.Mesh(new T.BoxGeometry(1.2,9,1.2),archMat);const p=s0.pos.clone().addScaledVector(s0.nor,side*(W+2));py.position.set(p.x,4.5,p.z);py.castShadow=true;scene.add(py);
    const flag=new T.Mesh(new T.PlaneGeometry(2.4,1.6),new T.MeshBasicMaterial({map:gpCanvasTex(64,48,(x,w,h)=>{for(let i=0;i<8;i++)for(let j=0;j<6;j++){x.fillStyle=(i+j)%2?"#111":"#fff";x.fillRect(i*8,j*8,8,8);}}),side:T.DoubleSide}));flag.position.set(p.x+s0.tan.x*0.2,10.2,p.z+s0.tan.z*0.2);flag.lookAt(flag.position.clone().add(s0.nor));scene.add(flag);});
  const beam=new T.Mesh(new T.BoxGeometry((W+2)*2+1.2,2.6,1.4),new T.MeshStandardMaterial({map:gpTextTex("GRAND FABLE GP","#c62828","#fff",1024,160,96),roughness:0.5}));beam.position.set(s0.pos.x,8.6,s0.pos.z);beam.lookAt(beam.position.clone().add(s0.tan));beam.castShadow=true;scene.add(beam);
  const screen=new T.Mesh(new T.BoxGeometry(5,3,0.6),new T.MeshBasicMaterial({map:gpTextTex("LAP 1","#0b1f5c","#7cf",512,300,120)}));screen.position.set(s0.pos.x,12.2,s0.pos.z);screen.lookAt(screen.position.clone().add(s0.tan));scene.add(screen);R3s_screen=screen;
  // start/finish checker line painted on the road
  const chk=new T.Mesh(new T.PlaneGeometry(2*W,1.6),new T.MeshStandardMaterial({map:gpCanvasTex(256,32,(x,w,h)=>{for(let i=0;i<32;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?"#111":"#f4f4f4";x.fillRect(i*8,j*8,8,8);}}),roughness:0.8}));
  chk.rotation.x=-Math.PI/2;chk.position.set(s0.pos.x,0.03,s0.pos.z);chk.rotation.z=-Math.atan2(s0.tan.x,s0.tan.z)+Math.PI/2;chk.receiveShadow=true;scene.add(chk);
  // grandstands with spectators
  const specGeo=new T.SphereGeometry(0.42,8,6),specMat=new T.MeshStandardMaterial({color:0xffffff,roughness:0.8});
  const standRanges=[[M-40,M],[0,45],[Math.floor(M*0.48),Math.floor(M*0.48)+50]];
  let specCount=0;standRanges.forEach(([a,b])=>specCount+=Math.floor((b-a)/2)*2*4+8);
  const spec=new T.InstancedMesh(specGeo,specMat,specCount);let si=0;const dummy=new T.Object3D();const palette=[0xff4d6d,0xffd166,0x4dd2ff,0x39e6a0,0xb06bff,0xffffff,0xff8c42];
  const standMat=new T.MeshStandardMaterial({color:0x8d99ae,roughness:0.7}),roofMat=new T.MeshStandardMaterial({color:0xd94141,roughness:0.5});
  standRanges.forEach(([a,b])=>{[-1,1].forEach(side=>{const sa=samples[a],sb=samples[b];const mid=sa.pos.clone().add(sb.pos).multiplyScalar(0.5);const dir=sb.pos.clone().sub(sa.pos);const Ln=dir.length();dir.normalize();const nor=new T.Vector3(-dir.z,0,dir.x);
    const stand=new T.Mesh(new T.BoxGeometry(Ln,5,7),standMat);const sp=mid.clone().addScaledVector(nor,side*(W+8));stand.position.set(sp.x,2.5,sp.z);stand.lookAt(stand.position.clone().add(dir));stand.castShadow=true;stand.receiveShadow=true;scene.add(stand);
    const roof=new T.Mesh(new T.BoxGeometry(Ln+2,0.4,8),roofMat);roof.position.set(sp.x,7,sp.z);roof.lookAt(roof.position.clone().add(dir));roof.castShadow=true;scene.add(roof);
    for(let i=a;i<b;i+=2)for(let tier=0;tier<4;tier++){if(si>=specCount)break;const s=samples[i];const p=s.pos.clone().addScaledVector(nor,side*(W+5.5+tier*1.3));dummy.position.set(p.x,3.2+tier*0.8,p.z);dummy.updateMatrix();spec.setMatrixAt(si,dummy.matrix);spec.setColorAt(si,gpLin(palette[(i+tier)%palette.length]));si++;}
  });});
  spec.count=si;spec.instanceMatrix.needsUpdate=true;if(spec.instanceColor)spec.instanceColor.needsUpdate=true;spec.castShadow=true;scene.add(spec);
  // cones
  const coneGeo=new T.ConeGeometry(0.5,1.3,10),coneMat=new T.MeshStandardMaterial({color:0xff7f11,roughness:0.5});const cones=[];
  for(let i=10;i<M;i+=14){const s=samples[i];const side=(i/14)%2?1:-1;const p=s.pos.clone().addScaledVector(s.nor,side*(W+2.9));cones.push(p);}
  const coneIM=new T.InstancedMesh(coneGeo,coneMat,cones.length);cones.forEach((p,i)=>{dummy.position.set(p.x,0.65,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();coneIM.setMatrixAt(i,dummy.matrix);});coneIM.castShadow=true;scene.add(coneIM);
  // tyre stacks on the outside of every bend
  const tyres=[];for(let i=0;i<M;i+=5){const a=samples[i],b=samples[(i+6)%M];const turn=b.tan.clone().sub(a.tan);if(turn.length()<0.03)continue;const side=turn.dot(a.nor)>0?-1:1;if(standRanges.some(([p,q])=>i>=p-4&&i<=q+4))continue;
    const p=a.pos.clone().addScaledVector(a.nor,side*(W+4.1));for(let h=0;h<3;h++)tyres.push([p.x,0.22+h*0.42,p.z,h]);}
  if(tyres.length){const tIM=new T.InstancedMesh(new T.TorusGeometry(0.5,0.22,8,16),new T.MeshStandardMaterial({color:0xffffff,roughness:0.9}),tyres.length);
    tyres.forEach((t,i)=>{dummy.position.set(t[0],t[1],t[2]);dummy.rotation.set(Math.PI/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();tIM.setMatrixAt(i,dummy.matrix);tIM.setColorAt(i,gpLin(t[3]===1?0xd94141:0x1b1b1f));});
    if(tIM.instanceColor)tIM.instanceColor.needsUpdate=true;tIM.castShadow=true;tIM.receiveShadow=true;scene.add(tIM);}
  // trees (instanced so hundreds cost almost nothing)
  const spots=[];for(let i=0;i<M;i+=6){if(standRanges.some(([a,b])=>i>=a-6&&i<=b+6))continue;const s=samples[i];for(let r=0;r<2;r++){if(r&&Math.random()<0.5)continue;const side=Math.random()<0.5?-1:1;const p=s.pos.clone().addScaledVector(s.nor,side*(W+10+r*14+Math.random()*14));spots.push([p.x,p.z,0.8+Math.random()*0.5,Math.random()*6.28]);}}
  const trunkMat=new T.MeshStandardMaterial({color:0x8d5a2b,roughness:0.9});const UP=new T.Vector3(0,1,0);
  if(C.tree==="palm"){
    const trunkGeo=new T.CylinderGeometry(0.28,0.48,7,7);trunkGeo.translate(0,3.5,0);
    const trIM=new T.InstancedMesh(trunkGeo,trunkMat,spots.length);const frGeo=new T.ConeGeometry(0.9,4.4,4);const frIM=new T.InstancedMesh(frGeo,new T.MeshStandardMaterial({color:0xffffff,roughness:0.8,side:T.DoubleSide}),spots.length*7);let fi=0;
    spots.forEach((s,i)=>{const lean=(Math.random()-0.5)*0.2,lean2=(Math.random()-0.5)*0.2;dummy.position.set(s[0],0,s[1]);dummy.rotation.set(lean,0,lean2);dummy.scale.set(s[2],s[2],s[2]);dummy.updateMatrix();trIM.setMatrixAt(i,dummy.matrix);
      const topv=new T.Vector3(0,7*s[2],0).applyEuler(new T.Euler(lean,0,lean2));for(let f=0;f<7;f++){const a=s[3]+f*Math.PI*2/7;const d=new T.Vector3(Math.cos(a),-0.3-Math.random()*0.2,Math.sin(a)).normalize();
        dummy.position.set(s[0]+topv.x+d.x*2*s[2],topv.y+d.y*2*s[2],s[1]+topv.z+d.z*2*s[2]);dummy.quaternion.setFromUnitVectors(UP,d);dummy.scale.set(s[2],s[2],s[2]*0.3);dummy.updateMatrix();frIM.setMatrixAt(fi,dummy.matrix);frIM.setColorAt(fi,gpLin([0x2e9e57,0x3cb371,0x27884a][f%3]));fi++;}
      dummy.quaternion.identity();});
    frIM.count=fi;if(frIM.instanceColor)frIM.instanceColor.needsUpdate=true;trIM.castShadow=true;frIM.castShadow=true;scene.add(trIM);scene.add(frIM);
  }else{
    const trunkGeo=new T.CylinderGeometry(0.35,0.6,3.2,7);trunkGeo.translate(0,1.6,0);const crownGeo=new T.IcosahedronGeometry(2.6,1);
    const trIM=new T.InstancedMesh(trunkGeo,trunkMat,spots.length);const crIM=new T.InstancedMesh(crownGeo,new T.MeshStandardMaterial({color:0xffffff,roughness:0.85,flatShading:true}),spots.length*2);let ci=0;
    spots.forEach((s,i)=>{dummy.rotation.set(0,s[3],0);dummy.position.set(s[0],0,s[1]);dummy.scale.set(s[2],s[2],s[2]);dummy.updateMatrix();trIM.setMatrixAt(i,dummy.matrix);
      [[0,4.6,0,1],[1.3,5.8,0.5,0.7]].forEach(c=>{dummy.position.set(s[0]+c[0]*s[2],c[1]*s[2],s[1]+c[2]*s[2]);dummy.scale.set(s[2]*c[3],s[2]*c[3]*0.9,s[2]*c[3]);dummy.updateMatrix();crIM.setMatrixAt(ci,dummy.matrix);crIM.setColorAt(ci,gpLin([0x2e8b57,0x3a9d4f,0x4c8f3a,0x2f7a45][(i+ci)%4]));ci++;});});
    if(crIM.instanceColor)crIM.instanceColor.needsUpdate=true;trIM.castShadow=true;crIM.castShadow=true;scene.add(trIM);scene.add(crIM);
  }
  // distant hills around the circuit
  let cx=0,cz=0;C.pts.forEach(p=>{cx+=p[0];cz+=p[1];});cx/=C.pts.length;cz/=C.pts.length;
  const hillMat=new T.MeshStandardMaterial({color:new T.Color(L.hill),roughness:1,flatShading:true});
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+Math.random()*0.3,r=520+Math.random()*160;const h=new T.Mesh(new T.IcosahedronGeometry(1,2),hillMat);h.position.set(cx+Math.cos(a)*r,-10,cz+Math.sin(a)*r);h.scale.set(110+Math.random()*90,40+Math.random()*50,110+Math.random()*90);scene.add(h);}
  // balloons and clouds
  for(let i=0;i<10;i++){const s=samples[Math.floor(Math.random()*M)];const p=s.pos.clone().addScaledVector(s.nor,(Math.random()<0.5?-1:1)*(W+4));const b=new T.Mesh(new T.SphereGeometry(1,14,10),new T.MeshStandardMaterial({color:palette[i%palette.length],roughness:0.25,metalness:0.1}));b.position.set(p.x,6+Math.random()*3,p.z);b.userData.bob=Math.random()*6;scene.add(b);R3_balloons.push(b);}
  const cloudTex=gpCanvasTex(128,64,(x,w,h)=>{x.fillStyle="rgba(255,255,255,.95)";[[30,40,22],[60,30,26],[92,40,20],[50,44,18],[75,46,18]].forEach(c=>{x.beginPath();x.arc(c[0],c[1],c[2],0,7);x.fill();});});
  for(let i=0;i<16;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:cloudTex,transparent:true,fog:false,opacity:0.9}));sp.scale.set(60,30,1);sp.position.set(cx+(Math.random()-0.5)*1200,90+Math.random()*60,cz+(Math.random()-0.5)*1200);scene.add(sp);}
  // item boxes + bananas
  const boxTex=gpCanvasTex(128,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);["#ff4d6d","#ffd166","#39e6a0","#4dd2ff","#b06bff"].forEach((c,i)=>g.addColorStop(i/4,c));x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle="rgba(255,255,255,.9)";x.lineWidth=8;x.strokeRect(4,4,w-8,h-8);x.fillStyle="#fff";x.font="900 90px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText("?",64,68);});
  const boxMat=new T.MeshStandardMaterial({map:boxTex,transparent:true,opacity:0.9,roughness:0.2,metalness:0.1,emissive:0x222222});const boxGeo=new T.BoxGeometry(1.5,1.5,1.5);const items=[];
  for(let i=30;i<M;i+=48){for(let l=-1;l<=1;l++){const it={t:(i/M+Math.random()*0.01)%1,x:l*0.55,kind:"box",alive:true,mesh:new T.Mesh(boxGeo,boxMat)};it.mesh.castShadow=true;scene.add(it.mesh);items.push(it);}}
  const bananaTex=gpCanvasTex(64,64,(x,w,h)=>{x.font="52px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText("🍌",32,36);});
  const mkBanana=(t,x)=>{const sp=new T.Sprite(new T.SpriteMaterial({map:bananaTex,transparent:true}));sp.scale.set(2,2,1);scene.add(sp);return{t,x,kind:"banana",alive:true,mesh:sp};};
  for(let i=70;i<M;i+=120)items.push(mkBanana(i/M,(Math.floor(Math.random()*3)-1)*0.55));
  // cars — the Speed GT: low wide body, glass cabin, driver in helmet, spinning wheels on steering hubs
  const tyreMat=new T.MeshStandardMaterial({color:0x121214,roughness:0.9}),rimMat=new T.MeshStandardMaterial({color:0xd6dbe3,roughness:0.2,metalness:0.9}),spokeMat=new T.MeshStandardMaterial({color:0x2a2d36,roughness:0.4,metalness:0.6});
  const dark=new T.MeshStandardMaterial({color:0x15171d,roughness:0.6,metalness:0.2}),glass=new T.MeshStandardMaterial({color:0x0f1a28,roughness:0.05,metalness:0.9,transparent:true,opacity:0.8});
  const wingMat=new T.MeshStandardMaterial({color:0x22252e,roughness:0.35,metalness:0.5}),tailMat=new T.MeshBasicMaterial({color:0xff2a2a}),lampMat=new T.MeshBasicMaterial({color:0xfff6d5}),chrome=new T.MeshStandardMaterial({color:0xaaaaaa,roughness:0.2,metalness:1});
  const stripeMat=new T.MeshStandardMaterial({color:0xffffff,roughness:0.3,metalness:0.3});
  const mkCar=(r,paint,num)=>{const g=new T.Group(),b=new T.Group();g.add(b);
    const body=new T.MeshStandardMaterial({color:paint,roughness:0.25,metalness:0.55});
    const add=(geo,mat,x,y,z,rx,ry,rz,par)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;m.castShadow=true;(par||b).add(m);return m;};
    add(new T.BoxGeometry(2.2,0.32,4.5),dark,0,0.42,0);                         // chassis
    add(new T.BoxGeometry(2.3,0.08,0.7),dark,0,0.3,2.25);                       // front splitter
    add(new T.BoxGeometry(2.15,0.5,4.4),body,0,0.78,0);                         // lower body
    add(new T.BoxGeometry(0.12,0.18,3.0),dark,-1.1,0.5,0);add(new T.BoxGeometry(0.12,0.18,3.0),dark,1.1,0.5,0); // side skirts
    add(new T.BoxGeometry(2.0,0.22,1.7),body,0,1.06,1.45,-0.1);                 // hood
    add(new T.BoxGeometry(0.34,0.24,1.72),stripeMat,0,1.075,1.45,-0.1);          // racing stripe on hood
    add(new T.BoxGeometry(1.75,0.55,2.1),glass,0,1.32,-0.15);                   // cabin glass
    add(new T.BoxGeometry(1.62,0.1,1.25),body,0,1.62,-0.3);                     // roof
    add(new T.BoxGeometry(0.34,0.11,1.27),stripeMat,0,1.63,-0.3);                // stripe on roof
    add(new T.BoxGeometry(1.7,0.55,0.12),glass,0,1.3,0.98,-0.75);               // windshield
    add(new T.BoxGeometry(1.6,0.5,0.12),glass,0,1.28,-1.28,0.7);                // rear glass
    add(new T.BoxGeometry(2.15,0.38,1.5),body,0,1.0,-1.6);                      // rear deck
    add(new T.BoxGeometry(0.18,0.34,1.1),dark,-1.1,0.9,-0.55);add(new T.BoxGeometry(0.18,0.34,1.1),dark,1.1,0.9,-0.55); // side intakes
    add(new T.BoxGeometry(2.3,0.08,0.55),wingMat,0,1.5,-2.15);                  // rear wing
    add(new T.BoxGeometry(0.08,0.5,0.6),body,-1.12,1.4,-2.15);add(new T.BoxGeometry(0.08,0.5,0.6),body,1.12,1.4,-2.15); // wing end plates
    add(new T.BoxGeometry(0.08,0.42,0.3),dark,-0.75,1.25,-2.1);add(new T.BoxGeometry(0.08,0.42,0.3),dark,0.75,1.25,-2.1); // struts
    for(let f=-2;f<=2;f++)add(new T.BoxGeometry(0.05,0.22,0.4),dark,f*0.35,0.42,-2.2); // diffuser fins
    add(new T.BoxGeometry(0.75,0.12,0.06),tailMat,-0.62,1.02,-2.36);add(new T.BoxGeometry(0.75,0.12,0.06),tailMat,0.62,1.02,-2.36);
    add(new T.BoxGeometry(0.5,0.14,0.06),lampMat,-0.72,0.98,2.23);add(new T.BoxGeometry(0.5,0.14,0.06),lampMat,0.72,0.98,2.23);
    add(new T.CylinderGeometry(0.11,0.11,0.32,10),chrome,-0.35,0.55,-2.3,Math.PI/2);add(new T.CylinderGeometry(0.11,0.11,0.32,10),chrome,0.35,0.55,-2.3,Math.PI/2);
    const plate=add(new T.PlaneGeometry(0.8,0.24),new T.MeshBasicMaterial({map:gpTextTex("SPEED GT","#f4f4f4","#111",256,80,52)}),0,0.72,-2.37);plate.rotation.y=Math.PI;plate.castShadow=false;
    const numTex=gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle="#fff";x.beginPath();x.arc(64,64,60,0,7);x.fill();x.fillStyle="#111";x.font="900 84px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText(String(num),64,70);});
    const numMat=new T.MeshStandardMaterial({map:numTex,transparent:true,roughness:0.4});
    const n1=add(new T.PlaneGeometry(0.62,0.62),numMat,1.081,0.8,0.35);n1.rotation.y=Math.PI/2;n1.castShadow=false;const n2=add(new T.PlaneGeometry(0.62,0.62),numMat,-1.081,0.8,0.35);n2.rotation.y=-Math.PI/2;n2.castShadow=false;
    // driver: helmet in racer colour with the animal face peeking out
    const helmet=add(new T.SphereGeometry(0.36,16,12),new T.MeshStandardMaterial({color:r.helmet,roughness:0.2,metalness:0.4}),-0.35,1.3,-0.18);
    const head=new T.Mesh(new T.SphereGeometry(0.28,14,10),new T.MeshBasicMaterial({map:gpFaceTex(r.e)}));head.position.set(-0.35,1.28,-0.02);head.rotation.y=Math.PI;b.add(head);
    const wheel=add(new T.TorusGeometry(0.17,0.035,6,14),dark,-0.35,1.12,0.35,-0.5);
    // wheels on hubs: front hubs steer, every wheel spins
    const wheels=[],steers=[];
    [[-1.02,0.48,1.45,0.46],[1.02,0.48,1.45,0.46],[-1.05,0.5,-1.4,0.5],[1.05,0.5,-1.4,0.5]].forEach(([x,y,z,rad])=>{const hub=new T.Group();hub.position.set(x,y,z);g.add(hub);const w=new T.Group();hub.add(w);
      const ty=new T.Mesh(new T.CylinderGeometry(rad,rad,0.42,20),tyreMat);ty.rotation.z=Math.PI/2;ty.castShadow=true;w.add(ty);
      const rm=new T.Mesh(new T.CylinderGeometry(rad*0.64,rad*0.64,0.44,14),rimMat);rm.rotation.z=Math.PI/2;w.add(rm);
      w.add(new T.Mesh(new T.BoxGeometry(0.46,rad*1.15,0.08),spokeMat));w.add(new T.Mesh(new T.BoxGeometry(0.46,0.08,rad*1.15),spokeMat));
      w.userData.rad=rad;wheels.push(w);if(z>0)steers.push(hub);});
    const shield=new T.Mesh(new T.SphereGeometry(2.9,20,14),new T.MeshBasicMaterial({color:gpLin(0x4dd2ff),transparent:true,opacity:0.25,depthWrite:false}));shield.material.userData.lin=1;shield.position.y=1;shield.visible=false;g.add(shield);
    const flame=new T.Sprite(new T.SpriteMaterial({map:gpCanvasTex(64,64,(x)=>{x.font="52px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText("🔥",32,36);}),transparent:true,depthWrite:false}));flame.scale.set(1.6,1.6,1);flame.position.set(0,0.7,-2.9);flame.visible=false;g.add(flame);
    // soft blob shadow under the car (keeps it grounded even when real shadows are switched off)
    const blob=new T.Mesh(new T.PlaneGeometry(3.2,5.6),new T.MeshBasicMaterial({map:gpSoftDot(),color:0x000000,transparent:true,opacity:0.35,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=0.06;g.add(blob);
    scene.add(g);return{g,body:b,wheels,steers,shieldMesh:shield,flameMesh:flame};};
  const karts=[];GP_RACERS.forEach((r,i)=>{const isMe=r.id===me.id;const m=mkCar(r,isMe?0xff5a1f:r.c,i+1);
    karts.push({racer:r,player:isMe,...m,t:0,x:0,px:0,speed:0,max:36+r.speed*3,accel:9+r.accel*2.2,steer:1.4+r.handle*0.28,lap:0,spin:0,boost:0,shield:0,item:null,fireIn:8+Math.random()*8,wobble:Math.random()*7,boxes:0,pos:new T.Vector3(),
      drift:0,charge:0,hop:0,roll:0,pitch:0,steerVis:0,yaw:null,lastSpeed:0});});
  let gi=0;karts.forEach(k=>{if(k.player){k.t=(M-6)/M;k.x=0;}else{k.t=(M-2-gi*3)/M%1;k.x=gi%2?0.5:-0.5;gi++;}k.px=k.x;});
  // particles
  const sparks=gpParticles(T,scene,320,0.95,true),flames=gpParticles(T,scene,240,1.25,true),dust=gpParticles(T,scene,160,1.6,false,0.55);
  // convert every plain colour from sRGB to linear once, so colours look right with the sRGB output + tone mapping
  const seen=new Set();scene.traverse(o=>{if(o===sky)return;const ms=Array.isArray(o.material)?o.material:(o.material?[o.material]:[]);ms.forEach(m=>{if(!m||seen.has(m)||m.isShaderMaterial||m.isPointsMaterial)return;seen.add(m);if(m.userData.lin)return;m.userData.lin=1;
    if(m.color&&!(o.isInstancedMesh&&o.instanceColor)&&!m.map)m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();});});
  R3={T,C,me,renderer,scene,camera,curve,samples,M,W,len,items,karts,shots:[],mkBanana,keys:{},touchDir:0,brake:false,drift:false,t0:performance.now(),time:0,countdown:3.5,lastN:null,done:false,raf:null,last:performance.now(),camPos:new T.Vector3(),msgT:0,place:5,board:[],
    sun,sky,sunOff:sunDir.clone().multiplyScalar(160),envRT,sparks,flames,dust,shake:0,fov:60,aniso,pr:pr0,fpsT:0,fpsN:0,fps:0,lowT:0,shadowsOn:true,tmpV:new T.Vector3(),tmpV2:new T.Vector3()};
  window.__gp={fps:0,pr:pr0,shadows:true};
  // keyboard
  R3.kd=e=>{if(!R3)return;const k=e.key.toLowerCase();GPA.init();if(k==="escape"){renderCircuits();return;}if(k===" "||k==="arrowup"){gpUseItem(R3.karts.find(x=>x.player));e.preventDefault();return;}if(k==="m"){gpToggleMute();return;}R3.keys[k]=true;if(["arrowleft","arrowright","arrowdown","shift"].includes(k))e.preventDefault();};
  R3.ku=e=>{if(!R3)return;R3.keys[e.key.toLowerCase()]=false;};
  window.addEventListener("keydown",R3.kd);window.addEventListener("keyup",R3.ku);
  // touch: hold-to-steer pads, drift, brake, item
  const hold=(id,dir)=>{const b=$(id);if(!b)return;const on=ev=>{ev.preventDefault();GPA.init();if(!R3)return;b.classList.add("on");if(dir==="b")R3.brake=true;else if(dir==="d")R3.drift=true;else R3.touchDir=dir;};
    const off=ev=>{b.classList.remove("on");if(!R3)return;if(dir==="b")R3.brake=false;else if(dir==="d")R3.drift=false;else if(R3.touchDir===dir)R3.touchDir=0;};
    ["pointerdown","touchstart"].forEach(t=>b.addEventListener(t,on,{passive:false}));["pointerup","pointerleave","pointercancel","touchend","touchcancel"].forEach(t=>b.addEventListener(t,off));
    b.addEventListener("contextmenu",ev=>ev.preventDefault());};
  hold("rcL",-1);hold("rcR",1);hold("rcB","b");hold("rcD","d");hold("gp3L",-1);hold("gp3R",1);
  const fire=$("rcF");const fireOn=ev=>{ev.preventDefault();GPA.init();fire.classList.add("on");if(R3)gpUseItem(R3.karts.find(x=>x.player));};
  fire.addEventListener("pointerdown",fireOn,{passive:false});["pointerup","pointerleave","pointercancel"].forEach(t=>fire.addEventListener(t,()=>fire.classList.remove("on")));
  $("gp3Mute").addEventListener("click",ev=>{ev.preventDefault();gpToggleMute();});
  // no page scrolling, pinch zoom or double-tap zoom while racing
  R3.blockTouch=ev=>{if(R3&&!R3.done&&ev.cancelable)ev.preventDefault();};
  document.addEventListener("touchmove",R3.blockTouch,{passive:false});document.addEventListener("gesturestart",R3.blockTouch,{passive:false});
  R3.onVis=()=>{if(!GPA.ctx)return;if(document.hidden)GPA.ctx.suspend();else GPA.ctx.resume();};document.addEventListener("visibilitychange",R3.onVis);
  const wrapEl=$("gp3");
  R3.onResize=()=>{if(!R3)return;const w=wrapEl.clientWidth||720,h=wrapEl.clientHeight||Math.round(w*9/16);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  R3.onOrient=()=>{[150,400,900].forEach(ms=>setTimeout(()=>{if(R3)R3.onResize();},ms));};window.addEventListener("resize",R3.onResize);window.addEventListener("orientationchange",R3.onOrient);R3.onResize();
  setTimeout(()=>{const c=$("gp3Card");if(c)c.classList.add("hide");},3500);
  GPA.startEngine();
  say("Grand Fable GP at "+C.name+". Three, two, one, go!");
  R3.raf=requestAnimationFrame(gpFrame);
  setTimeout(gpEnvCheck,1200);
}
/* safety net: if the reflection map ever blacks out the scene on some device, switch it off */
function gpEnvCheck(){try{if(!R3||!R3.scene.environment)return;R3.renderer.render(R3.scene,R3.camera);const c=R3.renderer.domElement,o=document.createElement("canvas");o.width=64;o.height=36;const x=o.getContext("2d");x.drawImage(c,0,0,64,36);const d=x.getImageData(0,27,64,9).data;let sum=0;for(let i=0;i<d.length;i+=4)sum+=d[i]+d[i+1]+d[i+2];if(sum/(d.length/4)<25){R3.scene.environment=null;window.__gp.envOff=true;}}catch(e){}}
let R3s_screen=null;const R3_balloons=[];
function gpToggleMute(){GPA.init();GPA.setMute(!GPA.muted);if(P){P.gpMute=GPA.muted;save();}const b=$("gp3Mute");if(b)b.textContent=GPA.muted?"🔇":"🔊";}
function gpMsg(m){if(!R3)return;const e=$("gp3Msg");if(e){e.textContent=m;e.classList.add("show");}R3.msgT=1.6;}
function gpFlash(){const f=$("gp3Flash");if(!f)return;f.style.transition="none";f.style.opacity="1";requestAnimationFrame(()=>{f.style.transition="opacity .5s";f.style.opacity="0";});}
function gpUseItem(k){
  if(!R3||R3.done||R3.countdown>0||!k||!k.item)return;const it=k.item;k.item=null;
  if(it==="rocket"){k.boost=3;if(k.player){GPA.play("whoosh");gpFlash();gpMsg("🚀 Rocket boost!");}}
  else if(it==="shield"){k.shield=8;if(k.player){GPA.play("shield");gpMsg("🛡️ Shield up!");}}
  else if(it==="banana"){R3.items.push(R3.mkBanana((k.t-0.012+1)%1,k.x));if(k.player){GPA.play("drop");gpMsg("🍌 Banana dropped!");}}
  else if(it==="orb"){const s=new R3.T.Mesh(new R3.T.SphereGeometry(0.7,16,12),new R3.T.MeshStandardMaterial({color:gpLin(0x4dd2ff),emissive:gpLin(0x1a6fa0),roughness:0.1,metalness:0.3}));R3.scene.add(s);R3.shots.push({t:k.t,x:k.x,speed:k.speed+30,from:k,life:5,mesh:s});if(k.player){GPA.play("fire");gpMsg("🌀 Homing orb away!");}}
  if(k.player)gpHudItem();
}
function gpHit(k,cause){
  if(k.shield>0){k.shield=0;if(k.player){GPA.play("shield");gpMsg("🛡️ Shield blocked it!");}return;}
  k.spin=1.2;k.boost=0;k.drift=0;k.charge=0;
  const p=k.pos;for(let i=0;i<24;i++){const a=Math.random()*6.28;R3.sparks.emit(p.x,1.2,p.z,Math.cos(a)*6,3+Math.random()*5,Math.sin(a)*6,1,0.85,0.25,0.6);}
  if(k.player){GPA.play("bonk");R3.shake=0.9;gpMsg(cause==="orb"?"🌀 Hit by an orb!":"🍌 Banana spin!");}
}
function gpHudItem(){const k=R3&&R3.karts.find(x=>x.player);const e=$("gp3Item");if(e&&k)e.innerHTML=k.item?GP_ITEMS[k.item].e+'<small>⚡ USE</small>':'—<small>ITEM</small>';}
function gpFrame(now){
  if(!R3)return;
  const raw=(now-R3.last)/1000;const dt=Math.min(0.05,raw);R3.last=now;
  // frame-rate watchdog: lower the resolution, then drop real shadows, if the iPad struggles
  R3.fpsT+=raw;R3.fpsN++;if(R3.fpsT>=2){R3.fps=R3.fpsN/R3.fpsT;R3.fpsT=0;R3.fpsN=0;window.__gp.fps=Math.round(R3.fps);
    if(R3.fps<45&&!document.hidden){R3.lowT++;if(R3.lowT>=2){R3.lowT=0;if(R3.pr>1){R3.pr=Math.max(1,R3.pr-0.25);R3.renderer.setPixelRatio(R3.pr);R3.onResize();}else if(R3.shadowsOn){R3.shadowsOn=false;R3.sun.castShadow=false;}}}else R3.lowT=0;
    window.__gp.pr=R3.pr;window.__gp.shadows=R3.shadowsOn;}
  if(R3.countdown>0){R3.countdown-=dt;const c=$("gp3Count");if(c){const n=Math.min(3,Math.ceil(R3.countdown-0.3));if(n!==R3.lastN){R3.lastN=n;GPA.play(n>0?"beep":"go");}c.textContent=n>0?String(n):"GO!";c.classList.add("show");if(R3.countdown<=0)setTimeout(()=>{const cc=$("gp3Count");if(cc)cc.classList.remove("show");},700);}}
  else if(!R3.done)R3.time=now-R3.t0-3500;
  gpUpdate(dt,R3.countdown>0);gpRender(dt);
  R3.raf=requestAnimationFrame(gpFrame);
}
function gpUpdate(dt,waiting){
  const {karts,samples,M,len,items,T}=R3;const me=karts.find(k=>k.player);
  const k=R3.keys;const left=k["arrowleft"]||k["a"]||R3.touchDir<0,right=k["arrowright"]||k["d"]||R3.touchDir>0,brake=k["arrowdown"]||k["s"]||R3.brake,driftBtn=k["shift"]||k["x"]||R3.drift;
  const V=R3.tmpV;
  karts.forEach(kt=>{
    const i=Math.floor(kt.t*M)%M;const s=samples[i],s2=samples[(i+4)%M];
    const curv=s.tan.clone().cross(s2.tan).y;
    const offroad=Math.abs(kt.x)>1.05;
    const maxNow=waiting?0:kt.max*(kt.boost>0?1.35:1)*(kt.spin>0?0.3:1)*(offroad?0.45:1);
    if(kt.player&&brake&&!waiting)kt.speed=Math.max(0,kt.speed-40*dt);else kt.speed+=(maxNow-kt.speed)*Math.min(1,dt*(kt.speed<maxNow?kt.accel/10:3));
    const spd=kt.speed/kt.max;kt.px=kt.x;
    if(kt.spin>0){kt.spin-=dt;kt.x+=Math.sin(kt.spin*18)*dt*0.6;}
    else if(kt.player&&!waiting){
      const inp=(left?-1:0)+(right?1:0);
      if(!kt.drift&&driftBtn&&inp!==0&&spd>0.45&&!offroad){kt.drift=inp;kt.charge=0;kt.off=0;kt.hop=0.28;GPA.play("hop");}
      if(kt.drift)kt.off=offroad?(kt.off||0)+dt:0;
      if(kt.drift&&(!driftBtn||(kt.off||0)>0.6||spd<0.3)){
        if(kt.charge>=1&&!offroad){const lv=kt.charge>=2.6?3:(kt.charge>=1.7?2:1);kt.boost=Math.max(kt.boost,[0,0.8,1.3,1.9][lv]);GPA.play("whoosh");gpFlash();gpMsg(["","💨 Mini turbo!","🔥 Super turbo!","🌈 ULTRA turbo!"][lv]);
          const p=kt.pos;for(let q=0;q<20;q++)R3.flames.emit(p.x,0.7,p.z,(Math.random()-0.5)*4,1+Math.random()*2,(Math.random()-0.5)*4,1,0.55,0.15,0.4);}
        kt.drift=0;kt.charge=0;}
      if(kt.drift){const same=inp===kt.drift,opp=inp===-kt.drift;if(!offroad)kt.charge+=dt*(same?1.35:(opp?0.6:1.0));kt.x+=kt.drift*dt*kt.steer*Math.max(.35,spd)*(same?0.5:(opp?-0.35:0.18));}
      else{if(left)kt.x-=dt*kt.steer*Math.max(.35,spd);if(right)kt.x+=dt*kt.steer*Math.max(.35,spd);}
    }
    else if(!kt.player){kt.wobble+=dt;const target=Math.sin(kt.wobble*0.5)*0.5;const ahead=karts.find(o=>o!==kt&&((o.t-kt.t+1)%1)<0.012&&Math.abs(o.x-kt.x)<0.35);kt.x+=((ahead?(kt.x<ahead.x?-0.7:0.7):target)-kt.x)*dt*(1.2+kt.racer.handle*0.2);
      kt.fireIn-=dt;if(kt.fireIn<=0&&!waiting&&!R3.done){kt.fireIn=10+Math.random()*10;if(!kt.item)kt.item=["orb","rocket","banana","shield"][Math.floor(Math.random()*4)];const gap=(me.t-kt.t+1)%1;if(kt.item==="orb"&&gap>0.005&&gap<0.12)gpUseItem(kt);else if(kt.item==="banana"&&gap>0.88)gpUseItem(kt);else if(kt.item==="rocket"||kt.item==="shield")gpUseItem(kt);}}
    kt.x-=curv*spd*dt*14*(kt.drift?0.4:1);
    kt.x=Math.max(-1.5,Math.min(1.5,kt.x));
    if(kt.boost>0)kt.boost-=dt;if(kt.shield>0)kt.shield-=dt;if(kt.hop>0)kt.hop-=dt;
    const before=kt.t;kt.t=(kt.t+kt.speed*dt/len)%1;
    if(!waiting&&kt.t<before&&before>0.5&&!kt.started){kt.started=true;}
    else if(!waiting&&kt.t<before&&before>0.5){kt.lap++;if(kt.player){if(kt.lap>=R3.C.laps&&!R3.done)gpFinish();else{GPA.play("lap");gpMsg(kt.lap+1===R3.C.laps?"🏁 Final lap!":"Lap "+(kt.lap+1)+"!");if(R3s_screen){const old=R3s_screen.material.map;R3s_screen.material.map=gpTextTex("LAP "+(kt.lap+1),"#0b1f5c","#7cf",512,300,120);if(old)old.dispose();}}}}
    // world position + orientation
    const pos=R3.curve.getPointAt(kt.t),tan=R3.curve.getTangentAt(kt.t).normalize(),nor=new T.Vector3(-tan.z,0,tan.x);
    pos.addScaledVector(nor,kt.x*(R3.W-1.2));kt.pos.copy(pos);
    kt.g.position.copy(pos);let y=0;if(offroad)y=Math.abs(Math.sin(kt.t*len*3))*0.12;if(kt.hop>0)y+=Math.sin(Math.PI*(1-kt.hop/0.28))*0.55;kt.g.position.y=y;
    kt.g.lookAt(pos.clone().add(tan));
    const yaw=Math.atan2(tan.x,tan.z);let yawRate=0;if(kt.yaw!==null){let d=yaw-kt.yaw;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;yawRate=d/Math.max(dt,0.001);}kt.yaw=yaw;
    const vx=(kt.x-kt.px)/Math.max(dt,0.001);
    const driftYaw=kt.drift?-kt.drift*0.38:0;
    kt.g.rotation.y+=(kt.spin>0?Math.sin(kt.spin*15)*0.9:0)+(-vx*0.1)+driftYaw;
    // body roll, pitch and steering wheels
    const rollT=Math.max(-0.13,Math.min(0.13,yawRate*0.22*spd-vx*0.05+(kt.drift?-kt.drift*0.06:0)));kt.roll+=(rollT-kt.roll)*Math.min(1,dt*8);
    const acc=(kt.speed-kt.lastSpeed)/Math.max(dt,0.001);kt.lastSpeed=kt.speed;const pitchT=Math.max(-0.06,Math.min(0.06,-acc*0.004));kt.pitch+=(pitchT-kt.pitch)*Math.min(1,dt*6);
    kt.body.rotation.z=kt.roll;kt.body.rotation.x=kt.pitch;
    const stT=Math.max(-0.5,Math.min(0.5,yawRate*0.35-vx*0.25+(kt.drift?kt.drift*0.3:0)));kt.steerVis+=(stT-kt.steerVis)*Math.min(1,dt*10);kt.steers.forEach(h=>h.rotation.y=kt.steerVis);
    kt.wheels.forEach(w=>w.rotation.x+=kt.speed*dt/w.userData.rad);
    kt.shieldMesh.visible=kt.shield>0;kt.flameMesh.visible=kt.boost>0;if(kt.boost>0){const f=1.3+Math.random()*0.6;kt.flameMesh.scale.set(f,f,1);}
    // effects: drift sparks, boost flames, grass dust (world positions of the rear wheels / exhausts)
    const near=kt.player||kt.pos.distanceToSquared(me.pos)<3600;
    if(near&&(kt.drift||kt.boost>0||(offroad&&spd>0.2))){kt.g.updateMatrixWorld(true);
      if(kt.drift){const c=kt.charge>=2.6?[0.55,0.1,1]:kt.charge>=1.7?[1,0.38,0.02]:kt.charge>=1?[0.1,0.45,1]:[0.5,0.5,0.4];[-1,1].forEach(sd=>{V.set(sd*1.05,0.1,-1.45);kt.g.localToWorld(V);for(let q=0;q<(kt.charge>=1?3:1);q++)R3.sparks.emit(V.x,V.y+0.1,V.z,(Math.random()-0.5)*3-tan.x*4,1.5+Math.random()*3,(Math.random()-0.5)*3-tan.z*4,c[0],c[1],c[2],0.35+Math.random()*0.2);});}
      if(kt.boost>0){[-0.35,0.35].forEach(sd=>{V.set(sd,0.55,-2.45);kt.g.localToWorld(V);for(let q=0;q<2;q++)R3.flames.emit(V.x,V.y,V.z,-tan.x*9+(Math.random()-0.5)*1.5,0.5+Math.random(),-tan.z*9+(Math.random()-0.5)*1.5,1,0.45+Math.random()*0.3,0.1,0.22);});}
      if(offroad&&spd>0.2&&Math.random()<0.8){const sd=Math.random()<0.5?-1:1;V.set(sd*1.05,0.2,-1.4);kt.g.localToWorld(V);R3.dust.emit(V.x,V.y,V.z,-tan.x*3+(Math.random()-0.5)*2,1+Math.random()*1.5,-tan.z*3+(Math.random()-0.5)*2,0.62,0.52,0.36,0.7);}}
    // items
    items.forEach(it=>{if(!it.alive)return;const d=(it.t-kt.t+1)%1;if(d<0.004&&Math.abs(it.x-kt.x)<0.35){
      if(it.kind==="box"){it.alive=false;it.mesh.visible=false;setTimeout(()=>{it.alive=true;if(it.mesh)it.mesh.visible=true;},7000);kt.boxes++;
        if(kt.player||near){const p=it.mesh.position;for(let q=0;q<14;q++)R3.sparks.emit(p.x,p.y,p.z,(Math.random()-0.5)*8,Math.random()*6,(Math.random()-0.5)*8,Math.random(),0.8,1,0.5);}
        if(!kt.item){const pool=R3.place>=4&&kt.player?["rocket","rocket","orb","shield"]:["rocket","orb","shield","banana"];kt.item=pool[Math.floor(Math.random()*pool.length)];if(kt.player){GPA.play("chime");gpMsg("🎁 "+GP_ITEMS[kt.item].n+"!");gpHudItem();}}}
      else if(it.kind==="banana"&&kt.spin<=0){it.alive=false;it.mesh.visible=false;if(!it.dropped)setTimeout(()=>{it.alive=true;if(it.mesh)it.mesh.visible=true;},9000);gpHit(kt,"banana");}
    }});
  });
  // kart-kart bumps
  for(let a=0;a<karts.length;a++)for(let b=a+1;b<karts.length;b++){const A=karts[a],B=karts[b];const d=(A.t-B.t+1)%1;const close=d<0.004||d>0.996;if(close&&Math.abs(A.x-B.x)<0.42){const back=d<0.5?B:A,front=back===A?B:A;if(back.speed>front.speed)back.speed=front.speed*0.85;A.x+=(A.x<B.x?-1:1)*0.2;B.x-=(A.x<B.x?-1:1)*0.2;if((A.player||B.player)&&R3.shake<0.3){R3.shake=0.3;GPA.tone(140,0.12,"square",0.12,90);}}}
  // homing orbs
  R3.shots=R3.shots.filter(s=>{s.life-=dt;s.t=(s.t+s.speed*dt/len)%1;let target=null,bd=1;karts.forEach(o=>{if(o===s.from)return;const d=(o.t-s.t+1)%1;if(d<0.09&&d<bd){bd=d;target=o;}});
    if(target){s.x+=(target.x-s.x)*dt*4;if(bd<0.004&&Math.abs(target.x-s.x)<0.45){gpHit(target,"orb");if(s.from.player){GPA.play("chime");gpMsg("🌀 Got "+target.racer.n+"!");}R3.scene.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();return false;}}
    const pos=R3.curve.getPointAt(s.t),tan=R3.curve.getTangentAt(s.t),nor=new T.Vector3(-tan.z,0,tan.x);pos.addScaledVector(nor,s.x*(R3.W-1.2));s.mesh.position.set(pos.x,1,pos.z);
    R3.sparks.emit(pos.x,1,pos.z,(Math.random()-0.5),Math.random(),(Math.random()-0.5),0.3,0.7,1,0.3);
    if(s.life<=0){R3.scene.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();return false;}return true;});
  // item + balloon animation
  const tnow=performance.now();
  items.forEach(it=>{if(it.kind==="box"){it.mesh.rotation.y+=dt*1.5;it.mesh.rotation.x+=dt*0.7;}if(it.placed&&it.kind==="box"){it.mesh.position.y=1.3+Math.sin(tnow/400+it.x)*0.2;return;}const pos=R3.curve.getPointAt(it.t),tan=R3.curve.getTangentAt(it.t),nor=new T.Vector3(-tan.z,0,tan.x);pos.addScaledVector(nor,it.x*(R3.W-1.2));it.mesh.position.set(pos.x,it.kind==="box"?1.3+Math.sin(tnow/400+it.x)*0.2:0.9,pos.z);if(it.kind==="box")it.placed=true;});
  R3_balloons.forEach(b=>{b.position.y+=Math.sin(tnow/900+b.userData.bob)*dt*0.6;});
  R3.sparks.update(dt,9);R3.flames.update(dt,-2);R3.dust.update(dt,-0.5);
  // standings
  const all=karts.slice().sort((a,b)=>(b.lap+b.t)-(a.lap+a.t));R3.board=all;R3.place=all.indexOf(me)+1;
  if(R3.msgT>0){R3.msgT-=dt;if(R3.msgT<=0){const e=$("gp3Msg");if(e)e.classList.remove("show");}}
  // HUD
  const el=(id,v)=>{const e=$(id);if(e&&e.textContent!==v)e.textContent=v;};
  el("gp3Lap","LAP "+Math.min(R3.C.laps,me.lap+1)+"/"+R3.C.laps);el("gp3Time",gpFmt(Math.max(0,R3.time)));el("gp3Speed",Math.round(me.speed*3.2)+" km/h");
  const pe=$("gp3Pos");if(pe&&pe.dataset.p!==String(R3.place)){pe.dataset.p=String(R3.place);pe.innerHTML=R3.place+"<small>"+gpSuf(R3.place)+"</small>";pe.classList.toggle("p1",R3.place===1);}
  const bd=$("gp3Board");if(bd){const html=all.map((k2,i)=>'<div class="'+(k2.player?"me":"")+'"><i style="background:'+k2.racer.css+'"></i>'+(i+1)+'. '+esc(k2.racer.n)+'</div>').join("");if(bd.innerHTML!==html)bd.innerHTML=html;}
  gpDrawMini($("gp3Map"),R3.C,karts);
  const spd=me.speed/me.max;GPA.engine(Math.min(1.2,spd),me.boost>0,!!me.drift,waiting);
  const ln=$("gp3Lines");if(ln){const o=Math.max(0,Math.min(1,(spd-0.9)*5))*0.5+(me.boost>0?0.55:0);const v=o.toFixed(2);if(ln.style.opacity!==v)ln.style.opacity=v;}
}
function gpRender(dt){
  const me=R3.karts.find(k=>k.player);const tan=R3.curve.getTangentAt(me.t).normalize();const nor=R3.tmpV2.set(-tan.z,0,tan.x);
  const spd=me.speed/me.max;
  const back=(R3.camera.aspect<1?9.2:7.4)+(me.boost>0?1.4:0)-spd*0.5;
  const target=me.pos.clone().addScaledVector(tan,-back).add(new R3.T.Vector3(0,R3.camera.aspect<1?4.6:3.1,0)).addScaledVector(nor,(me.drift||0)*1.1);
  if(R3.camPos.lengthSq()===0)R3.camPos.copy(target);
  R3.camPos.lerp(target,Math.min(1,dt*5));R3.camera.position.copy(R3.camPos);
  if(R3.shake>0){R3.shake=Math.max(0,R3.shake-dt*1.8);const a=R3.shake*0.5;R3.camera.position.x+=(Math.random()-0.5)*a;R3.camera.position.y+=(Math.random()-0.5)*a;R3.camera.position.z+=(Math.random()-0.5)*a;}
  const tall=R3.camera.aspect<1;R3.camera.lookAt(me.pos.clone().addScaledVector(tan,tall?9:12).add(new R3.T.Vector3(0,tall?-1.2:2.3,0)));
  const fovT=(R3.camera.aspect<1?80:60)+Math.min(1.2,spd)*6+(me.boost>0?10:0);R3.fov+=(fovT-R3.fov)*Math.min(1,dt*4);if(Math.abs(R3.camera.fov-R3.fov)>0.05){R3.camera.fov=R3.fov;R3.camera.updateProjectionMatrix();}
  // sky follows the camera; sun and its shadow box follow the player so shadows stay sharp
  R3.sky.position.copy(R3.camera.position);
  R3.sun.position.copy(me.pos).add(R3.sunOff);R3.sun.target.position.copy(me.pos);R3.sun.target.updateMatrixWorld();
  R3.renderer.render(R3.scene,R3.camera);
}
function gpFinish(){
  R3.done=true;const me=R3.karts.find(k=>k.player);const place=R3.place;const xp=[0,30,20,10,5,5][place]||5;
  const w0=$("gp3");if(w0)w0.classList.add("done");
  GPA.play(place<=3?"fanfare":"lap");if(place===1)confetti();
  say(place===1?"You win the Grand Fable GP! Champion of "+R3.C.name+"!":"You finished "+gpOrd(place)+". Great driving!");
  let earned=0;
  if(P){earned=xp;P.xp+=xp;P.race=P.race||{};const prev=P.race[R3.C.id];P.race[R3.C.id]={time:prev&&prev.time<R3.time?prev.time:R3.time,place:Math.min(place,prev?prev.place:9),date:today()};
    if(place===1&&!P.trophies.some(t=>t.type==="race")&&typeof awardTrophy==="function")awardTrophy({type:"race",icon:"🏎️",label:"Grand Fable Champion",color:"#ffd166",detail:"Won the Grand Fable GP at "+R3.C.name+"."});save();}
  const podium=R3.board.slice(0,3).map((k,i)=>'<div class="gp-pod p'+(i+1)+'"><span>'+k.racer.e+'</span><b>'+gpOrd(i+1)+'</b><small>'+esc(k.racer.n)+'</small></div>').join("");
  setTimeout(()=>{if(!R3)return;GPA.stopEngine();const w=$("gp3");if(!w)return;w.insertAdjacentHTML("beforeend",'<div class="gp3-finish"><div class="gp3-fin-title">🏁 '+gpOrd(place).toUpperCase()+' PLACE</div><div class="gp-podium">'+podium+'</div><div class="gp3-fin-sub">'+gpFmt(R3.time)+' · 🎁 '+me.boxes+' boxes'+(earned?' · +'+earned+' XP':'')+'</div><div class="btn-row" style="margin-top:12px"><button class="btn big" onclick="startRace3D(\''+R3.C.id+'\')">Race again 🔁</button><button class="btn secondary big" onclick="renderCircuits()">Circuits 🏁</button><button class="btn secondary big" onclick="'+(P?'renderHome()':'renderProfiles()')+'">Home 🏠</button></div></div>');},1300);
}
