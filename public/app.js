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
    appointments:[], tests:[], ultrasounds:[], symptoms:[], milestones:{}, customMilestones:[], memories:[], names:[], family:[], tasks:[], kicks:[], contractions:[], vitals:[], chat:[], demo:false };
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
// Tensión arterial: nivel según umbrales habituales en el embarazo
function nivelTension(sis, dia){ sis = Number(sis) || 0; dia = Number(dia) || 0; if (!sis && !dia) return null; if (sis >= 160 || dia >= 110) return 'grave'; if (sis >= 140 || dia >= 90) return 'alta'; if (sis < 90 || dia < 60) return 'baja'; return 'normal'; }
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
  for (const { a, n } of citas) { const nq = preguntasDe(a).length; out.push({ ic:I.calendar, txt:`${n === 0 ? 'Hoy' : 'Mañana'}${fmtTime(a.date) ? ' a las ' + fmtTime(a.date) : ''}: ${a.title}`, sub: n === 0 ? (nq ? `${nq} ${nq === 1 ? 'pregunta' : 'preguntas'} · toca para anotar las respuestas` : 'Toca para anotar lo que digan') : (nq ? `${nq} ${nq === 1 ? 'pregunta anotada' : 'preguntas anotadas'} · toca para preparar la cita` : 'Sin preguntas todavía · toca para preparar la cita'), fn: n === 0 ? `openCitaHoy('${a.id}')` : `openPreparar('${a.id}')` }); }
  const ultimaTA = [...(S.vitals || [])].filter(v => v.systolic).sort((x, y) => y.date.localeCompare(x.date))[0];
  if (ultimaTA && ['alta','grave'].includes(nivelTension(ultimaTA.systolic, ultimaTA.diastolic)) && diffDays(t, pd(ultimaTA.date)) <= 1) out.push({ ic:I.alert, txt:`Tensión ${ultimaTA.systolic}/${ultimaTA.diastolic} ${diffDays(t, pd(ultimaTA.date)) === 0 ? 'hoy' : 'ayer'}`, sub: nivelTension(ultimaTA.systolic, ultimaTA.diastolic) === 'grave' ? 'Contacta con el equipo médico ahora' : 'Conviene repetirla y avisar al equipo médico', fn:`go('salud'); subSalud('sintomas')` });
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
  const sinCerrar = S.appointments.filter(a => citaPasada(a) && !a.resumen && (a.notes || preguntasDe(a).some(x => x.a)) && diffDays(t, pd(a.date)) <= 7).sort((x, y) => y.date.localeCompare(x.date))[0];
  if (sinCerrar) out.push({ ic:I.spark, txt:`Cerrar la cita: ${sinCerrar.title}`, sub:'Resumen, tareas y análisis que se desprenden', fn:`openCierreCita('${sinCerrar.id}')` });
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
  W.kicks = []; W.contractions = [];
  W.vitals = [ { id:uid(), date: at(7,3), weight:'61.2', systolic:'112', diastolic:'68', note:'' }, { id:uid(), date: iso(addDays(t, -2)), weight:'62.0', systolic:'115', diastolic:'70', note:'' } ];
  W.chat = [];
  return W;
}

