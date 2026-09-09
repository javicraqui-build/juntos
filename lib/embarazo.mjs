// Cálculo gestacional y avisos, versión servidor (sin DOM). Misma lógica que app-core.js.
import { SEMANAS, HITOS_BASE, SINTOMAS, ESCALA } from './contenido.mjs';

const TZ = { ES:'Europe/Madrid', UY:'America/Montevideo', AR:'America/Argentina/Buenos_Aires', MX:'America/Mexico_City', CO:'America/Bogota', CL:'America/Santiago', PE:'America/Lima', OT:'Europe/Madrid' };
export const DAY = 864e5;
export const pd = s => { if (!s) return null; const [y, m, d] = s.slice(0, 10).split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const iso = t => new Date(t).toISOString().slice(0, 10);
export const addDays = (t, n) => t + n * DAY;
export const diffDays = (a, b) => Math.round((a - b) / DAY);
export function hoyEn(country){ return pd(new Intl.DateTimeFormat('en-CA', { timeZone: TZ[country] || TZ.OT, year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date())); }
export function horaEn(country){ return Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ[country] || TZ.OT, hour:'2-digit', hour12:false }).format(new Date())); }
export function fmt(t, country, opts){ return new Intl.DateTimeFormat(country === 'ES' ? 'es-ES' : 'es-' + (country || 'ES'), Object.assign({ timeZone:'UTC' }, opts || { day:'numeric', month:'long' })).format(new Date(t)); }

export function preg(p, t){
  const edd = p.eddOverride ? pd(p.eddOverride) : addDays(pd(p.lmp), 280);
  const lmpEff = addDays(edd, -280);
  const days = Math.max(0, Math.min(42 * 7 + 6, diffDays(t, lmpEff)));
  return { edd, lmpEff, days, w: Math.floor(days / 7), d: days % 7, remaining: diffDays(edd, t) };
}
export const contenido = w => SEMANAS.find(x => x.w === Math.max(1, Math.min(42, w)));
export const semanaTxt = days => { const w = Math.floor(days / 7), d = days % 7; return d ? `Semana ${w} + ${d} ${d === 1 ? 'día' : 'días'}` : `Semana ${w}`; };
export const citaPasada = (a, ahoraMs) => { if (!a?.date) return false; const [d, h] = a.date.split('T'); let t = pd(d); if (h) { const [hh, mm] = h.split(':').map(Number); t += (hh || 0) * 36e5 + (mm || 0) * 6e4; } else t += DAY - 6e4; return t <= ahoraMs; };

