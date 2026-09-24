/* ============================================================
   GRAND FABLE GP — STORYBOOK EDITION (Three.js r128)
   Ink-and-watercolour look (inspired by Foldline): every frame goes through
   one post-process pass that draws wobbly ink outlines, paper grain, washes
   and a soft glow. Pastel seaside world, floating islands, lamps, lanterns,
   villagers. FREE DRIVE: collect floating music notes that build a song.
   RACE: the Forza-style race with rivals and skill chains.
   The previous Festival edition is kept as race3d.forza.js.
   Forza-Horizon-style open-road racing, built for iPad and phones.
   · Choose a real-looking car (supercar, muscle, rally, roadster,
     off-roader) and a paint colour — no cartoon racers, no weapons.
   · Rolling hills: roads rise and fall with the land.
   · Festival start arch, flags, tents, crowds; fences, chevron bend
     signs, speed-trap camera, forests, rocks, distant mountains.
   · Skill chains: DRIFT, NEAR MISS, PASS, DRAFTING, SPEED TRAP,
     CLEAN RACING — chain them for a multiplier, a bump breaks it.
   · Rev counter with gears, engine that shifts, brake lights, tyre
     smoke, skid marks, cinematic intro camera, sun glare.
   Same entry points as before: renderRace / renderCircuits / startRace3D.
   Falls back to the 2D racer when WebGL or Three.js is unavailable.
   ============================================================ */
"use strict";
let R3=null;
const GP_CARS=[
 {id:"kei",n:"Lemon Kei Truck",cls:"B",pi:640,type:"kei",paint:"#f4efe6",speed:3,handle:5,accel:4,bio:"Little white truck. Nips round every corner."},
 {id:"coast",n:"Coastline Buggy",cls:"B",pi:680,type:"roadster",paint:"#7cc6b6",speed:4,handle:4,accel:3,bio:"Open-top buggy. Wind in your hair."},
 {id:"rally",n:"Accra Rally",cls:"A",pi:750,type:"rally",paint:"#6b8fd6",speed:3,handle:5,accel:5,bio:"Rally hatchback. Darts through tight bends."},
 {id:"trail",n:"Savanna Trail",cls:"B",pi:660,type:"offroad",paint:"#8fae6a",speed:3,handle:3,accel:4,bio:"Jeep. Hardly slows down on grass."},
 {id:"kumasi",n:"Kumasi V8",cls:"A",pi:780,type:"muscle",paint:"#e9a23b",speed:5,handle:2,accel:5,bio:"Muscle car. Loves long straights."},
 {id:"volta",n:"Volta GT",cls:"S1",pi:880,type:"super",paint:"#e8604c",speed:5,handle:4,accel:4,bio:"Supercar. Big wing, big grip."}
];
const GP_SHAPE={
 kei:{len:3.5,w:1.7,ride:0.34,rad:0.36,radR:0.36,nose:0.9,hood:0.98,belt:0.8,deck:0.8,tail:0.8,cabF:1.35,cabR:0.15,roof:1.85,roofF:1.2,roofR:0.2,wing:"none",bed:1},
 super:{len:4.5,w:2.05,ride:0.30,rad:0.45,radR:0.48,nose:0.62,hood:0.86,belt:0.98,deck:0.98,tail:0.8,cabF:0.55,cabR:-1.35,roof:1.3,roofF:-0.15,roofR:-0.85,wing:"big"},
 muscle:{len:4.8,w:2.0,ride:0.34,rad:0.46,radR:0.48,nose:0.8,hood:0.98,belt:1.04,deck:1.02,tail:0.92,cabF:0.05,cabR:-1.55,roof:1.46,roofF:-0.45,roofR:-1.15,wing:"duck"},
 rally:{len:4.0,w:1.9,ride:0.40,rad:0.46,radR:0.46,nose:0.82,hood:0.98,belt:1.06,deck:1.08,tail:1.0,cabF:0.75,cabR:-1.85,roof:1.66,roofF:0.1,roofR:-1.72,wing:"roof",scoop:1,flaps:1,num:1},
 roadster:{len:4.2,w:1.9,ride:0.32,rad:0.44,radR:0.44,nose:0.66,hood:0.86,belt:0.94,deck:0.95,tail:0.86,cabF:0.25,cabR:-0.7,roof:1.2,roofF:0,roofR:0,open:1,wing:"none"},
 offroad:{len:4.6,w:2.1,ride:0.62,rad:0.6,radR:0.6,nose:1.05,hood:1.32,belt:1.4,deck:1.38,tail:1.3,cabF:0.55,cabR:-1.3,roof:2.08,roofF:0.05,roofR:-1.25,wing:"none",rack:1}
};
const GP_PAINTS=["#f4efe6","#e8604c","#f2c14e","#7cc6b6","#6b8fd6","#c98bb9","#8fae6a","#3d4a5c"];
const GP_SCALE=[392,440,523.25,587.33,659.25,783.99,880,1046.5,1174.66];
const GP_DRIVERS=["Kofi","Ama","Esi","Kwame","Abena"];
const GP_CIRCUITS=[
 {id:"palm",name:"Volta Coast Road",laps:2,tree:"palm",hills:2.2,grass:0x9cc27a,sea:"#5cc6c0",
  look:{top:"#a9d8ee",hor:"#fbf3e2",glow:"#fff4d6",sun:"#fff3e0",sunI:1.05,hemi:0.95,dir:[0.45,0.8,0.35],paper:"#f7f0e1",ink:"#2b2735",hill:"#a7c7a0",time:"Morning by the sea",night:0},
  pts:[[0,0],[70,-8],[125,25],[135,85],[95,125],[30,118],[-35,140],[-95,105],[-115,45],[-70,-5]]},
 {id:"stadium",name:"Cape Coast Harbour",laps:2,tree:"mixed",hills:3.2,grass:0xb3bf73,sea:"#58b3c4",
  look:{top:"#8fb8e6",hor:"#fde3bf",glow:"#ffd49a",sun:"#ffe2b8",sunI:1.1,hemi:0.85,dir:[0.8,0.5,-0.25],paper:"#f8ecd8",ink:"#2d2632",hill:"#c3b68c",time:"Golden afternoon",night:0},
  pts:[[0,0],[90,0],[130,40],[110,95],[40,110],[-10,80],[-60,110],[-120,80],[-125,25],[-70,-10]]},
 {id:"hills",name:"Aburi Hills at Dusk",laps:2,tree:"forest",hills:5.5,grass:0x7f9a78,sea:null,
  look:{top:"#3b3f78",hor:"#f2a88e",glow:"#c9705a",sun:"#ffc2a0",sunI:0.8,hemi:0.46,dir:[-0.85,0.32,0.2],paper:"#e8d3c6",ink:"#241c30",hill:"#7a7aa6",time:"Dusk, lanterns on",night:1},
  pts:[[0,0],[60,-20],[120,10],[140,70],[100,110],[60,80],[10,120],[-60,130],[-120,90],[-110,30],[-50,-15]]}
];
const GP_KMH=4.6;                       // game speed → km/h shown on the dial
const GP_GEARS=[0,42,78,114,150,190];   // km/h where each gear starts
function gpOrd(n){return n+(["th","st","nd","rd"][(n%100>10&&n%100<14)?0:(n%10<4?n%10:0)]);}
function gpSuf(n){return gpOrd(n).slice(String(n).length);}
function gpFmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return m+":"+String(s%60).padStart(2,"0")+"."+String(Math.floor((ms%1000)/100));}
function gpLin(c){return new THREE.Color(c).convertSRGBToLinear();}
function gpNum(n){return Math.round(n).toLocaleString("en-US");}
function gpCar(){const id=(P&&P.gpCar)||window._gpCar||"kei";return GP_CARS.find(c=>c.id===id)||GP_CARS[0];}
function gpPaint(){return (P&&P.gpPaint)||window._gpPaint||gpCar().paint;}
function gpStats(car){return{max:36+car.speed*3,accel:9+car.accel*2.2,steer:1.4+car.handle*0.28,offF:car.type==="offroad"?0.85:(car.type==="rally"?0.62:0.45)};}

/* ---------- ink & wash post-process (one full-screen pass) ---------- */
const GP_POST_FS=`
uniform sampler2D tCol;uniform sampler2D tDep;uniform vec2 res;uniform float t;uniform float hasDep;uniform vec3 paper;uniform vec3 ink;uniform float cn;uniform float cf;uniform float night;
varying vec2 vUv;
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hsh(i),hsh(i+vec2(1.0,0.0)),f.x),mix(hsh(i+vec2(0.0,1.0)),hsh(i+vec2(1.0,1.0)),f.x),f.y);}
float rawD(vec2 uv){return texture2D(tDep,uv).x;}
float linD(float z){float zn=z*2.0-1.0;return 2.0*cn*cf/(cf+cn-zn*(cf-cn));}
void main(){
  float bt=floor(t*12.0);
  vec2 wob=vec2(nz(vUv*7.0+bt*1.7),nz(vUv*7.0+bt*1.7+19.3))-0.5;
  vec2 uv=vUv+wob*2.2/res;
  vec2 px=2.1/res;
  vec3 c=texture2D(tCol,vUv).rgb;
  vec3 cl=texture2D(tCol,uv-vec2(px.x,0.0)).rgb,cr=texture2D(tCol,uv+vec2(px.x,0.0)).rgb,cu=texture2D(tCol,uv+vec2(0.0,px.y)).rgb,cd=texture2D(tCol,uv-vec2(0.0,px.y)).rgb;
  float e=smoothstep(0.10,0.30,length(cr-cl)+length(cu-cd));
  float sky=0.0;
  if(hasDep>0.5){
    sky=step(0.99999,rawD(vUv));
    float dc=linD(rawD(uv)),dl=linD(rawD(uv-vec2(px.x,0.0))),dr=linD(rawD(uv+vec2(px.x,0.0))),du=linD(rawD(uv+vec2(0.0,px.y))),dd=linD(rawD(uv-vec2(0.0,px.y)));
    float lap=(abs(dl+dr-2.0*dc)+abs(du+dd-2.0*dc))/max(dc,1.0);
    float jump=max(max(abs(dl-dc),abs(dr-dc)),max(abs(du-dc),abs(dd-dc)))/max(dc,1.0);
    e=max(e,max(smoothstep(0.012,0.045,lap),smoothstep(0.025,0.08,jump)));
    e*=1.0-smoothstep(260.0,800.0,dc)*0.8;
  }
  vec3 gl=vec3(0.0);
  for(int i=0;i<8;i++){float a=float(i)*0.7854;vec2 o=vec2(cos(a),sin(a))*7.0/res;vec3 s=texture2D(tCol,vUv+o).rgb;gl+=max(s-vec3(0.86),0.0);}
  c+=gl*(0.07+night*0.22);
  c=mix(c,paper,0.08+sky*(0.34-night*0.2));
  float bl=nz(vUv*res/190.0)*0.6+nz(vUv*res/55.0)*0.4;
  c*=0.93+0.12*bl;
  float gr=hsh(floor(vUv*res/1.6))*0.55+nz(vec2(vUv.x*res.x/2.5,vUv.y*res.y/9.0))*0.45;
  c*=0.935+0.075*gr;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  float hat=step(0.55,fract((vUv.x*res.x+vUv.y*res.y)/6.0));
  c=mix(c,ink,min(1.0,e*1.05)*0.9+(1.0-smoothstep(0.16,0.34,lum))*hat*0.16*(1.0-sky));
  c*=1.0-night*0.12*(1.0-sky);
  vec2 q=vUv*(1.0-vUv);float v=pow(clamp(q.x*q.y*18.0,0.0,1.0),0.16);
  c=mix(paper*0.84,c,v);
  gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
}`;
function gpPostSetup(T,renderer,L){let depthOK=true;const rt=new T.WebGLRenderTarget(4,4,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});rt.texture.encoding=T.sRGBEncoding;
  try{const ok=renderer.capabilities.isWebGL2||renderer.extensions.has("WEBGL_depth_texture");if(!ok)throw 0;rt.depthTexture=new T.DepthTexture();rt.depthTexture.type=T.UnsignedIntType;}catch(e){depthOK=false;rt.depthTexture=null;}
  const mat=new T.ShaderMaterial({uniforms:{tCol:{value:rt.texture},tDep:{value:rt.depthTexture},res:{value:new T.Vector2(4,4)},t:{value:0},hasDep:{value:depthOK?1:0},paper:{value:new T.Color(L.paper)},ink:{value:new T.Color(L.ink)},cn:{value:0.6},cf:{value:1800},night:{value:L.night||0}},
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}",fragmentShader:GP_POST_FS,depthTest:false,depthWrite:false});
  const quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.frustumCulled=false;const scene=new T.Scene();scene.add(quad);const cam=new T.OrthographicCamera(-1,1,1,-1,0,1);
  return{rt,mat,scene,cam,depthOK,resize(w,h,pr){const W=Math.max(2,Math.round(w*pr)),H=Math.max(2,Math.round(h*pr));rt.setSize(W,H);mat.uniforms.res.value.set(W,H);},dispose(){rt.dispose();if(rt.depthTexture)rt.depthTexture.dispose();mat.dispose();quad.geometry.dispose();}};}

/* ---------- sound: synthesised with WebAudio (no files) ---------- */
const GPA={ctx:null,master:null,eng:null,muted:false,
  init(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:0.9;this.master.connect(this.ctx.destination);
      const nb=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noiseBuf=nb;}
    if(this.ctx.state==="suspended")this.ctx.resume();}catch(e){}},
  setMute(m){this.muted=m;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(m?0:0.9,this.ctx.currentTime,0.02);},
  startEngine(){if(!this.ctx||this.eng)return;try{const c=this.ctx;
    const o1=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
    o1.type="sawtooth";o2.type="square";o1.frequency.value=50;o2.frequency.value=25;f.type="lowpass";f.frequency.value=400;f.Q.value=4;g.gain.value=0;
    o1.connect(f);o2.connect(f);f.connect(g);g.connect(this.master);o1.start();o2.start();
    const ns=c.createBufferSource();ns.buffer=this.noiseBuf;ns.loop=true;const bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=1900;bp.Q.value=4;const ng=c.createGain();ng.gain.value=0;
    ns.connect(bp);bp.connect(ng);ng.connect(this.master);ns.start();this.eng={o1,o2,f,g,ng,ns};}catch(e){}},
  engine(rf,load,screech,idle){const e=this.eng;if(!e)return;const t=this.ctx.currentTime;const base=idle?40+rf*40:36+rf*150;
    e.o1.frequency.setTargetAtTime(base,t,0.035);e.o2.frequency.setTargetAtTime(base/2+0.7,t,0.035);
    e.f.frequency.setTargetAtTime(240+rf*1800,t,0.05);e.g.gain.setTargetAtTime(0.026+load*0.05,t,0.08);e.ng.gain.setTargetAtTime(screech?0.05:0,t,0.05);},
  stopEngine(){const e=this.eng;if(!e)return;try{e.g.gain.setTargetAtTime(0,this.ctx.currentTime,0.05);e.ng.gain.setTargetAtTime(0,this.ctx.currentTime,0.05);const s=this.ctx.currentTime+0.3;e.o1.stop(s);e.o2.stop(s);e.ns.stop(s);}catch(x){}this.eng=null;},
  tone(freq,dur,type,vol,slideTo,delay){if(!this.ctx)return;try{const c=this.ctx,t=c.currentTime+(delay||0);const o=c.createOscillator(),g=c.createGain();o.type=type||"sine";o.frequency.setValueAtTime(freq,t);if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+0.05);}catch(e){}},
  noise(dur,vol,freq,delay){if(!this.ctx||!this.noiseBuf)return;try{const c=this.ctx,t=c.currentTime+(delay||0);const s=c.createBufferSource();s.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type="bandpass";f.frequency.value=freq||1000;f.Q.value=1.2;const g=c.createGain();
    g.gain.setValueAtTime(vol||0.2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+dur+0.05);}catch(e){}},
  box(f,delay){if(!this.ctx)return;try{const c=this.ctx,t=c.currentTime+(delay||0);[[1,0.2],[2.01,0.055],[3.98,0.022]].forEach(([m,v])=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=f*m;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+1.3/m);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+1.4);});}catch(e){}},
  play(n){switch(n){
    case"beep":this.tone(660,0.2,"square",0.12);break;
    case"go":this.tone(1320,0.5,"square",0.14);break;
    case"shift":this.noise(0.07,0.1,2200);this.tone(190,0.09,"square",0.05,110);break;
    case"skill":this.tone(1180,0.09,"triangle",0.12);break;
    case"bank":this.tone(880,0.12,"triangle",0.18);this.tone(1320,0.2,"triangle",0.18,null,0.08);this.tone(1760,0.3,"triangle",0.14,null,0.16);break;
    case"trap":this.noise(0.05,0.25,4000);this.tone(1760,0.18,"sine",0.14,null,0.04);break;
    case"break":this.tone(300,0.3,"sawtooth",0.1,120);break;
    case"bump":this.tone(150,0.18,"square",0.16,80);this.noise(0.15,0.25,500);break;
    case"lap":this.tone(990,0.15,"triangle",0.2);this.tone(1320,0.28,"triangle",0.2,null,0.12);break;
    case"fanfare":[523,659,784,1047].forEach((f,i)=>this.tone(f,0.3,"triangle",0.22,null,i*0.14));this.tone(1047,1.0,"triangle",0.2,null,0.62);this.tone(784,1.0,"triangle",0.12,null,0.62);break;}}
};