// ====== ARRANQUE Y SINCRONIZACIÓN ======
async function boot_artifact(){
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

// ====== RENDER PRINCIPAL ======
const TABS = [ ['hoy','Hoy',I.home], ['evolucion','Evolución',I.timeline], ['salud','Salud',I.health], ['nosotros','Nosotros',I.us], ['preguntar','Preguntar',I.ask] ];
function render(){
  const app = $('#app');
  if (!S || !S.pregnancy?.lmp || OB.step === 5) { app.innerHTML = renderOnboarding(); $('.tabbar')?.remove(); window.scrollTo(0,0); return; }
  if (!L.role) { app.innerHTML = renderRolePick(); $('.tabbar')?.remove(); return; }
  const fn = { hoy: renderHoy, evolucion: renderEvolucion, salud: renderSalud, nosotros: renderNosotros, preguntar: renderPreguntar }[L.tab] || renderHoy;
  app.innerHTML = `<div class="screen ${L.tab==='preguntar'?'chat-screen':''}">${fn()}</div>`;
  let tb = $('.tabbar');
  if (!tb) { tb = document.createElement('div'); tb.className = 'tabbar'; document.body.appendChild(tb); }
  tb.innerHTML = `<nav>${TABS.map(([k,l,ic]) => `<button class="${L.tab===k?'on':''}" onclick="go('${k}')" aria-label="${l}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
  if (L.tab === 'preguntar') { const c = $('#chat'); if (c) window.scrollTo(0, document.body.scrollHeight); }
}
function go(tab){ L.tab = tab; L.sub = L.sub || {}; if (tab !== 'nosotros') delete L.sub.us; saveLocal(); render(); window.scrollTo(0,0); }

function topbar(title){
  const n = notificaciones();
  return `<div class="topbar"><div class="brand">${title ? esc(title) : 'juntos'}<small>${title ? 'juntos' : 'El embarazo, juntos'}</small></div>
    <div class="topbar-actions">
      <button class="iconbtn" onclick="openNotifs()" aria-label="Notificaciones">${I.bell}${notifFirma(n) !== L.seen ? '<span class="dot"></span>' : ''}</button>
      <button class="avatar" onclick="openPerfil()" aria-label="Perfil">${esc(iniciales(yo()))}</button>
    </div></div>`;
}
function notifFirma(n){ return (n || notificaciones()).map(x => x.txt).join('|'); }
function disclaimer(){ return `<p class="disclaimer">Esta información es orientativa y no sustituye el consejo de un profesional de la salud.</p>`; }
function emptyState(icon, title, text, cta){ return `<div class="empty"><div class="glyph">${icon}</div><h3>${title}</h3><p>${text}</p>${cta ? `<div style="margin-top:14px">${cta}</div>` : ''}</div>`; }

// ====== HOY ======
function renderHoy(){
  const P = preg(), c = contenido(P.w), nx = proximoHito();
  if (P.nacido) return renderHoyNacido(P);
  const sizeTxt = !c.cm ? '' : c.cm < 0.1 ? 'menos de 1 mm' : c.cm < 1 ? `${(c.cm*10).toFixed(0)} mm` : `${String(c.cm).replace('.',',')} cm`;
  const peso = c.g ? (c.g >= 1000 ? `${(c.g/1000).toFixed(1).replace('.',',')} kg` : `${c.g} g`) : null;
  const porPeso = c.by === 'peso';
  const sizeLead = porPeso ? `Pesa como ${esc(c.cmp)}` : `Como ${esc(c.cmp)}`;
  const sizeDetail = porPeso ? `Alrededor de ${peso}${c.cm ? `, y mide unos ${sizeTxt} de la cabeza a los pies` : ''}.` : c.cm < 0.1 ? 'Mide menos de un milímetro.' : `Mide unos ${sizeTxt}${peso ? ` y pesa alrededor de ${peso}` : ''}.`;
  const me = yo();
  const ella = `<div class="card accent"><span class="eyebrow">Para ${me==='mother' ? 'ti' : esc(quien('mother'))}</span><h3>${me==='mother' ? 'Cómo puedes sentirte esta semana' : 'Lo que ella lee esta semana'}</h3><p class="sub">${esc(c.ella)}</p></div>`;
  const pareja = `<div class="card warm"><span class="eyebrow">Para ${me==='partner' ? 'ti' : esc(quien('partner'))}</span><h3>${me==='partner' ? 'Cómo acompañarla esta semana' : 'Lo que le proponemos esta semana'}</h3><p class="sub">${esc(c.pareja)}</p></div>`;
  const dias = P.remaining > 0 ? P.remaining : 0;
  return `${topbar()}
  ${S.demo ? `<div class="demo-flag">Datos de ejemplo · <button class="link" onclick="openPerfil()">empezar de cero</button></div>` : ''}
  <section class="hero">
    <span class="eyebrow">${cap(fmtLong(today()))}</span>
    <div class="week num">${P.w} <span>${P.d ? `+ ${P.d} ${P.d===1?'día':'días'}` : 'semanas'}</span></div>
    <p style="color:var(--hero-muted);font-size:14px">${P.d ? 'semanas de embarazo' : 'justas de embarazo'} · ${['','Primer','Segundo','Tercer'][P.trimester]} trimestre</p>
    <div class="progress"><i style="width:${(P.pct*100).toFixed(1)}%"></i></div>
    <div class="trim"><span>Test</span><span>Semana 14</span><span>Semana 28</span><span>Parto</span></div>
    <div class="meta">
      <div><strong class="num">${esc(fmtShort(P.edd))}</strong>Fecha probable de parto</div>
      ${P.remaining >= 0 ? `<div><strong class="num">${dias}</strong>${dias===1?'día restante':'días restantes'}</div>` : `<div><strong class="num">+${-P.remaining}</strong>${-P.remaining===1?'día desde la FPP':'días desde la FPP'}</div>`}
      <div><strong class="num">${P.trimester}.º</strong>trimestre</div>
    </div>
  </section>

  ${(() => { const items = paraHoy(); return items.length ? `<section class="section"><div class="section-head"><h2>Para hoy</h2></div><div class="card" style="padding:4px 18px">${items.map(x => `<div class="row clickable" onclick="${x.fn}"><div class="ic">${x.ic}</div><div class="body"><h4>${esc(x.txt)}</h4><p>${esc(x.sub)}</p></div></div>`).join('')}</div></section>` : ''; })()}
  ${P.w >= 37 ? `<section class="section"><div class="card warm" onclick="openHito('nacimiento')" role="button" tabindex="0"><span class="eyebrow">${P.remaining < 0 ? 'Pasó la fecha probable' : 'Ya a término'}</span><h3>¿Ya nació?</h3><p class="sub">Marca el nacimiento y la app pasa a acompañarlos en los primeros días.</p></div></section>` : ''}
  <section class="section"><div class="card">
    <div class="size"><div class="orb"><img src="/img/tamano/${c.img}.svg" alt="${esc(c.cmp)}" width="96" height="96"></div>
    ${c.cm ? `<div class="txt"><span class="eyebrow">${porPeso ? 'Peso aproximado' : 'Tamaño aproximado'}</span><h3>${sizeLead}</h3><p>${sizeDetail}</p></div>` : `<div class="txt"><span class="eyebrow">Tamaño</span><h3>Todavía no hay embrión</h3><p>La cuenta empieza en la última regla; la fecundación ocurre hacia la semana 3.</p></div>`}</div>
  </div></section>

  <section class="section"><div class="section-head"><h2>Esta semana</h2><button class="link" onclick="go('evolucion')">Ver evolución</button></div>
    <div class="card"><ul class="list plum">${c.bebe.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
  </section>

  ${nx ? `<section class="section"><div class="section-head"><h2>Próximo hito</h2><button class="link" onclick="go('${nx.kind==='hito'?'evolucion':'salud'}')">${nx.kind==='hito'?'Ver evolución':'Ver citas'}</button></div>
    <div class="card" onclick="${nx.kind==='hito' ? `openHito('${nx.id}')` : nx.kind==='cita' ? `openCita('${nx.id}')` : `openAnalisis('${nx.id}')`}" role="button" tabindex="0"><div class="next"><div class="cd">${diffDays(nx.date, today()) === 0 ? `<b class="num" style="font-size:20px">Hoy</b>` : `<b class="num">${diffDays(nx.date, today())}</b><small>${diffDays(nx.date, today())===1?'día':'días'}</small>`}</div>
    <div><span class="chip ${nx.kind==='cita'?'plum':nx.kind==='analisis'?'sage':'warm'}">${nx.kind==='cita'?'Cita':nx.kind==='analisis'?'Análisis':nx.estimated?'Hito · fecha estimada':'Hito'}</span><h3 style="margin-top:6px">${esc(nx.title)}</h3><p>${cap(fmtLong(nx.date))}${nx.sub ? ' · ' + esc(nx.sub) : ''}</p>${nx.estimated ? '<p style="font-size:13px;color:var(--ink3);margin-top:4px">Toca para poner la fecha real o crear la cita.</p>' : ''}</div></div></div>
  </section>` : ''}

  <section class="section"><div class="section-head"><h2>Para cada uno</h2></div>
    ${me === 'partner' ? pareja + ella : ella + pareja}
    ${c.hitos ? `<div class="card soft"><span class="eyebrow">Hitos médicos habituales</span><p class="sub" style="margin-top:4px">${esc(c.hitos)}</p></div>` : ''}
  </section>

  <section class="section"><div class="section-head"><h2>Cosas para hablar esta semana</h2></div>
    <div class="card"><ul class="list">${c.temas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <div style="margin-top:14px"><button class="btn soft sm" onclick="preguntarCon('${esc(c.temas[0]).replace(/'/g,"\\'")}')">Preguntar al asistente</button></div></div>
  </section>
  ${disclaimer()}`;
}

function renderHoyNacido(P){
  const me = yo(), n = P.diasVida, nombre = S.pregnancy.babyName || 'El bebé';
  const match = S.names.find(x => x.votes?.mother === 'fav' && x.votes?.partner === 'fav') || S.names.find(x => x.votes?.mother && x.votes?.partner && x.votes.mother !== 'no' && x.votes.partner !== 'no');
  return `${topbar()}
  <section class="hero">
    <span class="eyebrow">${cap(fmtLong(today()))}</span>
    <div class="week num">${n} <span>${n===1?'día':'días'}</span></div>
    <p style="color:var(--hero-muted);font-size:14px">${nombre === 'El bebé' ? 'de vida' : `de vida de ${esc(nombre)}`} · nació el ${esc(fmtLong(P.nacDate))}</p>
    <div class="progress"><i style="width:100%"></i></div>
    <div class="trim"><span>Test</span><span>Semana 14</span><span>Semana 28</span><span>Nacimiento</span></div>
    <div class="meta">
      <div><strong class="num">${esc(fmtShort(P.nacDate))}</strong>Nacimiento</div>
      <div><strong class="num">${semanaCorta(Math.max(0, diffDays(P.nacDate, P.lmpEff)))}</strong>semanas al nacer</div>
      <div><strong class="num">${Math.floor(n/7)}</strong>${Math.floor(n/7)===1?'semana de vida':'semanas de vida'}</div>
    </div>
  </section>
  <section class="section"><div class="card accent"><span class="eyebrow">Para ${me==='mother' ? 'ti' : esc(quien('mother'))}</span><h3>Los primeros días</h3><p class="sub">El cuerpo necesita semanas para recuperarse: sangrado (loquios) que va bajando, molestias en el pecho al empezar la lactancia y un cansancio que no se parece a ningún otro. Dormir cuando el bebé duerme no es un consejo vacío. La revisión posparto suele ser a las 4–6 semanas.</p></div>
  <div class="card warm"><span class="eyebrow">Para ${me==='partner' ? 'ti' : esc(quien('partner'))}</span><h3>Ahora es cuando más cuentas</h3><p class="sub">Ocúpate de la casa, las visitas y las comidas sin que nadie te lo pida. Cambia pañales, baña al bebé, levántate por la noche aunque haya lactancia materna: el descanso de ella es parte del cuidado del bebé. Y mira cómo está ella de ánimo: si a las dos semanas sigue muy abajo, es momento de hablarlo con su equipo médico.</p></div>
  <div class="card soft"><span class="eyebrow">Cuándo consultar sin esperar</span><p class="sub" style="margin-top:6px">Para ella: sangrado muy abundante, fiebre, dolor intenso en el pecho o en la herida, dolor de cabeza fuerte o alteraciones de la visión. Para el bebé: fiebre, rechazo de las tomas, color amarillo intenso o dificultad para respirar. Ante cualquiera, contacta con el equipo médico o llama al ${esc(pais().emergencias)}.</p></div></section>
  <section class="section"><div class="section-head"><h2>Guardar estos días</h2></div>
    <div class="card"><ul class="list plum"><li>El nacimiento: cómo fue, la hora, quién estaba.</li><li>${match ? `El nombre: ${esc(match.name)}. ¿Lo confirmamos?` : 'El nombre que eligieron y por qué.'}</li><li>La primera foto de los tres.</li></ul>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn soft sm" onclick="openRecuerdo(null, 'El día que nació', '${iso(P.nacDate)}')">Guardar el recuerdo</button><button class="btn ghost sm" onclick="openHito('nacimiento')">Editar el nacimiento</button></div></div>
  </section>
  ${disclaimer()}`;
}

// ====== EVOLUCIÓN ======
function renderEvolucion(){
  const P = preg(), items = timeline(), t = today();
  let nowMarked = false;
  const html = items.map(h => {
    const isFuture = h.date > t;
    let marker = '';
    if (!nowMarked && isFuture && !h.done && !P.nacido) { nowMarked = true; marker = `<div class="tl-item now"><div class="knot"></div><div class="when">Hoy · ${semanaTxt(P.days)}</div><h3>Aquí estamos</h3><p>${esc(comoTxt(contenido(P.w)))}</p></div>`; }
    return marker + `<div class="tl-item ${h.done?'done':'up'} ${h.emocional?'emo':''}" onclick="openHito('${h.id}')" role="button" tabindex="0">
      <div class="knot">${h.done ? I.check : ''}</div>
      <div class="when"><span class="num">${cap(fmtShort(h.date))}${h.estimated && !h.done ? ' (aprox.)' : ''}</span><span>·</span><span>${semanaCorta(Math.max(0,h.ga))}</span>${h.custom ? '<span class="chip warm" style="padding:2px 8px">Nuestro</span>' : ''}${h.porConfirmar ? '<span class="chip amber" style="padding:2px 8px">¿Ya pasó?</span>' : ''}</div>
      <h3>${esc(h.title)} <span style="display:inline-block;vertical-align:middle;width:16px;height:16px;color:var(--ink3);margin-left:4px">${I.edit.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"')}</span></h3><p>${esc(h.desc)}</p>
      ${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}
      ${h.photo ? `<div class="thumb"><img src="${fotoSrc(h.photo)}" data-foto="${esc(h.photo)}" alt=""></div>` : ''}
    </div>`;
  }).join('');
  const done = items.filter(h => h.done).length;
  return `${topbar('Evolución')}
    <h1 class="h-page">Del test positivo al nacimiento</h1>
    <p class="sub">${done} de ${items.length} momentos vividos. Las fechas aproximadas son estimaciones: toca el hito para confirmarlo con su fecha real, crear la cita o quitarlo si no aplica.</p>
    <div class="section"><div class="tl">${html}</div></div>
    <button class="fab" onclick="openHitoNuevo()" aria-label="Añadir hito">${I.plus}</button>`;
}

// ====== SALUD ======
function renderSalud(){
  const sub = L.sub.salud || 'citas';
  const seg = [['citas','Citas'],['analisis','Análisis'],['ecos','Ecografías'],['sintomas','Síntomas'],['bebe','Bebé']].map(([k,l]) => `<button class="${sub===k?'on':''}" onclick="subSalud('${k}')">${l}</button>`).join('');
  const body = ({ citas: renderCitas, analisis: renderAnalisis, ecos: renderEcos, sintomas: renderSintomas, bebe: renderBebe }[sub] || renderCitas)();
  const fabs = { citas: `openCita()`, analisis: `openAnalisis()`, ecos: `openEco()`, sintomas: yo() === 'mother' ? `openSintomas()` : null, bebe: null };
  return `${topbar('Salud')}<h1 class="h-page">Salud</h1><p class="sub">Todo lo médico, claro y en un solo lugar.</p><div class="seg">${seg}</div>${body}${disclaimer()}
    ${fabs[sub] ? `<button class="fab" onclick="${fabs[sub]}" aria-label="Añadir">${I.plus}</button>` : ''}`;
}
function subSalud(k){ L.sub.salud = k; saveLocal(); render(); }
function rowCita(a){
  const d = pd(a.date);
  return `<div class="row clickable" onclick="openCita('${a.id}')"><div class="ic date"><b class="num">${d.getDate()}</b><small>${fmt(d,{month:'short'}).replace('.','')}</small></div>
    <div class="body"><h4>${esc(a.title)}</h4><p>${[fmtTime(a.date), a.doctor, a.clinic].filter(Boolean).map(esc).join(' · ')}</p></div>
    <div class="tail">${citaPasada(a) ? '<span class="chip sage">Ya fue</span>' : `<span class="chip plum num">${relDias(diffDays(d, today()))}</span>`}</div></div>`;
}
function renderCitas(){
  const t = today();
  const prox = S.appointments.filter(a => !citaPasada(a)).sort((a,b) => a.date.localeCompare(b.date));
  const ant = S.appointments.filter(a => citaPasada(a)).sort((a,b) => b.date.localeCompare(a.date));
  return `<div class="section" style="margin-top:4px"><div class="section-head"><h2>Próximas citas</h2></div>
    ${prox.length ? `<div class="card" style="padding:4px 18px">${prox.map(rowCita).join('')}</div>` : emptyState(I.calendar, 'No hay próximas citas guardadas', 'Cuando reserven una consulta o una ecografía, guárdenla aquí con las preguntas que quieran hacer.', `<button class="btn soft sm" onclick="openCita()">Añadir cita</button>`)}
    </div>
    ${ant.length ? `<div class="section"><div class="section-head"><h2>Citas anteriores</h2></div><div class="card" style="padding:4px 18px">${ant.map(rowCita).join('')}</div></div>` : ''}`;
}
const KINDS = { sangre:'Análisis de sangre', orina:'Análisis de orina', genetico:'Estudio genético', glucosa:'Glucosa', tension:'Tensión arterial', cribado:'Cribado', eco:'Ecografía', otro:'Otro' };
const STATUS = { pendiente:['Pendiente','amber'], normal:['Normal','sage'], revisar:['Para comentar','warm'], alterado:['Requiere seguimiento','red'] };
function renderAnalisis(){
  const list = [...S.tests].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  if (!list.length) return emptyState(I.flask, 'Todavía no hay análisis guardados', 'Guarda cada resultado con una explicación sencilla para volver a leerla cuando haga falta.', `<button class="btn soft sm" onclick="openAnalisis()">Añadir análisis</button>`);
  const pend = list.filter(x => x.status === 'pendiente'), done = list.filter(x => x.status !== 'pendiente');
  const row = x => { const [l, cls] = STATUS[x.status] || STATUS.pendiente; return `<div class="row clickable" onclick="openAnalisis('${x.id}')"><div class="ic">${I.flask}</div><div class="body"><h4>${esc(x.name)}</h4><p>${x.date ? cap(fmtShort(x.date)) + ' · ' + semanaCorta(Math.max(0,gaOf(x.date))) + ' · ' : ''}${esc(x.result || KINDS[x.kind] || '')}</p></div><div class="tail"><span class="chip ${cls}">${l}</span></div></div>`; };
  return `${pend.length ? `<div class="section" style="margin-top:4px"><div class="section-head"><h2>Pendientes</h2></div><div class="card" style="padding:4px 18px">${pend.map(row).join('')}</div></div>` : ''}
    <div class="section"><div class="section-head"><h2>Resultados</h2></div>${done.length ? `<div class="card" style="padding:4px 18px">${done.map(row).join('')}</div>` : '<p class="sub">Aún no hay resultados guardados.</p>'}</div>`;
}
function renderEcos(){
  const list = [...S.ultrasounds].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  if (!list.length) return emptyState(I.photo, 'Todavía no hay ecografías', 'Cada ecografía es un momento importante. Guarda la imagen, la fecha y lo que les dijeron.', `<button class="btn soft sm" onclick="openEco()">Añadir ecografía</button>`);
  return `<div class="section" style="margin-top:4px"><div class="eco-grid">${list.map(e => `<button class="eco" onclick="openEco('${e.id}')">${e.photo ? (esDoc(e.photo) ? '<div class="img">Informe PDF</div>' : `<img src="${fotoSrc(e.photo)}" data-foto="${esc(e.photo)}" alt="Ecografía">`) : '<div class="img">Sin imagen</div>'}<div class="bd"><b>${semanaTxt(Math.max(0,gaOf(e.date)))}</b><small>${cap(fmtShort(e.date))}${e.fhr ? ` · ${e.fhr} lpm` : ''}</small></div></button>`).join('')}</div></div>`;
}
function renderSintomas(){
  const t = iso(today());
  const hoy = S.symptoms.find(s => s.date === t);
  const hist = [...S.symptoms].sort((a,b) => a.date.localeCompare(b.date)).slice(-10);
  const score = s => Object.values(s.values||{}).reduce((a,b) => a+b, 0);
  const top = hoy ? SINTOMAS.filter(x => (hoy.values[x.k]||0) > 0).sort((a,b) => hoy.values[b.k]-hoy.values[a.k]) : [];
  const ella = yo() === 'mother';
  return `<div class="section" style="margin-top:4px"><div class="card">
      <div class="section-head" style="margin-bottom:8px"><h3 style="font-size:19px">Hoy</h3>${ella ? `<button class="link" onclick="openSintomas()">${hoy ? 'Editar' : 'Registrar'}</button>` : ''}</div>
      ${hoy ? `<div class="chips">${top.length ? top.map(x => `<span class="chip ${hoy.values[x.k]===3?'red':hoy.values[x.k]===2?'amber':'sage'}">${x.l} · ${ESCALA[hoy.values[x.k]].toLowerCase()}</span>`).join('') : '<span class="chip sage">Sin síntomas destacables</span>'}</div>${hoy.note ? `<p class="sub" style="margin-top:10px">${esc(hoy.note)}</p>` : ''}` : `<p class="sub">${ella ? 'Todavía no has registrado cómo te sientes hoy. Un minuto alcanza.' : `${esc(quien('mother'))} todavía no ha registrado cómo se siente hoy.`}</p>`}
    </div></div>
    ${hist.length ? `<div class="section"><div class="section-head"><h2>Últimos días</h2></div><div class="card"><div class="sym-hist">${hist.map(s => `<div class="sym-day" ${ella ? `onclick="openSintomas('${s.date}')" role="button" tabindex="0" style="cursor:pointer"` : ''}><div class="bar"><i style="height:${Math.max(4, Math.min(44, score(s)*3))}px" title="${score(s)}"></i></div><span class="num">${fmtShort(s.date)}</span></div>`).join('')}</div><p class="sub" style="font-size:13px;margin-top:8px">La altura resume la intensidad total del día. Sirve para ver tendencias, no para diagnosticar.${ella ? ' Toca un día para editarlo, o cambia la fecha al registrar para añadir uno anterior.' : ''}</p></div></div>` : ''}
    ${renderConstantes()}
    <div class="section"><div class="card soft"><span class="eyebrow">Cuándo consultar sin esperar</span><p class="sub" style="margin-top:6px">Sangrado abundante, dolor abdominal intenso o en un solo lado, desmayo, dolor de cabeza fuerte con alteraciones de la visión, dificultad para respirar o fiebre alta. Ante cualquiera de estas señales, contacta con tu equipo médico o llama al ${esc(pais().emergencias)}.</p></div></div>`;
}

// Peso y tensión de ella, como serie
function renderConstantes(){
  const ella = yo() === 'mother';
  const list = [...(S.vitals || [])].sort((a, b) => a.date.localeCompare(b.date));
  const ult = list[list.length - 1];
  const nivel = ult ? nivelTension(ult.systolic, ult.diastolic) : null;
  const chipTA = nivel === 'grave' ? '<span class="chip red">Muy alta</span>' : nivel === 'alta' ? '<span class="chip amber">Alta</span>' : nivel === 'baja' ? '<span class="chip amber">Baja</span>' : nivel === 'normal' ? '<span class="chip sage">Normal</span>' : '';
  const pesos = list.filter(v => v.weight), tas = list.filter(v => v.systolic && v.diastolic);
  return `<div class="section"><div class="card">
    <div class="section-head" style="margin-bottom:8px"><h3 style="font-size:19px">Peso y tensión</h3>${ella ? `<button class="link" onclick="openConstantes()">Registrar</button>` : ''}</div>
    ${ult ? `<p class="sub">Último registro ${cap(fmtShort(ult.date))}: ${ult.weight ? `<b class="num">${esc(String(ult.weight).replace('.', ','))} kg</b>` : ''}${ult.weight && ult.systolic ? ' · ' : ''}${ult.systolic ? `<b class="num">${esc(ult.systolic)}/${esc(ult.diastolic)}</b> ${chipTA}` : ''}</p>` : `<p class="sub">${ella ? 'Anota el peso y la tensión cuando te los tomen (o en casa): se ven como una serie y el asistente los tiene en cuenta.' : `${esc(quien('mother'))} todavía no ha registrado peso ni tensión.`}</p>`}
    ${['alta','grave'].includes(nivel) ? `<div class="alert-urgent" style="margin-top:10px"><strong>${nivel === 'grave' ? 'Tensión muy alta' : 'Tensión alta'}</strong>${nivel === 'grave' ? 'Con 160/110 o más, contacta con tu equipo médico ahora o acude a urgencias, sobre todo si hay dolor de cabeza, visión borrosa o hinchazón repentina.' : 'A partir de 140/90 conviene repetirla sentada y en reposo y avisar a tu equipo médico hoy.'}</div>` : ''}
    ${pesos.length >= 2 ? grafico(pesos.map(v => ({ x: v.date, y: Number(v.weight) })), { label:'Peso (kg)', unit:' kg', color:'var(--accent)' }) : ''}
    ${tas.length >= 2 ? grafico(tas.map(v => ({ x: v.date, y: Number(v.systolic), y2: Number(v.diastolic) })), { label:'Tensión (sistólica / diastólica)', unit:'', color:'var(--accent)', color2:'var(--warm)', lines:[{ y:140, txt:'140' }, { y:90, txt:'90' }], min:50, max:170 }) : ''}
    ${list.length ? `<div style="margin-top:10px"><button class="link" style="font-size:13px" onclick="openHistorialConstantes()">Ver todos los registros</button></div>` : ''}
  </div></div>`;
}
// Gráfico de líneas mínimo (SVG): una o dos series de la misma medida, un eje, últimos 12 puntos
function grafico(pts, o){
  pts = pts.slice(-12); const W = 320, H = 120, px = 34, py = 14, pr = 44;
  const ys = pts.flatMap(p => [p.y, p.y2]).filter(v => Number.isFinite(v));
  let min = o.min ?? Math.min(...ys), max = o.max ?? Math.max(...ys); if (max - min < 4) { min -= 2; max += 2; }
  const X = i => px + (pts.length === 1 ? (W - px - pr) / 2 : i * (W - px - pr) / (pts.length - 1)), Y = v => py + (H - 2 * py) * (1 - (v - min) / (max - min));
  const path = k => pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p[k]).toFixed(1)}`).join(' ');
  const dots = k => pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p[k]).toFixed(1)}" r="4" fill="var(--surface)" stroke="${k === 'y' ? o.color : o.color2}" stroke-width="2"><title>${fmtShort(p.x)}: ${p[k]}${o.unit}</title></circle>`).join('');
  const last = pts[pts.length - 1];
  return `<div class="chart"><div class="chart-head"><span>${esc(o.label)}</span>${o.color2 ? `<span class="legend"><i style="background:${o.color}"></i>sistólica <i style="background:${o.color2}"></i>diastólica</span>` : ''}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(o.label)}">
      ${(o.lines || []).filter(l => l.y > min && l.y < max).map(l => `<line x1="${px}" x2="${W - pr}" y1="${Y(l.y).toFixed(1)}" y2="${Y(l.y).toFixed(1)}" stroke="var(--red)" stroke-dasharray="3 4" stroke-width="1" opacity=".7"/><text x="${px - 4}" y="${(Y(l.y) + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--red)">${l.txt}</text>`).join('')}
      <line x1="${px}" x2="${W - pr}" y1="${H - py}" y2="${H - py}" stroke="var(--line)"/>
      <text x="${px - 4}" y="${(Y(max) + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--ink3)">${Math.round(max)}</text><text x="${px - 4}" y="${(Y(min) + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--ink3)">${Math.round(min)}</text>
      <path d="${path('y')}" fill="none" stroke="${o.color}" stroke-width="2" stroke-linejoin="round"/>${dots('y')}
      ${o.color2 ? `<path d="${path('y2')}" fill="none" stroke="${o.color2}" stroke-width="2" stroke-linejoin="round"/>${dots('y2')}` : ''}
      <text x="${(X(pts.length - 1) + 6).toFixed(1)}" y="${(Y(last.y) + 4).toFixed(1)}" font-size="11" font-weight="600" fill="var(--ink)">${last.y}</text>${o.color2 ? `<text x="${(X(pts.length - 1) + 6).toFixed(1)}" y="${(Y(last.y2) + 4).toFixed(1)}" font-size="11" font-weight="600" fill="var(--ink)">${last.y2}</text>` : ''}
    </svg><div class="chart-x"><span>${fmtShort(pts[0].x)}</span><span>${fmtShort(last.x)}</span></div></div>`;
}