// Avisos de hoy para una persona. Devuelve [{ key, title, body, url }]. `key` evita repetir el mismo aviso.
export function avisos(doc, role, t){
  const p = doc.pregnancy || {}; if (!p.lmp) return [];
  const country = p.country || 'ES'; const out = [];
  const names = p.names || {}; const ella = names.mother || 'Ella', el = names.partner || 'tu pareja';
  const nac = (doc.milestones || {}).nacimiento;
  if (nac && nac.done) return [];
  const P = preg(p, t);
  const manana = addDays(t, 1);
  for (const a of doc.appointments || []) {
    const d = pd(a.date); if (d == null) continue;
    const hora = a.date.length >= 16 ? a.date.slice(11, 16) : '';
    const nq = (a.questions || []).filter(x => typeof x === 'string' ? x : x?.q).length;
    const sub = [a.doctor, a.clinic].filter(Boolean).join(' · ');
    if (d === manana) out.push({ key:`cita-${a.id}-manana`, title:`Mañana${hora ? ' a las ' + hora : ''}: ${a.title}`, body:`${sub ? sub + '. ' : ''}${nq ? `Llevan ${nq} ${nq === 1 ? 'pregunta anotada' : 'preguntas anotadas'}.` : 'Todavía no hay preguntas anotadas: es buen momento para pensarlas juntos.'}`, url:`/?cita=${a.id}` });
    else if (d === t) out.push({ key:`cita-${a.id}-hoy`, title:`Hoy${hora ? ' a las ' + hora : ''}: ${a.title}`, body:`${sub ? sub + '. ' : ''}${nq ? `Repasen las ${nq} preguntas antes de entrar.` : 'Vayan con las preguntas pensadas.'}`, url:`/?cita=${a.id}` });
  }
  if (P.d === 0 && P.w >= 4 && P.w <= 42) { const c = contenido(P.w); out.push({ key:`semana-${P.w}`, title:`Hoy empieza la semana ${P.w}`, body: c.cm ? `El bebé es como ${c.cmp}. ${role === 'partner' ? c.pareja : c.ella}`.slice(0, 180) : c.bebe[0], url:'/' }); }
  const mias = (doc.tasks || []).filter(x => x.status !== 'hecha' && x.due && (x.owner === role || x.owner === 'both') && pd(x.due) <= t).sort((a, b) => a.due.localeCompare(b.due));
  if (mias.length) { const x = mias[0]; const atras = diffDays(t, pd(x.due)); out.push({ key:`tarea-${x.id}-${iso(t)}`, title: atras ? `Tarea atrasada: ${x.title}` : `Tarea para hoy: ${x.title}`, body: atras ? `Vencía hace ${atras} ${atras === 1 ? 'día' : 'días'}. ${mias.length > 1 ? `Y hay ${mias.length - 1} más a tu cargo.` : ''}` : (x.notes || 'Está a tu cargo.'), url:'/?tab=nosotros&us=tareas' }); }
  if (role === 'partner') {
    const ayer = iso(addDays(t, -1));
    const s = (doc.symptoms || []).find(x => x.date === ayer);
    if (s) { const fuertes = SINTOMAS.filter(x => (s.values?.[x.k] || 0) >= 2).map(x => `${x.l.toLowerCase()} (${ESCALA[s.values[x.k]].toLowerCase()})`); if ((s.values && Object.values(s.values).some(v => v === 3)) || fuertes.length >= 2) out.push({ key:`sintomas-${ayer}`, title:`${ella} no tuvo un buen día ayer`, body:`Registró ${fuertes.join(', ')}${s.note ? `. "${s.note}"` : ''}. Pregúntale cómo está hoy.`, url:'/?tab=salud&sub=sintomas' }); }
  } else if (role === 'mother') {
    if (P.w >= 6 && !(doc.symptoms || []).some(x => x.date === iso(t) || x.date === iso(addDays(t, -1)))) { /* sin regaños: no avisamos por no registrar */ }
  }
  const prox = HITOS_BASE.filter(h => !['test','nacimiento','fpp'].includes(h.key)).map(h => { const st = (doc.milestones || {})[h.key] || {}; if (st.hidden || st.done) return null; const cita = (doc.appointments || []).find(a => a.milestone === h.key); if (cita) return null; return { h, date: addDays(P.lmpEff, h.w * 7 + (h.d || 0)) }; }).filter(Boolean).find(x => diffDays(x.date, t) === 7);
  if (prox && !prox.h.emocional) out.push({ key:`hito-${prox.h.key}`, title:`En una semana toca: ${prox.h.title}`, body:`${prox.h.desc} Si ya tienen fecha, guárdenla como cita.`, url:'/?tab=evolucion' });
  const ta = [...(doc.vitals || [])].filter(v => v.systolic && v.diastolic).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (ta && diffDays(t, pd(ta.date)) <= 1) { const s = Number(ta.systolic), d = Number(ta.diastolic); const grave = s >= 160 || d >= 110, alta = s >= 140 || d >= 90; if (grave || alta) out.push({ key:`tension-${ta.date}`, title: grave ? `Tensión muy alta: ${s}/${d}` : `Tensión alta: ${s}/${d}`, body: grave ? `${role === 'partner' ? ella + ' registró' : 'Registraste'} ${s}/${d}. Con 160/110 o más hay que contactar con el equipo médico hoy mismo.` : `${role === 'partner' ? ella + ' registró' : 'Registraste'} ${s}/${d}. Conviene repetirla en reposo y avisar al equipo médico.`, url:'/?tab=salud&sub=sintomas' }); }
  if (P.remaining === 14) out.push({ key:'fpp-14', title:'Dos semanas para la fecha probable de parto', body:'Bolso listo, documentación a mano y el plan para llegar al hospital hablado entre los dos.', url:'/' });
  return out;
}
