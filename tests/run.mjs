// Tests de la lógica pura de juntos. Sin framework: node tests/run.mjs
// Carga los archivos construidos (public/*.js) en un contexto con DOM mínimo y fecha fija, y prueba los cálculos.
import vm from 'node:vm'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXED = new Date(2026, 8, 9, 15, 0, 0);   // miércoles 9 de septiembre de 2026, 15:00 local
let fallos = 0, ok = 0;
function t(nombre, fn){ try { fn(); ok++; } catch (e) { fallos++; console.log(`  ✗ ${nombre}\n      ${e.message}`); } }
function eq(a, b, msg){ const sa = JSON.stringify(a), sb = JSON.stringify(b); if (sa !== sb) throw new Error(`${msg || ''} esperado ${sb}, obtenido ${sa}`); }
function ok_(c, msg){ if (!c) throw new Error(msg || 'condición falsa'); }

// ---------- contexto de navegador mínimo ----------
function contexto(){
  class FakeDate extends Date { constructor(...a){ super(...(a.length ? a : [FIXED.getTime()])); } static now(){ return FIXED.getTime(); } }
  const el = () => ({ innerHTML:'', textContent:'', className:'', style:{}, classList:{ add(){}, remove(){}, toggle(){} }, appendChild(){}, remove(){}, querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, setAttribute(){}, insertAdjacentHTML(){} });
  const document = { querySelector: () => null, querySelectorAll: () => [], createElement: el, body: el(), activeElement: null, addEventListener(){} };
  const ctx = { Date: FakeDate, document, window: {}, navigator: { userAgent:'test', language:'es-ES' }, localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, console, setTimeout, clearTimeout, setInterval, clearInterval, Intl, Math, JSON, URL, location: { href:'http://juntos.test/', origin:'http://juntos.test' }, history: { replaceState(){} }, confirm: () => true, alert(){}, prompt: () => null, FormData: class { forEach(){} } };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['public/content.js', 'public/app.js', 'public/sheets.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  // S, L y las constantes son let/const del script: se alcanzan con accesores dentro del contexto
  vm.runInContext('function __setS(v){ S = v; return S; } function __S(){ return S; } function __setRole(r){ L.role = r; } function __ALARMA(){ return ALARMA; }', ctx);
  return ctx;
}
const C = contexto();
const iso = d => C.iso(d), addDays = (d, n) => C.addDays(d, n);
const HOY = new C.Date(2026, 8, 9);
function espacio(lmpDays, extra = {}){ const W = C.emptyWorkspace(); W.pregnancy.lmp = iso(addDays(HOY, -lmpDays)); const { role, ...rest } = extra; C.__setS(Object.assign(W, rest)); C.__setRole(role || 'mother'); return C.__S(); }

console.log('cálculo gestacional');
t('semana y día desde la FUM', () => { espacio(20*7 + 3); const P = C.preg(); eq([P.w, P.d, P.trimester], [20, 3, 2]); eq(iso(P.edd), iso(addDays(HOY, 280 - (20*7+3)))); });
t('FPP ajustada por ecografía manda sobre la FUM', () => { const S = espacio(100); S.pregnancy.eddOverride = iso(addDays(HOY, 170)); const P = C.preg(); eq(P.days, 110); });
t('semanas 1–3 tienen contenido y la 0 no rompe', () => { eq(C.contenido(0).w, 1); eq(C.contenido(3).img, 'celula'); ok_(!C.contenido(2).cm); eq(C.contenido(45).w, 42); });
t('comoTxt sin embrión', () => { ok_(C.comoTxt(C.contenido(2)).startsWith('Todavía')); ok_(C.comoTxt(C.contenido(10)).includes('fresa')); });
t('semanaTxt', () => { eq(C.semanaTxt(0), 'Semana 0'); eq(C.semanaTxt(71), 'Semana 10 + 1 día'); eq(C.semanaTxt(73), 'Semana 10 + 3 días'); });
t('posparto', () => { const S = espacio(41*7); S.milestones.nacimiento = { done:true, date: iso(addDays(HOY, -3)) }; const P = C.preg(); ok_(P.nacido); eq(P.diasVida, 3); eq(C.paraHoy(), []); });

console.log('citas');
t('citaPasada por fecha y hora', () => { const d = iso(HOY); ok_(C.citaPasada({ date: d + 'T14:59' })); ok_(!C.citaPasada({ date: d + 'T15:01' })); ok_(!C.citaPasada({ date: d })); ok_(C.citaPasada({ date: iso(addDays(HOY, -1)) })); ok_(!C.citaPasada({ date: iso(addDays(HOY, 1)) + 'T00:00' })); });
t('preguntasDe acepta cadenas y objetos', () => { eq(C.preguntasDe({ questions: ['¿A?', { q:'¿B?', a:'sí' }, { q:'' }, null] }), [{ q:'¿A?', a:'' }, { q:'¿B?', a:'sí' }]); eq(C.preguntasDe({}), []); });
t('nivelTension', () => { eq(C.nivelTension(118, 72), 'normal'); eq(C.nivelTension(140, 85), 'alta'); eq(C.nivelTension(120, 90), 'alta'); eq(C.nivelTension(160, 95), 'grave'); eq(C.nivelTension(85, 55), 'baja'); eq(C.nivelTension('', ''), null); });

console.log('línea de tiempo');
t('los hitos base no se marcan solos por la fecha', () => { espacio(20*7); const tl = C.timeline(); const nipt = tl.find(h => h.id === 'nipt'); ok_(!nipt.done); ok_(nipt.porConfirmar); const t3 = tl.find(h => h.id === 't3'); ok_(!t3.done); });
t('los hitos de calendario sí', () => { espacio(30*7); const tl = C.timeline(); ok_(tl.find(h => h.id === 't3').done); ok_(!tl.find(h => h.id === 'termino').done); });
t('la cita vinculada manda: fecha y estado', () => { const S = espacio(12*7); const d = iso(addDays(HOY, -2)); S.appointments.push({ id:'c1', title:'Eco', date: d + 'T10:00', milestone:'eco12' }); const h = C.timeline().find(x => x.id === 'eco12'); ok_(h.done); eq(iso(h.date), d); eq(h.citaId, 'c1'); ok_(!h.estimated); });
t('hito quitado no aparece', () => { const S = espacio(12*7); S.milestones.nipt = { hidden:true }; ok_(!C.timeline().some(h => h.id === 'nipt')); });
t('próximo hito prefiere la cita y salta el hito vinculado', () => { const S = espacio(19*7+3); const d = iso(addDays(HOY, 5)); S.appointments.push({ id:'c1', title:'Morfológica', date: d + 'T10:00', milestone:'eco20', doctor:'Dra.' }); const nx = C.proximoHito(); eq(nx.kind, 'cita'); eq(nx.id, 'c1'); });

console.log('para hoy');
t('cita de hoy abre modo cita, la de mañana preparar, tarea atrasada, tensión alta', () => {
  const S = espacio(30*7, { role:'partner' });
  S.appointments.push({ id:'h', title:'Hoy', date: iso(HOY) + 'T20:00', questions:[{ q:'¿?', a:'' }] }, { id:'m', title:'Mañana', date: iso(addDays(HOY, 1)) + 'T09:00' });
  S.tasks.push({ id:'t', title:'Seguro', owner:'partner', due: iso(addDays(HOY, -2)), status:'pendiente' }, { id:'u', title:'De ella', owner:'mother', due: iso(HOY), status:'pendiente' });
  S.vitals.push({ id:'v', date: iso(addDays(HOY, -1)), systolic:'145', diastolic:'92' });
  const p = C.paraHoy(); const fns = p.map(x => x.fn);
  ok_(fns.some(f => f.startsWith("openCitaHoy('h')")), 'modo cita'); ok_(fns.some(f => f.startsWith("openPreparar('m')")), 'preparar');
  ok_(p.some(x => x.txt.startsWith('Atrasada: Seguro'))); ok_(!p.some(x => x.txt.includes('De ella')), 'la tarea de ella no es suya'); ok_(p.some(x => x.txt.startsWith('Tensión 145/92')));
});
t('la pareja ve el mal día de ella; ella no se ve a sí misma', () => {
  const S = espacio(20*7, { role:'partner' }); S.symptoms.push({ id:'s', date: iso(addDays(HOY, -1)), values:{ nauseas:3 }, note:'' });
  ok_(C.paraHoy().some(x => x.txt.includes('náuseas')));
  C.__setRole('mother'); ok_(!C.paraHoy().some(x => x.txt.includes('náuseas')));
});
t('cita pasada con respuestas y sin resumen pide cierre', () => { const S = espacio(20*7); S.appointments.push({ id:'p', title:'Consulta', date: iso(addDays(HOY, -1)) + 'T10:00', questions:[{ q:'¿?', a:'sí' }] }); ok_(C.paraHoy().some(x => x.fn === "openCierreCita('p')")); S.appointments[0].resumen = 'ok'; ok_(!C.paraHoy().some(x => x.fn === "openCierreCita('p')")); });

console.log('contracciones y avisos locales');
t('statsContracciones detecta 5-1-1', () => {
  const base = FIXED.getTime() - 3600e3; const list = Array.from({ length: 12 }, (_, i) => ({ s: base + i * 5 * 60e3, e: base + i * 5 * 60e3 + 60e3 }));
  const st = C.statsContracciones(list); eq([st.intervalo, st.duracion, st.alerta], [5, 60, true]);
  const pocas = C.statsContracciones(list.slice(0, 3)); ok_(!pocas.alerta); eq(C.statsContracciones([]).n, 0);
});
t('notificaciones: nombre que aman los dos', () => { const S = espacio(10*7); S.names.push({ id:'n', name:'Vera', votes:{ mother:'fav', partner:'like' } }); ok_(C.notificaciones().some(x => x.txt.includes('Vera'))); });
t('ALARMA detecta señales', () => { const hit = q => C.__ALARMA().find(a => a.re.test(q))?.l; eq(hit('tengo sangrado abundante'), 'sangrado abundante'); eq(hit('creo que rompí aguas'), 'posible rotura de bolsa'); eq(hit('no lo siento moverse'), 'disminución de movimientos'); eq(hit('¿puedo comer sushi?'), undefined); });

console.log('avisos push (lib servidor)');
const E = await import(path.join(ROOT, 'lib/embarazo.mjs'));
t('avisos del día: cita mañana, semana nueva, tarea, síntomas para la pareja, tensión', () => {
  const tt = E.pd('2026-09-09'); const isoS = E.iso;
  const doc = { pregnancy:{ lmp: isoS(E.addDays(tt, -20*7)), country:'ES', names:{ mother:'Lu', partner:'Javi' } }, milestones:{}, appointments:[{ id:'c1', title:'Eco', date:'2026-09-10T12:00', questions:[{ q:'¿?', a:'' }, '¿otra?'] }], tasks:[{ id:'t1', title:'Seguro', owner:'partner', due:'2026-09-07', status:'pendiente' }], symptoms:[{ date:'2026-09-08', values:{ nauseas:3 }, note:'' }], vitals:[{ date:'2026-09-09', systolic:'150', diastolic:'95' }] };
  const p = E.avisos(doc, 'partner', tt).map(a => a.key); ok_(p.includes('cita-c1-manana')); ok_(p.includes('semana-20')); ok_(p.includes('tarea-t1-2026-09-09')); ok_(p.includes('sintomas-2026-09-08')); ok_(p.includes('tension-2026-09-09'));
  const m = E.avisos(doc, 'mother', tt).map(a => a.key); ok_(!m.includes('sintomas-2026-09-08')); ok_(!m.includes('tarea-t1-2026-09-09')); ok_(m.includes('tension-2026-09-09'));
  const cita = E.avisos(doc, 'partner', tt).find(a => a.key === 'cita-c1-manana'); ok_(cita.body.includes('2 preguntas')); eq(cita.url, '/?cita=c1');
});
t('sin avisos tras el nacimiento ni sin FUM', () => { const tt = E.pd('2026-09-09'); eq(E.avisos({ pregnancy:{ lmp:'2026-01-01' }, milestones:{ nacimiento:{ done:true } } }, 'mother', tt), []); eq(E.avisos({ pregnancy:{} }, 'mother', tt), []); });
t('franjas horarias por país', () => { ok_(typeof E.horaEn('UY') === 'number'); ok_(/^\d{4}-\d\d-\d\d$/.test(E.iso(E.hoyEn('ES')))); });

console.log('parseo de las respuestas JSON de la IA');
t('extraer: prefill + JSON parcial', () => {
  const parse = cont => { const txt = '{"preguntas":[' + cont; try { return JSON.parse(txt.slice(0, txt.lastIndexOf('}') + 1)).preguntas; } catch { return [...txt.matchAll(/"([^"\n]{8,200}\?)"/g)].map(m => m[1]); } };
  eq(parse('"¿Se confirma la FPP?","¿Qué tocan?"]}'), ['¿Se confirma la FPP?', '¿Qué tocan?']); eq(parse(' "¿Sin cierre y larga pregunta?"'), ['¿Sin cierre y larga pregunta?']);
});

console.log(`\n${ok} ok, ${fallos} fallos`);
if (fallos) process.exit(1);