// ====== BEBÉ: movimientos y contracciones ======
function renderBebe(){
  const P = preg(), ella = yo() === 'mother';
  const kicks = [...(S.kicks || [])].sort((a, b) => b.date.localeCompare(a.date));
  const contr = [...(S.contractions || [])].sort((a, b) => b.date.localeCompare(a.date));
  const enCurso = KICK.start ? `<span class="chip amber">Sesión en curso · ${KICK.count}</span>` : '';
  const cEnCurso = CONTR.list.length || CONTR.current ? `<span class="chip amber">En curso · ${CONTR.list.length}</span>` : '';
  const kRow = k => { const mins = k.mins || 0; const ok = k.count >= 10; return `<div class="row"><div class="ic" style="${ok ? '' : 'color:var(--amber)'}">${I.baby}</div><div class="body"><h4>${k.count} ${k.count === 1 ? 'movimiento' : 'movimientos'} en ${mins} min</h4><p>${cap(fmtShort(k.date))}${fmtTime(k.date) ? ' · ' + fmtTime(k.date) : ''}${k.note ? ' · ' + esc(k.note) : ''}</p></div><div class="tail">${ok ? '<span class="chip sage">10 alcanzados</span>' : mins >= 120 ? '<span class="chip amber">Menos de 10</span>' : ''}</div></div>`; };
  const cRow = c => { const st = statsContracciones(c.contractions || []); return `<div class="row"><div class="ic">${I.wave}</div><div class="body"><h4>${(c.contractions || []).length} contracciones${st.n >= 2 ? ` · cada ${st.intervalo} min · ${st.duracion} s` : ''}</h4><p>${cap(fmtShort(c.date))}${fmtTime(c.date) ? ' · ' + fmtTime(c.date) : ''}${c.note ? ' · ' + esc(c.note) : ''}</p></div><div class="tail">${st.alerta ? '<span class="chip red">5-1-1</span>' : ''}</div></div>`; };
  return `<div class="section" style="margin-top:4px"><div class="card">
      <div class="section-head" style="margin-bottom:6px"><h3 style="font-size:19px">Movimientos del bebé</h3>${enCurso}</div>
      <p class="sub">${P.w < 28 ? `Contar movimientos tiene sentido a partir de la semana 28 (están en la ${P.w}). Antes, sentirlo es suficiente.` : 'Elige un rato en el que suela moverse, túmbate de lado y cuenta: lo habitual es llegar a 10 movimientos en menos de 2 horas. Si un día notas claramente menos, consulta sin esperar.'}</p>
      ${ella ? `<div style="margin-top:12px"><button class="btn ${KICK.start ? 'soft' : ''} block" onclick="openMovimientos()">${KICK.start ? 'Seguir contando' : 'Empezar a contar'}</button></div>` : `<p class="sub" style="margin-top:8px">Cuenta ${esc(quien('mother'))}; tú ves las sesiones aquí.</p>`}
    </div>
    ${kicks.length ? `<div class="card" style="padding:4px 18px;margin-top:12px">${kicks.slice(0, 5).map(kRow).join('')}</div>` : ''}
    </div>
    <div class="section"><div class="card">
      <div class="section-head" style="margin-bottom:6px"><h3 style="font-size:19px">Contracciones</h3>${cEnCurso}</div>
      <p class="sub">${P.w < 36 ? 'Las contracciones de práctica (Braxton Hicks) son irregulares y se pasan al cambiar de postura o descansar. Si antes de la semana 37 son regulares y van a más, llama.' : 'Cronometra cada una desde que empieza hasta que termina. La referencia para ir al hospital suele ser 5-1-1: cada 5 minutos, de 1 minuto, durante 1 hora (pregunten a su equipo cuál es la suya).'}</p>
      <div style="margin-top:12px"><button class="btn ${CONTR.list.length ? 'soft' : ''} block" onclick="openContracciones()">${CONTR.list.length || CONTR.current ? 'Seguir cronometrando' : 'Cronometrar contracciones'}</button></div>
    </div>
    ${contr.length ? `<div class="card" style="padding:4px 18px;margin-top:12px">${contr.slice(0, 5).map(cRow).join('')}</div>` : ''}
    </div>`;
}
function statsContracciones(list){
  const done = list.filter(c => c.s && c.e); const n = done.length;
  if (n < 2) return { n, intervalo: null, duracion: null, alerta: false };
  const ult = done.slice(-6);
  const ints = ult.slice(1).map((c, i) => (c.s - ult[i].s) / 60000);
  const durs = ult.map(c => (c.e - c.s) / 1000);
  const intervalo = Math.round(ints.reduce((a, b) => a + b, 0) / ints.length), duracion = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
  const span = (done[n - 1].s - done[Math.max(0, n - 12)].s) / 60000;
  const alerta = n >= 6 && intervalo <= 5 && duracion >= 45 && span >= 50;
  return { n, intervalo, duracion, alerta };
}

