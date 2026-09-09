// ====== UTILIDADES ======
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const DAY = 864e5;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function today(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
function pd(iso){ if(!iso) return null; const [y,m,d] = iso.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); }
function iso(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function diffDays(a, b){ return Math.round((a - b) / DAY); }
function pais(){ return PAISES[S?.pregnancy?.country] || PAISES.OT; }
function fmt(d, o){ if(typeof d === 'string') d = pd(d); if(!d) return ''; return new Intl.DateTimeFormat(pais().locale, o || {day:'numeric', month:'long'}).format(d); }
function fmtLong(d){ return fmt(d, {weekday:'long', day:'numeric', month:'long'}); }
function fmtShort(d){ return fmt(d, {day:'numeric', month:'short'}); }
function fmtTime(dt){ if(!dt || dt.length < 16) return ''; return dt.slice(11,16); }
function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function semanaTxt(days){ const w = Math.floor(days/7), d = days % 7; return d ? `Semana ${w} + ${d} ${d===1?'día':'días'}` : `Semana ${w}`; }
function semanaCorta(days){ const w = Math.floor(days/7), d = days % 7; return `${w}+${d}`; }
function gaOf(dateIso){ const P = preg(); return diffDays(pd(dateIso), P.lmpEff); }
function relDias(n){ if(n === 0) return 'Hoy'; if(n === 1) return 'Mañana'; if(n === -1) return 'Ayer'; if(n > 1) return `Faltan ${n} días`; return `Hace ${-n} días`; }
function fotoSrc(v){ return v || ''; }  // en prod se resuelve contra Storage
function quitarFoto(v){}                 // en prod borra el archivo de Storage
function chatMsgs(){ return S.chat; }     // en prod: conversación privada de cada persona
function chatPersist(){ persist(); }
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

// ====== ICONOS ======
const I = {
  home:'<svg viewBox="0 0 24 24"><path d="M12 3.5 3.5 11v9h6v-6h5v6h6v-9z"/></svg>',
  timeline:'<svg viewBox="0 0 24 24"><path d="M12 3v18"/><circle cx="12" cy="7" r="2.2" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="2.2"/><path d="M14 7h5M5 17h5"/></svg>',
  health:'<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/><path d="M8 13h2.2l1.3-2.5 1.6 4.5 1.2-2H16"/></svg>',
  us:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M3.5 19c.6-3.4 2.9-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><path d="M15 15.2c2.4.2 4.5 1.5 5.2 3.8"/></svg>',
  ask:'<svg viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5z"/><path d="M10 9.2c.3-1.1 1.2-1.7 2.2-1.7 1.2 0 2.1.8 2.1 1.8 0 1.6-2.2 1.6-2.2 3.2"/><circle cx="12.1" cy="14.4" r=".6" fill="currentColor"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  calendar:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  flask:'<svg viewBox="0 0 24 24"><path d="M9.5 3h5M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3"/><path d="M7.5 15h9"/></svg>',
  wave:'<svg viewBox="0 0 24 24"><path d="M3 12h3l2-6 3 12 3-9 2 3h5"/></svg>',
  mood:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9 10h.01M15 10h.01M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 20 4l-4 16-4-7z"/></svg>',
  chevL:'<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg>',
  camera:'<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5V21"/></svg>',
  photo:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m3.5 16 5-5 4 4 2.5-2.5 5.5 5.5"/><circle cx="15.5" cy="9.5" r="1.5"/></svg>',
  people:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M3.5 19c.6-3.4 2.9-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><path d="M15 15.2c2.4.2 4.5 1.5 5.2 3.8"/></svg>',
  list:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
  tag:'<svg viewBox="0 0 24 24"><path d="M4 12.5V5.5A1.5 1.5 0 0 1 5.5 4h7l8 8-8.5 8.5z"/><circle cx="8.5" cy="8.5" r="1.3"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  thumb:'<svg viewBox="0 0 24 24"><path d="M7 10v10H4V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5V9H19a2 2 0 0 1 2 2.2l-1 6.6A2.5 2.5 0 0 1 17.5 20H7"/></svg>',
  alert:'<svg viewBox="0 0 24 24"><path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4M12 17.2h.01"/></svg>',
  baby:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><path d="M12 6c0-1.5.8-2.5 2-3"/><path d="M9.5 12.5h.01M14.5 12.5h.01M9.8 15.5c.7.7 1.4 1 2.2 1s1.5-.3 2.2-1"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m13.5 8.5 3 3"/></svg>',
  doc:'<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
  gift:'<svg viewBox="0 0 24 24"><rect x="3.5" y="9" width="17" height="11" rx="2"/><path d="M12 9v11M3.5 13h17M12 9c-2-4-6-3-6-1s3 1 6 1c3 0 6 1 6-1s-4-3-6 1"/></svg>'
};

// ====== ESTADO ======
let S = null;
let L = { role: null, tab: 'hoy', sub: {}, seen: '' };
let dbRef = null, dbOn = false, sampleFn = null, syncing = false;
try { const l = localStorage.getItem('juntos.local'); if (l) L = Object.assign(L, JSON.parse(l)); } catch(e){}
function saveLocal(){ try { localStorage.setItem('juntos.local', JSON.stringify(L)); } catch(e){} }

function emptyWorkspace(){
  return { v:1, createdAt: iso(today()), pregnancy:{ lmp:null, eddOverride:null, maternalAge:null, firstPregnancy:null, type:'unico', country:'ES', names:{mother:'', partner:''}, inviteCode: code6() },
    appointments:[], tests:[], ultrasounds:[], symptoms:[], milestones:{}, customMilestones:[], memories:[], names:[], family:[], tasks:[], chat:[], demo:false };
}
function code6(){ const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for(let i=0;i<6;i++) s += a[Math.floor(Math.random()*a.length)]; return s; }

function persist(){
  S.updatedAt = new Date().toISOString();
  try { localStorage.setItem('juntos.ws', JSON.stringify(S)); } catch(e){}
  if (dbRef) { syncing = true; dbRef.set(S).catch(e => console.warn('db set', e)).finally(() => { syncing = false; }); }
}
function commit(){ persist(); render(); }

// ====== CÁLCULO GESTACIONAL ======
function preg(){
  const p = S.pregnancy;
  const edd = p.eddOverride ? pd(p.eddOverride) : addDays(pd(p.lmp), 280);
  const lmpEff = addDays(edd, -280);
  const days = clamp(diffDays(today(), lmpEff), 0, 42*7+6);
  const w = Math.floor(days/7), d = days % 7;
  const remaining = diffDays(edd, today());
  const trimester = w < 14 ? 1 : w < 28 ? 2 : 3;
  const nac = S.milestones?.nacimiento; const nacido = !!(nac && nac.done); const nacDate = nacido ? (pd(nac.date) || edd) : null;
  return { edd, lmpEff, days, w, d, remaining, trimester, pct: clamp(days/280, 0, 1), nacido, nacDate, diasVida: nacido ? diffDays(today(), nacDate) : null };
}
function contenido(w){ const k = clamp(w, 1, 42); return SEMANAS.find(x => x.w === k); }
function comoTxt(c){ return c.cm ? `El bebé es como ${c.cmp}.` : 'Todavía no hay embrión que medir.'; }
// Preguntas de una cita como [{ q, a }] (acepta el formato viejo de cadenas)
function preguntasDe(a){ return (a?.questions || []).map(x => typeof x === 'string' ? { q: x, a: '' } : { q: x?.q || '', a: x?.a || '' }).filter(x => x.q); }
function citaPasada(a){ if (!a?.date) return false; const [d, t] = a.date.split('T'); const x = pd(d); if (t) { const [hh, mm] = t.split(':').map(Number); x.setHours(hh || 0, mm || 0, 0, 0); } else x.setHours(23, 59, 0, 0); return x <= new Date(); }
function hitoFecha(h){ return addDays(preg().lmpEff, h.w*7 + (h.d||0)); }

// Línea de tiempo: hitos base + personalizados, con estado
function timeline(){
  const t = today();
  const base = HITOS_BASE.filter(h => !(S.milestones[h.key] || {}).hidden).map(h => {
    const st = S.milestones[h.key] || {};
    const cita = S.appointments.find(a => a.milestone === h.key);
    const date = cita ? pd(cita.date) : st.date ? pd(st.date) : hitoFecha(h);
    // Un hito base solo está vivido si alguien lo confirmó o si su cita vinculada ya fue. Nunca por la fecha estimada.
    // Excepción: los hitos de calendario (tercer trimestre, a término, FPP) se cumplen solos con la fecha.
    const calendario = ['t3','termino','fpp'].includes(h.key);
    const done = st.done != null ? st.done : cita ? citaPasada(cita) : calendario ? date <= t : false;
    const estimated = !st.date && !cita;
    return { ...h, id:h.key, date, done, note: st.note || '', photo: st.photo || '', custom:false, ga: diffDays(date, preg().lmpEff), estimated, citaId: cita?.id || null, porConfirmar: !done && estimated && date < t && !calendario && h.key !== 'nacimiento' };
  });
  const custom = S.customMilestones.map(c => ({ id:c.id, key:c.id, title:c.title, desc:c.desc||'', date: pd(c.date), done: c.done != null ? c.done : pd(c.date) <= t, note:c.note||'', photo:c.photo||'', custom:true, emocional:true, ga: diffDays(pd(c.date), preg().lmpEff), estimated:false }));
  return [...base, ...custom].sort((a,b) => a.date - b.date || (a.emocional?1:0) - (b.emocional?1:0));
}
function proximoHito(){
  const t = today();
  const cands = [];
  timeline().filter(h => !h.done && h.date >= t && h.key !== 'nacimiento' && !h.citaId).forEach(h => cands.push({ id:h.id, title:h.title, date:h.date, kind:'hito', estimated:h.estimated }));
  S.appointments.filter(a => !citaPasada(a)).forEach(a => cands.push({ id:a.id, title:a.title, date:pd(a.date), kind:'cita', sub:[a.doctor, a.clinic].filter(Boolean).join(' · ') }));
  S.tests.filter(x => x.status === 'pendiente' && x.date && pd(x.date) >= t).forEach(x => cands.push({ id:x.id, title:x.name, date:pd(x.date), kind:'analisis' }));
  cands.sort((a,b) => a.date - b.date);
  return cands[0] || null;
}

// ====== NOTIFICACIONES (derivadas) ======
function notificaciones(){
  const P = preg(), t = today(), out = [];
  const c = contenido(P.w);
  if (P.nacido) { out.push({ ic:I.heart, txt:`${P.diasVida === 0 ? 'Hoy nació' : `Hace ${P.diasVida} ${P.diasVida === 1 ? 'día' : 'días'} que nació`} ❤️`, sub:'Ya está aquí' }); return out; }
  if (P.d === 0) out.push({ ic:I.heart, txt:`Hoy empieza la semana ${P.w} ❤️`, sub:'Un capítulo nuevo' });
  else out.push({ ic:I.heart, txt:`${semanaTxt(P.days)}. ${comoTxt(c)}`, sub:'Hoy' });
  if ((P.w === 14 || P.w === 28) && P.d < 7) out.push({ ic:I.spark, txt:`Nuevo hito: ya están en el ${P.w===14?'segundo':'tercer'} trimestre.`, sub:'Esta semana' });
  const nx = proximoHito();
  if (nx) { const n = diffDays(nx.date, t); out.push({ ic:I.calendar, txt: n === 0 ? `Hoy: ${nx.title}.` : n === 1 ? `Mañana ${nx.kind==='cita'?'tienen cita: ':''}${nx.title}.` : `Faltan ${n} días para ${nx.title}.`, sub: cap(fmtLong(nx.date)) }); }
  if (c.temas?.[0]) out.push({ ic:I.people, txt:`Esta semana puede ser un buen momento para hablar sobre: ${c.temas[0].replace(/^¿|\?$/g,'').toLowerCase()}.`, sub:'Para hablar' });
  const match = S.names.find(n => n.votes?.mother && n.votes?.partner && n.votes.mother !== 'no' && n.votes.partner !== 'no');
  if (match) out.push({ ic:I.tag, txt:`Los dos aman el nombre ${match.name} ❤️`, sub:'Nombres' });
  S.tasks.filter(x => x.status !== 'hecha' && x.due && diffDays(pd(x.due), t) <= 3 && diffDays(pd(x.due), t) >= 0).slice(0,2).forEach(x => out.push({ ic:I.list, txt:`Tarea para pronto: ${x.title}`, sub: `${relDias(diffDays(pd(x.due), t))} · ${quien(x.owner)}` }));
  return out;
}

// "Para hoy": lo concreto de hoy para quien mira, según su rol
function paraHoy(){
  const P = preg(), t = today(), me = yo(), out = [];
  if (P.nacido) return out;
  const ahora = new Date();
  const citas = S.appointments.filter(a => !citaPasada(a)).map(a => ({ a, n: diffDays(pd(a.date), t) })).filter(x => x.n <= 1).sort((x, y) => x.a.date.localeCompare(y.a.date));
  for (const { a, n } of citas) { const nq = preguntasDe(a).length; out.push({ ic:I.calendar, txt:`${n === 0 ? 'Hoy' : 'Mañana'}${fmtTime(a.date) ? ' a las ' + fmtTime(a.date) : ''}: ${a.title}`, sub: nq ? `${nq} ${nq === 1 ? 'pregunta anotada' : 'preguntas anotadas'}` : 'Sin preguntas anotadas todavía', fn:`openCita('${a.id}')` }); }
  const mias = S.tasks.filter(x => x.status !== 'hecha' && x.due && (x.owner === me || x.owner === 'both') && diffDays(pd(x.due), t) <= 0).sort((a, b) => a.due.localeCompare(b.due));
  for (const x of mias.slice(0, 2)) { const atras = -diffDays(pd(x.due), t); out.push({ ic:I.list, txt:`${atras ? 'Atrasada' : 'Para hoy'}: ${x.title}`, sub: atras ? `Vencía hace ${atras} ${atras === 1 ? 'día' : 'días'}` : (x.owner === 'both' ? 'De los dos' : 'A tu cargo'), fn:`openTarea('${x.id}')` }); }
  if (me === 'partner') {
    const recientes = [iso(t), iso(addDays(t, -1))].map(d => S.symptoms.find(s => s.date === d)).filter(Boolean);
    for (const s of recientes) {
      const fuertes = SINTOMAS.filter(x => (s.values?.[x.k] || 0) >= 2);
      if (fuertes.some(x => s.values[x.k] === 3) || fuertes.length >= 2) { out.push({ ic:I.mood, txt:`${quien('mother')} ${s.date === iso(t) ? 'hoy' : 'ayer'}: ${fuertes.map(x => `${x.l.toLowerCase()} (${ESCALA[s.values[x.k]].toLowerCase()})`).join(', ')}`, sub: s.note ? `"${s.note}"` : 'Pregúntale cómo está', fn:`go('salud'); subSalud('sintomas')` }); break; }
    }
  } else if (me === 'mother' && P.w >= 5 && !S.symptoms.some(s => s.date === iso(t)) && ahora.getHours() >= 12) {
    out.push({ ic:I.mood, txt:'¿Cómo te sientes hoy?', sub:'Un minuto. Sirve para la próxima cita', fn:`openSintomas()` });
  }
  const hito = timeline().find(h => !h.done && !h.custom && !h.citaId && !h.emocional && h.date > t && diffDays(h.date, t) <= 10);
  if (hito && !citas.length) out.push({ ic:I.timeline, txt:`En ${diffDays(hito.date, t)} días toca: ${hito.title}`, sub:'Si ya tienen fecha, créala como cita', fn:`openHito('${hito.id}')` });
  return out.slice(0, 4);
}
function quien(role){ const n = S.pregnancy.names || {}; if (role === 'mother') return n.mother || 'Ella'; if (role === 'partner') return n.partner || 'Pareja'; if (role === 'both') return 'Los dos'; return '—'; }
function yo(){ return L.role === 'partner' ? 'partner' : 'mother'; }
function iniciales(role){ const n = quien(role); return n.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase(); }

// ====== DATOS DE EJEMPLO ======
function demoWorkspace(){
  const W = emptyWorkspace(); const t = today();
  const lmp = addDays(t, -(10*7 + 2)); // semana 10 + 2
  const at = (w, d) => iso(addDays(lmp, w*7 + d));
  W.demo = true;
  W.pregnancy = { lmp: iso(lmp), eddOverride:null, maternalAge:34, firstPregnancy:true, type:'unico', country:'ES', names:{mother:'Lucía', partner:'Martín'}, inviteCode:'JNT4KQ' };
  W.appointments = [
    { id:uid(), title:'Primera consulta prenatal', doctor:'Dra. Elena Ruiz', specialty:'Ginecología y obstetricia', clinic:'Clínica Santa Marta', location:'C/ Arturo Soria 120, Madrid', date: at(7,3)+'T10:30', notes:'Nos pidió la analítica completa y ácido fólico 400 µg.', questions:[{ q:'¿Qué suplementos hay que tomar?', a:'Ácido fólico 400 µg al día y yodo. Hierro según la analítica.' }] },
    { id:uid(), title:'Primera ecografía', doctor:'Dra. Elena Ruiz', specialty:'Ginecología y obstetricia', clinic:'Clínica Santa Marta', location:'C/ Arturo Soria 120, Madrid', date: at(8,1)+'T09:00', notes:'Embrión único, latido presente. CRL 17 mm.', questions:[{ q:'¿Se confirma la fecha probable de parto?', a:'Sí, coincide con la última regla. Se revisa en la eco de la semana 12.' }] },
    { id:uid(), title:'Extracción para el NIPT', doctor:'Laboratorio', specialty:'Análisis clínicos', clinic:'Clínica Santa Marta', location:'Planta baja, laboratorio', date: iso(addDays(t, 5))+'T08:15', notes:'No hace falta ayuno. Llevar el volante.', questions:['¿Cuánto tardan los resultados?','¿Incluye el sexo?'] },
    { id:uid(), title:'Ecografía del primer trimestre', doctor:'Dra. Elena Ruiz', specialty:'Ginecología y obstetricia', clinic:'Clínica Santa Marta', location:'C/ Arturo Soria 120, Madrid', date: iso(addDays(t, 13))+'T12:00', notes:'', questions:['¿Cómo está la translucencia nucal?','¿Se confirma la fecha probable de parto?','¿Podemos grabar el latido?'] }
  ];
  W.tests = [
    { id:uid(), name:'Beta hCG', kind:'sangre', date: at(4,5), result:'1.250 mUI/ml', status:'normal', interpretation:'Un valor compatible con un embarazo de pocas semanas. Lo que importa es que suba en los próximos días, no el número aislado.', doctorNotes:'Repetir en 48 h para ver evolución.' },
    { id:uid(), name:'Beta hCG (control)', kind:'sangre', date: at(5,0), result:'3.100 mUI/ml', status:'normal', interpretation:'Ha subido como se espera. Buena señal de evolución.', doctorNotes:'' },
    { id:uid(), name:'Analítica del primer trimestre', kind:'sangre', date: at(7,3), result:'Hemograma, grupo A+, serologías negativas', status:'normal', interpretation:'Todo dentro de lo esperado. El grupo sanguíneo positivo significa que no hace falta la inmunoglobulina anti-D.', doctorNotes:'Hierro en el límite: dieta rica en hierro y control en el segundo trimestre.' },
    { id:uid(), name:'Análisis de orina', kind:'orina', date: at(7,3), result:'Sin alteraciones', status:'normal', interpretation:'Se repite en cada trimestre para descartar infecciones sin síntomas.', doctorNotes:'' },
    { id:uid(), name:'Tensión arterial', kind:'tension', date: at(7,3), result:'112/68', status:'normal', interpretation:'Valores normales. Se controla en cada consulta.', doctorNotes:'' },
    { id:uid(), name:'NIPT', kind:'genetico', date: iso(addDays(t, 5)), result:'', status:'pendiente', interpretation:'Cribado de alteraciones cromosómicas con una muestra de sangre. No es diagnóstico: un resultado de alto riesgo se confirma con otra prueba.', doctorNotes:'' },
    { id:uid(), name:'Prueba de glucosa (O\'Sullivan)', kind:'glucosa', date: at(25,0), result:'', status:'pendiente', interpretation:'Cribado de diabetes gestacional entre la semana 24 y la 28.', doctorNotes:'' }
  ];
  W.ultrasounds = [ { id:uid(), date: at(8,1), crl:'17', fhr:'162', comments:'Embrión único, intrauterino, con actividad cardíaca. Saco vitelino normal. La fecha coincide con la última menstruación.', doctor:'Dra. Elena Ruiz', clinic:'Clínica Santa Marta', photo:'' } ];
  W.symptoms = [0,1,2,3,4,6].map(n => ({ id:uid(), date: iso(addDays(t, -n)), values:{ nauseas: [2,2,3,2,1,2][Math.min(n,5)], cansancio: [3,2,3,3,2,3][Math.min(n,5)], pechos:1, cabeza: n===2?1:0, colicos:0, animo: n===1?1:0, sueno:1, apetito:1, mareos: n===0?1:0 }, note: n===0 ? 'Mejor por la tarde. Las galletas saladas ayudan por la mañana.' : '' }));
  W.milestones = { test:{ done:true, date: at(4,3), note:'Un martes, antes de ir a trabajar. Nos quedamos mirando el test un rato largo.' }, consulta1:{ done:true, date: at(7,3) }, eco1:{ done:true, date: at(8,1), note:'17 mm. Un puntito parpadeando.' }, intrauterino:{ done:true, date: at(8,1) }, latido:{ done:true, date: at(8,1), note:'162 latidos por minuto. Martín no dijo nada durante un minuto entero.' }, nipt:{ done:false, date: iso(addDays(t, 5)) }, eco12:{ done:false, date: iso(addDays(t, 13)) } };
  W.customMilestones = [ { id:uid(), title:'Se lo contamos a los abuelos', desc:'A los padres de Lucía, en la comida del domingo.', date: at(9,4), done:true, note:'Mi madre lloró. Mi padre preguntó si podía contárselo a su hermano.' } ];
  W.memories = [
    { id:uid(), title:'El día que nos enteramos', text:'Dos rayas. Lucía salió del baño sin decir nada y me lo enseñó. No hablamos durante un minuto, y después no paramos de hablar en toda la noche.', date: at(4,3), author:'partner', photo:'', audio:false },
    { id:uid(), title:'Primera ecografía', text:'Un punto diminuto con un parpadeo. La doctora subió el volumen y escuchamos el corazón: 162 latidos por minuto. Martín me apretó la mano tan fuerte que me dejó marca.', date: at(8,1), author:'mother', photo:'', audio:true },
    { id:uid(), title:'La reacción de los abuelos', text:'Se lo contamos con una ecografía dentro de una tarjeta de cumpleaños. Mi madre tardó en entenderlo y luego no soltó la foto en toda la tarde.', date: at(9,4), author:'mother', photo:'', audio:false }
  ];
  W.names = [
    { id:uid(), name:'Olivia', meaning:'Del olivo, símbolo de paz', origin:'Latino', notes:'', addedBy:'mother', votes:{ mother:'fav', partner:'like' } },
    { id:uid(), name:'Mateo', meaning:'Regalo de Dios', origin:'Hebreo', notes:'Como el abuelo de Martín.', addedBy:'partner', votes:{ partner:'fav' } },
    { id:uid(), name:'Julia', meaning:'Juvenil, de la familia Julia', origin:'Latino', notes:'', addedBy:'mother', votes:{ mother:'like' } },
    { id:uid(), name:'Bruno', meaning:'Moreno, de piel oscura', origin:'Germánico', notes:'', addedBy:'partner', votes:{ partner:'like', mother:'no' } },
    { id:uid(), name:'Vera', meaning:'Verdadera', origin:'Latino / eslavo', notes:'Corto y suena bien en los dos idiomas.', addedBy:'partner', votes:{ partner:'like', mother:'like' } }
  ];
  W.family = [
    { id:uid(), group:'abuelos', name:'Padres de Lucía', knows:true, date: at(9,4), how:'Con la eco dentro de una tarjeta', reaction:'Lágrimas y muchas preguntas. Ya quieren saber el nombre.' },
    { id:uid(), group:'abuelos', name:'Padres de Martín', knows:false, date:'', how:'', reaction:'' },
    { id:uid(), group:'hermanos', name:'Sofía (hermana de Lucía)', knows:false, date:'', how:'', reaction:'' },
    { id:uid(), group:'primos', name:'Los primos de Valencia', knows:false, date:'', how:'', reaction:'' },
    { id:uid(), group:'amigos', name:'Grupo de la uni', knows:false, date:'', how:'', reaction:'' },
    { id:uid(), group:'trabajo', name:'Jefa de Lucía', knows:false, date:'', how:'', reaction:'' }
  ];
  W.tasks = [
    { id:uid(), title:'Reservar el NIPT', owner:'partner', due: iso(addDays(t, -2)), status:'hecha', notes:'Reservado para dentro de 5 días, 8:15.' },
    { id:uid(), title:'Pedir cita para la ecografía de la semana 12', owner:'mother', due: iso(addDays(t, -6)), status:'hecha', notes:'' },
    { id:uid(), title:'Revisar qué cubre el seguro del parto', owner:'partner', due: iso(addDays(t, 3)), status:'pendiente', notes:'Preguntar por habitación individual y acompañante.' },
    { id:uid(), title:'Investigar maternidades y hospitales', owner:'both', due: iso(addDays(t, 20)), status:'pendiente', notes:'Santa Marta, La Paz y Quirón. Pedir visita.' },
    { id:uid(), title:'Revisar la licencia parental de cada uno', owner:'partner', due: iso(addDays(t, 14)), status:'pendiente', notes:'' },
    { id:uid(), title:'Preparar las preguntas para la eco de la semana 12', owner:'both', due: iso(addDays(t, 12)), status:'pendiente', notes:'' }
  ];
  W.chat = [];
  return W;
}

// ====== ARRANQUE Y SINCRONIZACIÓN ======
async function boot(){
  try { const w = localStorage.getItem('juntos.ws'); if (w) S = JSON.parse(w); } catch(e){}
  render();
  if (!window.claude?.use) return;
  claude.use('db').then(db => {
    if (!db) return;
    dbRef = db.doc('workspaces/main');
    dbRef.onSnapshot(snap => {
      const data = snap.exists ? snap.data() : null;
      if (data && data.pregnancy) {
        if (syncing) return;
        if (S && S.updatedAt && data.updatedAt && S.updatedAt > data.updatedAt) { dbRef.set(S).catch(()=>{}); }
        else if (JSON.stringify(data) !== JSON.stringify(S)) { S = data; try { localStorage.setItem('juntos.ws', JSON.stringify(S)); } catch(e){} if (!document.querySelector('.overlay') && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) render(); }
      } else if (S && S.pregnancy?.lmp && !snap.exists) { dbRef.set(S).catch(()=>{}); }
      if (!dbOn) { dbOn = true; const el = $('#sync'); if (el) { el.classList.add('on'); el.querySelector('span').textContent = 'Sincronizado con tu pareja'; } }
    }, err => console.warn('db', err));
  }).catch(()=>{});
  claude.use('sample').then(s => { sampleFn = s; if (L.tab === 'preguntar') render(); }).catch(()=>{});
}
