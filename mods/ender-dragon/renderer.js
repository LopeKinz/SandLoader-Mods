/* eslint-env browser */
'use strict'
;(function (g) {
  const S = g.SMLN || g.__SMLN__
  if (!S || g.__SMLN_ENDER_DRAGON__) return
  const M = g.__SMLN_ENDER_DRAGON__ = {
    boss:null, canvas:null, ctx:null, api:null, state:null, last:performance.now(),
    particles:[], fireballs:[], auto:false
  }
  const C = { hp:1200, damage:25, reward:100000 }

  const now=()=>performance.now()
  const rand=(a,b)=>a+Math.random()*(b-a)
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
  const state=()=>M.state||S.state||(S.getState&&S.getState())
  const game=()=>M.api||S.game

  function ensureCanvas(){
    if(M.canvas&&M.canvas.isConnected)return
    const c=document.createElement('canvas')
    c.id='smln-ender-dragon'
    Object.assign(c.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',
      pointerEvents:'none',zIndex:'2147483000'})
    document.documentElement.appendChild(c)
    M.canvas=c; M.ctx=c.getContext('2d')
    resize(); addEventListener('resize',resize,{passive:true})
    addEventListener('pointerdown',hit,true)
    requestAnimationFrame(frame)
  }

  function resize(){
    if(!M.canvas)return
    const d=Math.min(devicePixelRatio||1,2)
    M.w=innerWidth; M.h=innerHeight
    M.canvas.width=Math.round(M.w*d); M.canvas.height=Math.round(M.h*d)
    M.ctx.setTransform(d,0,0,d,0,0)
  }

  function spawn(){
    ensureCanvas()
    if(M.boss&&M.boss.active)return false
    M.boss={active:true,dying:false,hp:C.hp,max:C.hp,x:M.w*.72,y:M.h*.30,
      tx:M.w*.72,ty:M.h*.30,size:clamp(Math.min(M.w,M.h)*.16,90,165),
      targetAt:0,nextAttack:now()+3500,hurt:0,deathAt:0,rewarded:false}
    return true
  }

  function despawn(){ if(!M.boss||!M.boss.active)return false; M.boss.active=false; return true }

  function player(){
    const s=state(), a=game()
    try{
      if(a&&a.player&&a.player.getPosition){
        const p=a.player.getPosition(s); if(p&&isFinite(p.x)&&isFinite(p.y))return p
      }
    }catch(_){}
    const p=s&&s.store&&s.store.player
    return p&&isFinite(p.x)&&isFinite(p.y)?{x:p.x+(p.width||0)/2,y:p.y+(p.height||0)/2}:null
  }

  function cellSize(){
    const a=game()
    try{
      if(a&&a.config){
        if(isFinite(a.config.cellSize))return a.config.cellSize
        if(a.config.get){const c=a.config.get();if(c&&isFinite(c.cellSize))return c.cellSize}
      }
    }catch(_){}
    return 4
  }

  function element(name,fallback){
    const e=S.enums||g.__SMLN_ENUMS__||{}, m=e.ElementByName||{}
    return Number.isFinite(m[name])?m[name]:fallback
  }

  function create(x,y,id){
    const a=game(),s=state()
    try{
      if(a&&s&&a.elements&&a.elements.createAt){a.elements.createAt(s,Math.round(x),Math.round(y),id,{});return true}
    }catch(_){}
    return false
  }

  function attack(){
    const b=M.boss,p=player(); if(!b||!b.active||b.dying||!p)return
    M.fireballs.push({sx:b.x,sy:b.y,ex:M.w*.5,ey:M.h*.82,start:now(),dur:700,
      wx:Math.round(p.x/cellSize()),wy:Math.round(p.y/cellSize())})
    b.nextAttack=now()+rand(3200,5200)
  }

  function explode(f){
    const fire=element('fire',11), flame=element('flame',13)
    for(let i=0;i<26;i++){
      const a=Math.random()*Math.PI*2,r=rand(1,7)
      create(f.wx+Math.cos(a)*r,f.wy+Math.sin(a)*r,i%4?flame:fire)
    }
    for(let i=0;i<24;i++)M.particles.push({x:f.ex,y:f.ey,vx:rand(-180,180),vy:rand(-210,70),
      born:now(),life:rand(450,900),size:rand(3,8)})
  }

  function gold(amount){
    const s=state(); if(!s||!s.store)return false
    s.store.resources=s.store.resources||{}
    const r=s.store.resources,k=Object.keys(r).find(x=>x.toLowerCase()==='gold')||'gold',v=r[k]
    if(typeof v==='number')r[k]=v+amount
    else if(v&&typeof v==='object'){
      let n=0
      for(const f of ['available','found','amount','count'])if(typeof v[f]==='number'){v[f]+=amount;n++}
      if(!n)v.available=amount
    }else r[k]=amount
    s.store.integrity=s.store.integrity||{cheatsUsed:false,modsUsed:true}
    s.store.integrity.modsUsed=true
    try{S.refreshUI&&S.refreshUI()}catch(_){}
    return true
  }

  function shower(){
    const p=player(); if(!p)return
    const cs=cellSize(), id=element('gold',7)
    for(let i=0;i<42;i++)create(p.x/cs+rand(-9,9),p.y/cs-rand(8,22),id)
  }

  function damage(n){
    const b=M.boss;if(!b||!b.active||b.dying)return
    b.hp=Math.max(0,b.hp-n); b.hurt=now()+130
    if(!b.hp){b.dying=true;b.deathAt=now();b.nextAttack=Infinity}
  }

  function hit(e){
    if(e.button!==0)return
    const b=M.boss;if(!b||!b.active||b.dying)return
    const dx=(e.clientX-b.x)/(b.size*1.15),dy=(e.clientY-b.y)/(b.size*.65)
    if(dx*dx+dy*dy<=1)damage(C.damage)
  }

  function update(t,dt){
    const b=M.boss;if(!b||!b.active)return
    if(b.dying){
      if(t-b.deathAt>1900){
        if(!b.rewarded&&gold(C.reward)){b.rewarded=true;shower()}
        b.active=false
      }
      return
    }
    if(t-b.targetAt>900){
      b.targetAt=t
      b.tx=rand(b.size,Math.max(b.size+1,M.w-b.size))
      b.ty=rand(Math.max(110,b.size*.7),Math.max(130,M.h*.52))
    }
    b.x+=(b.tx-b.x)*Math.min(1,dt*3.8); b.y+=(b.ty-b.y)*Math.min(1,dt*3.8)
    if(t>=b.nextAttack)attack()
    for(let i=M.fireballs.length-1;i>=0;i--){
      const f=M.fireballs[i]
      if(t-f.start>=f.dur){explode(f);M.fireballs.splice(i,1)}
    }
    for(let i=M.particles.length-1;i>=0;i--){
      const q=M.particles[i]; if(t-q.born>q.life){M.particles.splice(i,1);continue}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=210*dt
    }
  }

  function dragon(c,t){
    const b=M.boss;if(!b||!b.active)return
    const d=b.dying?clamp((t-b.deathAt)/1900,0,1):0,s=b.size*(1+d*.2),flap=Math.sin(t*.01)*.22
    c.save();c.translate(b.x,b.y);if(b.dying){c.rotate(d*2);c.globalAlpha=1-d}
    c.lineWidth=Math.max(1,s*.012);c.lineJoin='round';c.shadowBlur=t<b.hurt?26:14
    c.shadowColor=t<b.hurt?'#fff':'#9b44ff'
    const body=t<b.hurt?'#706878':'#17141e', wing='#261c36', edge='#7d3bd1'
    function poly(a,fill){c.beginPath();c.moveTo(a[0][0],a[0][1]);for(let i=1;i<a.length;i++)c.lineTo(a[i][0],a[i][1]);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.stroke()}
    c.save();c.rotate(-flap);poly([[0,-s*.08],[s*.35,-s*.88],[s*.52,-s*.35],[s*.9,-s*.6],[s*.62,0],[s*.15,s*.1]],wing);c.restore()
    c.save();c.rotate(flap);poly([[0,s*.02],[s*.3,s*.82],[s*.5,s*.33],[s*.9,s*.57],[s*.62,-s*.02],[s*.14,-s*.1]],wing);c.restore()
    c.strokeStyle=body;c.lineWidth=s*.11;c.beginPath();c.moveTo(s*.35,0);c.bezierCurveTo(s*.7,0,s*.92,s*.28,s*1.18,s*.12);c.stroke()
    c.fillStyle=body;c.beginPath();c.ellipse(0,0,s*.46,s*.24,0,0,Math.PI*2);c.fill();c.strokeStyle=edge;c.lineWidth=Math.max(1,s*.012);c.stroke()
    c.fillStyle='#24202f';c.fillRect(-s*.86,-s*.17,s*.34,s*.28);c.strokeRect(-s*.86,-s*.17,s*.34,s*.28)
    c.shadowColor='#db5bff';c.shadowBlur=12;c.fillStyle='#db5bff';c.fillRect(-s*.8,-s*.08,s*.05,s*.025);c.fillRect(-s*.64,-s*.08,s*.05,s*.025)
    c.restore()
  }

  function bar(c){
    const b=M.boss;if(!b||!b.active||b.dying)return
    const w=Math.min(620,M.w*.72),x=(M.w-w)/2,y=32,r=b.hp/b.max
    c.fillStyle='rgba(8,8,12,.9)';c.fillRect(x-3,y-3,w+6,24)
    c.fillStyle='#b23cff';c.fillRect(x,y,w*r,18)
    c.font='700 18px system-ui';c.textAlign='center';c.fillStyle='#fff'
    c.fillText('ENDER DRAGON  •  '+Math.ceil(b.hp)+' / '+b.max+' HP',M.w/2,y-8)
  }

  function frame(t){
    requestAnimationFrame(frame)
    if(!M.ctx)return
    const dt=clamp((t-M.last)/1000,0,.05);M.last=t;update(t,dt)
    const c=M.ctx;c.clearRect(0,0,M.w,M.h)
    for(const f of M.fireballs){
      const p=clamp((t-f.start)/f.dur,0,1),x=f.sx+(f.ex-f.sx)*p,y=f.sy+(f.ey-f.sy)*p
      c.fillStyle='#b23cff';c.beginPath();c.arc(x,y,10+14*p,0,Math.PI*2);c.fill()
    }
    dragon(c,t)
    for(const q of M.particles){const a=1-(t-q.born)/q.life;c.globalAlpha=clamp(a,0,1);c.fillStyle='#9b44ff';c.fillRect(q.x,q.y,q.size,q.size)}
    c.globalAlpha=1;bar(c)
  }

  function commands(){
    if(!S.registerCommand)return
    S.registerCommand({name:'dragon',summary:'Control the Ender Dragon boss',
      usage:'dragon <spawn|status|despawn>',
      args:[{name:'action',optional:true,values:()=>['spawn','status','despawn']}],
      run:a=>{
        const x=String(a[0]||'status').toLowerCase()
        if(x==='spawn')return[spawn()?'Ender Dragon spawned.':'Ender Dragon already active.']
        if(x==='despawn')return[despawn()?'Ender Dragon despawned.':'No Ender Dragon active.']
        const b=M.boss;return[b&&b.active?`Ender Dragon: ${Math.ceil(b.hp)}/${b.max} HP`:'Ender Dragon: not active']
      }})
  }

  function start(api){
    M.api=api&&api.game?api.game:(api||S.game);M.state=api&&api.state?api.state:S.state
    ensureCanvas()
    if(!M.auto){M.auto=true;setTimeout(()=>{if(!M.boss||!M.boss.active)spawn()},3500)}
  }

  commands()
  if(S.whenReady)S.whenReady(start);else start({game:S.game,state:S.state})
  if(S.on)S.on('ready',start)
})(globalThis)