// ====== NOSOTROS ======
function renderNosotros(){
  const us = L.sub.us;
  if (us === 'recuerdos') return renderRecuerdos();
  if (us === 'nombres') return renderNombres();
  if (us === 'familia') return renderFamilia();
  if (us === 'tareas') return renderTareas();
  const P = preg();
  const match = S.names.filter(n => n.votes?.mother && n.votes?.partner && n.votes.mother !== 'no' && n.votes.partner !== 'no').length;
  const sabe = S.family.filter(f => f.knows).length;
  const pend = S.tasks.filter(t => t.status !== 'hecha').length;
  const tile = (k, ic, title, sub) => `<button class="us-tile" onclick="subUs('${k}')"><div class="ic">${ic}</div><h3>${title}</h3><p>${sub}</p></button>`;
  const last = [...S.memories].sort((a,b) => b.date.localeCompare(a.date))[0];
  return `${topbar('Nosotros')}
    <h1 class="h-page">${esc(quien('mother'))} y ${esc(quien('partner'))}</h1>
    <p class="sub">Construyendo esta historia desde hace ${P.days} días.</p>
    <div class="us-grid">
      ${tile('recuerdos', I.camera, 'Recuerdos', S.memories.length ? `${S.memories.length} ${S.memories.length===1?'momento guardado':'momentos guardados'}` : 'Esta historia recién empieza')}
      ${tile('nombres', I.tag, 'Nombres', match ? `${match} ${match===1?'nombre que aman los dos':'nombres que aman los dos'}` : S.names.length ? `${S.names.length} en la lista` : 'Empiecen a guardar nombres')}
      ${tile('familia', I.people, 'Familia', sabe ? `${sabe} ya lo saben` : 'Todavía es un secreto')}
      ${tile('tareas', I.list, 'Tareas', pend ? `${pend} pendientes` : 'Todo al día')}
    </div>
    ${last ? `<div class="section"><div class="section-head"><h2>Último recuerdo</h2><button class="link" onclick="subUs('recuerdos')">Ver todos</button></div><div class="mem-card" onclick="openRecuerdo('${last.id}')" role="button" tabindex="0">${last.photo ? `<img src="${fotoSrc(last.photo)}" data-foto="${esc(last.photo)}" alt="">` : '<div class="ph"></div>'}<div class="bd"><div class="who">${esc(quien(last.author))} · ${cap(fmtShort(last.date))} · ${semanaCorta(Math.max(0,gaOf(last.date)))}</div><h3>${esc(last.title)}</h3><p>${esc(last.text)}</p></div></div></div>` : ''}`;
}
function subUs(k){ L.sub.us = k; saveLocal(); render(); window.scrollTo(0,0); }
function backUs(){ delete L.sub.us; saveLocal(); render(); }
const backBtn = `<button class="back" onclick="backUs()">${I.chevL} Nosotros</button>`;

