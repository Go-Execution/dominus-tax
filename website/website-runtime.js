(async()=>{
 const aliases={'#admin':'/crm','#cms':'/cms','#about':'/#firm','#contact':'/#book','#booking':'/#book'};
 if(aliases[location.hash]){location.replace(aliases[location.hash]);return;}
 const initial=new Map();document.querySelectorAll('[data-cms]').forEach(e=>initial.set(e,e.textContent));
 const initialLinks=new Map();document.querySelectorAll('[data-cms-link]').forEach(e=>initialLinks.set(e,e.getAttribute('href')));
 const schema=await fetch('/website-schema.json').then(r=>r.json());
 function apply(content){
  const values=content.values||{};
  initial.forEach((text,e)=>e.textContent=values[e.dataset.cms]??text);
  initialLinks.forEach((url,e)=>e.setAttribute('href',values[e.dataset.cmsLink]??url));
  schema.fields.forEach(f=>{const v=values[f.id]??f.value;
   if(f.type==='image'){if(v)document.documentElement.style.setProperty('--cms-'+f.id,'url("'+v+'")');else document.documentElement.style.removeProperty('--cms-'+f.id);}
   if(f.type==='color')document.documentElement.style.setProperty(f.variable,v);
   if(f.type==='title')document.title=v;
   if(f.type==='description')document.querySelector('meta[name="description"]').content=v;
  });
  document.querySelectorAll('[data-cms-section]').forEach(e=>e.hidden=(content.hidden||[]).includes(e.dataset.cmsSection));
  (content.order||schema.sections.map(s=>s.id)).forEach(id=>{const e=document.querySelector('[data-cms-section="'+id+'"]');if(e)document.querySelector('main').append(e);});
  const marquee=document.querySelector('.marquee');if(marquee)document.querySelector('.hero').after(marquee);
 }
 const preview=new URLSearchParams(location.search).has('cms-preview')&&window.parent!==window;
 if(preview){
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='dominus-preview')apply(e.data.content);});
  document.addEventListener('click',e=>{e.preventDefault();const el=e.target.closest('[data-cms]');if(el)parent.postMessage({type:'dominus-select',id:el.dataset.cms},location.origin);});
  parent.postMessage({type:'dominus-ready'},location.origin);
 }else{try{const r=await fetch('/api/website');if(r.ok)apply((await r.json()).content);}catch{ /* The supplied homepage remains usable when content storage is unavailable. */ }}
})();
