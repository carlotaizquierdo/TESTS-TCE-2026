const BANK_FILES=[
  "estrategias","cross","cocim","internet","protocolo","instrumentos","organismos","fundamentos"
];
const LABELS={
  estrategias:"Estrategias de Negocios Internacionales",
  cross:"Cross Cultural",
  cocim:"COCIM",
  internet:"Internet como fuente de información",
  protocolo:"Protocolo y Comunicación",
  instrumentos:"Instrumentos de análisis económico",
  organismos:"Organismos multilaterales",
  fundamentos:"Fundamentos de Economía"
};

let bank=[],quiz=[],index=0,selected=null,answers=[],currentView="home",uploadedText="",localDocs=[];
const $=id=>document.getElementById(id);
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const esc=s=>(s||"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));

async function loadBanks(){
  const chunks=await Promise.all(BANK_FILES.map(async f=>{
    const r=await fetch("data/"+f+".json");
    return r.json();
  }));
  bank=chunks.flat();
  localDocs=await loadLocalDocs();
  buildSubjects();
}
function buildSubjects(){
  const built=BANK_FILES.map((k,i)=>`
    <label class="subject"><input type="checkbox" value="${k}" ${i<3?"checked":""}>
    <span><strong>${LABELS[k]}</strong><small class="muted"> ${bank.filter(q=>q.subject===k).length} conceptos base</small></span></label>
  `).join("");
  const local=localDocs.map(d=>`
    <label class="subject"><input type="checkbox" value="local:${d.id}">
    <span><strong>${esc(d.subject)}</strong><small class="muted"> ${esc(d.name)} · generación nueva desde el documento</small></span></label>
  `).join("");
  $("subjects").innerHTML=built+local;
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
function showView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===id));
  $(id).classList.add("active");
  currentView=id;
  if(id==="stats") renderStats();
}

function recentIds(){return JSON.parse(localStorage.getItem("tce_recent")||"[]")}
function remember(ids){
  const next=[...ids,...recentIds()].slice(0,120);
  localStorage.setItem("tce_recent",JSON.stringify([...new Set(next)]));
}
function history(){return JSON.parse(localStorage.getItem("tce_history")||"[]")}
function saveHistory(entry){const h=history();h.unshift(entry);localStorage.setItem("tce_history",JSON.stringify(h.slice(0,100)))}
function mistakes(){return JSON.parse(localStorage.getItem("tce_mistakes")||"{}")}
function saveMistakes(result){
  const m=mistakes();
  result.forEach(a=>{
    if(!a.correct&&!a.blank)m[a.item.baseId]=(m[a.item.baseId]||0)+1;
    else if(a.correct&&m[a.item.baseId])m[a.item.baseId]=Math.max(0,m[a.item.baseId]-0.25);
  });
  localStorage.setItem("tce_mistakes",JSON.stringify(m));
}