/* ---------- one-time CSS: festival look, iPad + phone layouts ---------- */
function gpCss(){if(!document.getElementById("gpFont")){const l=document.createElement("link");l.id="gpFont";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap";document.head.appendChild(l);}if(document.getElementById("gpV3Css"))return;const s=document.createElement("style");s.id="gpV3Css";s.textContent=`
.fz-title{font-size:clamp(30px,6.5vw,54px);font-weight:900;font-style:italic;letter-spacing:.02em;line-height:1;background:linear-gradient(90deg,#ff2d87,#ff7a00);-webkit-background-clip:text;background-clip:text;color:transparent;text-transform:uppercase}
.fz-sub{margin-top:6px;font-size:12px;letter-spacing:.24em;font-weight:800;color:#ffd2e6;text-transform:uppercase}
.fz-cars{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.fz-car{position:relative;display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:16px;border:2px solid rgba(255,255,255,.14);background:linear-gradient(160deg,#1c1030,#0b0f1e);color:#fff;font-family:inherit;text-align:left;cursor:pointer;transition:transform .15s,border-color .15s}
.fz-car:hover{transform:translateY(-2px)}
.fz-car.on{border-color:#ff2d87;box-shadow:0 0 0 3px rgba(255,45,135,.3),0 10px 30px rgba(255,45,135,.25)}
.fz-car canvas{width:100%;height:auto;border-radius:10px;background:radial-gradient(ellipse at 50% 80%,#3a2a55,#120c20)}
.fz-car b{font-size:17px;font-style:italic;text-transform:uppercase}
.fz-car small{font-size:11px;color:#cdbfe6;line-height:1.3}
.fz-cls{position:absolute;top:18px;left:18px;display:flex;font-weight:900;font-size:12px;border-radius:5px;overflow:hidden}
.fz-cls i{font-style:normal;background:#ff2d87;padding:2px 6px}.fz-cls em{font-style:normal;background:#fff;color:#111;padding:2px 6px}
.fz-bar{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;color:#e9dbff;text-transform:uppercase}
.fz-bar i{width:58px;flex:none;font-style:normal}.fz-bar s{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden;text-decoration:none}.fz-bar em{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#ff7a00,#ff2d87)}
.fz-paints{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:12px}
.fz-sw{width:40px;height:40px;border-radius:50%;border:3px solid rgba(255,255,255,.3);cursor:pointer}
.fz-sw.on{border-color:#fff;box-shadow:0 0 0 3px #ff2d87}
.fz-route{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:16px;border:2px solid rgba(255,255,255,.14);background:linear-gradient(160deg,#1c1030,#0b0f1e);color:#fff;font-family:inherit;cursor:pointer;text-align:left}
.fz-route:hover{border-color:#ff2d87}
.fz-route canvas{width:100%;height:auto;border-radius:10px}
.fz-route b{font-size:16px;font-style:italic;text-transform:uppercase}.fz-route small{font-size:12px;color:#cdbfe6}
.fz-card{background:rgba(20,10,40,.72);color:#f3eaff;border:1px solid rgba(255,45,135,.3)}
.gp3-wrap.v3{--tach:clamp(112px,13vw,160px);position:relative;max-width:min(1600px,calc((100vh - 70px)*16/9));width:100%;margin:0 auto;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000;border:2px solid rgba(255,45,135,.55);box-shadow:0 20px 50px rgba(0,0,0,.5);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,sans-serif}
@supports (height:100dvh){.gp3-wrap.v3{max-width:min(1600px,calc((100dvh - 70px)*16/9))}}
.gp3-wrap.v3 canvas#gp3c{display:block;width:100%;height:100%}
.gp3-wrap.v3 .gp3-touch{position:absolute;top:0;left:0;width:50%;height:100%;z-index:1;touch-action:none}.gp3-wrap.v3 .gp3-touch.right{left:50%}
.fz-vig{position:absolute;inset:0;pointer-events:none;z-index:2;background:radial-gradient(ellipse at 50% 55%,transparent 55%,rgba(0,0,0,.38))}
.fz-tl{position:absolute;left:12px;top:10px;z-index:3;color:#fff;pointer-events:none;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.fz-pos{font-size:clamp(40px,5.4vw,64px);font-weight:900;font-style:italic;line-height:.9}
.fz-pos small{font-size:.42em;margin-left:1px}.fz-pos em{font-size:.36em;font-style:italic;color:#ffc2dc;margin-left:6px}
.fz-lap{margin-top:4px;font-size:clamp(12px,1.4vw,15px);font-weight:900;font-style:italic;letter-spacing:.08em;background:linear-gradient(90deg,#ff2d87,#ff7a00);display:inline-block;padding:2px 10px;border-radius:3px;transform:skewX(-12deg)}
.fz-time{font-size:clamp(15px,1.8vw,20px);font-weight:800;font-variant-numeric:tabular-nums;margin-top:3px}
.gp3-wrap.v3 .gp3-map{position:absolute;left:12px;top:clamp(116px,13vw,140px);width:clamp(96px,11vw,136px);aspect-ratio:150/110;height:auto;z-index:3;border-radius:12px;border:2px solid rgba(255,255,255,.35);background:rgba(10,8,25,.55);pointer-events:none}
.fz-skill{position:absolute;left:12px;top:48%;z-index:3;pointer-events:none;color:#fff;min-width:150px;opacity:0;transition:opacity .2s;text-shadow:0 2px 8px rgba(0,0,0,.7)}
.fz-skill.on{opacity:1}
.fz-skill .pts{font-size:clamp(22px,2.8vw,32px);font-weight:900;font-style:italic;line-height:1}
.fz-skill .mul{display:inline-block;margin-left:8px;font-size:.6em;background:#ff2d87;padding:1px 7px;border-radius:4px;vertical-align:middle}
.fz-skill .row{font-size:clamp(11px,1.2vw,13px);font-weight:800;letter-spacing:.06em;color:#ffd6e8;text-transform:uppercase;margin-top:2px}
.fz-skill .row:first-of-type{color:#fff}
.fz-tach{position:absolute;right:10px;top:8px;width:var(--tach);height:var(--tach);z-index:3;pointer-events:none}
.fz-btn{position:absolute;right:calc(var(--tach) + 18px);z-index:6;width:42px;height:42px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(10,8,25,.6);color:#fff;font-size:19px;display:grid;place-items:center;cursor:pointer;touch-action:manipulation;padding:0}
.fz-btn.mute{top:10px}.fz-btn.quit{top:60px}
.gp3-wrap.v3 .gp3-msg{position:absolute;left:50%;top:17%;transform:translateX(-50%) skewX(-10deg);z-index:4;padding:6px 18px;font-size:clamp(15px,2.2vw,24px);font-weight:900;font-style:italic;letter-spacing:.04em;color:#fff;background:linear-gradient(90deg,rgba(255,45,135,.92),rgba(255,122,0,.92));border-radius:4px;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap;text-transform:uppercase}
.gp3-wrap.v3 .gp3-msg.show{opacity:1}
.gp3-wrap.v3 .gp3-count{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);z-index:5;font-size:clamp(64px,13vw,130px);font-weight:900;font-style:italic;color:#fff;text-shadow:0 0 30px #ff2d87,0 6px 20px #000;opacity:0;pointer-events:none}
.gp3-wrap.v3 .gp3-count.show{opacity:1}
.gp3-wrap.v3 .gp3-card{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);z-index:4;padding:10px 22px;text-align:center;color:#fff;background:rgba(10,8,25,.75);border-left:4px solid #ff2d87;border-radius:4px;transition:opacity .6s;pointer-events:none;white-space:nowrap}
.gp3-wrap.v3 .gp3-card b{display:block;font-size:clamp(17px,2.4vw,26px);font-style:italic;text-transform:uppercase}.gp3-wrap.v3 .gp3-card small{font-size:12px;color:#ffd2e6;letter-spacing:.1em;text-transform:uppercase}
.gp3-wrap.v3 .gp3-card.hide{opacity:0}
.gp3-pad{position:absolute;bottom:12px;display:flex;gap:clamp(8px,1.2vw,14px);z-index:5;align-items:flex-end}
.gp3-pad.l{left:12px}.gp3-pad.r{right:12px}
.gp3-wrap.v3 .race-btn{width:clamp(70px,7.8vw,94px);height:clamp(70px,7.8vw,94px);border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(10,8,25,.45);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);color:#fff;font-size:clamp(24px,3vw,34px);touch-action:none;display:grid;place-items:center;padding:0;font-family:inherit;cursor:pointer;user-select:none;-webkit-user-select:none}
.gp3-wrap.v3 .race-btn.txt{font-size:clamp(11px,1.3vw,14px);font-weight:900;font-style:italic;letter-spacing:.04em}
.gp3-wrap.v3 .race-btn.brake{background:rgba(160,20,40,.55)}
.gp3-wrap.v3 .race-btn.drift{background:linear-gradient(135deg,rgba(255,45,135,.8),rgba(255,122,0,.8))}
.gp3-wrap.v3 .race-btn.on{background:#fff;color:#111}
.gp3-wrap.v3 .gp3-finish{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(40,5,40,.88),rgba(10,8,25,.9));color:#fff;text-align:center;padding:10px}
.fz-fin-t{font-size:clamp(30px,6vw,56px);font-weight:900;font-style:italic;background:linear-gradient(90deg,#ff2d87,#ff7a00);-webkit-background-clip:text;background-clip:text;color:transparent}
.fz-res{margin:8px 0;min-width:min(420px,90%);font-size:clamp(12px,1.6vw,15px)}
.fz-res div{display:grid;grid-template-columns:38px 1fr 1fr;gap:8px;padding:4px 10px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);font-weight:700}
.fz-res div.me{background:linear-gradient(90deg,rgba(255,45,135,.5),rgba(255,122,0,.3));font-weight:900}
.fz-res i{font-style:italic}
.fz-fin-s{font-weight:800;color:#ffd2e6;margin-top:2px}
.gp3-wrap.v3.done .gp3-pad,.gp3-wrap.v3.done .fz-btn,.gp3-wrap.v3.done .fz-skill{display:none}
.fz-quit-row{margin-top:8px}
/* ---- phones: the race takes over the whole screen ---- */
@media (max-height:520px),(orientation:portrait) and (max-width:600px){
.gp3-wrap.v3{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;aspect-ratio:auto!important;margin:0!important;border:0!important;border-radius:0!important;z-index:9000;--tach:92px}
@supports (height:100dvh){.gp3-wrap.v3{height:100dvh!important}}
.gp3-wrap.v3 ~ .fz-quit-row{display:none}
.fz-tl{left:calc(8px + env(safe-area-inset-left));top:calc(6px + env(safe-area-inset-top))}
.fz-pos{font-size:36px}.fz-lap{font-size:11px}.fz-time{font-size:14px}
.gp3-wrap.v3 .gp3-map{top:calc(92px + env(safe-area-inset-top));left:calc(8px + env(safe-area-inset-left));width:84px}
.fz-skill{left:calc(8px + env(safe-area-inset-left));min-width:120px}
.fz-skill .pts{font-size:22px}.fz-skill .row{font-size:10px}
.fz-tach{right:calc(6px + env(safe-area-inset-right));top:calc(4px + env(safe-area-inset-top))}
.fz-btn{width:36px;height:36px;font-size:16px;right:calc(var(--tach) + 12px + env(safe-area-inset-right))}
.fz-btn.mute{top:calc(8px + env(safe-area-inset-top))}.fz-btn.quit{top:calc(50px + env(safe-area-inset-top))}
.gp3-pad{bottom:calc(10px + env(safe-area-inset-bottom));gap:8px}.gp3-pad.l{left:calc(10px + env(safe-area-inset-left))}.gp3-pad.r{right:calc(10px + env(safe-area-inset-right))}
.gp3-wrap.v3 .race-btn{width:58px;height:58px;font-size:22px}
.gp3-wrap.v3 .race-btn.txt{font-size:10px}
.gp3-wrap.v3 .gp3-msg{font-size:15px;top:24%}
.gp3-wrap.v3 .gp3-count{font-size:70px}
.gp3-wrap.v3 .gp3-card{padding:6px 14px}.gp3-wrap.v3 .gp3-card b{font-size:16px}
.fz-fin-t{font-size:30px}.fz-res{font-size:12px}.gp3-wrap.v3 .gp3-finish .btn{padding:8px 12px;font-size:14px}
}
@media (max-height:520px){.gp3-wrap.v3{--tach:84px}.fz-skill{top:46%}.fz-pos{font-size:30px}.gp3-wrap.v3 .gp3-map{width:70px;top:calc(96px + env(safe-area-inset-top))}.gp3-wrap.v3 .race-btn{width:54px;height:54px}}
@media (orientation:portrait) and (max-width:600px){.fz-skill{top:32%}.gp3-wrap.v3 .gp3-finish .btn-row{flex-direction:column;gap:8px}}
/* ---- storybook (ink & wash) theme ---- */
.fz-shell,.gp3-wrap.v3{font-family:"Patrick Hand","Chalkboard SE","Comic Sans MS",system-ui,sans-serif}
.fz-shell{background:#efe6d3;border:3px solid #2b2735;border-radius:18px;padding:10px 12px 16px;margin-top:8px!important;box-shadow:6px 6px 0 rgba(0,0,0,.25);color:#2b2735}
.fz-title{background:none;color:#2b2735;-webkit-text-fill-color:#2b2735;text-shadow:3px 3px 0 #e8604c;font-style:normal;letter-spacing:.04em}
.fz-sub{color:#6b6076}
.fz-car,.fz-route{background:#f7f0e1;color:#2b2735;border:3px solid #2b2735;box-shadow:4px 4px 0 rgba(0,0,0,.3);font-family:inherit}
.fz-car.on{border-color:#e8604c;box-shadow:0 0 0 3px #e8604c,4px 4px 0 rgba(0,0,0,.3)}
.fz-car canvas{background:linear-gradient(#e3f1ef,#f7f0e1);border:2px solid #2b2735}
.fz-car b,.fz-route b{font-style:normal;font-size:19px}
.fz-car small,.fz-route small{color:#5b5566}
.fz-route canvas{border:2px solid #2b2735}
.fz-bar{color:#2b2735}.fz-bar s{background:rgba(43,39,53,.15)}.fz-bar em{background:#e8604c}
.fz-cls i{background:#e8604c;color:#fff}.fz-cls em{background:#2b2735;color:#fff}
.fz-sw{border-color:#2b2735}.fz-sw.on{border-color:#2b2735;box-shadow:0 0 0 3px #e8604c}
.fz-card{background:#f7f0e1!important;color:#2b2735!important;border:3px solid #2b2735!important}
.fz-card p{color:#3d3747!important}
.fz-mode{display:flex;gap:10px;justify-content:center;margin:0 0 12px;flex-wrap:wrap}
.fz-mode button{font:inherit;font-size:19px;padding:10px 16px;border-radius:14px;border:3px solid #2b2735;background:#f7f0e1;color:#2b2735;cursor:pointer;box-shadow:3px 3px 0 rgba(0,0,0,.3)}
.fz-mode button.on{background:#e8604c;color:#fff}
.gp3-wrap.v3{border:3px solid #2b2735;background:#f7f0e1}
.fz-vig{display:none}
.fz-tl{color:#2b2735;text-shadow:none}
.fz-pos{color:#2b2735;font-style:normal;text-shadow:2px 2px 0 #f7f0e1}.fz-pos em{color:#6b6076}
.fz-lap{background:#e8604c;color:#fff;transform:none;border:2px solid #2b2735;font-style:normal}
.fz-time{color:#2b2735;background:rgba(247,240,225,.9);display:inline-block;padding:0 6px;border-radius:6px;margin-left:4px;border:2px solid #2b2735}
.fz-song{margin-top:6px;display:flex;align-items:center;gap:5px;background:rgba(247,240,225,.92);border:2px solid #2b2735;border-radius:10px;padding:3px 8px;font-size:clamp(13px,1.5vw,17px);width:max-content}
.fz-song b{font-weight:400;margin-right:3px}
.fz-song i{width:11px;height:11px;border-radius:50%;border:2px solid #2b2735;display:inline-block;background:transparent}
.fz-song i.on{background:var(--c)}
.fz-skill{color:#2b2735;text-shadow:0 0 6px #f7f0e1,0 0 2px #f7f0e1}.fz-skill .row{color:#5b4f66}.fz-skill .row:first-of-type{color:#2b2735}.fz-skill .mul{background:#e8604c;color:#fff}
.gp3-wrap.v3 .gp3-map{background:rgba(247,240,225,.9);border:2px solid #2b2735}
.fz-btn{background:#f7f0e1;color:#2b2735;border:2px solid #2b2735}
.gp3-wrap.v3 .gp3-msg{background:#f7f0e1;color:#2b2735;border:3px solid #2b2735;transform:translateX(-50%) rotate(-2deg);font-style:normal;box-shadow:3px 3px 0 rgba(0,0,0,.25);text-transform:none}
.gp3-wrap.v3 .gp3-count{color:#f7f0e1;text-shadow:4px 4px 0 #2b2735;font-style:normal}
.gp3-wrap.v3 .gp3-card{background:#f7f0e1;color:#2b2735;border:3px solid #2b2735;border-left:8px solid #e8604c}.gp3-wrap.v3 .gp3-card b{font-style:normal}.gp3-wrap.v3 .gp3-card small{color:#6b6076}
.gp3-wrap.v3 .race-btn{background:rgba(247,240,225,.78);color:#2b2735;border:3px solid #2b2735;-webkit-backdrop-filter:none;backdrop-filter:none;font-family:inherit}
.gp3-wrap.v3 .race-btn.txt{font-style:normal;font-size:clamp(13px,1.5vw,17px)}
.gp3-wrap.v3 .race-btn.brake{background:rgba(232,96,76,.85);color:#fff}
.gp3-wrap.v3 .race-btn.drift{background:rgba(242,193,78,.92);color:#2b2735}
.gp3-wrap.v3 .race-btn.on{background:#2b2735;color:#f7f0e1}
.gp3-wrap.v3 .gp3-finish{background:rgba(247,240,225,.95);color:#2b2735}
.fz-fin-t{background:none;color:#2b2735;-webkit-text-fill-color:#2b2735;font-style:normal;text-shadow:3px 3px 0 #f2c14e}
.fz-res div{border-bottom:1px dashed rgba(43,39,53,.3)}.fz-res div.me{background:#f2c14e}
.fz-fin-s{color:#5b4f66}
@media (max-height:520px),(orientation:portrait) and (max-width:600px){.fz-song{font-size:12px;padding:2px 6px}.fz-song i{width:8px;height:8px}.gp3-wrap.v3 .race-btn.txt{font-size:12px}}
`;document.head.appendChild(s);}

/* ---------- menus: car select → route select → race ---------- */
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
  try{if(R3.post)R3.post.dispose();}catch(e){}
  try{R3.renderer.dispose();R3.renderer.forceContextLoss();}catch(e){}
  R3=null;
}
function renderRace(){
  clearTimers();closeOverlay();defocus();showAnanseCorner(false);gpStop();
  if(typeof kdWebgl==="function"&&!kdWebgl()){renderRace2D();return;}
  gpCss();document.body.classList.add("learningworld");
  const sel=gpCar().id,paint=gpPaint();
  const cards=GP_CARS.map(c=>'<button class="fz-car'+(c.id===sel?" on":"")+'" data-car="'+c.id+'" onclick="gpPickCar(\''+c.id+'\')"><canvas width="480" height="200" data-prev="'+c.id+'"></canvas><span class="fz-cls"><i>'+c.cls+'</i><em>'+c.pi+'</em></span><b>'+esc(c.n)+'</b>'
    +'<span class="fz-bar"><i>Speed</i><s><em style="width:'+(c.speed*20)+'%"></em></s></span><span class="fz-bar"><i>Handling</i><s><em style="width:'+(c.handle*20)+'%"></em></s></span><span class="fz-bar"><i>Launch</i><s><em style="width:'+(c.accel*20)+'%"></em></s></span>'
    +'<small>'+esc(c.bio)+'</small></button>').join("");
  const sw=GP_PAINTS.map(h=>'<button class="fz-sw'+(h===paint?" on":"")+'" style="background:'+h+'" data-paint="'+h+'" onclick="gpPickPaint(\''+h+'\')" aria-label="Paint colour"></button>').join("");
  app.innerHTML='<div class="fadein fz-shell" style="max-width:980px;margin:0 auto;padding:0 8px">'
   +'<div style="text-align:center;padding:16px 8px 12px"><div class="fz-title">Grand Fable GP</div><div class="fz-sub">Storybook drive · choose your car</div></div>'
   +'<div class="fz-cars">'+cards+'</div>'
   +'<div class="fz-paints">'+sw+'</div>'
   +'<div class="center" style="margin-top:14px"><button class="btn big" onclick="renderCircuits()">Next: choose a route ▶</button></div>'
   +'<div class="btn-row" style="margin-top:12px"><button class="btn secondary" onclick="'+(P?'renderHome()':'renderProfiles()')+'">⟵ Back</button><button class="btn secondary" style="font-size:14px" onclick="renderRace2D()">Classic 2D racer</button></div><div class="spacer"></div></div>';
  gpDrawPreviews();
  loadThree().then(gpDrawPreviews).catch(()=>{});
  say("Grand Fable festival! Choose your car.");
}
function gpDrawPreviews(){if(!window.THREE)return;const pc=gpCar().id,pp=gpPaint();document.querySelectorAll("canvas[data-prev]").forEach(cv=>{const c=GP_CARS.find(x=>x.id===cv.dataset.prev);gpCarDraw(cv,c,c.id===pc?pp:c.paint);});}
function gpPickCar(id){if(P){P.gpCar=id;save();}else window._gpCar=id;document.querySelectorAll(".fz-car").forEach(b=>b.classList.toggle("on",b.dataset.car===id));gpDrawPreviews();sfx("tick");}
function gpPickPaint(h){if(P){P.gpPaint=h;save();}else window._gpPaint=h;document.querySelectorAll(".fz-sw").forEach(b=>b.classList.toggle("on",b.dataset.paint===h));gpDrawPreviews();sfx("tick");}
function gpPickRacer(id){gpPickCar(GP_CARS.some(c=>c.id===id)?id:"kei");}
function gpMode(){return (P&&P.gpMode)||window._gpMode||"free";}
function gpPace(){return (P&&P.gpPace)||window._gpPace||"gentle";}
function gpPickPace(v){if(P){P.gpPace=v;save();}else window._gpPace=v;document.querySelectorAll(".fz-pace button").forEach(b=>b.classList.toggle("on",b.dataset.p===v));sfx("tick");}
function gpPaceMul(){const g=gpPace()==="gentle";return gpMode()==="free"?(g?0.55:0.72):(g?0.68:0.85);}
function gpPickMode(m){if(P){P.gpMode=m;save();}else window._gpMode=m;document.querySelectorAll(".fz-mode button").forEach(b=>b.classList.toggle("on",b.dataset.m===m));sfx("tick");}
function renderCircuits(){
  clearTimers();closeOverlay();showAnanseCorner(false);gpStop();gpCss();
  const best=P&&P.race?P.race:{};
  app.innerHTML='<div class="fadein fz-shell" style="max-width:980px;margin:0 auto;padding:0 8px">'
   +'<div style="text-align:center;padding:16px 8px 12px"><div class="fz-title">Grand Fable GP</div><div class="fz-sub">'+esc(gpCar().n)+' · choose a route</div></div>'
   +'<div class="fz-mode fz-pace"><button data-p="gentle" class="'+(gpPace()==="gentle"?"on":"")+'" onclick="gpPickPace(\'gentle\')">🐢 Gentle speed</button><button data-p="normal" class="'+(gpPace()==="normal"?"on":"")+'" onclick="gpPickPace(\'normal\')">🚗 Normal speed</button></div>'
   +'<div class="fz-mode"><button data-m="free" class="'+(gpMode()==="free"?"on":"")+'" onclick="gpPickMode(\'free\')">🎵 Free drive: collect the music</button><button data-m="race" class="'+(gpMode()==="race"?"on":"")+'" onclick="gpPickMode(\'race\')">🏁 Race: beat 4 rivals</button></div>'
   +'<div class="fz-cars">'+GP_CIRCUITS.map((c,i)=>'<button class="fz-route" onclick="startRace3D(\''+c.id+'\')"><canvas id="gpMini'+i+'" width="220" height="150"></canvas><b>'+esc(c.name)+'</b><small>'+esc(c.look.time)+' · '+c.laps+' laps'+(best[c.id]&&best[c.id].time?' · best '+gpFmt(best[c.id].time)+' · '+gpOrd(best[c.id].place):'')+(best[c.id]&&best[c.id].skill?' · skill '+gpNum(best[c.id].skill):'')+(best[c.id]&&best[c.id].notes?' · 🎵 '+best[c.id].notes+' notes':'')+'</small></button>').join("")+'</div>'
   +'<div class="card fz-card" style="margin-top:14px"><b>How to play</b><p style="margin-top:6px">🎵 <b>Free drive</b>: cruise the coast and drive through the floating music notes. Every 8 notes makes a tune, and at the end you can play your whole song.<br>🏁 <b>Race</b>: beat 4 rivals. Score skill points for drifting, near misses and passing.<br>◀ ▶ steer · BRAKE slows down · hold DRIFT while turning to slide. The car speeds up on its own. Keyboard: ← → steer, ↓ brake, Space drift, M mute, Esc quit.</p></div>'
   +'<div class="btn-row" style="margin-top:12px"><button class="btn secondary" onclick="renderRace()">⟵ Cars</button></div><div class="spacer"></div></div>';
  GP_CIRCUITS.forEach((c,i)=>gpDrawMini($("gpMini"+i),c,null));
  say("Choose a route.");
}
function gpDrawMini(cv,c,karts){
  if(!cv)return;const x=cv.getContext("2d");x.clearRect(0,0,cv.width,cv.height);
  const xs=c.pts.map(p=>p[0]),zs=c.pts.map(p=>p[1]);const minX=Math.min(...xs)-15,maxX=Math.max(...xs)+15,minZ=Math.min(...zs)-15,maxZ=Math.max(...zs)+15;
  const sx=cv.width/(maxX-minX),sz=cv.height/(maxZ-minZ),s=Math.min(sx,sz);const ox=(cv.width-(maxX-minX)*s)/2,oz=(cv.height-(maxZ-minZ)*s)/2;
  const map=(px,pz)=>[ox+(px-minX)*s,oz+(pz-minZ)*s];
  if(!c._mini){const P0=c.pts,n=P0.length,pts=[];for(let i=0;i<n;i++){const a=P0[(i-1+n)%n],b=P0[i],cc=P0[(i+1)%n],d=P0[(i+2)%n];for(let t=0;t<1;t+=0.1){const t2=t*t,t3=t2*t;pts.push([0.5*((2*b[0])+(-a[0]+cc[0])*t+(2*a[0]-5*b[0]+4*cc[0]-d[0])*t2+(-a[0]+3*b[0]-3*cc[0]+d[0])*t3),0.5*((2*b[1])+(-a[1]+cc[1])*t+(2*a[1]-5*b[1]+4*cc[1]-d[1])*t2+(-a[1]+3*b[1]-3*cc[1]+d[1])*t3)]);}}c._mini=pts;}
  const pts=c._mini;
  if(!karts){x.fillStyle="#e3eee9";x.fillRect(0,0,cv.width,cv.height);}
  x.lineCap="round";x.lineJoin="round";x.strokeStyle="#2b2735";x.lineWidth=karts?cv.width/28:8;x.beginPath();pts.forEach((p,i)=>{const m=map(p[0],p[1]);i?x.lineTo(m[0],m[1]):x.moveTo(m[0],m[1]);});x.closePath();x.stroke();
  x.strokeStyle="#f2c14e";x.lineWidth=karts?cv.width/70:3;x.stroke();
  const P0=c.pts;const st=map(P0[0][0],P0[0][1]);x.fillStyle="#fff";x.fillRect(st[0]-4,st[1]-4,8,8);x.fillStyle="#111";x.fillRect(st[0]-4,st[1]-4,4,4);x.fillRect(st[0],st[1],4,4);
  if(karts)karts.forEach(k=>{const p=k.pos;const m=map(p.x,p.z);x.fillStyle=k.player?"#e8604c":k.racer.css;const rr=cv.width/(k.player?26:34);x.beginPath();x.arc(m[0],m[1],rr,0,7);x.fill();if(k.player){x.strokeStyle="#2b2735";x.lineWidth=cv.width/80;x.stroke();}});
}
/* ---------- car shape (side profile) shared by the 3D model and the menu picture ---------- */
function gpProfile(S){const T=THREE,hl=S.len/2,b=S.ride,aF=S.rad+0.08,aR=S.radR+0.08,xf=hl-0.95,xr=-hl+0.95;
  const s=new T.Shape();s.moveTo(-hl+0.1,b);s.lineTo(xr-aR,b);s.absarc(xr,S.radR,aR,Math.PI,0,true);s.lineTo(xr+aR,b);s.lineTo(xf-aF,b);s.absarc(xf,S.rad,aF,Math.PI,0,true);s.lineTo(xf+aF,b);s.lineTo(hl-0.08,b);
  s.quadraticCurveTo(hl+0.06,b+0.04,hl+0.04,(b+S.nose)/2);s.quadraticCurveTo(hl+0.02,S.nose,hl-0.3,S.nose+0.03);s.lineTo(S.cabF,S.hood);s.lineTo(S.cabR,S.belt);
  const dx=Math.min(-hl+0.3,S.cabR-0.1);s.lineTo(dx,S.deck);s.quadraticCurveTo(-hl-0.02,S.deck,-hl,S.tail);s.lineTo(-hl+0.02,b+0.08);s.lineTo(-hl+0.1,b);
  let c=null;if(!S.open){c=new T.Shape();c.moveTo(S.cabF,S.hood-0.03);c.quadraticCurveTo((S.cabF+S.roofF)/2+0.12,(S.hood+S.roof)/2+0.06,S.roofF,S.roof);c.lineTo(S.roofR,S.roof);
    c.quadraticCurveTo((S.roofR+S.cabR)/2-0.06,(S.roof+S.belt)/2+0.08,S.cabR,S.belt-0.03);c.lineTo(S.cabF,S.hood-0.03);}
  return{body:s,cabin:c,xf,xr,hl};}
function gpCarDraw(cv,car,paint){if(!cv||!window.THREE||!car)return;const S=GP_SHAPE[car.type],pr=gpProfile(S),x=cv.getContext("2d"),Wc=cv.width,Hc=cv.height;x.clearRect(0,0,Wc,Hc);
  const sc=Math.min(Wc/(4.8+1.0),(Hc-24)/(2.08+0.5));const ox=Wc/2,oy=Hc-18;const P2=p=>[ox+p.x*sc,oy-p.y*sc];
  x.fillStyle="rgba(0,0,0,.45)";x.beginPath();x.ellipse(ox,oy+3,S.len*sc*0.52,7,0,0,7);x.fill();
  const path=sh=>{const pts=sh.getPoints(14);x.beginPath();pts.forEach((p,i)=>{const q=P2(p);i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]);});x.closePath();};
  if(pr.cabin){path(pr.cabin);x.fillStyle="#bfe0e8";x.fill();x.strokeStyle="#2b2735";x.lineWidth=3;x.stroke();}
  path(pr.body);const g=x.createLinearGradient(0,oy-S.roof*sc,0,oy);g.addColorStop(0,"#fff");g.addColorStop(0.18,paint);g.addColorStop(1,paint);x.fillStyle=g;x.fill();x.strokeStyle="#2b2735";x.lineWidth=3;x.stroke();
  if(S.bed){const a=P2({x:-pr.hl+0.12,y:S.deck+0.32}),b2=P2({x:S.cabR-0.06,y:S.deck+0.32});x.strokeStyle="#2b2735";x.lineWidth=4;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b2[0],b2[1]);x.stroke();x.strokeStyle="#d9553f";x.lineWidth=5;const r0=P2({x:S.cabR-0.1,y:S.deck}),r1=P2({x:S.cabR-0.1,y:S.deck+0.9});x.beginPath();x.moveTo(r0[0],r0[1]);x.lineTo(r1[0],r1[1]);x.stroke();}
  x.fillStyle="rgba(0,0,0,.18)";x.fillRect(ox-pr.hl*sc,oy-(S.ride+0.12)*sc,S.len*sc,0.12*sc);
  if(S.wing==="big"){const a=P2({x:-pr.hl+0.32,y:S.deck+0.46});x.fillStyle="#15171c";x.fillRect(a[0]-0.34*sc,a[1],0.68*sc,0.11*sc);x.fillRect(a[0]-0.06*sc,a[1],0.08*sc,0.46*sc);}
  if(S.wing==="duck"){const a=P2({x:-pr.hl+0.05,y:S.deck+0.12});x.fillStyle="#15171c";x.fillRect(a[0],a[1],0.4*sc,0.09*sc);}
  if(S.type==="muscle"){const a=P2({x:0.9,y:S.nose+0.2});x.fillStyle="#15171c";x.fillRect(a[0]-0.35*sc,a[1],0.7*sc,0.1*sc);x.fillStyle="rgba(255,255,255,.85)";x.fillRect(ox-pr.hl*sc,oy-(S.belt-0.14)*sc,S.len*sc,0.07*sc);}
  if(S.rack){const a=P2({x:S.roofR,y:S.roof+0.18});x.fillStyle="#222";x.fillRect(a[0],a[1],(S.roofF-S.roofR)*sc,0.06*sc);x.fillStyle="#ffd166";x.fillRect(a[0]+(S.roofF-S.roofR)*sc-0.3*sc,a[1]-0.06*sc,0.28*sc,0.06*sc);}
  const hlp=P2({x:pr.hl-0.05,y:(S.ride+S.nose)/2+0.08});x.fillStyle="#fff6d5";x.fillRect(hlp[0]-0.18*sc,hlp[1]-0.04*sc,0.2*sc,0.08*sc);
  const tl=P2({x:-pr.hl+0.02,y:S.tail-0.08});x.fillStyle="#ff2a2a";x.fillRect(tl[0],tl[1]-0.04*sc,0.12*sc,0.08*sc);
  [[pr.xf,S.rad],[pr.xr,S.radR]].forEach(([wx,r])=>{const q=P2({x:wx,y:r});x.fillStyle="#0d0d0f";x.beginPath();x.arc(q[0],q[1],r*sc,0,7);x.fill();x.fillStyle="#c9ced6";x.beginPath();x.arc(q[0],q[1],r*sc*0.62,0,7);x.fill();
    x.strokeStyle="#3a3d45";x.lineWidth=Math.max(2,r*sc*0.12);for(let k=0;k<5;k++){const a=k*1.2566;x.beginPath();x.moveTo(q[0],q[1]);x.lineTo(q[0]+Math.cos(a)*r*sc*0.58,q[1]+Math.sin(a)*r*sc*0.58);x.stroke();}
    x.fillStyle="#555";x.beginPath();x.arc(q[0],q[1],r*sc*0.14,0,7);x.fill();});
}
/* ---------- textures drawn on canvases ---------- */
function gpCanvasTex(w,h,draw,repeat){const cv=document.createElement("canvas");cv.width=w;cv.height=h;draw(cv.getContext("2d"),w,h);const t=new THREE.CanvasTexture(cv);if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=window._gpAniso||4;if(THREE.sRGBEncoding)t.encoding=THREE.sRGBEncoding;return t;}
function gpTextTex(text,bg,fg,w,h,size){return gpCanvasTex(w||512,h||128,(x,W,H)=>{if(Array.isArray(bg)){const g=x.createLinearGradient(0,0,W,0);bg.forEach((c,i)=>g.addColorStop(i/(bg.length-1),c));x.fillStyle=g;}else x.fillStyle=bg;x.fillRect(0,0,W,H);x.fillStyle=fg;x.font="italic 900 "+(size||64)+"px system-ui";x.textAlign="center";x.textBaseline="middle";x.shadowColor="rgba(0,0,0,.4)";x.shadowBlur=6;x.fillText(text,W/2,H/2+2);});}
function gpSoftDot(){return gpCanvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.35,"rgba(255,255,255,.7)");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(0,0,w,h);});}
function gpParticles(T,scene,n,size,additive,opacity){
  const g=new T.BufferGeometry();const pos=new Float32Array(n*3),col=new Float32Array(n*3);for(let i=0;i<n;i++)pos[i*3+1]=-999;
  g.setAttribute("position",new T.BufferAttribute(pos,3));g.setAttribute("color",new T.BufferAttribute(col,3));
  const m=new T.PointsMaterial({size,map:gpSoftDot(),vertexColors:true,transparent:true,opacity:opacity||1,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending,sizeAttenuation:true});
  const pts=new T.Points(g,m);pts.frustumCulled=false;scene.add(pts);
  return{pts,g,pos,col,n,additive,life:new Float32Array(n),max:new Float32Array(n),vel:new Float32Array(n*3),c0:new Float32Array(n*3),next:0,live:0,
    emit(x,y,z,vx,vy,vz,r,gg,b,life){const i=this.next;this.next=(i+1)%this.n;const k=i*3;this.pos[k]=x;this.pos[k+1]=y;this.pos[k+2]=z;this.vel[k]=vx;this.vel[k+1]=vy;this.vel[k+2]=vz;this.c0[k]=r;this.c0[k+1]=gg;this.c0[k+2]=b;this.col[k]=r;this.col[k+1]=gg;this.col[k+2]=b;this.life[i]=life;this.max[i]=life;this.live=1;},
    update(dt,grav){if(!this.live)return;let any=0;for(let i=0;i<this.n;i++){if(this.life[i]<=0)continue;this.life[i]-=dt;const k=i*3;if(this.life[i]<=0){this.pos[k+1]=-999;continue;}any=1;
      this.vel[k+1]-=grav*dt;this.pos[k]+=this.vel[k]*dt;this.pos[k+1]+=this.vel[k+1]*dt;this.pos[k+2]+=this.vel[k+2]*dt;
      const f=this.life[i]/this.max[i];if(this.additive){this.col[k]=this.c0[k]*f;this.col[k+1]=this.c0[k+1]*f;this.col[k+2]=this.c0[k+2]*f;}}
      this.live=any;this.g.attributes.position.needsUpdate=true;this.g.attributes.color.needsUpdate=true;}};
}
/* ---------- the race ---------- */
async function startRace3D(cid){
  clearTimers();closeOverlay();showAnanseCorner(false);gpStop();
  GPA.init(); // inside the tap on a route card, which is what iOS needs to allow sound
  const C=GP_CIRCUITS.find(c=>c.id===cid)||GP_CIRCUITS[0];
  app.innerHTML='<div class="fadein center" style="padding-top:20vh"><div class="ananse-wrap">'+ananseSVG(100,"idle")+'</div><h2 style="color:#fff">Heading to the festival…</h2><p class="muted" style="color:#ffd2e6">Loading '+esc(C.name)+'…</p></div>';
  try{await loadThree();}catch(e){toast("3D engine could not load — using the classic racer");startRace2D(cid==="palm"?"accra":(cid==="stadium"?"nebula":"skybridge"));return;}
  try{gpBuild(C);}catch(e){console.error(e);gpStop();toast("3D racer hit a problem — using the classic racer");startRace2D(cid==="palm"?"accra":(cid==="stadium"?"nebula":"skybridge"));}
}
function gpBuild(C){
  gpCss();
  const myCar=gpCar(),myPaint=gpPaint(),L=C.look;
  if(P&&typeof P.gpMute==="boolean")GPA.muted=P.gpMute;GPA.setMute(GPA.muted);
  app.innerHTML='<div class="fadein gp3-wrap v3" id="gp3">'
   +'<canvas id="gp3c"></canvas><div class="fz-vig"></div>'
   +'<div class="gp3-touch" id="gp3L"></div><div class="gp3-touch right" id="gp3R"></div>'
   +'<div class="fz-tl"><div class="fz-pos" id="gp3Pos"'+(gpMode()==="free"?' style="display:none"':'')+'>5<small>th</small><em>/5</em></div><div class="fz-lap" id="gp3Lap">LAP 1/'+C.laps+'</div><div class="fz-time" id="gp3Time">0:00.0</div><div class="fz-song" id="gp3Song"'+(gpMode()==="free"?'':' style="display:none"')+'></div></div>'
   +'<canvas class="gp3-map" id="gp3Map" width="300" height="220"></canvas>'
   +'<div class="fz-skill" id="gp3Skill"></div>'
   +'<canvas class="fz-tach" id="gp3Tach" width="300" height="300"></canvas>'
   +'<button class="fz-btn mute" id="gp3Mute" aria-label="Sound on or off">'+(GPA.muted?"🔇":"🔊")+'</button>'
   +'<button class="fz-btn quit" id="gp3Quit" aria-label="Quit race" onclick="renderCircuits()">✕</button>'
   +'<div class="gp3-msg" id="gp3Msg"></div>'
   +'<div class="gp3-card" id="gp3Card"><b>'+esc(C.name)+'</b><small>'+(gpMode()==="free"?"Free drive · ":"Race · ")+esc(L.time)+' · '+esc(myCar.n)+'</small></div>'
   +'<div class="gp3-count" id="gp3Count"></div>'
   +'<div class="gp3-pad l"><button class="race-btn" id="rcL" aria-label="Steer left">◀</button><button class="race-btn" id="rcR" aria-label="Steer right">▶</button></div>'
   +'<div class="gp3-pad r"><button class="race-btn txt brake" id="rcB" aria-label="Brake">BRAKE</button><button class="race-btn txt drift" id="rcD" aria-label="Drift">DRIFT</button></div>'
   +'</div>'
   +'<div class="center fz-quit-row"><button class="readbtn" onclick="renderCircuits()">⟵ Quit race</button></div>';
  const T=THREE,canvas=$("gp3c"),UP=new T.Vector3(0,1,0);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  const pr0=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(pr0);
  if(T.sRGBEncoding)renderer.outputEncoding=T.sRGBEncoding;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():4);window._gpAniso=aniso;
  const scene=new T.Scene();scene.fog=new T.Fog(gpLin(L.paper),140,820);
  const camera=new T.PerspectiveCamera(58,16/9,0.6,1800);
  const post=gpPostSetup(T,renderer,L);
  const phone=Math.min(window.screen.width||999,window.screen.height||999,Math.max(innerWidth,innerHeight))<600||Math.min(innerWidth,innerHeight)<520;
  // lights
  const sunDir=new T.Vector3(L.dir[0],L.dir[1],L.dir[2]).normalize();
  scene.add(new T.HemisphereLight(gpLin(L.hor),gpLin(C.grass),L.hemi));
  const sun=new T.DirectionalLight(gpLin(L.sun),L.sunI);sun.castShadow=true;
  sun.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);const sc=sun.shadow.camera;sc.left=-46;sc.right=46;sc.top=46;sc.bottom=-46;sc.near=5;sc.far=420;sun.shadow.bias=-0.0005;if("normalBias" in sun.shadow)sun.shadow.normalBias=0.04;
  scene.add(sun);scene.add(sun.target);
  // sky dome with a sun disc and glow
  const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new T.Color(L.top)},hor:{value:new T.Color(L.hor)},glow:{value:new T.Color(L.glow)},sunDir:{value:sunDir}},
    vertexShader:"varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:"uniform vec3 top;uniform vec3 hor;uniform vec3 glow;uniform vec3 sunDir;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.0,1.0);vec3 c=mix(hor,top,pow(h,0.5));float s=max(dot(d,sunDir),0.0);c+=glow*(smoothstep(0.9985,0.9993,s)*1.6+pow(s,60.0)*0.35+pow(s,6.0)*0.1);if(d.y<0.0)c=hor;gl_FragColor=vec4(c,1.0);}"});
  const sky=new T.Mesh(new T.SphereGeometry(1400,32,16),skyMat);sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);
  // paint reflections: small painted panorama → environment map
  let envRT=null;
  // ---- the road: follows rolling hills ----
  const HA=C.hills||3,ph=C.id.length*1.7;
  const hgt=(x,z)=>HA*(Math.sin(x*0.011+ph)*Math.cos(z*0.013-ph*0.7)+0.55*Math.sin((x+z)*0.019+ph*1.3)+0.25*Math.cos((x-z)*0.031))+(C.sea?6:0);
  const SEA=C.sea?-1.3:null;
  const curve=new T.CatmullRomCurve3(C.pts.map(p=>new T.Vector3(p[0],hgt(p[0],p[1]),p[1])),true,"centripetal",0.6);
  const M=700,W=7.5;const len=curve.getLength();
  const samples=[];for(let i=0;i<=M;i++){const t=(i/M)%1;const pos=curve.getPointAt(t);const tan=curve.getTangentAt(t).normalize();const nor=new T.Vector3(-tan.z,0,tan.x).normalize();samples.push({pos,tan,nor});}
  // terrain height: flat under the road, blending out to the natural hills
  const CELL=24,hash=new Map();for(let i=0;i<M;i++){const p=samples[i].pos;const k=Math.floor(p.x/CELL)+","+Math.floor(p.z/CELL);let l=hash.get(k);if(!l){l=[];hash.set(k,l);}l.push(i);}
  const nearest=(x,z)=>{const cx0=Math.floor(x/CELL),cz0=Math.floor(z/CELL);let bd=1e12,bi=-1;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const l=hash.get((cx0+a)+","+(cz0+b));if(!l)continue;for(const i of l){const p=samples[i].pos;const d=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z);if(d<bd){bd=d;bi=i;}}}return[bi,Math.sqrt(bd)];};
  const RW=W+3.6,BL=34;
  const groundAt=(x,z)=>{const n=nearest(x,z);let h=hgt(x,z);if(n[0]<0)return SEA!==null?SEA-6:h;const rp=samples[n[0]].pos;const ry=rp.y-0.14;if(n[1]<=RW)return ry;
    if(SEA!==null){const outer=((x-cx)*(x-cx)+(z-cz)*(z-cz))>((rp.x-cx)*(rp.x-cx)+(rp.z-cz)*(rp.z-cz));if(outer)h=SEA-6;}
    const t=Math.min(1,(n[1]-RW)/BL);const e=t*t*(3-2*t);return ry+(h-ry)*e;};
  let cx=0,cz=0;C.pts.forEach(p=>{cx+=p[0];cz+=p[1];});cx/=C.pts.length;cz/=C.pts.length;
  const gh="#"+C.grass.toString(16).padStart(6,"0");
  const grassTex=gpCanvasTex(256,256,(x,w,h)=>{x.fillStyle=gh;x.fillRect(0,0,w,h);for(let i=0;i<60;i++){const r=10+Math.random()*40;x.fillStyle=Math.random()<0.5?"rgba(0,0,0,.05)":"rgba(255,240,160,.06)";x.beginPath();x.arc(Math.random()*w,Math.random()*h,r,0,7);x.fill();}
    for(let i=0;i<2600;i++){x.fillStyle=Math.random()<0.5?"rgba(0,0,0,.08)":"rgba(255,255,190,.07)";x.fillRect(Math.random()*w,Math.random()*h,1.5,3);}},true);grassTex.repeat.set(110,110);
  const TG=new T.PlaneGeometry(1500,1500,150,150);TG.rotateX(-Math.PI/2);const tp=TG.attributes.position;for(let i=0;i<tp.count;i++){const x=tp.getX(i)+cx,z=tp.getZ(i)+cz;tp.setXYZ(i,x,groundAt(x,z),z);}TG.computeVertexNormals();
  const ground=new T.Mesh(TG,new T.MeshLambertMaterial({map:grassTex}));ground.receiveShadow=true;scene.add(ground);
  let seaTex=null;if(C.sea){seaTex=gpCanvasTex(256,256,(x,w,h)=>{x.fillStyle=C.sea;x.fillRect(0,0,w,h);for(let i=0;i<600;i++){x.fillStyle="rgba(255,255,255,.05)";x.fillRect(Math.random()*w,Math.random()*h,3,2);}x.strokeStyle="rgba(255,255,255,.6)";x.lineWidth=2.5;x.lineCap="round";for(let i=0;i<24;i++){const px=Math.random()*w,py=Math.random()*h,l=12+Math.random()*26;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+l/2,py-5,px+l,py);x.stroke();}},true);seaTex.repeat.set(46,46);
    const sea=new T.Mesh(new T.PlaneGeometry(4200,4200),new T.MeshLambertMaterial({map:seaTex}));sea.rotation.x=-Math.PI/2;sea.position.set(cx,SEA,cz);sea.receiveShadow=true;scene.add(sea);}
  const ribbon=(inner,outer,mat,yIn,yOut,vScale)=>{const g=new T.BufferGeometry();const v=[],uv=[],idx=[];for(let i=0;i<=M;i++){const s=samples[i];const a=s.pos.clone().addScaledVector(s.nor,inner),b=s.pos.clone().addScaledVector(s.nor,outer);v.push(a.x,s.pos.y+yIn,a.z,b.x,s.pos.y+yOut,b.z);uv.push(0,i*vScale,1,i*vScale);if(i<M){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.receiveShadow=true;return m;};
  const roadTex=gpCanvasTex(512,512,(x,w,h)=>{x.fillStyle="#d8c9b4";x.fillRect(0,0,w,h);for(let i=0;i<40;i++){x.fillStyle=Math.random()<0.5?"rgba(160,140,120,.07)":"rgba(255,255,255,.1)";x.beginPath();x.arc(Math.random()*w,Math.random()*h,20+Math.random()*50,0,7);x.fill();}x.strokeStyle="rgba(120,104,96,.12)";x.lineWidth=2;for(let i=1;i<4;i++){x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke();}x.fillStyle="#f2b92e";x.fillRect(w/2-12,h*0.08,24,h*0.46);x.strokeStyle="#2b2735";x.lineWidth=3;x.strokeRect(w/2-12,h*0.08,24,h*0.46);x.fillStyle="#2b2735";x.fillRect(0,0,9,h);x.fillRect(w-9,0,9,h);x.fillStyle="#f7f2ea";x.fillRect(16,0,8,h);x.fillRect(w-24,0,8,h);if(0){x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=40+Math.random()*55|0;x.fillStyle="rgba("+v+","+v+","+(v+4)+",.55)";x.fillRect(Math.random()*w,Math.random()*h,2,2);}
    const gr=x.createLinearGradient(0,0,w,0);[[0,0],[.25,.22],[.38,0],[.62,0],[.75,.22],[1,0]].forEach(s=>gr.addColorStop(s[0],"rgba(8,8,10,"+s[1]+")"));x.fillStyle=gr;x.fillRect(0,0,w,h);
    }},true);
  scene.add(ribbon(-W,W,new T.MeshLambertMaterial({map:roadTex}),0.03,0.03,(len/M)/(2*W)));
  const gravTex=gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle="#e9d9b8";x.fillRect(0,0,w,h);x.fillStyle="#d9785f";x.fillRect(0,0,14,h);x.fillRect(w-14,0,14,h);if(0){x.fillStyle="#8d8062";x.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=90+Math.random()*80|0;x.fillStyle="rgba("+v+","+(v-8)+","+(v-25)+",.6)";x.fillRect(Math.random()*w,Math.random()*h,2,2);}}},true);
  const gravMat=new T.MeshStandardMaterial({map:gravTex,roughness:1});scene.add(ribbon(-W-3.4,-W,gravMat,-0.1,0.02,0.4));scene.add(ribbon(W,W+3.4,gravMat,0.02,-0.1,0.4));
  // ---- festival hub at the start line ----
  const s0=samples[0],sStart=s0.pos.clone();const standRanges=[[M-24,M],[0,24]];
  const inStands=i=>standRanges.some(([a,b])=>i>=a-4&&i<=b+4);
  const pinkMat=new T.MeshLambertMaterial({color:0xe8604c}),orangeMat=new T.MeshLambertMaterial({color:0xf2c14e});
  [[W+3.2,0.55,pinkMat,0],[W+2.2,0.35,orangeMat,1.3]].forEach(([r,tb,mat,off])=>{const arch=new T.Mesh(new T.TorusGeometry(r,tb,10,48,Math.PI),mat);arch.position.copy(sStart).addScaledVector(s0.tan,off);arch.lookAt(arch.position.clone().add(s0.tan));arch.castShadow=true;scene.add(arch);});
  const banner=new T.Mesh(new T.BoxGeometry(12,1.8,0.5),new T.MeshStandardMaterial({map:gpTextTex("GRAND FABLE ROAD TRIP",["#f7f0e1","#f7f0e1"],"#2b2735",1024,160,86),roughness:0.5}));banner.position.copy(sStart).add(new T.Vector3(0,W+3.4,0));banner.lookAt(banner.position.clone().add(s0.tan));banner.castShadow=true;scene.add(banner);
  const lapScreen=new T.Mesh(new T.BoxGeometry(5,3,0.5),new T.MeshBasicMaterial({map:gpTextTex("LAP 1",["#f7f0e1","#f7f0e1"],"#e8604c",512,300,120)}));lapScreen.position.copy(sStart).add(new T.Vector3(0,W+6.4,0));lapScreen.lookAt(lapScreen.position.clone().add(s0.tan));scene.add(lapScreen);
  const flagCols=[0xe8604c,0xf2c14e,0x7cc6b6,0x6b8fd6,0xc98bb9];const poleMat=new T.MeshStandardMaterial({color:0xdddddd,roughness:0.4,metalness:0.6});
  let fc=0;for(const [a,b] of [[M-60,M],[0,60]])for(let i=a;i<b;i+=10){const s=samples[i%M];[-1,1].forEach(side=>{const p=s.pos.clone().addScaledVector(s.nor,side*(W+4.6));const y=groundAt(p.x,p.z);const pole=new T.Mesh(new T.CylinderGeometry(0.08,0.1,7,6),poleMat);pole.position.set(p.x,y+3.5,p.z);scene.add(pole);
    const fl=new T.Mesh(new T.PlaneGeometry(1.2,2.6),new T.MeshStandardMaterial({color:flagCols[fc++%flagCols.length],side:T.DoubleSide,roughness:0.7}));fl.position.set(p.x,y+5.4,p.z);fl.lookAt(fl.position.clone().add(s.nor));fl.translateX(0.62*side);fl.castShadow=true;scene.add(fl);});}
  const dummy=new T.Object3D();
  // ---- seaside town: pastel houses with terracotta roofs ----
  const innerSide=s=>{const a=s.pos.clone().addScaledVector(s.nor,20),b=s.pos.clone().addScaledVector(s.nor,-20);return ((a.x-cx)*(a.x-cx)+(a.z-cz)*(a.z-cz))<((b.x-cx)*(b.x-cx)+(b.z-cz)*(b.z-cz))?1:-1;};
  const houses=[];for(let i=0;i<M;i+=5){if(Math.random()<0.4)continue;const s=samples[i];const side=C.sea?innerSide(s):(Math.random()<0.5?-1:1);const p=s.pos.clone().addScaledVector(s.nor,side*(W+13+Math.random()*24));const y=groundAt(p.x,p.z);if(C.sea&&y<0.5)continue;houses.push([p.x,y,p.z,2.6+Math.random()*2.2,2.4+Math.random()*3.4,Math.atan2(s.tan.x,s.tan.z),i]);}
  const winTex=gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle="#fff";x.fillRect(0,0,w,h);x.fillStyle="#56738c";[[22,26],[74,26],[22,74],[74,74]].forEach(q=>{x.fillRect(q[0],q[1],30,30);});x.strokeStyle="#fff";x.lineWidth=3;[[22,26],[74,26],[22,74],[74,74]].forEach(q=>{x.strokeRect(q[0]+1,q[1]+1,28,28);x.beginPath();x.moveTo(q[0]+15,q[1]);x.lineTo(q[0]+15,q[1]+30);x.stroke();});x.fillStyle="#c9553f";x.fillRect(48,98,26,30);});
  const wallCols=[0xf7f0e1,0xf4e3c3,0xe9f0ee,0xf6d9cf,0xdfe8f5],roofCols=[0xd9624a,0xc9553f,0xe07a55,0x6d8fb3];
  if(houses.length){const hb=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({map:winTex}),houses.length);const rg=new T.ConeGeometry(0.78,0.7,4);rg.rotateY(Math.PI/4);const hr=new T.InstancedMesh(rg,new T.MeshLambertMaterial({color:0xffffff}),houses.length);
    houses.forEach((h,k)=>{dummy.position.set(h[0],h[1]+h[4]/2,h[2]);dummy.rotation.set(0,h[5],0);dummy.scale.set(h[3],h[4],h[3]*1.1);dummy.updateMatrix();hb.setMatrixAt(k,dummy.matrix);hb.setColorAt(k,gpLin(wallCols[k%wallCols.length]));
      dummy.position.set(h[0],h[1]+h[4]+h[3]*0.34,h[2]);dummy.scale.set(h[3]*1.3,h[3],h[3]*1.42);dummy.updateMatrix();hr.setMatrixAt(k,dummy.matrix);hr.setColorAt(k,gpLin(roofCols[(h[6]>>3)%roofCols.length]));});
    [hb,hr].forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;scene.add(m);});}
  // ---- street lamps (glow at dusk) ----
  const inkCol=new T.Color(L.ink).getHex();const lamps=[];for(let i=6;i<M;i+=16){const s=samples[i];[-1,1].forEach(side=>{const p=s.pos.clone().addScaledVector(s.nor,side*(W+4.4));const q=p.clone().addScaledVector(s.nor,-side*0.85);lamps.push([p.x,groundAt(p.x,p.z),p.z,q.x,q.z]);});}
  const poleCol=0x6f6880;const lpg=new T.CylinderGeometry(0.05,0.07,5.2,6);lpg.translate(0,2.6,0);const lpIM=new T.InstancedMesh(lpg,new T.MeshLambertMaterial({color:poleCol}),lamps.length);const armIM=new T.InstancedMesh(new T.BoxGeometry(0.06,0.06,1),new T.MeshLambertMaterial({color:poleCol}),lamps.length);const lhIM=new T.InstancedMesh(new T.SphereGeometry(L.night?0.42:0.28,10,8),new T.MeshBasicMaterial({color:0xfff1c9}),lamps.length);
  lamps.forEach((l,k)=>{dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.position.set(l[0],l[1],l[2]);dummy.updateMatrix();lpIM.setMatrixAt(k,dummy.matrix);dummy.position.set(l[3],l[1]+5.15,l[4]);dummy.updateMatrix();lhIM.setMatrixAt(k,dummy.matrix);dummy.position.set((l[0]+l[3])/2,l[1]+5.25,(l[2]+l[4])/2);dummy.lookAt(l[3],l[1]+5.25,l[4]);dummy.scale.set(1,1,0.85);dummy.updateMatrix();armIM.setMatrixAt(k,dummy.matrix);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);});lpIM.castShadow=true;scene.add(lpIM);scene.add(armIM);scene.add(lhIM);
  // ---- lantern strings across the road ----
  const lanCols=[0xe8604c,0xf2c14e,0x7cc6b6,0x6b8fd6,0xc98bb9];const lanPts=[];
  [0.13,0.38,0.63,0.86].forEach(f=>{const s=samples[Math.floor(M*f)];const a=s.pos.clone().addScaledVector(s.nor,W+4.4),b=s.pos.clone().addScaledVector(s.nor,-(W+4.4));const ya=groundAt(a.x,a.z),yb=groundAt(b.x,b.z);
    [[a,ya],[b,yb]].forEach(([q,y])=>{const pl=new T.Mesh(lpg,new T.MeshLambertMaterial({color:0x6f6880}));pl.position.set(q.x,y,q.z);pl.scale.set(1,1.3,1);pl.castShadow=true;scene.add(pl);});
    const line=[];for(let k=0;k<=14;k++){const u=k/14;const x=a.x+(b.x-a.x)*u,z=a.z+(b.z-a.z)*u,y=ya+(yb-ya)*u+6.6-Math.sin(Math.PI*u)*1.5;line.push(new T.Vector3(x,y,z));if(k>0&&k<14)lanPts.push([x,y-0.25,z,k]);}
    scene.add(new T.Line(new T.BufferGeometry().setFromPoints(line),new T.LineBasicMaterial({color:inkCol})));});
  const lanIM=new T.InstancedMesh(new T.SphereGeometry(0.3,10,8),new T.MeshBasicMaterial({color:0xffffff}),lanPts.length);lanPts.forEach((q,k)=>{dummy.position.set(q[0],q[1],q[2]);dummy.updateMatrix();lanIM.setMatrixAt(k,dummy.matrix);lanIM.setColorAt(k,gpLin(lanCols[q[3]%lanCols.length]));});if(lanIM.instanceColor)lanIM.instanceColor.needsUpdate=true;scene.add(lanIM);
  // ---- villagers in straw hats ----
  const folk=[];for(let k=0;k<26;k++){const i=Math.floor(Math.random()*M);const s=samples[i];const side=C.sea?innerSide(s):(Math.random()<0.5?-1:1);const p=s.pos.clone().addScaledVector(s.nor,side*(W+5+Math.random()*3));const y=groundAt(p.x,p.z);if(C.sea&&y<0.5)continue;folk.push([p.x,y,p.z,k]);}
  if(folk.length){const shirts=[0xe8604c,0x6b8fd6,0x7cc6b6,0xc98bb9,0xf7f0e1],skins=[0x5a3825,0x7a4a2a,0x3d2616,0x9a6a45];
    const fb=new T.InstancedMesh(new T.CylinderGeometry(0.26,0.34,1.0,7),new T.MeshLambertMaterial({color:0xffffff}),folk.length),fh=new T.InstancedMesh(new T.SphereGeometry(0.21,10,8),new T.MeshLambertMaterial({color:0xffffff}),folk.length),fhat=new T.InstancedMesh(new T.CylinderGeometry(0.42,0.42,0.05,14),new T.MeshLambertMaterial({color:0xf2c14e}),folk.length);
    folk.forEach((f,k)=>{dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.position.set(f[0],f[1]+0.5,f[2]);dummy.updateMatrix();fb.setMatrixAt(k,dummy.matrix);fb.setColorAt(k,gpLin(shirts[k%shirts.length]));dummy.position.y=f[1]+1.2;dummy.updateMatrix();fh.setMatrixAt(k,dummy.matrix);fh.setColorAt(k,gpLin(skins[k%skins.length]));dummy.position.y=f[1]+1.36;dummy.updateMatrix();fhat.setMatrixAt(k,dummy.matrix);});
    [fb,fh].forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;});[fb,fh,fhat].forEach(m=>{m.castShadow=true;scene.add(m);});}
  // ---- floating islands in the sky ----
  const islands=[];const rockMat=new T.MeshLambertMaterial({color:0xe2d8ea}),capMat=new T.MeshLambertMaterial({color:0x9cc27a}),iwMat=new T.MeshLambertMaterial({color:0xf7f0e1}),irMat=new T.MeshLambertMaterial({color:0xd9624a}),itMat=new T.MeshLambertMaterial({color:0x5f9a62});
  for(let k=0;k<7;k++){const a=k/7*6.28+0.4,r=230+Math.random()*190;const g=new T.Group();const rock=new T.Mesh(new T.DodecahedronGeometry(15,0),rockMat);rock.scale.set(1,0.9,1);rock.position.y=-11;g.add(rock);const rock2=new T.Mesh(new T.DodecahedronGeometry(8,0),rockMat);rock2.position.set(3,-23,-2);g.add(rock2);const cap=new T.Mesh(new T.CylinderGeometry(15.5,15,3.2,10),capMat);cap.position.y=1;g.add(cap);
    if(k%2===0){const hb=new T.Mesh(new T.BoxGeometry(5,4,5),iwMat);hb.position.set(2,4,1);g.add(hb);const hr=new T.Mesh(new T.ConeGeometry(4.2,3,4),irMat);hr.rotation.y=Math.PI/4;hr.position.set(2,7.5,1);g.add(hr);}
    for(let q=0;q<3;q++){const tr=new T.Mesh(new T.ConeGeometry(2.2,7,7),itMat);tr.position.set(-6+q*3.5,5,-4+q*2);g.add(tr);}
    g.position.set(cx+Math.cos(a)*r,65+Math.random()*75,cz+Math.sin(a)*r);g.scale.setScalar(0.6+Math.random()*0.7);g.userData.bob=Math.random()*6;scene.add(g);islands.push(g);}
  // ---- roadside: fences, bushes, chevron signs, speed trap ----
  const railMat=new T.MeshLambertMaterial({color:0xd9785f,side:T.DoubleSide});
  const rail=(off,y0,y1)=>{const g=new T.BufferGeometry();const v=[],idx=[];for(let i=0;i<=M;i++){const s=samples[i];const a=s.pos.clone().addScaledVector(s.nor,off);const gy=groundAt(a.x,a.z);const hide=inStands(i%M);v.push(a.x,hide?gy-2:gy+y0,a.z,a.x,hide?gy-2:gy+y1,a.z);if(i<M){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,railMat);m.castShadow=true;return m;};
  [-1,1].forEach(side=>scene.add(rail(side*(W+3.9),0,0.7)));
  const bush=[];for(let i=0;i<M;i+=4){if(inStands(i)||Math.random()<0.45)continue;const s=samples[i];const side=Math.random()<0.5?-1:1;const p=s.pos.clone().addScaledVector(s.nor,side*(W+7.4+Math.random()*2.5));bush.push([p.x,groundAt(p.x,p.z),p.z,0.7+Math.random()*0.7]);}
  const bushIM=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:0xffffff,roughness:0.9}),Math.max(1,bush.length));
  bush.forEach((b,i)=>{dummy.position.set(b[0],b[1]+b[3]*0.55,b[2]);dummy.scale.set(b[3]*1.3,b[3],b[3]*1.3);dummy.rotation.set(0,i,0);dummy.updateMatrix();bushIM.setMatrixAt(i,dummy.matrix);bushIM.setColorAt(i,gpLin([0x3f7a3a,0x4d8a3f,0x5c8f3c,0x356b33][i%4]));});
  bushIM.count=bush.length;if(bushIM.instanceColor)bushIM.instanceColor.needsUpdate=true;bushIM.castShadow=true;scene.add(bushIM);
  const chevTex=gpCanvasTex(128,96,(x,w,h)=>{x.fillStyle="#c8102e";x.fillRect(0,0,w,h);x.fillStyle="#fff";for(let k=0;k<2;k++){const o=22+k*44;x.beginPath();x.moveTo(o+34,14);x.lineTo(o+14,48);x.lineTo(o+34,82);x.lineTo(o+22,82);x.lineTo(o+2,48);x.lineTo(o+22,14);x.closePath();x.fill();}x.strokeStyle="#fff";x.lineWidth=4;x.strokeRect(2,2,w-4,h-4);});
  const chev=[];for(let i=0;i<M;i+=6){if(inStands(i))continue;const a=samples[i],b=samples[(i+10)%M];const ang=Math.acos(Math.max(-1,Math.min(1,a.tan.x*b.tan.x+a.tan.z*b.tan.z)));if(ang<0.2)continue;const left=a.tan.clone().cross(b.tan).y>0;const side=left?1:-1;
    const p=a.pos.clone().addScaledVector(a.nor,side*(W+4.3));chev.push([p.x,groundAt(p.x,p.z),p.z,a.tan.clone(),left]);}
  if(chev.length){const bIM=new T.InstancedMesh(new T.PlaneGeometry(1.3,0.95),new T.MeshStandardMaterial({map:chevTex,roughness:0.5,side:T.DoubleSide}),chev.length);const pIM=new T.InstancedMesh(new T.CylinderGeometry(0.05,0.05,1.3,5),poleMat,chev.length);
    chev.forEach((c,i)=>{dummy.position.set(c[0],c[1]+1.55,c[2]);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.lookAt(new T.Vector3(c[0]-c[3].x,c[1]+1.55,c[2]-c[3].z));dummy.scale.set(c[4]?1:-1,1,1);dummy.updateMatrix();bIM.setMatrixAt(i,dummy.matrix);
      dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.position.set(c[0],c[1]+0.65,c[2]);dummy.updateMatrix();pIM.setMatrixAt(i,dummy.matrix);});bIM.castShadow=true;scene.add(bIM);scene.add(pIM);}
  // speed trap on the straightest stretch
  let trapI=Math.floor(M*0.3),bestStr=-9;for(let i=Math.floor(M*0.12);i<Math.floor(M*0.88);i+=4){if(inStands(i))continue;const a=samples[(i-25+M)%M].tan,b=samples[(i+25)%M].tan;const d=a.x*b.x+a.z*b.z;if(d>bestStr){bestStr=d;trapI=i;}}
  if(gpMode()==="race"){const s=samples[trapI];const p=s.pos.clone().addScaledVector(s.nor,W+3.8);const y=groundAt(p.x,p.z);const pole=new T.Mesh(new T.CylinderGeometry(0.12,0.14,4.4,8),poleMat);pole.position.set(p.x,y+2.2,p.z);pole.castShadow=true;scene.add(pole);
    const sign=new T.Mesh(new T.BoxGeometry(3.6,1.3,0.2),new T.MeshStandardMaterial({map:gpTextTex("SPEED TRAP",["#0a4dcc","#0a2a88"],"#fff",512,180,78),roughness:0.4}));sign.position.set(p.x,y+4.6,p.z);sign.lookAt(sign.position.clone().sub(s.tan));sign.castShadow=true;scene.add(sign);
    const cam=new T.Mesh(new T.BoxGeometry(0.5,0.4,0.7),new T.MeshStandardMaterial({color:0x222222,roughness:0.4}));cam.position.set(p.x,y+3.7,p.z);scene.add(cam);}
  // ---- trees, rocks, hills, clouds ----
  const spots=[];for(let i=0;i<M;i+=5){if(inStands(i))continue;const s=samples[i];for(let r=0;r<3;r++){if(r&&Math.random()<0.45)continue;const side=Math.random()<0.5?-1:1;const p=s.pos.clone().addScaledVector(s.nor,side*(W+12+r*16+Math.random()*16));spots.push([p.x,groundAt(p.x,p.z),p.z,0.8+Math.random()*0.6,Math.random()*6.28,Math.random()]);}}
  for(let k=0;k<260;k++){const a=Math.random()*6.28,r=160+Math.random()*420;const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(nearest(x,z)[1]<W+20)continue;spots.push([x,groundAt(x,z),z,0.9+Math.random()*0.8,Math.random()*6.28,Math.random()]);}
  if(C.sea)for(let k=spots.length-1;k>=0;k--)if(spots[k][1]<0.4)spots.splice(k,1);
  const trunkMat=new T.MeshLambertMaterial({color:0x8a6445});
  const leafGreens=C.id==="hills"?[0x2f5e2e,0x3b6b33,0x6e7f2e,0x8a5a24,0x2a4f2c]:(C.id==="stadium"?[0x4c7a36,0x5d8a3a,0x7a8a3a,0x3f6b35]:[0x2e9e57,0x3cb371,0x27884a]);
  if(C.tree==="palm"){
    const trunkGeo=new T.CylinderGeometry(0.26,0.46,7,7);trunkGeo.translate(0,3.5,0);const trIM=new T.InstancedMesh(trunkGeo,trunkMat,spots.length);const frIM=new T.InstancedMesh(new T.ConeGeometry(0.9,4.4,4),new T.MeshStandardMaterial({color:0xffffff,roughness:0.8,side:T.DoubleSide}),spots.length*7);let fi=0;
    spots.forEach((s,i)=>{const lean=(s[5]-0.5)*0.25,lean2=(s[4]/6.28-0.5)*0.25;dummy.position.set(s[0],s[1],s[2]);dummy.rotation.set(lean,0,lean2);dummy.scale.set(s[3],s[3],s[3]);dummy.updateMatrix();trIM.setMatrixAt(i,dummy.matrix);
      const topv=new T.Vector3(0,7*s[3],0).applyEuler(new T.Euler(lean,0,lean2));for(let f=0;f<7;f++){const a=s[4]+f*Math.PI*2/7;const d=new T.Vector3(Math.cos(a),-0.3-((f*37)%10)/50,Math.sin(a)).normalize();
        dummy.position.set(s[0]+topv.x+d.x*2*s[3],s[1]+topv.y+d.y*2*s[3],s[2]+topv.z+d.z*2*s[3]);dummy.quaternion.setFromUnitVectors(UP,d);dummy.scale.set(s[3],s[3],s[3]*0.3);dummy.updateMatrix();frIM.setMatrixAt(fi,dummy.matrix);frIM.setColorAt(fi,gpLin(leafGreens[f%leafGreens.length]));fi++;}
      dummy.quaternion.identity();});
    frIM.count=fi;if(frIM.instanceColor)frIM.instanceColor.needsUpdate=true;trIM.castShadow=true;frIM.castShadow=true;scene.add(trIM);scene.add(frIM);
  }else{
    const conFrac=C.tree==="forest"?0.6:0.3;const con=spots.filter(s=>s[5]<conFrac),broad=spots.filter(s=>s[5]>=conFrac);
    const tg=new T.CylinderGeometry(0.3,0.5,3.2,6);tg.translate(0,1.6,0);
    const trIM=new T.InstancedMesh(tg,trunkMat,spots.length);let ti=0;
    const crIM=new T.InstancedMesh(new T.IcosahedronGeometry(2.6,1),new T.MeshStandardMaterial({color:0xffffff,roughness:0.85}),Math.max(1,broad.length*2));let ci=0;
    broad.forEach((s,i)=>{dummy.rotation.set(0,s[4],0);dummy.position.set(s[0],s[1],s[2]);dummy.scale.set(s[3],s[3],s[3]);dummy.updateMatrix();trIM.setMatrixAt(ti++,dummy.matrix);
      [[0,4.6,0,1],[1.2,5.6,0.6,0.72]].forEach(c=>{dummy.position.set(s[0]+c[0]*s[3],s[1]+c[1]*s[3],s[2]+c[2]*s[3]);dummy.scale.set(s[3]*c[3],s[3]*c[3]*0.85,s[3]*c[3]);dummy.updateMatrix();crIM.setMatrixAt(ci,dummy.matrix);crIM.setColorAt(ci,gpLin(leafGreens[(i+ci)%leafGreens.length]));ci++;});});
    const cg=new T.ConeGeometry(2.2,6.5,8);cg.translate(0,5.6,0);const cnIM=new T.InstancedMesh(cg,new T.MeshStandardMaterial({color:0xffffff,roughness:0.9}),Math.max(1,con.length*2));let ni=0;
    con.forEach((s,i)=>{dummy.rotation.set(0,s[4],0);dummy.position.set(s[0],s[1],s[2]);dummy.scale.set(s[3],s[3]*1.2,s[3]);dummy.updateMatrix();trIM.setMatrixAt(ti++,dummy.matrix);
      [[0,1],[2.4,0.72]].forEach(c=>{dummy.position.set(s[0],s[1]+c[0]*s[3],s[2]);dummy.scale.set(s[3]*c[1],s[3]*c[1]*1.15,s[3]*c[1]);dummy.updateMatrix();cnIM.setMatrixAt(ni,dummy.matrix);cnIM.setColorAt(ni,gpLin([0x1f4a2a,0x25542e,0x2d5f33][(i+ni)%3]));ni++;});});
    trIM.count=ti;crIM.count=ci;cnIM.count=ni;[crIM,cnIM].forEach(m=>{if(m.instanceColor)m.instanceColor.needsUpdate=true;});[trIM,crIM,cnIM].forEach(m=>{m.castShadow=true;scene.add(m);});
    if(C.tree==="forest"){const rocks=[];for(let k=0;k<70;k++){const i=Math.floor(Math.random()*M);if(inStands(i))continue;const s=samples[i];const side=Math.random()<0.5?-1:1;const p=s.pos.clone().addScaledVector(s.nor,side*(W+9+Math.random()*25));rocks.push([p.x,groundAt(p.x,p.z),p.z,0.6+Math.random()*1.6]);}
      const rIM=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x8a8478,roughness:0.95,flatShading:true}),Math.max(1,rocks.length));rocks.forEach((r,i)=>{dummy.position.set(r[0],r[1]+r[3]*0.3,r[2]);dummy.rotation.set(i,i*2,i*3);dummy.scale.set(r[3]*1.3,r[3],r[3]);dummy.updateMatrix();rIM.setMatrixAt(i,dummy.matrix);});rIM.count=rocks.length;rIM.castShadow=true;rIM.receiveShadow=true;scene.add(rIM);}
  }
  const hillMat=new T.MeshStandardMaterial({color:new T.Color(L.hill),roughness:1,flatShading:true});
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2+Math.random()*0.25,r=690+Math.random()*140;const h=new T.Mesh(new T.IcosahedronGeometry(1,2),hillMat);h.position.set(cx+Math.cos(a)*r,-16,cz+Math.sin(a)*r);h.scale.set(150+Math.random()*110,(C.id==="hills"?90:50)+Math.random()*60,150+Math.random()*110);scene.add(h);}
  const cloudTex=gpCanvasTex(256,128,(x,w,h)=>{[[70,80,40],[120,60,52],[180,78,40],[100,92,34],[150,94,36]].forEach(c=>{const g=x.createRadialGradient(c[0],c[1]-c[2]*0.3,c[2]*0.1,c[0],c[1],c[2]);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(0.7,"rgba(245,248,255,.85)");g.addColorStop(1,"rgba(230,236,248,0)");x.fillStyle=g;x.beginPath();x.arc(c[0],c[1],c[2],0,7);x.fill();});});
  for(let i=0;i<18;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:cloudTex,transparent:true,fog:false,opacity:0.85,depthWrite:false}));const s=70+Math.random()*60;sp.scale.set(s,s/2,1);sp.position.set(cx+(Math.random()-0.5)*1500,130+Math.random()*80,cz+(Math.random()-0.5)*1500);scene.add(sp);}
  const glare=new T.Sprite(new T.SpriteMaterial({map:gpSoftDot(),color:new T.Color(L.glow),transparent:true,opacity:0.55,blending:T.AdditiveBlending,depthWrite:false,fog:false}));glare.material.userData.lin=1;glare.scale.set(260,260,1);glare.visible=false;scene.add(glare);
  // ---- cars ----
  const tyreMat=new T.MeshLambertMaterial({color:0x2b2735}),rimMat=new T.MeshLambertMaterial({color:0xf2ece0}),spokeMat=new T.MeshLambertMaterial({color:0x8a8494});
  const dark=new T.MeshStandardMaterial({color:0x121419,roughness:0.55,metalness:0.2}),glass=new T.MeshLambertMaterial({color:0xbfe0e8,transparent:true,opacity:0.88});
  const chrome=new T.MeshLambertMaterial({color:0xd8d4cc}),lampMat=new T.MeshStandardMaterial({color:0xfff6d5,emissive:0xfff2c8,emissiveIntensity:1.2,roughness:0.2});
  const helmetMat=new T.MeshStandardMaterial({color:0xf2f2f2,roughness:0.3,metalness:0.2}),blobTex=gpSoftDot(),exhaustMat=new T.MeshLambertMaterial({color:0x4a4655}),skinMats=[0x5a3825,0x7a4a2a,0x3d2616,0x9a6a45].map(c=>new T.MeshLambertMaterial({color:c})),hatMat=new T.MeshLambertMaterial({color:0xf2c14e});
  const mkCar=(car,paint,num)=>{const S=GP_SHAPE[car.type],pr=gpProfile(S),g=new T.Group(),b=new T.Group();g.add(b);
    const body=new T.MeshLambertMaterial({color:new T.Color(paint)});
    const tail=new T.MeshStandardMaterial({color:0xff1a1a,emissive:0xff0000,emissiveIntensity:0.6,roughness:0.3});
    const add=(geo,mat,x,y,z,rx,ry,rz,par)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;m.castShadow=true;(par||b).add(m);return m;};
    const ext=(shape,depth,bev)=>{const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:10});geo.translate(0,0,-depth/2);geo.rotateY(-Math.PI/2);return geo;};
    add(ext(pr.body,S.w-0.36,0.1),body,0,0,0);
    if(pr.cabin){add(ext(pr.cabin,S.w*0.72,0.06),glass,0,0,0);add(new T.BoxGeometry(S.w*0.74,0.07,Math.max(0.3,S.roofF-S.roofR)+0.05),body,0,S.roof+0.05,(S.roofF+S.roofR)/2);}
    else{add(new T.BoxGeometry(S.w*0.82,0.44,0.05),glass,0,S.hood+0.2,S.cabF-0.08,-0.62);[-0.42,0.42].forEach(x=>{add(new T.TorusGeometry(0.2,0.04,6,12,Math.PI),chrome,x,S.belt+0.02,S.cabR+0.2);add(new T.BoxGeometry(0.46,0.5,0.4),dark,x,S.belt-0.05,S.cabR+0.4);});}
    const hl=pr.hl,ly=(S.ride+S.nose)/2+0.08;
    [-1,1].forEach(sd=>{add(new T.BoxGeometry(0.44,0.13,0.08),lampMat,sd*S.w*0.31,ly,hl+0.1);add(new T.BoxGeometry(0.48,0.12,0.07),tail,sd*S.w*0.32,S.tail-0.06,-hl-0.1);
      add(new T.BoxGeometry(0.16,0.1,0.14),body,sd*(S.w/2+0.06),S.hood+0.14,S.cabF-0.12);add(new T.CylinderGeometry(0.07,0.07,0.3,10),exhaustMat,sd*0.36,S.ride+0.12,-hl-0.05,Math.PI/2);});
    add(new T.BoxGeometry(S.w*0.42,0.16,0.05),dark,0,ly-0.16,hl+0.12);
    if(S.wing==="big"){add(new T.BoxGeometry(S.w*0.98,0.06,0.46),dark,0,S.deck+0.42,-hl+0.32);[-0.55,0.55].forEach(x=>add(new T.BoxGeometry(0.06,0.42,0.2),dark,x,S.deck+0.2,-hl+0.34));[-1,1].forEach(sd=>add(new T.BoxGeometry(0.05,0.3,0.5),body,sd*S.w*0.49,S.deck+0.42,-hl+0.32));}
    if(S.wing==="duck")add(new T.BoxGeometry(S.w*0.86,0.07,0.24),dark,0,S.deck+0.08,-hl+0.22,-0.35);
    if(S.wing==="roof")add(new T.BoxGeometry(S.w*0.7,0.05,0.34),body,0,S.roof+0.08,S.roofR-0.12,0.25);
    if(S.scoop)add(new T.BoxGeometry(0.5,0.12,0.5),body,0,S.roof+0.12,(S.roofF+S.roofR)/2+0.3);
    if(S.flaps)[-1,1].forEach(sd=>add(new T.BoxGeometry(0.34,0.26,0.03),dark,sd*(S.w/2-0.2),S.ride+0.03,pr.xr-S.radR-0.14));
    if(S.num){const nt=gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle="#fff";x.beginPath();x.arc(64,64,60,0,7);x.fill();x.fillStyle="#111";x.font="900 80px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText(String(num),64,70);});const nm=new T.MeshStandardMaterial({map:nt,transparent:true,roughness:0.4});
      [-1,1].forEach(sd=>{const m=add(new T.PlaneGeometry(0.55,0.55),nm,sd*(S.w/2+0.005),(S.ride+S.belt)/2+0.05,-0.1);m.rotation.y=sd*Math.PI/2;m.castShadow=false;});}
    if(S.rack){[S.roofF-0.1,S.roofR+0.2].forEach(z=>add(new T.BoxGeometry(S.w*0.8,0.05,0.06),dark,0,S.roof+0.16,z));add(new T.BoxGeometry(S.w*0.66,0.12,0.12),new T.MeshStandardMaterial({color:0xffd166,emissive:0xffb000,emissiveIntensity:0.8}),0,S.roof+0.24,S.roofF-0.1);
      add(new T.TorusGeometry(0.4,0.15,8,16),tyreMat,0,S.tail+0.1,-hl-0.22);}
    if(S.bed){const bz0=-hl+0.12,bz1=S.cabR-0.06,bl=bz1-bz0,bm=(bz0+bz1)/2;[-1,1].forEach(sd=>add(new T.BoxGeometry(0.07,0.32,bl),body,sd*(S.w/2-0.2),S.deck+0.16,bm));add(new T.BoxGeometry(S.w-0.4,0.32,0.07),body,0,S.deck+0.16,bz0);
      const rk=new T.MeshLambertMaterial({color:0xd9553f});[-1,1].forEach(sd=>add(new T.CylinderGeometry(0.045,0.045,0.9,6),rk,sd*(S.w/2-0.26),S.deck+0.45,bz1-0.05));add(new T.CylinderGeometry(0.045,0.045,S.w-0.5,6),rk,0,S.deck+0.9,bz1-0.05,0,0,Math.PI/2);
      add(new T.BoxGeometry(0.6,0.35,0.5),new T.MeshLambertMaterial({color:0xb08a5a}),-0.3,S.deck+0.18,bm-0.2);add(new T.BoxGeometry(0.4,0.3,0.4),new T.MeshLambertMaterial({color:0x7cc6b6}),0.35,S.deck+0.15,bm+0.3);}
    const seatZ=S.bed?(S.cabF+S.cabR)/2+0.1:(S.cabF+S.cabR)/2,hy=S.bed?S.belt+0.55:S.belt+0.26;
    [-1].concat(S.open||S.bed?[1]:[]).forEach((sd,j)=>{add(new T.SphereGeometry(0.19,12,10),skinMats[(num+j)%skinMats.length],sd*S.w*0.2,hy,seatZ);
      if(S.open||S.type==="offroad"){add(new T.CylinderGeometry(0.36,0.36,0.035,14),hatMat,sd*S.w*0.2,hy+0.15,seatZ);add(new T.CylinderGeometry(0.17,0.19,0.14,12),hatMat,sd*S.w*0.2,hy+0.22,seatZ);}});
    const wheels=[],steers=[];
    [[1,pr.xf,S.rad],[-1,pr.xf,S.rad],[1,pr.xr,S.radR],[-1,pr.xr,S.radR]].forEach(([sd,z,rad])=>{const hub=new T.Group();hub.position.set(sd*(S.w/2-0.04),rad,z);g.add(hub);const w=new T.Group();hub.add(w);
      const ty=new T.Mesh(new T.CylinderGeometry(rad,rad,S.type==="offroad"?0.44:0.36,22),tyreMat);ty.rotation.z=Math.PI/2;ty.castShadow=true;w.add(ty);
      const rm=new T.Mesh(new T.CylinderGeometry(rad*0.66,rad*0.66,0.36,16),rimMat);rm.rotation.z=Math.PI/2;w.add(rm);
      for(let k=0;k<5;k++){const sp=new T.Mesh(new T.BoxGeometry(0.38,rad*1.2,0.07),spokeMat);sp.rotation.x=k*1.2566;w.add(sp);}
      w.userData.rad=rad;wheels.push(w);if(z>0)steers.push(hub);});
    const blob=new T.Mesh(new T.PlaneGeometry(S.w*1.5,S.len*1.2),new T.MeshBasicMaterial({map:blobTex,color:0x000000,transparent:true,opacity:0.38,depthWrite:false}));blob.material.userData.lin=1;blob.rotation.x=-Math.PI/2;blob.position.y=0.05;g.add(blob);
    scene.add(g);return{g,body:b,wheels,steers,tailMat:tail,S,xr:pr.xr};};
  const others=GP_CARS.filter(c=>c.id!==myCar.id);
  const pname=(P&&typeof P.name==="string"&&P.name.trim())?P.name.trim().split(/\s+/)[0]:"You";
  const racers=[{n:pname,car:myCar,css:myPaint,player:true}].concat(gpMode()==="race"?others.slice(0,4).map((c,i)=>({n:GP_DRIVERS[i%GP_DRIVERS.length],car:c,css:c.paint,player:false})):[]);
  const pace=gpPaceMul();const karts=racers.map((r,i)=>{const m=mkCar(r.car,r.css,i+2);const st=gpStats(r.car);st.max*=pace;st.accel*=0.75;
    return{racer:r,player:r.player,...m,...st,t:0,x:0,px:0,speed:0,lap:0,spin:0,drift:0,off:0,hop:0,roll:0,pitch:0,steerVis:0,yaw:null,lastSpeed:0,skidD:0,ahead:true,started:false,pos:new T.Vector3(),draft:false,brakeOn:false};});
  let gi=0;karts.forEach(k=>{if(k.player){k.t=(M-6)/M;k.x=0;}else{k.t=((M-2-gi*3)/M)%1;k.x=gi%2?0.5:-0.5;gi++;}k.px=k.x;});
  // ---- music notes to collect (free drive) ----
  const notes=[];if(gpMode()==="free"){const noteCols=["#e8604c","#f2c14e","#4fb3a3","#6b8fd6","#c27bb4"];const noteTex=noteCols.map(c=>gpCanvasTex(128,128,(x,w,h)=>{x.fillStyle="rgba(247,240,225,.95)";x.beginPath();x.arc(64,64,54,0,7);x.fill();x.lineWidth=7;x.strokeStyle=L.ink;x.stroke();x.fillStyle=c;x.font="bold 86px serif";x.textAlign="center";x.textBaseline="middle";x.fillText("♪",60,70);}));
    for(let i=24;i<M-10;i+=19){const k=notes.length;const sp=new T.Sprite(new T.SpriteMaterial({map:noteTex[k%noteTex.length],transparent:true,depthWrite:false}));sp.scale.set(2,2,1);const t=i/M,x=Math.max(-0.7,Math.min(0.7,Math.sin(i*0.37)*0.62));
      const pp=curve.getPointAt(t),tn=curve.getTangentAt(t).normalize(),nn=new T.Vector3(-tn.z,0,tn.x).normalize();pp.addScaledVector(nn,x*(W-1.2));sp.position.set(pp.x,pp.y+1.5,pp.z);scene.add(sp);notes.push({t,x,mesh:sp,alive:true,col:noteCols[k%noteCols.length],k,y:pp.y+1.5});}}
  // particles and skid marks
  const smoke=gpParticles(T,scene,260,2.4,false,0.5),dust=gpParticles(T,scene,160,2.0,false,0.5),sparks=gpParticles(T,scene,120,0.6,true);
  const skidGeo=new T.PlaneGeometry(0.26,1.0);skidGeo.rotateX(-Math.PI/2);const SK=700;
  const skids=new T.InstancedMesh(skidGeo,new T.MeshBasicMaterial({color:0x0a0a0a,transparent:true,opacity:0.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),SK);skids.material.userData.lin=1;
  dummy.position.set(0,-999,0);dummy.rotation.set(0,0,0);dummy.scale.set(0.0001,0.0001,0.0001);dummy.updateMatrix();for(let i=0;i<SK;i++)skids.setMatrixAt(i,dummy.matrix);skids.frustumCulled=false;scene.add(skids);
  // convert plain colours from sRGB to linear once (colours look right with sRGB output + tone mapping)
  const seen=new Set();scene.traverse(o=>{if(o===sky)return;const ms=Array.isArray(o.material)?o.material:(o.material?[o.material]:[]);ms.forEach(m=>{if(!m||seen.has(m)||m.isShaderMaterial||m.isPointsMaterial)return;seen.add(m);if(m.userData.lin)return;m.userData.lin=1;
    if(m.color&&!(o.isInstancedMesh&&o.instanceColor)&&!m.map)m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();});});
  R3={T,C,renderer,scene,camera,curve,samples,M,W,len,karts,me:karts.find(k=>k.player),keys:{},touchDir:0,brake:false,drift:false,t0:performance.now(),time:0,countdown:3.5,lastN:null,done:false,raf:null,last:performance.now(),camPos:new T.Vector3(),msgT:0,place:5,board:[],
    sun,sky,glare,sunDir,sunOff:sunDir.clone().multiplyScalar(170),envRT,smoke,dust,sparks,skids,skN:0,dummy,shake:0,fov:58,pr:pr0,fpsT:0,fpsN:0,fps:0,lowT:0,shadowsOn:true,tmpV:new T.Vector3(),tmpV2:new T.Vector3(),UP,
    lapScreen,trapT:trapI/M,trapBest:0,gear:1,tachT:0,post,mode:gpMode(),notes,notesGot:0,notesTotal:notes.length*C.laps,song:[],lastDeg:4,songDirty:1,islands,seaTex,sk:{chain:0,mult:1,total:0,idle:0,list:[],dirty:1,clean:0},bumpT:9};
  window.__gp={fps:0,pr:pr0,shadows:true};
  // keyboard
  R3.kd=e=>{if(!R3)return;const k=e.key.toLowerCase();GPA.init();if(k==="escape"){renderCircuits();return;}if(k==="m"){gpToggleMute();return;}R3.keys[k]=true;if(["arrowleft","arrowright","arrowdown","arrowup","shift"," "].includes(k))e.preventDefault();};
  R3.ku=e=>{if(!R3)return;R3.keys[e.key.toLowerCase()]=false;};
  window.addEventListener("keydown",R3.kd);window.addEventListener("keyup",R3.ku);
  // touch
  const hold=(id,dir)=>{const b=$(id);if(!b)return;const on=ev=>{ev.preventDefault();GPA.init();if(!R3)return;b.classList.add("on");if(dir==="b")R3.brake=true;else if(dir==="d")R3.drift=true;else R3.touchDir=dir;};
    const off=ev=>{b.classList.remove("on");if(!R3)return;if(dir==="b")R3.brake=false;else if(dir==="d")R3.drift=false;else if(R3.touchDir===dir)R3.touchDir=0;};
    ["pointerdown","touchstart"].forEach(t=>b.addEventListener(t,on,{passive:false}));["pointerup","pointerleave","pointercancel","touchend","touchcancel"].forEach(t=>b.addEventListener(t,off));b.addEventListener("contextmenu",ev=>ev.preventDefault());};
  hold("rcL",-1);hold("rcR",1);hold("rcB","b");hold("rcD","d");hold("gp3L",-1);hold("gp3R",1);
  $("gp3Mute").addEventListener("click",ev=>{ev.preventDefault();gpToggleMute();});
  R3.blockTouch=ev=>{if(R3&&!R3.done&&ev.cancelable)ev.preventDefault();};
  document.addEventListener("touchmove",R3.blockTouch,{passive:false});document.addEventListener("gesturestart",R3.blockTouch,{passive:false});
  R3.onVis=()=>{if(!GPA.ctx)return;if(document.hidden)GPA.ctx.suspend();else GPA.ctx.resume();};document.addEventListener("visibilitychange",R3.onVis);
  const wrapEl=$("gp3");
  R3.onResize=()=>{if(!R3)return;const w=wrapEl.clientWidth||720,h=wrapEl.clientHeight||Math.round(w*9/16);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(R3.post)R3.post.resize(w,h,renderer.getPixelRatio());};
  R3.onOrient=()=>{[150,400,900].forEach(ms=>setTimeout(()=>{if(R3)R3.onResize();},ms));};
  window.addEventListener("resize",R3.onResize);window.addEventListener("orientationchange",R3.onOrient);R3.onResize();
  setTimeout(()=>{const c=$("gp3Card");if(c)c.classList.add("hide");},3200);
  GPA.startEngine();
  say(C.name+". "+myCar.n+". Three, two, one, go!");
  R3.raf=requestAnimationFrame(gpFrame);
  setTimeout(gpEnvCheck,1200);
}
/* safety net: if the reflection map ever blacks out the scene on some device, switch it off */
function gpEnvCheck(){try{if(!R3||!R3.scene.environment)return;R3.renderer.render(R3.scene,R3.camera);const c=R3.renderer.domElement,o=document.createElement("canvas");o.width=64;o.height=36;const x=o.getContext("2d");x.drawImage(c,0,0,64,36);const d=x.getImageData(0,27,64,9).data;let sum=0;for(let i=0;i<d.length;i+=4)sum+=d[i]+d[i+1]+d[i+2];if(sum/(d.length/4)<25){R3.scene.environment=null;window.__gp.envOff=true;}}catch(e){}}
function gpToggleMute(){GPA.init();GPA.setMute(!GPA.muted);if(P){P.gpMute=GPA.muted;save();}const b=$("gp3Mute");if(b)b.textContent=GPA.muted?"🔇":"🔊";}
function gpMsg(m){if(!R3)return;const e=$("gp3Msg");if(e){e.textContent=m;e.classList.add("show");}R3.msgT=1.7;}
/* ---------- skill chains ---------- */
function gpSkill(name,pts,discrete){const S=R3.sk;if(!S.list.length||S.list[0].n!==name||discrete){S.list.unshift({n:name,p:0});if(S.list.length>1)S.mult=Math.min(5,S.mult+1);if(S.list.length>4)S.list.length=4;if(discrete)GPA.play("skill");}
  S.list[0].p+=pts;S.chain+=pts;S.idle=0;S.dirty=1;}
function gpChainBreak(){const S=R3.sk;if(S.chain>0){gpMsg("Chain broken");GPA.play("break");}S.chain=0;S.mult=1;S.list=[];S.dirty=1;}
function gpBank(){const S=R3.sk;if(S.chain<=0)return;const v=Math.round(S.chain*S.mult);S.total+=v;gpMsg("+"+gpNum(v)+" skill");GPA.play("bank");S.chain=0;S.mult=1;S.list=[];S.dirty=1;}
function gpSkillHud(){const S=R3.sk;if(!S.dirty)return;S.dirty=0;const e=$("gp3Skill");if(!e)return;if(!S.list.length){e.classList.remove("on");return;}
  e.innerHTML='<div class="pts">'+gpNum(S.chain)+(S.mult>1?'<span class="mul">×'+S.mult+'</span>':'')+'</div>'+S.list.map(l=>'<div class="row">'+esc(l.n)+' '+gpNum(l.p)+'</div>').join("");e.classList.add("on");}
/* ---------- rev counter ---------- */
function gpTach(kmh,gear,rf){const cv=$("gp3Tach");if(!cv)return;const x=cv.getContext("2d"),S=cv.width,c=S/2,r=S*0.4;x.clearRect(0,0,S,S);
  x.fillStyle="rgba(247,240,225,.92)";x.beginPath();x.arc(c,c,S*0.47,0,7);x.fill();x.lineWidth=S*0.02;x.strokeStyle="#2b2735";x.stroke();
  const a0=Math.PI*0.75,a1=Math.PI*2.25,ang=v=>a0+(a1-a0)*v;x.lineCap="butt";
  x.lineWidth=S*0.045;x.strokeStyle="rgba(43,39,53,.15)";x.beginPath();x.arc(c,c,r,a0,a1);x.stroke();
  x.strokeStyle="rgba(255,40,80,.7)";x.beginPath();x.arc(c,c,r,ang(0.86),a1);x.stroke();
  const g=x.createLinearGradient(0,S,S,0);g.addColorStop(0,"#f2c14e");g.addColorStop(1,"#e8604c");x.strokeStyle=g;x.beginPath();x.arc(c,c,r,a0,ang(Math.max(0.01,Math.min(1,rf))));x.stroke();
  x.fillStyle="rgba(43,39,53,.7)";x.font="700 "+(S*0.07)+"px system-ui";x.textAlign="center";x.textBaseline="middle";for(let k=0;k<=8;k++){const a=ang(k/8);x.fillText(String(k),c+Math.cos(a)*r*0.74,c+Math.sin(a)*r*0.74);}
  const na=ang(Math.max(0,Math.min(1,rf)));x.strokeStyle="#2b2735";x.lineWidth=S*0.018;x.beginPath();x.moveTo(c+Math.cos(na)*r*0.25,c+Math.sin(na)*r*0.25);x.lineTo(c+Math.cos(na)*r*1.02,c+Math.sin(na)*r*1.02);x.stroke();
  x.fillStyle="#2b2735";x.font="italic 900 "+(S*0.2)+"px system-ui";x.fillText(String(Math.round(kmh)),c,c+S*0.02);
  x.fillStyle="#6b6076";x.font="800 "+(S*0.065)+"px system-ui";x.fillText("KM/H",c,c+S*0.15);
  x.fillStyle="#e8604c";x.beginPath();x.arc(c,c+S*0.32,S*0.085,0,7);x.fill();x.fillStyle="#fff";x.font="italic 900 "+(S*0.1)+"px system-ui";x.fillText(String(gear),c,c+S*0.325);}
function gpFrame(now){
  if(!R3)return;
  const raw=(now-R3.last)/1000;const dt=Math.min(0.05,raw);R3.last=now;
  R3.fpsT+=raw;R3.fpsN++;if(R3.fpsT>=2){R3.fps=R3.fpsN/R3.fpsT;R3.fpsT=0;R3.fpsN=0;window.__gp.fps=Math.round(R3.fps);
    if(R3.fps<45&&!document.hidden){R3.lowT++;if(R3.lowT>=2){R3.lowT=0;if(R3.pr>1){R3.pr=Math.max(1,R3.pr-0.25);R3.renderer.setPixelRatio(R3.pr);R3.onResize();}else if(R3.shadowsOn){R3.shadowsOn=false;R3.sun.castShadow=false;}}}else R3.lowT=0;
    window.__gp.pr=R3.pr;window.__gp.shadows=R3.shadowsOn;}
  if(R3.countdown>0){R3.countdown-=dt;const c=$("gp3Count");if(c){const n=Math.min(3,Math.ceil(R3.countdown-0.3));if(n!==R3.lastN){R3.lastN=n;GPA.play(n>0?"beep":"go");}c.textContent=n>0?String(n):"GO!";c.classList.add("show");if(R3.countdown<=0)setTimeout(()=>{const cc=$("gp3Count");if(cc)cc.classList.remove("show");},700);}}
  else if(!R3.done)R3.time=now-R3.t0-3500;
  gpUpdate(dt,R3.countdown>0);gpRender(dt);
  R3.raf=requestAnimationFrame(gpFrame);
}
function gpUpdate(dt,waiting){
  const {karts,samples,M,len,T,me}=R3;
  const k=R3.keys;const left=k["arrowleft"]||k["a"]||R3.touchDir<0,right=k["arrowright"]||k["d"]||R3.touchDir>0,brake=k["arrowdown"]||k["s"]||R3.brake,driftBtn=k["shift"]||k[" "]||k["x"]||R3.drift;
  const V=R3.tmpV,sk=R3.sk;R3.bumpT+=dt;
  karts.forEach(kt=>{
    const i=Math.floor(kt.t*M)%M;const s=samples[i],s2=samples[(i+4)%M];
    const curv=s.tan.clone().cross(s2.tan).y;
    const offroad=Math.abs(kt.x)>1.05;
    let draft=false;if(!waiting&&kt.speed/kt.max>0.55){draft=karts.some(o=>{if(o===kt)return false;const d=(o.t-kt.t+1)%1;return d>0.003&&d<0.028&&Math.abs(o.x-kt.x)<0.32;});}kt.draft=draft;
    let band=1;if(!kt.player&&!waiting){const gap=(kt.lap+kt.t)-(me.lap+me.t);band=gap>0.06?0.93:(gap<-0.06?1.07:1);}
    const maxNow=waiting?0:kt.max*band*(draft?1.07:1)*(kt.spin>0?0.6:1)*(offroad?kt.offF:1)*(kt.drift?0.94:1);
    kt.brakeOn=kt.player&&brake&&!waiting;
    if(kt.brakeOn)kt.speed=Math.max(0,kt.speed-38*dt);else kt.speed+=(maxNow-kt.speed)*Math.min(1,dt*(kt.speed<maxNow?kt.accel/10:2.2));
    if(!kt.player&&!waiting){const nxt=samples[(i+14)%M];const bend=Math.abs(s.tan.x*nxt.tan.z-s.tan.z*nxt.tan.x);kt.brakeOn=bend>0.22&&kt.speed>kt.max*0.8;if(kt.brakeOn)kt.speed-=12*dt;}
    const spd=kt.speed/kt.max;kt.px=kt.x;
    if(kt.player&&!waiting){
      const inp=(left?-1:0)+(right?1:0);
      if(!kt.drift&&driftBtn&&inp!==0&&spd>0.4&&!offroad){kt.drift=inp;kt.off=0;kt.hop=0.22;}
      if(kt.drift)kt.off=offroad?kt.off+dt:0;
      if(kt.drift&&(!driftBtn||kt.off>0.6||spd<0.3))kt.drift=0;
      if(kt.drift){const same=inp===kt.drift,opp=inp===-kt.drift;kt.x+=kt.drift*dt*kt.steer*Math.max(.35,spd)*(same?0.5:(opp?-0.35:0.18));}
      else{const tgt=((left?-1:0)+(right?1:0))*kt.steer*(R3.mode==="free"?0.36:0.42)*Math.max(.4,spd);kt.sv=(kt.sv||0)+(tgt-(kt.sv||0))*Math.min(1,dt*(tgt?3:8));kt.x+=kt.sv*dt;}
    }
    else if(!kt.player){const target=Math.sin((kt.t*6.28*3)+kt.racer.n.length)*0.45-curv*6;const ahead=karts.find(o=>o!==kt&&((o.t-kt.t+1)%1)<0.012&&Math.abs(o.x-kt.x)<0.35);kt.x+=((ahead?(kt.x<ahead.x?-0.65:0.65):Math.max(-0.8,Math.min(0.8,target)))-kt.x)*dt*(1.1+kt.racer.car.handle*0.18);}
    kt.x-=curv*spd*dt*(kt.player?(R3.mode==="free"?3:6):14)*(kt.drift?0.4:1);
    if(kt.player&&R3.mode==="race"&&!kt.drift&&!left&&!right&&Math.abs(kt.x)>0.95)kt.x-=Math.sign(kt.x)*dt*0.7;
    if(kt.player&&R3.mode==="free"&&!kt.drift&&!left&&!right&&Math.abs(kt.x)>0.7)kt.x-=Math.sign(kt.x)*dt*0.5;
    const lim=kt.player&&R3.mode==="free"?1.15:1.5;kt.x=Math.max(-lim,Math.min(lim,kt.x));
    if(kt.hop>0)kt.hop-=dt;
    const before=kt.t;kt.t=(kt.t+kt.speed*dt/len)%1;
    if(!waiting&&kt.t<before&&before>0.5&&!kt.started){kt.started=true;}
    else if(!waiting&&kt.t<before&&before>0.5){kt.lap++;if(kt.player){if(kt.lap>=R3.C.laps&&!R3.done)gpFinish();else{R3.notes.forEach(n=>{n.alive=true;n.mesh.visible=true;});GPA.play("lap");gpMsg(kt.lap+1===R3.C.laps?"Final lap":"Lap "+(kt.lap+1));const old=R3.lapScreen.material.map;R3.lapScreen.material.map=gpTextTex("LAP "+(kt.lap+1),["#f7f0e1","#f7f0e1"],"#e8604c",512,300,120);if(old)old.dispose();}}}
    if(kt.player&&!waiting&&!R3.done&&R3.mode==="race"){const tt=R3.trapT;const crossed=before<=kt.t?(before<tt&&kt.t>=tt):(before<tt||kt.t>=tt);if(crossed){const kmh=Math.round(kt.speed*GP_KMH);R3.trapBest=Math.max(R3.trapBest,kmh);const r=kt.speed/(kt.max||1);const stars=r>=0.97?"★★★":r>=0.9?"★★":"★";gpMsg("Speed trap "+kmh+" km/h "+stars);GPA.play("trap");gpSkill("Speed trap",kmh*3,true);}}
    // place the car
    const pos=R3.curve.getPointAt(kt.t),tan=R3.curve.getTangentAt(kt.t).normalize(),nor=new T.Vector3(-tan.z,0,tan.x).normalize();
    pos.addScaledVector(nor,kt.x*(R3.W-1.2));kt.pos.copy(pos);
    kt.g.position.copy(pos);let y=0;if(offroad)y=Math.abs(Math.sin(kt.t*len*3))*0.08;if(kt.hop>0)y+=Math.sin(Math.PI*(1-kt.hop/0.22))*0.25;kt.g.position.y+=y;
    kt.g.lookAt(pos.clone().add(tan));
    const yaw=Math.atan2(tan.x,tan.z);let yawRate=0;if(kt.yaw!==null){let d=yaw-kt.yaw;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;yawRate=d/Math.max(dt,0.001);}kt.yaw=yaw;
    const vx=(kt.x-kt.px)/Math.max(dt,0.001);
    kt.g.rotateY((-vx*0.05)+(kt.drift?-kt.drift*0.35:0));
    const rollT=Math.max(-0.09,Math.min(0.09,yawRate*0.18*spd-vx*0.04+(kt.drift?-kt.drift*0.05:0)));kt.roll+=(rollT-kt.roll)*Math.min(1,dt*6);
    const acc=(kt.speed-kt.lastSpeed)/Math.max(dt,0.001);kt.lastSpeed=kt.speed;const pitchT=Math.max(-0.045,Math.min(0.045,-acc*0.003));kt.pitch+=(pitchT-kt.pitch)*Math.min(1,dt*6);
    kt.body.rotation.z=kt.roll;kt.body.rotation.x=kt.pitch;
    const stT=Math.max(-0.45,Math.min(0.45,yawRate*0.32-vx*0.22+(kt.drift?kt.drift*0.35:0)));kt.steerVis+=(stT-kt.steerVis)*Math.min(1,dt*10);kt.steers.forEach(h=>h.rotation.y=kt.steerVis);
    kt.wheels.forEach(w=>w.rotation.x+=kt.speed*dt/w.userData.rad);
    kt.tailMat.emissiveIntensity=kt.brakeOn?3.2:0.6;
    // effects: tyre smoke + skid marks when drifting or braking hard, dust off the road
    const near=kt.player||kt.pos.distanceToSquared(me.pos)<2500;
    const skid=!offroad&&((kt.drift&&spd>0.35)||(kt.brakeOn&&spd>0.55));
    if(near&&(skid||(offroad&&spd>0.2))){kt.g.updateMatrixWorld(true);
      [-1,1].forEach(sd=>{V.set(sd*(kt.S.w/2-0.04),0.1,kt.xr);kt.g.localToWorld(V);
        if(skid){if(Math.random()<0.7)R3.smoke.emit(V.x,V.y+0.2,V.z,(Math.random()-0.5)*1.5-tan.x*2,0.6+Math.random()*0.8,(Math.random()-0.5)*1.5-tan.z*2,0.9,0.9,0.92,1.1);}
        else if(Math.random()<0.6)R3.dust.emit(V.x,V.y+0.2,V.z,-tan.x*3+(Math.random()-0.5)*2,0.8+Math.random()*1.2,-tan.z*3+(Math.random()-0.5)*2,0.6,0.5,0.35,0.9);});}
    if(skid&&near){kt.skidD+=kt.speed*dt;if(kt.skidD>0.9){kt.skidD=0;const D=R3.dummy;const fw=Math.atan2(tan.x,tan.z)+(kt.drift?-kt.drift*0.42:0);
      [-1,1].forEach(sd=>{V.set(sd*(kt.S.w/2-0.04),0,kt.xr);kt.g.localToWorld(V);D.position.set(V.x,kt.pos.y+0.045,V.z);D.rotation.set(0,fw,0);D.scale.set(1,1,1);D.updateMatrix();R3.skids.setMatrixAt(R3.skN,D.matrix);R3.skN=(R3.skN+1)%700;});R3.skids.instanceMatrix.needsUpdate=true;}}
  });
  // bumps between cars
  for(let a=0;a<karts.length;a++)for(let b=a+1;b<karts.length;b++){const A=karts[a],B=karts[b];const d=(A.t-B.t+1)%1;const close=d<0.004||d>0.996;if(close&&Math.abs(A.x-B.x)<0.42){const back=d<0.5?B:A,front=back===A?B:A;if(back.speed>front.speed)back.speed=front.speed*0.88;A.x+=(A.x<B.x?-1:1)*0.18;B.x-=(A.x<B.x?-1:1)*0.18;
    if((A.player||B.player)&&R3.bumpT>0.8&&!waiting){R3.bumpT=0;R3.shake=0.45;GPA.play("bump");sk.clean=0;gpChainBreak();const p=me.pos;for(let q=0;q<14;q++){const an=Math.random()*6.28;R3.sparks.emit(p.x,p.y+0.7,p.z,Math.cos(an)*4,2+Math.random()*3,Math.sin(an)*4,1,0.7,0.25,0.4);}}}}
  // skills
  if(!waiting&&!R3.done&&R3.mode==="race"){const spd=me.speed/me.max,offroad=Math.abs(me.x)>1.05;
    if(me.drift&&spd>0.35&&!offroad)gpSkill("Drift",me.speed*dt*9);
    if(me.draft)gpSkill("Drafting",me.speed*dt*4);
    karts.forEach(o=>{if(o.player)return;const ahead=(o.lap+o.t)>(me.lap+me.t);if(o.ahead&&!ahead&&me.started){const gap=Math.abs(o.x-me.x)*(R3.W-1.2);if(gap<3.3&&R3.bumpT>1){gpSkill("Near miss",350,true);gpMsg("Near miss");}else gpSkill("Pass",150,true);}o.ahead=ahead;});
    if(!offroad&&R3.bumpT>0.8)sk.clean+=dt;else if(offroad)sk.clean=0;if(sk.clean>=12){sk.clean=0;gpSkill("Clean racing",250,true);}
    sk.idle+=dt;if(sk.chain>0&&sk.idle>2.6)gpBank();}
  if(R3.notes.length){const tn=performance.now()/1000;R3.notes.forEach(n=>{if(!n.alive)return;n.mesh.position.y=n.y+Math.sin(tn*2.2+n.k)*0.25;if(waiting||R3.done)return;const d=(n.t-me.t+1)%1;if(d<0.006&&Math.abs(n.x-me.x)<0.45){n.alive=false;n.mesh.visible=false;gpNote(n);}});}
  R3.islands.forEach(g=>{g.position.y+=Math.sin(performance.now()/1400+g.userData.bob)*dt*0.5;});
  if(R3.seaTex){R3.seaTex.offset.x+=dt*0.006;R3.seaTex.offset.y+=dt*0.003;}
  R3.smoke.update(dt,-1.2);R3.dust.update(dt,-0.4);R3.sparks.update(dt,9);
  // standings + HUD
  const all=karts.slice().sort((a,b)=>(b.lap+b.t)-(a.lap+a.t));R3.board=all;R3.place=all.indexOf(me)+1;
  if(R3.msgT>0){R3.msgT-=dt;if(R3.msgT<=0){const e=$("gp3Msg");if(e)e.classList.remove("show");}}
  const el=(id,v)=>{const e=$(id);if(e&&e.textContent!==v)e.textContent=v;};
  el("gp3Lap","LAP "+Math.min(R3.C.laps,me.lap+1)+"/"+R3.C.laps);el("gp3Time",gpFmt(Math.max(0,R3.time)));
  const pe=$("gp3Pos");if(pe&&pe.dataset.p!==String(R3.place)){pe.dataset.p=String(R3.place);pe.innerHTML=R3.place+"<small>"+gpSuf(R3.place)+"</small><em>/"+karts.length+"</em>";}
  gpSkillHud();
  if(R3.mode==="free"&&R3.songDirty){R3.songDirty=0;const e=$("gp3Song");if(e){const cur=R3.song.length%8,ph=R3.song.slice(R3.song.length-cur);let dots="";for(let i=0;i<8;i++)dots+='<i class="'+(i<cur?"on":"")+'" style="--c:'+(ph[i]?ph[i].c:"#fff")+'"></i>';e.innerHTML='🎵 <b>'+R3.notesGot+' / '+R3.notesTotal+'</b>'+dots;}}
  gpDrawMini($("gp3Map"),R3.C,karts);
  // gearbox + engine sound + rev counter
  const kmh=me.speed*GP_KMH;let gear=1;for(let g=1;g<GP_GEARS.length;g++)if(kmh>=GP_GEARS[g])gear=g+1;
  const lo=GP_GEARS[gear-1],hi=gear<GP_GEARS.length?GP_GEARS[gear]:250;let rf=0.14+0.8*Math.max(0,Math.min(1,(kmh-lo)/(hi-lo)));if(waiting)rf=0.14+Math.random()*0.02;
  if(gear>R3.gear&&!waiting)GPA.play("shift");R3.gear=gear;
  GPA.engine(rf,(waiting?0.2:(me.brakeOn?0.3:1))*(R3.mode==="free"?0.5:1),!!me.drift||(me.brakeOn&&me.speed/me.max>0.55),waiting);
  R3.tachT+=dt;if(R3.tachT>0.04){R3.tachT=0;gpTach(kmh,gear,rf);}
}
function gpRender(dt){
  const me=R3.me,T=R3.T;const tan=R3.curve.getTangentAt(me.t).normalize();const flat=R3.tmpV2.set(tan.x,0,tan.z).normalize();const nor=new T.Vector3(-flat.z,0,flat.x);
  const spd=me.speed/me.max,tall=R3.camera.aspect<1;
  let target,look;
  if(R3.countdown>0.5){const a=Math.max(0,(R3.countdown-0.5)/3)*Math.PI;const off=flat.clone().multiplyScalar(-(tall?9:7.5)).applyAxisAngle(R3.UP,a);target=me.pos.clone().add(off).add(new T.Vector3(0,tall?3.4:2.2,0));look=me.pos.clone().add(new T.Vector3(0,0.9,0));R3.camPos.copy(target);}
  else{const back=(tall?8.6:6.8)-spd*0.4;target=me.pos.clone().addScaledVector(flat,-back).add(new T.Vector3(0,tall?3.9:2.35,0)).addScaledVector(nor,(me.drift||0)*0.9);
    target.y=Math.max(target.y,me.pos.y+(tall?3.4:1.9));
    look=me.pos.clone().addScaledVector(tan,tall?9:11).add(new T.Vector3(0,tall?-0.6:1.4,0));
    R3.camPos.lerp(target,Math.min(1,dt*3.5));}
  R3.camera.position.copy(R3.camPos);
  const sh=R3.shake;if(sh>0){R3.shake=Math.max(0,R3.shake-dt*1.6);const a=sh*0.35;R3.camera.position.x+=(Math.random()-0.5)*a;R3.camera.position.y+=(Math.random()-0.5)*a;}
  R3.camera.lookAt(look);
  const fovT=(tall?78:58)+Math.min(1.1,spd)*3+(me.draft?1.5:0);R3.fov+=(fovT-R3.fov)*Math.min(1,dt*3);if(Math.abs(R3.camera.fov-R3.fov)>0.05){R3.camera.fov=R3.fov;R3.camera.updateProjectionMatrix();}
  R3.sky.position.copy(R3.camera.position);R3.glare.position.copy(R3.camera.position).addScaledVector(R3.sunDir,1100);
  R3.sun.position.copy(me.pos).add(R3.sunOff);R3.sun.target.position.copy(me.pos);R3.sun.target.updateMatrixWorld();
  const pp=R3.post;if(pp){pp.mat.uniforms.t.value=performance.now()/1000;R3.renderer.setRenderTarget(pp.rt);R3.renderer.render(R3.scene,R3.camera);R3.renderer.setRenderTarget(null);R3.renderer.render(pp.scene,pp.cam);}else R3.renderer.render(R3.scene,R3.camera);
}
function gpNote(n){let d=R3.lastDeg+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)];if(d<0)d=1;if(d>GP_SCALE.length-1)d=GP_SCALE.length-2;R3.lastDeg=d;R3.song.push({d,c:n.col});R3.notesGot++;GPA.box(GP_SCALE[d]);
  const p=n.mesh.position,col=new R3.T.Color(n.col);for(let q=0;q<16;q++){const a=Math.random()*6.28;R3.sparks.emit(p.x,p.y,p.z,Math.cos(a)*3,1+Math.random()*3,Math.sin(a)*3,col.r,col.g,col.b,0.6);}
  R3.songDirty=1;if(R3.notesGot%8===0){R3.song.slice(-8).forEach((s,i)=>GPA.box(GP_SCALE[s.d],0.35+i*0.17));gpMsg("🎵 Tune "+(R3.notesGot/8)+" done!");}}
function gpPlaySong(){GPA.init();const s=window._gpSong||[];if(!s.length){toast("Collect some notes first!");return;}s.slice(0,64).forEach((n,i)=>GPA.box(GP_SCALE[n.d],i*0.22+Math.floor(i/8)*0.25));}
function gpFinishFree(){R3.done=true;const got=R3.notesGot,tot=R3.notesTotal,tunes=Math.floor(got/8);const xp=10+Math.min(20,Math.floor(got/3));
  const w0=$("gp3");if(w0)w0.classList.add("done");GPA.play("fanfare");if(got>=tot*0.8)confetti();
  say("Trip complete! You collected "+got+" music notes.");
  let earned=0;if(P){earned=xp;P.xp+=xp;P.race=P.race||{};const prev=P.race[R3.C.id]||{};P.race[R3.C.id]=Object.assign({},prev,{notes:Math.max(got,prev.notes||0),date:today()});save();}
  window._gpSong=R3.song.slice();
  setTimeout(()=>{if(!R3)return;GPA.stopEngine();const w=$("gp3");if(!w)return;w.insertAdjacentHTML("beforeend",'<div class="gp3-finish"><div class="fz-fin-t">Trip complete! 🎵</div><div class="fz-fin-s" style="font-size:1.25em;margin:8px 0">'+got+' of '+tot+' notes · '+tunes+' tune'+(tunes===1?'':'s')+' · '+gpFmt(R3.time)+(earned?' · +'+earned+' XP':'')+'</div><div class="btn-row" style="margin-top:12px"><button class="btn big" onclick="gpPlaySong()">▶ Play my song</button><button class="btn secondary big" onclick="startRace3D(\''+R3.C.id+'\')">Drive again 🔁</button><button class="btn secondary big" onclick="renderCircuits()">Routes 🗺️</button></div></div>');},1300);}
function gpFinish(){
  if(R3.mode==="free")return gpFinishFree();
  R3.done=true;gpBank();const place=R3.place;const skill=R3.sk.total;const bonus=Math.min(10,Math.floor(skill/2000));const xp=([0,30,20,10,5,5][place]||5)+bonus;
  const w0=$("gp3");if(w0)w0.classList.add("done");
  GPA.play(place<=3?"fanfare":"lap");if(place===1)confetti();
  say(place===1?"You win at "+R3.C.name+"! Festival champion!":"You finished "+gpOrd(place)+". Great driving!");
  let earned=0;
  if(P){earned=xp;P.xp+=xp;P.race=P.race||{};const prev=P.race[R3.C.id]||{};P.race[R3.C.id]={time:prev.time&&prev.time<R3.time?prev.time:R3.time,place:Math.min(place,prev.place||9),skill:Math.max(skill,prev.skill||0),trap:Math.max(R3.trapBest,prev.trap||0),date:today()};
    if(place===1&&!P.trophies.some(t=>t.type==="race")&&typeof awardTrophy==="function")awardTrophy({type:"race",icon:"🏎️",label:"Grand Fable Champion",color:"#ff2d87",detail:"Won the Grand Fable GP at "+R3.C.name+"."});save();}
  const rows=R3.board.map((k,i)=>'<div class="'+(k.player?"me":"")+'"><i>'+gpOrd(i+1)+'</i><span>'+esc(k.racer.n)+'</span><span>'+esc(k.racer.car.n)+'</span></div>').join("");
  setTimeout(()=>{if(!R3)return;GPA.stopEngine();const w=$("gp3");if(!w)return;w.insertAdjacentHTML("beforeend",'<div class="gp3-finish"><div class="fz-fin-t">'+gpOrd(place).toUpperCase()+' PLACE</div><div class="fz-res">'+rows+'</div><div class="fz-fin-s">'+gpFmt(R3.time)+' · Skill '+gpNum(skill)+(R3.trapBest?' · Speed trap '+R3.trapBest+' km/h':'')+(earned?' · +'+earned+' XP':'')+'</div><div class="btn-row" style="margin-top:12px"><button class="btn big" onclick="startRace3D(\''+R3.C.id+'\')">Race again 🔁</button><button class="btn secondary big" onclick="renderCircuits()">Routes 🏁</button><button class="btn secondary big" onclick="renderRace()">Cars 🚗</button></div></div>');},1300);
}