function renderRecuerdos(){
  const list = [...S.memories].sort((a,b) => b.date.localeCompare(a.date));
  return `${topbar('Recuerdos')}${backBtn}<h1 class="h-page">Recuerdos</h1><p class="sub">La historia de este bebé, contada por los dos.</p>
    <div class="section mem">${list.length ? list.map(m => `<div class="mem-card" onclick="openRecuerdo('${m.id}')" role="button" tabindex="0">${m.photo ? `<img src="${fotoSrc(m.photo)}" data-foto="${esc(m.photo)}" alt="">` : '<div class="ph"></div>'}<div class="bd"><div class="who"><span class="who-mini"><i>${esc(iniciales(m.author))}</i></span>${esc(quien(m.author))} · ${cap(fmtShort(m.date))} · ${semanaTxt(Math.max(0,gaOf(m.date)))}</div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p>${m.audio ? `<span class="audio">${I.mic} Audio guardado</span>` : ''}</div></div>`).join('') : emptyState(I.camera, 'Esta historia recién empieza', 'Guarda el día que se enteraron, la primera ecografía, la reacción de los abuelos. Todo lo que quieran recordar.')}</div>
    <button class="fab" onclick="openRecuerdo()" aria-label="Añadir recuerdo">${I.plus}</button>`;
}
function renderNombres(){
  const me = yo(), otro = me === 'mother' ? 'partner' : 'mother';
  const isMatch = n => n.votes?.mother && n.votes?.partner && n.votes.mother !== 'no' && n.votes.partner !== 'no';
  const list = [...S.names].sort((a,b) => (isMatch(b)?1:0) - (isMatch(a)?1:0) || a.name.localeCompare(b.name));
  const activos = list.filter(n => n.votes?.[me] !== 'no'), descartados = list.filter(n => n.votes?.[me] === 'no');
  const card = n => `<div class="name-card ${isMatch(n)?'match':''}"><div class="nm" onclick="openNombre('${n.id}')" role="button" tabindex="0"><h4>${esc(n.name)}</h4><p>${[n.origin, n.meaning].filter(Boolean).map(esc).join(' · ') || 'Sin significado guardado'}</p>${isMatch(n) ? '<div class="match-banner">Los dos aman este nombre ❤️</div>' : n.votes?.[otro] && n.votes[otro] !== 'no' ? `<div class="match-banner" style="color:var(--ink3)">A ${esc(quien(otro))} le gusta</div>` : ''}</div>
    <div class="votes"><button class="vote like ${n.votes?.[me]==='like'?'on':''}" onclick="votar('${n.id}','like')" aria-label="Me gusta">${I.thumb}</button><button class="vote fav ${n.votes?.[me]==='fav'?'on':''}" onclick="votar('${n.id}','fav')" aria-label="Favorito">${I.star}</button><button class="vote no ${n.votes?.[me]==='no'?'on':''}" onclick="votar('${n.id}','no')" aria-label="Descartar">${I.x}</button></div></div>`;
  return `${topbar('Nombres')}${backBtn}<h1 class="h-page">Nombres</h1><p class="sub">Cada uno vota por su cuenta. Cuando coinciden, se nota.</p>
    <div class="section">${activos.length ? activos.map(card).join('') : emptyState(I.tag, 'Empiecen a guardar nombres que les gusten', 'Añadan los que se les ocurran, voten por separado y vean dónde coinciden.')}</div>
    ${descartados.length ? `<div class="section"><div class="section-head"><h2>Descartados por ti</h2></div>${descartados.map(card).join('')}</div>` : ''}
    <button class="fab" onclick="openNombre()" aria-label="Añadir nombre">${I.plus}</button>`;
}
const GRUPOS = ['abuelos','bisabuelos','hermanos','sobrinos','primos','amigos','trabajo','otros'];
function renderFamilia(){
  const groups = GRUPOS.filter(g => S.family.some(f => f.group === g));
  return `${topbar('Familia')}${backBtn}<h1 class="h-page">Anuncios a la familia</h1><p class="sub">Quién lo sabe, quién todavía no, y cómo se lo contamos.</p>
    <div class="section">${S.family.length ? groups.map(g => `<div class="fam-group"><h4>${cap(g)}</h4><div class="card" style="padding:4px 18px">${S.family.filter(f => f.group === g).map(f => `<div class="row clickable" onclick="openFamiliar('${f.id}')"><div class="ic" style="${f.knows?'background:var(--sage-soft);color:var(--sage)':''}">${f.knows ? I.check : I.people}</div><div class="body"><h4>${esc(f.name)}</h4><p>${f.knows ? [f.date ? cap(fmtShort(f.date)) : '', f.how].filter(Boolean).map(esc).join(' · ') || 'Ya lo sabe' : 'Todavía no lo sabe'}</p></div><div class="tail">${f.knows ? '<span class="chip sage">Lo sabe</span>' : '<span class="chip">Pendiente</span>'}</div></div>`).join('')}</div></div>`).join('') : emptyState(I.people, 'Todavía pueden disfrutar este secreto entre ustedes', 'Cuando decidan contarlo, guarden a quién, cuándo y cómo reaccionó.')}</div>
    <button class="fab" onclick="openFamiliar()" aria-label="Añadir persona">${I.plus}</button>`;
}
function renderTareas(){
  const t = today();
  const pend = S.tasks.filter(x => x.status !== 'hecha').sort((a,b) => (a.due||'9').localeCompare(b.due||'9'));
  const done = S.tasks.filter(x => x.status === 'hecha').sort((a,b) => (b.due||'').localeCompare(a.due||''));
  const row = x => { const late = x.due && x.status !== 'hecha' && pd(x.due) < t; return `<div class="task ${x.status==='hecha'?'done':''}"><button class="check ${x.status==='hecha'?'on':''}" onclick="toggleTarea('${x.id}')" aria-label="Completar">${x.status==='hecha' ? I.check : ''}</button><div class="t" onclick="openTarea('${x.id}')" role="button" tabindex="0"><h4>${esc(x.title)}</h4><p><span class="who-mini" style="margin:0"><i>${esc(iniciales(x.owner))}</i></span><span>${esc(quien(x.owner))}</span>${x.due ? `<span class="num" style="${late?'color:var(--red);font-weight:600':''}">${x.status==='hecha' ? cap(fmtShort(x.due)) : relDias(diffDays(pd(x.due), t))}</span>` : ''}</p></div></div>`; };
  const mine = pend.filter(x => x.owner === yo() || x.owner === 'both').length;
  return `${topbar('Tareas')}${backBtn}<h1 class="h-page">Tareas compartidas</h1><p class="sub">${pend.length ? `${pend.length} pendientes, ${mine} a tu cargo.` : 'Nada pendiente. Bien.'}</p>
    <div class="section">${pend.length ? `<div class="card" style="padding:4px 18px">${pend.map(row).join('')}</div>` : emptyState(I.list, 'Sin tareas pendientes', 'Reservar citas, revisar la cobertura, preparar la habitación: todo lo que decidan juntos, aquí.')}</div>
    ${done.length ? `<div class="section"><div class="section-head"><h2>Hechas</h2></div><div class="card" style="padding:4px 18px">${done.map(row).join('')}</div></div>` : ''}
    <button class="fab" onclick="openTarea()" aria-label="Añadir tarea">${I.plus}</button>`;
}
function toggleTarea(id){ const x = S.tasks.find(t => t.id === id); if (!x) return; x.status = x.status === 'hecha' ? 'pendiente' : 'hecha'; commit(); }
function votar(id, v){ const n = S.names.find(x => x.id === id); if (!n) return; n.votes = n.votes || {}; const me = yo(); n.votes[me] = n.votes[me] === v ? null : v; const otro = me==='mother'?'partner':'mother'; if (n.votes[me] && n.votes[me] !== 'no' && n.votes[otro] && n.votes[otro] !== 'no') toast('Los dos aman este nombre ❤️'); commit(); }