const stems=[
  q=>q.question,
  q=>"Según el temario, "+q.question.charAt(0).toLowerCase()+q.question.slice(1),
  q=>"Señala la opción correcta: "+q.question
];
const icexStems=[
  q=>"Señale la respuesta correcta: "+q.question,
  q=>"Indique cuál de las siguientes opciones es correcta: "+q.question,
  q=>"De acuerdo con el temario, señale la opción correcta: "+q.question
];
const giveaway=/\b(siempre|nunca|automáticamente|por completo|en todos los casos|sin ninguna condición|exclusivamente|únicamente)\b/i;
function icexQuality(q){
  const lengths=q.options.map(x=>x.length).filter(Boolean);
  if(lengths.length!==4)return -99;
  const ratio=Math.max(...lengths)/Math.max(1,Math.min(...lengths));
  const giveawayCount=q.options.filter(x=>giveaway.test(x)).length;
  let score=(q.difficulty==="hard"?5:q.difficulty==="medium"?3:0)+(q.key?2:0);
  if(ratio<=1.8)score+=4; else if(ratio<=2.4)score+=2; else score-=2;
  if(giveawayCount===0)score+=3; else score-=giveawayCount*2;
  return score;
}
function optionFrame(text,question,target,index){
  let t=(text||"").trim().replace(/[.;]\s*$/,"");
  if(t.length>=target*.82) return t;

  const lower=t.charAt(0).toLowerCase()+t.slice(1);
  const q=(question||"").toLowerCase();

  if(/^solo\s+/i.test(t)){
    const rest=t.replace(/^solo\s+/i,"");
    if(/^(el|la|los|las|un|una|unos|unas)\s+/i.test(rest)){
      t="Centrarse únicamente en "+rest+" como criterio principal";
    }else{
      t="Considerar que "+rest+" de forma exclusiva";
    }
  }else if(/^únicamente\s+/i.test(t)){
    t="Considerar únicamente "+t.replace(/^únicamente\s+/i,"")+" como elemento determinante";
  }else if(/^exclusivamente\s+/i.test(t)){
    t="Limitar la respuesta exclusivamente a "+t.replace(/^exclusivamente\s+/i,"");
  }else if(/^son sinónimos$/i.test(t)){
    t="Considerar ambos conceptos equivalentes y utilizarlos como sinónimos";
  }else if(/^no existe diferencia/i.test(t)){
    t="Sostener que no existe una diferencia relevante entre ambas alternativas";
  }else if(/^que\s+/i.test(t)){
    t="La alternativa según la cual "+t.replace(/^que\s+/i,"");
  }else if(/^porque\s+/i.test(t)){
    t="La explicación según la cual "+t.replace(/^porque\s+/i,"");
  }else if(/^(la|el|una|un|los|las)\s+/i.test(t)){
    if(/\b(es|son|puede|pueden|debe|deben|incluye|incluyen|importa|afecta|elimina|aumenta|reduce|tiene|tienen|exige|exigen|permite|permiten|representa|representan|se)\b/i.test(t)){
      t="La alternativa según la cual "+lower;
    }else{
      t="La alternativa que señala "+lower;
    }
  }else if(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:ar|er|ir)\b/i.test(t)){
    t="La opción basada en "+lower;
  }else if(t.length<36 && /(herramienta|programa|servicio|institución|organismo|indicador|modelo|dimensión|concepto)/i.test(q)){
    t=t+" como alternativa aplicable al supuesto planteado";
  }else{
    t="La alternativa que sostiene que "+lower;
  }

  if(t.length<target*.76){
    const endings=[
      ", dentro del enfoque planteado en la materia",
      ", como explicación principal de este supuesto",
      ", sin introducir otros elementos en el análisis",
      ", como criterio central para resolver la cuestión"
    ];
    const ending=endings[index%endings.length];
    if(t.length+ending.length<=target+10) t+=ending;
  }
  return t;
}

function lengthenDecoy(text,question,target,index){
  let t=(text||"").trim().replace(/[.;]\s*$/,"");
  const q=(question||"").toLowerCase();
  const lower=t.charAt(0).toLowerCase()+t.slice(1);

  if(t.length<target*.70){
    if(/(herramienta|programa|servicio|institución|organismo|indicador|modelo|dimensión|concepto)/i.test(q)){
      t=t+" como alternativa aplicable al supuesto planteado";
    }else if(/^porque\s+/i.test(t)){
      t="La explicación según la cual "+t.replace(/^porque\s+/i,"");
    }else if(/^que\s+/i.test(t)){
      t="La interpretación según la cual "+t.replace(/^que\s+/i,"");
    }else if(/^(la|el|una|un|los|las)\s+/i.test(t)){
      t="La alternativa según la cual "+lower;
    }else if(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:ar|er|ir)\b/i.test(t)){
      t="La opción basada en "+lower;
    }else{
      t="La alternativa que sostiene que "+lower;
    }
  }

  const tails=[
    ", según esta interpretación del contenido",
    ", dentro del supuesto planteado en la pregunta",
    ", como criterio principal para resolver el caso",
    ", de acuerdo con esta lectura del temario"
  ];
  let k=0;
  while(t.length<target && k<tails.length){
    const tail=tails[(index+k)%tails.length];
    if(!t.includes(tail.trim()) && t.length+tail.length<=target+14) t+=tail;
    k++;
  }
  return t;
}

