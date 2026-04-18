document.querySelectorAll('a[href^="#svc-"]').forEach((link)=>{
  link.addEventListener('click', (e)=>{
    const target = document.querySelector(link.getAttribute('href'));
    if(!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior:'smooth', block:'start'});
  });
});


(function(){
  const track = document.getElementById('cinematicTrack');
  const wrap = document.getElementById('cinematicPhoneWrap');
  const hotspot = document.getElementById('cinematicHotspot');
  const title = document.getElementById('cinematicTitle');
  const desc = document.getElementById('cinematicDesc');
  const counter = document.getElementById('cinematicCounter');
  const steps = [...document.querySelectorAll('.cine-step')];
  if(!track || !wrap || !hotspot || !title || !desc || !counter || !steps.length) return;

  let activeIndex = -1;
  let ticking = false;

  function setActive(index){
    if(index === activeIndex || !steps[index]) return;
    activeIndex = index;
    const step = steps[index];
    steps.forEach((item, i)=> item.classList.toggle('is-active', i === index));
    title.textContent = step.dataset.title || '';
    desc.textContent = step.dataset.desc || '';
    counter.textContent = step.dataset.counter || '';
    hotspot.style.left = `${step.dataset.hx || 50}%`;
    hotspot.style.top = `${step.dataset.hy || 50}%`;
  }

  function update(){
    ticking = false;
    const rect = track.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const total = Math.max(1, rect.height - vh);
    const raw = (-rect.top) / total;
    const progress = Math.max(0, Math.min(1, raw));

    const points = steps.map((step)=> ({
      x: Number(step.dataset.x || 50),
      y: Number(step.dataset.y || 0),
      rotate: Number(step.dataset.rotate || 0),
      scale: Number(step.dataset.scale || 1)
    }));

    const segment = 1 / (points.length - 1);
    let idx = Math.min(points.length - 2, Math.floor(progress / segment));
    idx = Math.max(0, idx);
    const localStart = idx * segment;
    const localProgress = Math.min(1, Math.max(0, (progress - localStart) / segment));
    const a = points[idx];
    const b = points[Math.min(points.length - 1, idx + 1)];
    const lerp = (v1, v2, t)=> v1 + (v2 - v1) * t;

    const x = lerp(a.x, b.x, localProgress);
    const y = lerp(a.y, b.y, localProgress);
    const r = lerp(a.rotate, b.rotate, localProgress);
    const s = lerp(a.scale, b.scale, localProgress);
    wrap.style.transform = `translate3d(${x}vw, ${y}vh, 0) rotate(${r}deg) scale(${s})`;

    let closest = 0;
    let minDistance = Infinity;
    steps.forEach((step, index)=>{
      const stepRect = step.getBoundingClientRect();
      const center = stepRect.top + stepRect.height / 2;
      const distance = Math.abs(center - vh / 2);
      if(distance < minDistance){
        minDistance = distance;
        closest = index;
      }
    });
    setActive(closest);
  }

  function requestUpdate(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, {passive:true});
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
})();