// ====== PREGUNTAR ======
function renderPreguntar(){
  const P = preg(), me = yo();
  const sug = me === 'partner'
    ? ['¿Qué debería estar haciendo yo como padre esta semana?', '¿Cómo puedo acompañarla mejor esta semana?', '¿Qué deberíamos preguntarle en la próxima cita?', '¿Cuándo tiene sentido contarle a la familia?', ...(S.pregnancy.maternalAge >= 35 ? [`¿Qué cambia porque ella tiene ${S.pregnancy.maternalAge} años?`] : ['¿Qué deberíamos preparar antes de la semana 20?'])]
    : [`¿Este síntoma es habitual en la semana ${P.w}?`, '¿Qué deberíamos preguntarle en la próxima cita?', '¿Cuándo conviene hacer el NIPT?', '¿Qué debería esperar de la próxima ecografía?', '¿Qué deberíamos preparar antes de la semana 20?'];
  const msgs = chatMsgs().slice(-30);
  const body = msgs.length ? msgs.map((m, i) => m.role === 'user' ? `<div class="msg user">${esc(m.content)}</div>` : `${m.urgent ? urgentBox(m.urgent) : ''}<div class="msg ai">${esc(m.content)}<span class="disc">Orientación general para ${semanaTxt(P.days).toLowerCase()}. No sustituye el consejo de tu equipo médico.${i > 0 && msgs[i-1].role === 'user' ? ` <button class="link" style="font-size:12px;margin-left:6px" onclick="openGuardarPregunta(${i - 1 + Math.max(0, chatMsgs().length - 30)})">Llevar preguntas a la cita</button>` : ''}</span></div>`).join('')
    : `<div class="card accent"><span class="eyebrow">Asistente</span><h3>Conoce este embarazo</h3><p class="sub">Sé que están en la ${semanaTxt(P.days).toLowerCase()}, la fecha probable de parto, las citas y los resultados que han guardado. Pregunta con contexto, sin tener que explicarlo todo. Esta conversación es solo tuya: tu pareja no la ve.</p></div>`;
  return `${topbar('Preguntar')}
    <h1 class="h-page">Preguntar</h1><p class="sub" style="margin-bottom:12px">Respuestas calmadas y con contexto. ${AI_OK === false ? 'El asistente con IA todavía no está configurado: respondo con orientación general.' : ''}</p>
    <div class="suggest">${sug.map(s => `<button onclick="preguntar('${esc(s).replace(/'/g,"\\'")}')">${esc(s)}</button>`).join('')}</div>
    <div class="chat" id="chat">${body}</div>
    ${chatMsgs().length ? `<div style="text-align:center;margin-top:16px"><button class="link" style="color:var(--ink3)" onclick="borrarChat()">Borrar conversación</button></div>` : ''}
    <div class="composer"><form onsubmit="event.preventDefault(); preguntar(this.q.value); this.q.value='';"><input name="q" placeholder="Escribe tu pregunta…" autocomplete="off" aria-label="Tu pregunta"><button type="submit" aria-label="Enviar">${I.send}</button></form></div>`;
}
function urgentBox(l){ return `<div class="alert-urgent"><strong>Esto puede necesitar atención ahora</strong>Mencionas ${esc(l)}. No esperes a la próxima cita: contacta con tu equipo médico o acude a urgencias. Si es grave, llama al <span class="tel">${esc(pais().emergencias)}</span>.</div>`; }
function borrarChat(){ chatMsgs().length = 0; chatPersist(); render(); }
function preguntarSobreCita(id){
  const a = S.appointments.find(x => x.id === id); if (!a) return;
  const q = `Tenemos ${a.title} el ${fmtLong(a.date)}${fmtTime(a.date) ? ' a las ' + fmtTime(a.date) : ''}${a.doctor ? ' con ' + a.doctor : ''}${a.clinic ? ' en ' + a.clinic : ''}. ${preguntasDe(a).length ? 'Ya anotamos estas preguntas: ' + preguntasDe(a).map(x => x.q).join('; ') + '. ' : 'Todavía no anotamos preguntas. '}¿Qué más deberíamos preguntar en esa cita, según nuestra semana y lo que tenemos guardado?`;
  closeSheet(); preguntarCon(q);
}
function preguntarCon(q){ L.tab = 'preguntar'; saveLocal(); render(); setTimeout(() => preguntar(q), 50); }

function contextoIA(){
  const P = preg(), p = S.pregnancy, t = today(), me = yo();
  const citas = S.appointments.filter(a => !citaPasada(a)).sort((x, y) => x.date.localeCompare(y.date)).slice(0,3).map(a => `${a.title} el ${fmtShort(a.date)} (${[a.doctor,a.clinic].filter(Boolean).join(', ')})${preguntasDe(a).length ? ' · preguntas ya anotadas: ' + preguntasDe(a).map(x => x.q).join('; ') : ''}`);
  const pasadas = S.appointments.filter(a => citaPasada(a)).sort((x, y) => y.date.localeCompare(x.date)).slice(0,3).map(a => { const qa = preguntasDe(a).filter(x => x.a).map(x => `${x.q} → ${x.a}`); return `${a.title} (${fmtShort(a.date)}${a.doctor ? ', ' + a.doctor : ''})${a.resumen ? ': ' + a.resumen : a.notes ? ': ' + a.notes : ''}${qa.length ? ' · Preguntas y respuestas: ' + qa.join(' | ') : ''}`; }).filter(x => x.includes(':') || x.includes('Preguntas'));
  const res = S.tests.filter(x => x.status !== 'pendiente').slice(-6).map(x => `${x.name} (${x.date ? semanaCorta(Math.max(0,gaOf(x.date))) : ''}): ${x.result} — ${x.status}`);
  const pendTests = S.tests.filter(x => x.status === 'pendiente').map(x => `${x.name}${x.date ? ' el ' + fmtShort(x.date) : ''}`);
  const ecos = S.ultrasounds.slice(-2).map(e => `Ecografía ${semanaCorta(Math.max(0,gaOf(e.date)))}: ${[e.crl && 'CRL ' + e.crl + ' mm', e.fhr && 'FCF ' + e.fhr + ' lpm', e.comments].filter(Boolean).join(', ')}`);
  const sint = [...S.symptoms].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3).map(s => `${fmtShort(s.date)}: ${SINTOMAS.filter(x => (s.values[x.k]||0) > 0).map(x => `${x.l.toLowerCase()} ${ESCALA[s.values[x.k]].toLowerCase()}`).join(', ') || 'sin síntomas'}${s.note ? ' (' + s.note + ')' : ''}`);
  const hitos = timeline().filter(h => h.done).map(h => h.title);
  const c = contenido(P.w);
  return `CONTEXTO DEL EMBARAZO (datos reales guardados por la pareja en la app):