function normalizeOptionSet(base){
  const raw=base.options.map(x=>(x||"").trim());
  const lengths=raw.map(x=>x.length);
  const max=Math.max(...lengths);
  const min=Math.min(...lengths);

  let out=[...raw];
  if(min<max*.78){
    const target=Math.max(44,Math.min(115,max));
    out=raw.map((x,i)=>optionFrame(x,base.question,target,i));
  }

  // Si la correcta sigue destacando por ser la más larga, alargamos
  // una alternativa incorrecta sin cambiar su significado.
  const lens=out.map(x=>x.length);
  const correctLen=lens[base.answer];
  const wrongIdx=lens.map((_,i)=>i).filter(i=>i!==base.answer);
  const maxWrong=Math.max(...wrongIdx.map(i=>lens[i]));
  if(correctLen>maxWrong+5){
    const candidates=wrongIdx.sort((a,b)=>lens[b]-lens[a]);
    const chosen=candidates[Math.floor(Math.random()*Math.min(2,candidates.length))];
    out[chosen]=lengthenDecoy(out[chosen],base.question,correctLen+Math.floor(Math.random()*7)+2,chosen);
  }
  return out;
}

function variantFrom(base,style="general"){
  const qtext=style==="icex"
    ? icexStems[Math.floor(Math.random()*icexStems.length)](base)
    : stems[Math.floor(Math.random()*stems.length)](base);
  const normalized=normalizeOptionSet(base);
  const packed=normalized.map((text,i)=>({text,isCorrect:i===base.answer}));
  const mixed=shuffle(packed);
  return {
    ...base,
    id:base.id+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),
    baseId:base.id,
    question:qtext,
    options:mixed.map(x=>x.text),
    answer:mixed.findIndex(x=>x.isCorrect)
  };
}

function createFreshQuiz(subjects,count,difficulty,priorityOnly=false,forcedBases=null,style="general"){
  let pool=forcedBases||bank.filter(q=>subjects.includes(q.subject));
  if(difficulty!=="mixed")pool=pool.filter(q=>q.difficulty===difficulty);
  if(style==="icex"&&!forcedBases){
    const ranked=pool.map(q=>({q,s:icexQuality(q)})).sort((a,b)=>b.s-a.s);
    const strict=ranked.filter(x=>x.s>=5).map(x=>x.q);
    const looser=ranked.filter(x=>x.s>=2).map(x=>x.q);
    pool=strict.length>=Math.min(count,20)?strict:(looser.length?looser:pool);
  }
  if(!pool.length)return [];
  const recent=new Set(recentIds());
  const scoreMistakes=mistakes();
  let candidates=pool.map(q=>({
    q,
    weight:(q.key&&priorityOnly?4:q.key?2:1)+(scoreMistakes[q.id]||0)*2+(recent.has(q.id)?-3:0)+Math.random()
  })).sort((a,b)=>b.weight-a.weight);
  const unique=[];
  for(const c of candidates){if(!unique.some(x=>x.q.id===c.q.id))unique.push(c)}
  const chosen=unique.slice(0,Math.min(count,unique.length)).map(x=>x.q);
  // If user requests more than base concepts, recycle concepts with different variants.
  while(chosen.length<count&&pool.length){
    chosen.push(pool[Math.floor(Math.random()*pool.length)]);
  }
  const generated=shuffle(chosen.map(b=>variantFrom(b,style)));
  remember(generated.map(x=>x.baseId));
  return generated;
}

