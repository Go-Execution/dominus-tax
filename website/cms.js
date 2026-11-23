const $=id=>document.getElementById(id);
let schema,content,published,group='Navigation',dirty=false,busy=false;
const status=message=>$('status').textContent=message;
async function api(url,options={}){const r=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});const data=await r.json();if(!r.ok)throw new Error(data.error||'The request failed. Please try again.');return data;}
function preview(){ $('preview').contentWindow.postMessage({type:'dominus-preview',content},location.origin); }
function changed(){dirty=true;status('Unsaved changes · preview only');preview();}
function draw(){
 $('group-title').textContent=group;const out=$('fields');out.replaceChildren();
 document.querySelectorAll('#groups button').forEach(b=>b.classList.toggle('active',b.textContent===group));
 if(group==='Page sections'){
  content.order.forEach((id,index)=>{const section=schema.sections.find(s=>s.id===id);const row=document.createElement('div');row.className='section-row';const label=document.createElement('label');const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=!content.hidden.includes(id);toggle.onchange=()=>{content.hidden=toggle.checked?content.hidden.filter(s=>s!==id):[...content.hidden,id];changed();};label.append(toggle,document.createTextNode(' '+section.label));row.append(label,document.createElement('br'));
   for(const [text,offset] of [['Move up',-1],['Move down',1]]){const b=document.createElement('button');b.textContent=text;b.className='quiet';b.disabled=index+offset<0||index+offset>=content.order.length;b.onclick=()=>{[content.order[index],content.order[index+offset]]=[content.order[index+offset],content.order[index]];changed();draw();};row.append(b);}out.append(row);});return;
 }
 const search=$('search').value.toLowerCase();
 schema.fields.filter(f=>search?(f.label+' '+(content.values[f.id]??f.value)).toLowerCase().includes(search):f.group===group).forEach(f=>{
 const wrap=document.createElement('div');wrap.className='field';wrap.id='wrap-'+f.id;const label=document.createElement('label');label.htmlFor=f.id;label.textContent=f.label;const input=document.createElement(f.type==='text'&&f.value.length>70?'textarea':'input');input.id=f.id;if(input.tagName==='INPUT')input.type=f.type==='color'?'color':'text';input.value=content.values[f.id]??f.value;input.maxLength=10000;input.oninput=()=>{content.values[f.id]=input.value;changed();};wrap.append(label,input);
 if(f.type==='image'){const hint=document.createElement('small');hint.textContent='Upload a website image (JPG, PNG or WebP, under 3 MB), or paste an HTTPS image URL. Leave empty for the original. Uploaded images are publicly accessible.';const upload=document.createElement('input');upload.type='file';upload.accept='image/jpeg,image/png,image/webp';upload.setAttribute('aria-label','Upload '+f.label);upload.onchange=async()=>{const file=upload.files[0];if(!file)return;if(file.size>3*1024*1024){status('Image must be smaller than 3 MB.');return;}upload.disabled=true;try{const result=await api('/api/website',{method:'POST',headers:{'Content-Type':file.type},body:file});content.values[f.id]=result.url;input.value=result.url;changed();}catch(err){status(err.message);}finally{upload.disabled=false;}};wrap.append(hint,upload);}if(f.type==='link'){const hint=document.createElement('small');hint.textContent='This link is updated everywhere it appears on the page.';wrap.append(hint);}out.append(wrap);
 });
}
async function openStudio(){
 await api('/api/auth/me');
 [schema,{draft:content,published}]=await Promise.all([api('/website-schema.json'),api('/api/website?mode=admin')]);
 schema.fields.forEach(f=>{if(['image','color','title','description'].includes(f.type))f.group=f.type==='image'?'Images':f.type==='color'?'Brand colors':'Search & SEO';});
 $('login').hidden=true;$('login').style.display='none';$('studio').hidden=false;
 const groups=[...new Set(schema.fields.map(f=>f.group)),'Page sections'];$('groups').replaceChildren();groups.forEach(name=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{group=name;$('search').value='';draw();};$('groups').append(b);});draw();preview();status('Ready to edit · changes stay private until published');
}
$('login-form').onsubmit=async e=>{e.preventDefault();$('login-error').textContent='';const b=e.submitter;b.disabled=true;try{await api('/api/auth/temporary-login',{method:'POST',body:JSON.stringify({password:$('password').value})});$('password').value='';await openStudio();}catch(err){$('login-error').textContent=err.message;}finally{b.disabled=false;}};
async function save(action){if(busy)return;busy=true;$('save').disabled=$('publish').disabled=true;try{const snapshot=structuredClone(content);await api('/api/website',{method:'PUT',body:JSON.stringify({action:'draft',content:snapshot})});if(action==='publish'){const r=await api('/api/website',{method:'PUT',body:JSON.stringify({action:'publish',content:snapshot})});published=snapshot;$('published-date').textContent='Published '+new Date(r.savedAt).toLocaleString();}dirty=JSON.stringify(snapshot)!==JSON.stringify(content);status(action==='publish'?'Published successfully · your website is live':'Draft saved · live website is unchanged');}catch(err){status(err.message);}finally{busy=false;$('save').disabled=$('publish').disabled=false;}}
$('save').onclick=()=>save('draft');$('publish').onclick=()=>$('publish-dialog').showModal();$('cancel-publish').onclick=()=>$('publish-dialog').close();$('confirm-publish').onclick=()=>{$('publish-dialog').close();save('publish');};
$('restore').onclick=()=>{if(confirm('Replace your current draft with the last published content?')){content=structuredClone(published);changed();draw();}};
$('search').oninput=draw;
$('logout').onclick=async()=>{if(dirty&&!confirm('You have unsaved changes. Sign out anyway?'))return;await api('/api/auth/temporary-logout',{method:'POST'});dirty=false;location.reload();};
$('desktop').onclick=()=>$('preview').style.maxWidth='100%';$('mobile').onclick=()=>$('preview').style.maxWidth='390px';
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('preview').contentWindow||!schema)return;if(e.data?.type==='dominus-ready')preview();if(e.data?.type==='dominus-select'){const f=schema.fields.find(f=>f.id===e.data.id);if(!f)return;group=f.group;$('search').value='';draw();$(f.id).focus();$(f.id).scrollIntoView({block:'center',behavior:'smooth'});}});
openStudio().catch(err=>{if(!/Authentication required|Invalid or expired|not enabled/i.test(err.message))$('login-error').textContent=err.message;});
