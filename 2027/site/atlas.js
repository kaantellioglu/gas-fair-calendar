(function () {
  'use strict';
  const radians = Math.PI / 180;
  const continents = {
    Europe: ['Avrupa', 18, 50], Asia: ['Asya', 92, 34],
    Africa: ['Afrika', 20, 4], 'North America': ['Kuzey Amerika', -98, 37],
    'South America': ['Güney Amerika', -61, -18], Oceania: ['Okyanusya', 144, -22]
  };
  const small = {
    BH: [50.55, 26.05, 'Asia'], SG: [103.82, 1.35, 'Asia'],
    MT: [14.38, 35.9, 'Europe'], AD: [1.6, 42.55, 'Europe'],
    LI: [9.55, 47.16, 'Europe'], MC: [7.42, 43.74, 'Europe'],
    SM: [12.46, 43.94, 'Europe'], VA: [12.45, 41.9, 'Europe'],
    MU: [57.55, -20.28, 'Africa'], SC: [55.46, -4.62, 'Africa'],
    KM: [43.33, -11.7, 'Africa'], ST: [6.61, .32, 'Africa'],
    CV: [-23.6, 15.11, 'Africa'], MV: [73.5, 4.17, 'Asia']
  };
  const centres = {FR:[2.2,46.4],US:[-98,39],NO:[12,64],GB:[-2,54],RU:[48,57],NZ:[172,-41]};
  const toSphere = ([longitude,latitude]) => {
    const a = longitude * radians, b = latitude * radians, c = Math.cos(b);
    return [c * Math.sin(a), Math.sin(b), c * Math.cos(a)];
  };
  const countries = new Map();
  const land = (window.GazAtlasGeometry || []).map(([code,name,continent,polygons]) => {
    const largest = polygons.reduce((a,b) => a[0].length >= b[0].length ? a : b);
    const sum = largest[0].map(toSphere).reduce((a,p) => a.map((v,i) => v+p[i]), [0,0,0]);
    const center = centres[code] || [Math.atan2(sum[0],sum[2])/radians, Math.atan2(sum[1],Math.hypot(sum[0],sum[2]))/radians];
    const result = {code,name,continent,center,rings:polygons.flatMap(p => p.map(ring => ring.map(toSphere)))};
    if (code) countries.set(code,result);
    return result;
  });
  const markers = [];
  for (const [code,[lon,lat,continent]] of Object.entries(small)) {
    if (countries.has(code)) continue;
    const item = {code,name:code,continent,center:[lon,lat],point:toSphere([lon,lat])};
    countries.set(code,item);
    markers.push(item);
  }
  window.GazAtlas = function (root, events, onChange) {
    const select = root.querySelector('#atlas-country');
    const regions = root.querySelector('#atlas-regions');
    const status = root.querySelector('#atlas-status');
    const canvas = root.querySelector('canvas');
    const motion = root.querySelector('#atlas-motion');
    const moveButtons = root.querySelectorAll('[data-rotate]');
    const label = root.querySelector('#atlas-map-label');
    const ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const names = new Intl.DisplayNames(['tr'],{type:'region'});
    const counts = new Map(), labels = new Map();
    for (const event of events) {
      counts.set(event.countryCode,(counts.get(event.countryCode)||0)+1);
      labels.set(event.countryCode,event.country);
    }
    const namesFor = item => labels.get(item.code) || (item.code ? names.of(item.code) : item.name) || item.name;
    const collator = new Intl.Collator('tr');
    let region = '', chosen = '', lon = 10, lat = 29, spin = !reduced.matches;
    let pointer = null, hovered = null, over = false, visible = true, frame = 0, last = 0;
    let width = 0, height = 0, ratio = 1, hits = [];
    const usable = !!(ctx && land.length && typeof Path2D === 'function');
    function options() {
      const all = [...countries.values()].filter(i => !region || i.continent === region).sort((a,b) => collator.compare(namesFor(a),namesFor(b)));
      for (const [code,name] of labels) if (!region && !countries.has(code)) all.push({code,name});
      select.replaceChildren(new Option('Tüm ülkeler',''),...all.map(i => new Option(namesFor(i)+(counts.has(i.code) ? ' · '+counts.get(i.code) : ''),i.code)));
      select.value = chosen;
    }
    function statusText() {
      const n = chosen ? counts.get(chosen)||0 : region ? events.filter(e => countries.get(e.countryCode)?.continent === region).length : events.length;
      const name = chosen ? labels.get(chosen) || namesFor(countries.get(chosen)) : region ? continents[region][0] : 'Tüm dünya';
      status.textContent = name+' · '+n+' etkinlik';
    }
    function updateButtons() {
      regions.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.region === region)));
      motion.textContent = spin ? 'Dönüşü durdur' : 'Dönüşü başlat';
    }
    function apply(nextRegion,nextCountry,notify=true,focus=true) {
      region = nextRegion;
      chosen = nextCountry;
      hovered = null;
      label.hidden = true;
      if (focus && chosen && countries.get(chosen)?.center) {
        [lon,lat] = countries.get(chosen).center;
        spin = false;
      } else if (focus && region) {
        [,lon,lat] = continents[region];
        spin = false;
      }
      options();
      statusText();
      updateButtons();
      draw();
      if (notify) onChange(chosen);
    }
    function selectCountry(code,notify=true) {
      const next = countries.get(code);
      apply(code && region && next?.continent !== region ? '' : region,code,notify);
    }
    function clearAll() {
      apply('','',false,false);
      onChange('',true);
    }
    function toggleCountry(code) {
      if (code === chosen) clearAll();
      else selectCountry(code);
    }
    for (const [value,labelText] of [['','Tüm dünya'],...Object.entries(continents).map(([k,v])=>[k,v[0]])]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = labelText;
      button.dataset.region = value;
      button.addEventListener('click',() => {
        if (!value || (value === region && !chosen)) clearAll();
        else apply(value,'');
      });
      regions.append(button);
    }
    select.addEventListener('change',() => selectCountry(select.value));
    motion.addEventListener('click',() => {spin = !spin; updateButtons(); schedule();});
    reduced.addEventListener('change',e => {if (e.matches) {spin = false; updateButtons();}});
    for (const b of moveButtons) b.addEventListener('click',() => {
      spin = false; lon += Number(b.dataset.rotate); updateButtons(); draw();
    });
    function draw() {
      if (!usable || !width || !height) return;
      const r = Math.min(width,height) * .438, cx = width/2, cy = height/2;
      const a = lon * radians, b = lat * radians, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const project = ([x,y,z]) => {
        const horizontal = z*ca+x*sa;
        return [cx+r*(x*ca-z*sa),cy-r*(y*cb-horizontal*sb),y*sb+horizontal*cb];
      };
      ctx.clearRect(0,0,width,height);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fillStyle = '#0b4156'; ctx.fill(); ctx.clip();
      function trace(ring,close) {
        const points = ring.map(project);
        let prev = points[0], open = false;
        const path = new Path2D();
        if (prev[2] >= 0) {path.moveTo(prev[0],prev[1]);open = true;}
        for (const p of points.slice(1)) {
          if ((p[2] >= 0) !== (prev[2] >= 0)) {
            const f = prev[2]/(prev[2]-p[2]);
            const x = prev[0]+f*(p[0]-prev[0]), y = prev[1]+f*(p[1]-prev[1]);
            if (!open || (!close && p[2] >= 0)) {path.moveTo(x,y);open=true;}
            else path.lineTo(x,y);
          }
          if (p[2] >= 0) path.lineTo(p[0],p[1]);
          prev = p;
        }
        if (close && open) path.closePath();
        return path;
      }
      ctx.strokeStyle = '#2f5f70'; ctx.lineWidth = .65;
      for (const ring of grid) ctx.stroke(trace(ring,false));
      hits = [];
      for (const item of land) {
        const path = new Path2D();
        for (const ring of item.rings) path.addPath(trace(ring,true));
        const isActive = item.code && item.code === (hovered || chosen);
        const shown = counts.has(item.code);
        ctx.fillStyle = isActive ? '#effcc8' : shown && (!region || item.continent === region) && (!chosen || chosen === item.code) ? '#91ce91' : '#3e6d73';
        ctx.fill(path,'evenodd');
        ctx.strokeStyle = '#143f50'; ctx.lineWidth = .55; ctx.stroke(path);
        if (item.code) hits.push([item.code,path]);
      }
      for (const item of markers) {
        if (!counts.has(item.code) && chosen !== item.code) continue;
        const [x,y,z] = project(item.point);
        if (z < 0) continue;
        const path = new Path2D(); path.arc(x,y,4,0,Math.PI*2);
        ctx.fillStyle = (chosen === item.code || hovered === item.code) ? '#effcc8' : '#91ce91';
        ctx.fill(path); ctx.stroke(path);
        hits.push([item.code,path]);
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle='#6293a3';ctx.lineWidth=1;ctx.stroke();
    }
    function pick(event) {
      const box = canvas.getBoundingClientRect();
      const x = (event.clientX-box.left)*ratio, y = (event.clientY-box.top)*ratio;
      return hits.findLast(([,path]) => ctx.isPointInPath(path,x,y,'evenodd'))?.[0] || '';
    }
    function schedule() {
      if (frame || !usable || !visible || !spin || over || pointer || document.hidden) return;
      frame = requestAnimationFrame(time => {
        frame=0;
        if (!spin || over || pointer || !visible || document.hidden) {last=0;return;}
        if (!last || time-last >= 32) {
          lon += Math.min(64,last ? time-last : 0)*.009;
          last=time; draw();
        }
        schedule();
      });
    }
    const grid = [];
    for (let m=-180;m<180;m+=30) grid.push(Array.from({length:73},(_,i)=>toSphere([m,-90+i*2.5])));
    for (let p=-60;p<=60;p+=30) grid.push(Array.from({length:145},(_,i)=>toSphere([-180+i*2.5,p])));
    if (usable) {
      new ResizeObserver(() => {
        const box = canvas.getBoundingClientRect();
        width=box.width; height=box.height; ratio=Math.min(2,devicePixelRatio||1);
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
        ctx.setTransform(ratio,0,0,ratio,0,0);draw();schedule();
      }).observe(canvas);
      new IntersectionObserver(([entry]) => {visible=entry.isIntersecting;last=0;schedule();}).observe(root);
      document.addEventListener('visibilitychange',() => {last=0;schedule();});
      canvas.addEventListener('pointerenter',e => {if (e.pointerType === 'mouse') {over = true;last=0;}});
      canvas.addEventListener('pointerleave',() => {over=false; hovered=null;label.hidden=true;draw();schedule();});
      canvas.addEventListener('pointerdown',e => {
        if (pointer || e.button !== 0) return;
        pointer = {id:e.pointerId,x:e.clientX,y:e.clientY,lon,lat,drag:false};
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove',e => {
        if (pointer?.id === e.pointerId) {
          const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
          if (!pointer.drag && Math.hypot(dx,dy)<5) return;
          pointer.drag=true;spin=false;lon=pointer.lon-dx*.55;lat=Math.max(-80,Math.min(80,pointer.lat+dy*.35));
          hovered=null;label.hidden=true;updateButtons();draw();return;
        }
        if (pointer || e.pointerType !== 'mouse') return;
        const code=pick(e);
        if (code===hovered) return;
        hovered=code;
        label.hidden=!code;
        if(code) label.textContent=namesFor(countries.get(code))+' · '+(counts.get(code)||0)+' etkinlik';
        draw();
      });
      canvas.addEventListener('pointerup',e => {
        if (!pointer || e.pointerId!==pointer.id) return;
        const code = !pointer.drag && pick(e);
        pointer=null;
        if(code) toggleCountry(code);
        schedule();
      });
      for (const event of ['pointercancel','lostpointercapture']) canvas.addEventListener(event,e => {
        if(pointer?.id===e.pointerId) {pointer=null;schedule();}
      });
    } else {
      canvas.hidden=true; motion.hidden=true;
      moveButtons.forEach(b=>b.hidden=true);
      root.querySelector('#atlas-help').textContent='Harita görüntülenemiyor. Kıta ve ülke filtrelerini kullanabilirsiniz.';
    }
    apply('','',false,false);
    return {
      selectCountry, reset:() => apply('','',false,false),
      selection:() => ({country:chosen,region}),
      restore:(nextRegion,code) => apply(continents[nextRegion] ? nextRegion : '',countries.has(code) ? code : '',false),
      includes:event => (!chosen || event.countryCode===chosen) && (!region || countries.get(event.countryCode)?.continent===region)
    };
  };
})();