$("startBtn").addEventListener("click",()=>{
  const selectedSubjects=[...document.querySelectorAll("#subjects input:checked")].map(x=>x.value);
  if(!selectedSubjects.length){alert("Selecciona al menos una asignatura.");return}
  const count=Math.min(Number($("count").value),999);
  const difficulty=$("difficulty").value;
  const style=$("examStyle")?.value||"general";
  const builtins=selectedSubjects.filter(x=>!x.startsWith("local:"));
  const locals=selectedSubjects.filter(x=>x.startsWith("local:")).map(x=>x.slice(6));
  let parts=[];
  const totalSources=builtins.length+locals.length;
  if(builtins.length){
    const n=Math.max(1,Math.round(count*(builtins.length/totalSources)));
    parts.push(...createFreshQuiz(builtins,n,difficulty,$("priority").checked,null,style));
  }
  if(locals.length){
    const localCount=Math.max(1,count-parts.length);
    const per=Math.max(1,Math.ceil(localCount/locals.length));
    locals.forEach(id=>{
      const d=localDocs.find(x=>String(x.id)===String(id));
      if(d)parts.push(...localQuestionsFromText(d.text,d.subject,d.name,per));
    });
  }
  quiz=shuffle(parts).slice(0,count);
  if(!quiz.length){alert("No hay contenido suficiente para generar ese test.");return}
  startQuiz();
});
function startQuiz(){
  index=0;selected=null;answers=[];
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  $("quiz").classList.add("active");
  renderQuestion();
}
function renderQuestion(){
  const q=quiz[index];
  selected=null;$("nextBtn").disabled=true;
  $("qIndex").textContent=index+1;$("qTotal").textContent=quiz.length;
  $("qSubject").textContent=q.subjectName;$("qSource").textContent=q.source;
  $("progressBar").style.width=(index/quiz.length*100)+"%";
  $("questionText").textContent=q.question;
  $("answers").innerHTML=q.options.map((o,i)=>`<button class="answer" data-i="${i}"><strong>${String.fromCharCode(65+i)}.</strong><span>${esc(o)}</span></button>`).join("");
  document.querySelectorAll(".answer").forEach(b=>b.addEventListener("click",()=>{
    selected=Number(b.dataset.i);
    document.querySelectorAll(".answer").forEach(x=>x.classList.remove("selected"));
    b.classList.add("selected");$("nextBtn").disabled=false;
  }));
  $("nextBtn").textContent=index===quiz.length-1?"Finalizar":"Siguiente";
}
function commitAnswer(blank=false){
  const item=quiz[index];
  answers.push({item,choice:blank?null:selected,blank,correct:!blank&&selected===item.answer});
  index++;
  if(index>=quiz.length)finishQuiz(); else renderQuestion();
}
$("blankBtn").addEventListener("click",()=>commitAnswer(true));
$("nextBtn").addEventListener("click",()=>{if(selected!==null)commitAnswer(false)});
function finishQuiz(){
  $("quiz").classList.remove("active");$("results").classList.add("active");
  const ok=answers.filter(a=>a.correct).length,bad=answers.filter(a=>!a.correct&&!a.blank).length,blank=answers.filter(a=>a.blank).length;
  const raw=ok-bad*.33,grade=raw/answers.length*10;
  $("grade").textContent=grade.toFixed(2).replace(".",",");
  $("summary").innerHTML=`<div class="metric"><span>Aciertos</span><strong>${ok}</strong></div><div class="metric"><span>Fallos</span><strong>${bad}</strong></div><div class="metric"><span>Blanco</span><strong>${blank}</strong></div>`;
  $("formula").textContent=`${ok} × 1 − ${bad} × 0,33 = ${raw.toFixed(2).replace(".",",")} puntos. Nota: ${grade.toFixed(2).replace(".",",")}/10.`;
  $("review").innerHTML=answers.map((a,i)=>`<article class="review-card"><strong>${i+1}. ${esc(a.item.question)}</strong><p class="${a.correct?"right":"wrong"}">Tu respuesta: ${a.blank?"En blanco":esc(a.item.options[a.choice])}</p><p class="right">Correcta: ${esc(a.item.options[a.item.answer])}</p><p class="muted">${esc(a.item.explanation)}</p><small class="source">Fuente: ${esc(a.item.source)}</small></article>`).join("");
  saveHistory({date:new Date().toISOString(),subjects:[...new Set(answers.map(a=>a.item.subject))],ok,bad,blank,grade});
  saveMistakes(answers);
}
$("newBtn").addEventListener("click",()=>showView("home"));
$("retryBtn").addEventListener("click",()=>{
  const failed=[...new Map(answers.filter(a=>!a.correct&&!a.blank).map(a=>[a.item.baseId,bank.find(q=>q.id===a.item.baseId)])).values()].filter(Boolean);
  if(!failed.length){alert("No tienes preguntas falladas.");return}
  quiz=createFreshQuiz([...new Set(failed.map(x=>x.subject))],Math.max(10,failed.length),"mixed",true,failed,$("examStyle")?.value||"icex");
  startQuiz();
});

