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

let bank=[],quiz=[],index=0,selected=null,answers=[],currentView="home",uploadedText="";
const $=id=>document.getElementById(id);
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const esc=s=>(s||"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));

async function loadBanks(){
  const chunks=await Promise.all(BANK_FILES.map(async f=>{
    const r=await fetch("data/"+f+".json");
    return r.json();
  }));
  bank=chunks.flat();
  buildSubjects();
}
function buildSubjects(){
  $("subjects").innerHTML=BANK_FILES.map((k,i)=>`
    <label class="subject"><input type="checkbox" value="${k}" ${i<3?"checked":""}>
    <span><strong>${LABELS[k]}</strong><small class="muted"> ${bank.filter(q=>q.subject===k).length} conceptos base</small></span></label>
  `).join("");
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

const stems={
  direct:[
    q=>q.question,
    q=>"Según el temario, "+q.question.charAt(0).toLowerCase()+q.question.slice(1),
    q=>"¿Cuál de las siguientes opciones responde correctamente a esta cuestión? "+q.question,
    q=>"Señala la opción correcta: "+q.question
  ],
  reverse:[
    q=>`¿Qué concepto o respuesta corresponde mejor con esta explicación: “${q.explanation}”?`,
    q=>`A partir de la explicación del temario —${q.explanation}—, ¿qué opción es correcta?`
  ],
  false:[
    q=>"¿Cuál de las siguientes afirmaciones es INCORRECTA en relación con este contenido?",
    q=>"Señala la opción que NO encaja con el concepto estudiado."
  ]
};

function variantFrom(base, allPool){
  const seed=Math.random();
  let qtext,options=[...base.options],correct=base.answer,type="direct";

  if(seed<0.62){
    qtext=stems.direct[Math.floor(Math.random()*stems.direct.length)](base);
  }else if(seed<0.82){
    type="reverse";
    qtext=stems.reverse[Math.floor(Math.random()*stems.reverse.length)](base);
    const correctText=base.options[base.answer];
    const distractors=shuffle(allPool.filter(x=>x.id!==base.id).map(x=>x.options[x.answer]).filter(Boolean))
      .filter((v,i,a)=>a.indexOf(v)===i&&v!==correctText).slice(0,3);
    if(distractors.length===3){options=[correctText,...distractors];correct=0}else{qtext=base.question}
  }else{
    type="direct";
    qtext=stems.direct[Math.floor(Math.random()*stems.direct.length)](base);
  }

  const packed=options.map((text,i)=>({text,isCorrect:i===correct}));
  const mixed=shuffle(packed);
  const answer=mixed.findIndex(x=>x.isCorrect);

  return {
    ...base,
    id:base.id+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),
    baseId:base.id,
    question:qtext,
    options:mixed.map(x=>x.text),
    answer,
    variantType:type
  };
}

function createFreshQuiz(subjects,count,difficulty,priorityOnly=false,forcedBases=null){
  let pool=forcedBases||bank.filter(q=>subjects.includes(q.subject));
  if(difficulty!=="mixed")pool=pool.filter(q=>q.difficulty===difficulty);
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
  const generated=shuffle(chosen.map(b=>variantFrom(b,pool)));
  remember(generated.map(x=>x.baseId));
  return generated;
}

$("startBtn").addEventListener("click",()=>{
  const subjects=[...document.querySelectorAll("#subjects input:checked")].map(x=>x.value);
  if(!subjects.length){alert("Selecciona al menos una asignatura.");return}
  const count=Math.min(Number($("count").value),999);
  const difficulty=$("difficulty").value;
  quiz=createFreshQuiz(subjects,count,difficulty,$("priority").checked);
  if(!quiz.length){alert("No hay conceptos con esa combinación.");return}
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
  quiz=createFreshQuiz([...new Set(failed.map(x=>x.subject))],Math.max(10,failed.length),"mixed",true,failed);
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
function localQuestionsFromText(text,subjectName,source,count){
  const sentences=text.replace(/\s+/g," ").split(/(?<=[.!?])\s+/).filter(s=>s.length>70&&s.length<320);
  const candidates=shuffle(sentences).slice(0,Math.min(sentences.length,count*4));
  const words=text.toLowerCase().match(/[a-záéíóúüñ]{6,}/g)||[];
  const freq={};words.forEach(w=>freq[w]=(freq[w]||0)+1);
  const common=Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).filter(w=>!["porque","también","cuando","donde","puede","tienen","entre","sobre","desde","hasta","según","mientras"].includes(w)).slice(0,80);
  const out=[];
  for(const s of candidates){
    const terms=s.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]{5,}/g)||[];
    const target=terms.sort((a,b)=>b.length-a.length)[0]; if(!target)continue;
    const distractors=shuffle(common.filter(w=>w!==target.toLowerCase()&&Math.abs(w.length-target.length)<6)).slice(0,3);
    if(distractors.length<3)continue;
    const opts=shuffle([target,...distractors]);
    out.push({id:"local-"+Date.now()+"-"+out.length,baseId:"local-"+out.length,subject:"custom",subjectName,source,question:"Completa correctamente la afirmación extraída del temario: "+s.replace(target,"_____"),options:opts,answer:opts.indexOf(target),explanation:"La frase procede directamente del documento cargado: "+s,difficulty:"medium",key:false});
    if(out.length>=count)break;
  }
  return out;
}
$("generateBtn").addEventListener("click",()=>{
  const subject=$("uploadSubject").value.trim()||"Temario añadido";
  const source=$("fileInput").files[0]?.name||"Documento cargado";
  const n=Number($("generatedCount").value);
  const qs=localQuestionsFromText(uploadedText,subject,source,n);
  if(!qs.length){alert("No he podido extraer suficientes frases para generar preguntas.");return}
  $("generatedPreview").innerHTML='<h3>Preguntas generadas</h3>'+qs.slice(0,5).map(q=>`<div class="preview-q"><strong>${esc(q.question)}</strong></div>`).join("")+`<p class="muted">${qs.length} preguntas listas para practicar ahora.</p><button id="practiceGenerated" class="primary">Practicar este temario</button>`;
  document.getElementById("practiceGenerated").addEventListener("click",()=>{quiz=shuffle(qs);startQuiz()});
});

let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden")});
$("installBtn").addEventListener("click",async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}else alert("En iPad: Safari → Compartir → Añadir a pantalla de inicio.")});
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
loadBanks();