- Hoy: ${fmtLong(t)}. ${P.nacido ? `EL BEBÉ YA NACIÓ el ${fmtLong(P.nacDate)} (${P.diasVida} días de vida). Estamos en el posparto: adapta todo a esta etapa.` : `Edad gestacional: ${semanaTxt(P.days)} (${['','primer','segundo','tercer'][P.trimester]} trimestre). Fecha probable de parto: ${fmtShort(P.edd)} (${P.remaining >= 0 ? `faltan ${P.remaining} días` : `pasó hace ${-P.remaining} días`}).`}
- Quien pregunta: ${me === 'mother' ? 'la persona embarazada' : 'la pareja (padre/madre no gestante)'}${p.names?.[me] ? ', se llama ' + p.names[me] : ''}. La otra persona se llama ${p.names?.[me==='mother'?'partner':'mother'] || '—'}.
- Edad materna: ${p.maternalAge || 'no indicada'}. ${p.firstPregnancy === false ? 'No es su primer embarazo.' : p.firstPregnancy ? 'Es su primer embarazo.' : ''} Tipo: ${p.type === 'gemelar' ? 'gemelar' : p.type === 'nose' ? 'todavía no saben si es único o múltiple' : 'único'}.
- País: ${pais().nombre}. Terminología local: ${pais().matrona}, ${pais().gine}, ${pais().analisis}. Emergencias: ${pais().emergencias}.
- Esta semana según el contenido de la app: bebé: ${c.bebe.join(' ')} Ella: ${c.ella} Hitos habituales: ${c.hitos || '—'}.
- Próximas citas: ${citas.length ? citas.join(' | ') : 'ninguna guardada'}.
- Lo que dijo el equipo médico en citas anteriores: ${pasadas.length ? pasadas.join(' || ') : 'sin notas'}.
- Pruebas pendientes: ${pendTests.join(' | ') || 'ninguna'}.
- Resultados guardados: ${res.join(' | ') || 'ninguno'}.
- Ecografías: ${ecos.join(' | ') || 'ninguna'}.
- Síntomas recientes: ${sint.join(' | ') || 'sin registros'}.
- Hitos completados: ${hitos.join(', ') || 'ninguno'}.
- Peso y tensión de ella (últimos): ${[...(S.vitals || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(v => `${fmtShort(v.date)}: ${v.weight ? v.weight + ' kg' : ''}${v.weight && v.systolic ? ', ' : ''}${v.systolic ? 'TA ' + v.systolic + '/' + v.diastolic : ''}`).join(' | ') || 'sin registros'}.
- Movimientos del bebé (sesiones recientes): ${[...(S.kicks || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(k => `${fmtShort(k.date)}: ${k.count} en ${k.mins} min`).join(' | ') || 'sin registros'}.
- Contracciones (última sesión): ${(() => { const c = [...(S.contractions || [])].sort((a, b) => b.date.localeCompare(a.date))[0]; if (!c) return 'sin registros'; const st = statsContracciones(c.contractions || []); return `${fmtShort(c.date)}: ${(c.contractions || []).length} contracciones${st.n >= 2 ? `, cada ${st.intervalo} min, de ${st.duracion} s` : ''}${st.alerta ? ' (patrón 5-1-1)' : ''}`; })()}.`;
}
const REGLAS_IA = `Eres el asistente de "juntos", una app de acompañamiento del embarazo para parejas. Responde SIEMPRE en español neutro y natural (válido para España y Latinoamérica), tuteando, en un tono calmado, cálido y honesto. Nunca uses inglés.
Reglas:
1. Personaliza según la semana gestacional y el contexto real de abajo. No pidas datos que ya tienes.
2. Distingue con claridad lo habitual de las señales de alarma. Evita la falsa certeza: usa "suele", "es frecuente", "en muchos casos".
3. No diagnostiques. No sustituyes a un profesional. Cuando corresponda, recomienda consultar con su equipo médico y di qué preguntar.
4. Ante síntomas urgentes (sangrado abundante, dolor abdominal intenso o unilateral, desmayo, dolor de cabeza intenso con alteraciones visuales, dificultad para respirar, fiebre alta, dolor intenso persistente, disminución clara de movimientos fetales, rotura de bolsa), empieza la respuesta recomendando atención médica inmediata o emergencias, de forma clara y sin alarmismo.
5. Sé especialmente cuidadoso con genética, aborto espontáneo, medicación y riesgos: explica opciones y límites, sin cifras inventadas ni promesas.
6. Trata a la pareja como progenitor activo y responsable, no como "ayudante". Usa "ocúpate de", "coordinen", "decidan juntos". Nunca "ayúdala con el bebé".
7. Formato: párrafos cortos, máximo unas 180 palabras salvo que pidan más. Sin listas con viñetas salvo que sean claramente útiles (máximo 5 puntos). Sin encabezados ni negritas. Termina, cuando aporte, con una frase concreta de qué pueden hacer o preguntar.`;

async function preguntar(q){
  q = (q || '').trim(); if (!q) return;
  const urg = ALARMA.find(a => a.re.test(q));
  chatMsgs().push({ role:'user', content:q, at:new Date().toISOString() });
  chatPersist(); render();
  const chat = $('#chat'); if (!chat) return;
  const box = document.createElement('div'); box.className = 'msg ai thinking'; box.textContent = 'Pensando…'; chat.appendChild(box); window.scrollTo(0, document.body.scrollHeight);
  if (urg) { const u = document.createElement('div'); u.innerHTML = urgentBox(urg.l); chat.insertBefore(u.firstChild, box); }
  let text = '';
  if (sampleFn) {
    const hist = chatMsgs().slice(-9, -1).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
    const prompt = `${REGLAS_IA}\n\n${contextoIA()}\n${urg ? `\nATENCIÓN: el mensaje menciona una posible señal de alarma (${urg.l}). Prioriza indicar atención médica urgente.\n` : ''}\n${hist ? 'CONVERSACIÓN PREVIA:\n' + hist + '\n\n' : ''}PREGUNTA ACTUAL DEL USUARIO:\n${q}\n\nResponde ahora, solo con el texto de la respuesta.`;
    try {
      const r = await sampleFn(prompt, { cache:false, modelTier:'default', onText: u => { text = u.text; box.classList.remove('thinking'); box.textContent = u.text; } });
      text = r.text || text;
    } catch (e) {
      text = e?.text || (e?.code === 'rate_limited' ? 'Demasiadas preguntas seguidas. Espera un momento y vuelve a intentarlo.' : e?.code === 'not_granted' || e?.code === 'sampling_disabled' ? 'El asistente no está disponible en esta cuenta. Guarda la pregunta para tu próxima cita.' : 'No he podido responder ahora. Inténtalo de nuevo en un momento.');
    }
  } else {
    text = respuestaLocal(q, urg);
  }
  chatMsgs().push({ role:'assistant', content:text, urgent: urg ? urg.l : null, at:new Date().toISOString() });
  chatPersist(); render(); window.scrollTo(0, document.body.scrollHeight);
}
function respuestaLocal(q, urg){
  const P = preg(), c = contenido(P.w), me = yo(), nx = proximoHito();
  if (urg) return `Por lo que describes (${urg.l}), lo más prudente es no esperar: contacta ahora con tu equipo médico o acude a urgencias. Si es grave o empeora, llama al ${pais().emergencias}. Cuando estés atendida, anota la hora en que empezó y qué notaste, porque te lo van a preguntar.`;
  const s = q.toLowerCase();
  if (/padre|pareja|acompañar|yo como/.test(s)) return `${c.pareja} Esta semana el bebé es como ${c.cmp}, y ella puede notar esto: ${c.ella.toLowerCase()} ${nx ? `Lo más concreto que tienes por delante es ${nx.title.toLowerCase()} el ${fmtShort(nx.date)}: ocúpate de la logística y de que vayan con las preguntas anotadas.` : ''}`;
  if (/pregunt.*(cita|gine|médic|consulta|ecograf)/.test(s) || /qué (deberíamos|debemos) preguntar/.test(s)) return `Para la ${nx ? nx.title.toLowerCase() : 'próxima cita'}, en la semana ${P.w}, suelen ser útiles estas preguntas: si la fecha probable de parto se confirma con la medición; qué pruebas tocan en las próximas semanas y cuándo hay que reservarlas; qué síntomas son normales ahora y cuáles merecen una llamada; y qué pueden hacer los dos para prepararse. Guarden las preguntas en la cita dentro de Salud para no olvidarlas.`;
  if (/nipt/.test(s)) return `El NIPT se puede hacer desde la semana 10 con una extracción de sangre; ustedes están en la ${semanaTxt(P.days).toLowerCase()}, así que ya es momento. Es un cribado, no un diagnóstico: un resultado de bajo riesgo tranquiliza mucho, y uno de alto riesgo se confirma con otra prueba. Los resultados suelen tardar entre una y dos semanas. Pregunten a su ${pais().gine} si en su caso conviene combinarlo con la ecografía de la semana 12.`;
  if (/familia|contar|abuelos/.test(s)) return `No hay un momento correcto: muchas parejas esperan a la ecografía de la semana 12 porque el riesgo de pérdida baja mucho a partir de ahí, y otras prefieren contarlo antes a las personas que las acompañarían pase lo que pase. Decidan juntos a quién, cuándo y cómo, y guárdenlo en Familia para llevar el registro.`;
  if (/síntoma|habitual|normal|náusea|cansancio|dolor/.test(s)) return `En la semana ${P.w}, esto es lo frecuente: ${c.ella} Lo que sí merece una llamada al equipo médico es sangrado abundante, dolor intenso o en un solo lado, fiebre alta o desmayos. Si el síntoma te preocupa o no te deja hacer vida normal, consúltalo: para eso está la próxima cita, y si no puede esperar, llama.`;
  if (/edad|años/.test(s)) return `${S.pregnancy.maternalAge ? `Con ${S.pregnancy.maternalAge} años` : 'Según la edad'}, el seguimiento suele ser el mismo, con más atención a los cribados genéticos (el NIPT es especialmente útil) y a controles de tensión y glucosa. La gran mayoría de los embarazos evolucionan bien. Pregunten a su ${pais().gine} si en su caso proponen alguna prueba o control adicional y por qué.`;
  if (/ecograf|eco /.test(s)) return `En la próxima ecografía suelen medir al bebé para confirmar la fecha probable de parto, revisar el latido y, según la semana, la anatomía. Pidan que les expliquen cada medida y, si quieren, que les den una imagen o graben el latido. Es un momento emocionalmente intenso: vayan los dos si pueden.`;
  if (/preparar|antes de la semana/.test(s)) return `Antes de la semana 20 suele tener sentido: tener reservada la ecografía morfológica, revisar la cobertura del parto y la licencia parental de cada uno, empezar la lista de nombres y decidir dónde quieren que nazca. Repartan estas tareas en Tareas compartidas para que no recaigan en una sola persona.`;
  return `En la ${semanaTxt(P.days).toLowerCase()}, lo que está pasando es esto: ${c.bebe[0]} ${c.ella} ${me === 'partner' ? c.pareja : ''} Si quieres, concreta un poco más la pregunta y te oriento con lo que tienen guardado.`;
}