function renderStats(){
  const h=history(),m=mistakes();
  if(!h.length){$("statsBody").innerHTML='<p class="muted">Todavía no hay intentos guardados.</p>';return}
  const per={};
  h.forEach(x=>x.subjects.forEach(s=>{per[s]??={n:0,sum:0};per[s].n++;per[s].sum+=x.grade}));
  const worst=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id,n])=>({q:bank.find(x=>x.id===id),n})).filter(x=>x.q);
  $("statsBody").innerHTML='<h3>Por asignatura</h3>'+Object.entries(per).map(([s,v])=>`<div class="stat-row"><span>${LABELS[s]}</span><strong>${(v.sum/v.n).toFixed(2).replace(".",",")}/10</strong></div>`).join("")+
  '<h3>Preguntas que más fallo</h3>'+(worst.length?worst.map(x=>`<div class="stat-row"><span>${esc(x.q.question)}</span><strong>${Math.round(x.n)} fallos</strong></div>`).join(""):'<p class="muted">Sin fallos acumulados.</p>');
}
$("resetBtn").addEventListener("click",()=>{if(confirm("¿Borrar estadísticas e historial local?")){["tce_history","tce_mistakes","tce_recent"].forEach(k=>localStorage.removeItem(k));renderStats()}});

// IndexedDB: guarda los documentos solo en este dispositivo.
function openLocalDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("tests-tce-db",1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("docs"))db.createObjectStore("docs",{keyPath:"id",autoIncrement:true})};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function loadLocalDocs(){
  try{
    const db=await openLocalDB();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction("docs","readonly"),req=tx.objectStore("docs").getAll();
      req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
    });
  }catch(e){console.error(e);return []}
}
async function saveLocalDoc(doc){
  const db=await openLocalDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction("docs","readwrite"),req=tx.objectStore("docs").add(doc);
    req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);
  });
}

// Local file ingestion. Generates fresh basic cloze-style questions without paid AI.
$("fileInput").addEventListener("change",async e=>{
  const f=e.target.files[0]; if(!f)return;
  $("fileInfo").textContent="Procesando "+f.name+"…";
  try{
    if(f.name.toLowerCase().endsWith(".txt")) uploadedText=await f.text();
    else if(f.name.toLowerCase().endsWith(".docx")){
      const arr=await f.arrayBuffer(); const res=await mammoth.extractRawText({arrayBuffer:arr}); uploadedText=res.value;
    }else if(f.name.toLowerCase().endsWith(".pdf")){
      uploadedText=await readPdfLocally(f);
    }else throw new Error("Formato no compatible");
    $("fileInfo").textContent=`${f.name}: ${uploadedText.length.toLocaleString("es-ES")} caracteres extraídos.`;
    $("generateBtn").disabled=uploadedText.length<200;
  }catch(err){$("fileInfo").textContent="No he podido leer ese archivo en el navegador. Prueba con DOCX o TXT.";console.error(err)}
});
async function readPdfLocally(file){
  // Load pdf.js dynamically as an ES module so it works on GitHub Pages.
  const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs";
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
  let text="";
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const tc=await page.getTextContent();text+="\n"+tc.items.map(i=>i.str).join(" ")}
  return text;
}
function extractConceptPairs(text){
  const clean=text.replace(/\s+/g," ").trim();
  const sentences=clean.split(/(?<=[.!?])\s+/).filter(s=>s.length>=45&&s.length<=320);
  const pairs=[],seen=new Set();
  const add=(concept,definition)=>{
    concept=(concept||"").replace(/^[•\-–—\d.)\s]+/,"").trim();
    definition=(definition||"").trim().replace(/[.;:]$/,"");
    if(concept.length<3||concept.length>70||definition.length<20||definition.length>240)return;
    if(concept.split(/\s+/).length>10)return;
    const key=concept.toLowerCase();
    if(seen.has(key))return;
    seen.add(key);pairs.push({concept,definition});
  };
  for(const s of sentences){
    let m=s.match(/^([^:]{3,70}):\s+(.{20,240})$/);
    if(m){add(m[1],m[2]);continue}
    m=s.match(/^(.{3,70}?)\s+(?:es|son|se define como|se refiere a|consiste en|sirve para|permite)\s+(.{20,240})$/i);
    if(m)add(m[1],m[2]);
  }
  return pairs;
}
function localQuestionsFromText(text,subjectName,source,count){
  const pairs=extractConceptPairs(text);
  if(pairs.length<4)return [];
  const pool=shuffle(pairs);
  const out=[];
  let cursor=0;
  while(out.length<count&&cursor<pool.length*3){
    const item=pool[cursor%pool.length],others=shuffle(pairs.filter(p=>p.concept.toLowerCase()!==item.concept.toLowerCase()));
    if(others.length<3)break;
    const reverse=Math.random()<0.45;
    if(reverse){
      const packed=shuffle([{text:item.concept,ok:true},...others.slice(0,3).map(p=>({text:p.concept,ok:false}))]);
      out.push({
        id:"local-"+Date.now()+"-"+out.length+"-"+Math.random().toString(36).slice(2,6),
        baseId:"local-"+source+"-"+item.concept,
        subject:"custom",subjectName,source,
        question:'¿A qué concepto del temario corresponde esta descripción? “'+item.definition+'”',
        options:packed.map(x=>x.text),answer:packed.findIndex(x=>x.ok),
        explanation:'La descripción corresponde a «'+item.concept+'» según el documento cargado.',
        difficulty:"medium",key:false
      });
    }else{
      const packed=shuffle([{text:item.definition,ok:true},...others.slice(0,3).map(p=>({text:p.definition,ok:false}))]);
      out.push({
        id:"local-"+Date.now()+"-"+out.length+"-"+Math.random().toString(36).slice(2,6),
        baseId:"local-"+source+"-"+item.concept,
        subject:"custom",subjectName,source,
        question:'Según el documento, ¿qué descripción corresponde mejor a «'+item.concept+'»?',
        options:packed.map(x=>x.text),answer:packed.findIndex(x=>x.ok),
        explanation:'«'+item.concept+'» se asocia en el documento con: '+item.definition,
        difficulty:"medium",key:false
      });
    }
    cursor++;
  }
  return shuffle(out).slice(0,count);
}

$("generateBtn").addEventListener("click",async()=>{
  const subject=$("uploadSubject").value.trim()||"Temario añadido";
  const source=$("fileInput").files[0]?.name||"Documento cargado";
  const n=Number($("generatedCount").value);
  const qs=localQuestionsFromText(uploadedText,subject,source,n);
  if(!qs.length){alert("No he podido extraer suficientes frases para generar preguntas.");return}
  await saveLocalDoc({subject,name:source,text:uploadedText,addedAt:new Date().toISOString()});
  localDocs=await loadLocalDocs();
  buildSubjects();
  $("generatedPreview").innerHTML='<h3>Temario guardado</h3>'+qs.slice(0,5).map(q=>`<div class="preview-q"><strong>${esc(q.question)}</strong></div>`).join("")+`<p class="muted">El documento queda guardado en este iPad. Cada nuevo test generará otra tanda desde su contenido.</p><button id="practiceGenerated" class="primary">Practicar ahora</button>`;
  document.getElementById("practiceGenerated").addEventListener("click",()=>{quiz=shuffle(localQuestionsFromText(uploadedText,subject,source,n));startQuiz()});
});

let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden")});
$("installBtn").addEventListener("click",async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}else alert("En iPad: Safari → Compartir → Añadir a pantalla de inicio.")});
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
loadBanks();
