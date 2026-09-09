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
  const seg = [['citas','Citas'],['analisis','Análisis'],['ecos','Ecografías'],['sintomas','Síntomas']].map(([k,l]) => `<button class="${sub===k?'on':''}" onclick="subSalud('${k}')">${l}</button>`).join('');
  const body = { citas: renderCitas, analisis: renderAnalisis, ecos: renderEcos, sintomas: renderSintomas }[sub]();
  const fabs = { citas: `openCita()`, analisis: `openAnalisis()`, ecos: `openEco()`, sintomas: yo() === 'mother' ? `openSintomas()` : null };
  return `${topbar('Salud')}<h1 class="h-page">Salud</h1><p class="sub">Todo lo médico, claro y en un solo lugar.</p><div class="seg">${seg}</div>${body}${disclaimer()}
    ${fabs[sub] ? `<button class="fab" onclick="${fabs[sub]}" aria-label="Añadir">${I.plus}</button>` : ''}`;
}
function subSalud(k){ L.sub.salud = k; saveLocal(); render(); }
function rowCita(a){
  const d = pd(a.date);
  return `<div class="row clickable" onclick="openCita('${a.id}')"><div class="ic date"><b class="num">${d.getDate()}</b><small>${fmt(d,{month:'short'}).replace('.','')}</small></div>
    <div class="body"><h4>${esc(a.title)}</h4><p>${[fmtTime(a.date), a.doctor, a.clinic].filter(Boolean).map(esc).join(' · ')}</p></div>
    <div class="tail">${a.done ? '<span class="chip sage">Hecha</span>' : `<span class="chip plum num">${relDias(diffDays(d, today()))}</span>`}</div></div>`;
}
function renderCitas(){
  const t = today();
  const prox = S.appointments.filter(a => !a.done && pd(a.date) >= t).sort((a,b) => a.date.localeCompare(b.date));
  const ant = S.appointments.filter(a => a.done || pd(a.date) < t).sort((a,b) => b.date.localeCompare(a.date));
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
    <div class="section"><div class="card soft"><span class="eyebrow">Cuándo consultar sin esperar</span><p class="sub" style="margin-top:6px">Sangrado abundante, dolor abdominal intenso o en un solo lado, desmayo, dolor de cabeza fuerte con alteraciones de la visión, dificultad para respirar o fiebre alta. Ante cualquiera de estas señales, contacta con tu equipo médico o llama al ${esc(pais().emergencias)}.</p></div></div>`;
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
  const body = msgs.length ? msgs.map(m => m.role === 'user' ? `<div class="msg user">${esc(m.content)}</div>` : `${m.urgent ? urgentBox(m.urgent) : ''}<div class="msg ai">${esc(m.content)}<span class="disc">Orientación general para ${semanaTxt(P.days).toLowerCase()}. No sustituye el consejo de tu equipo médico.</span></div>`).join('')
    : `<div class="card accent"><span class="eyebrow">Asistente</span><h3>Conoce este embarazo</h3><p class="sub">Sé que están en la ${semanaTxt(P.days).toLowerCase()}, la fecha probable de parto, las citas y los resultados que han guardado. Pregunta con contexto, sin tener que explicarlo todo. Esta conversación es solo tuya: tu pareja no la ve.</p></div>`;
  return `${topbar('Preguntar')}
    <h1 class="h-page">Preguntar</h1><p class="sub" style="margin-bottom:12px">Respuestas calmadas y con contexto. ${sampleFn ? '' : (window.claude?.use ? 'Conectando…' : 'En esta vista, respuestas de orientación general.')}</p>
    <div class="suggest">${sug.map(s => `<button onclick="preguntar('${esc(s).replace(/'/g,"\\'")}')">${esc(s)}</button>`).join('')}</div>
    <div class="chat" id="chat">${body}</div>
    ${chatMsgs().length ? `<div style="text-align:center;margin-top:16px"><button class="link" style="color:var(--ink3)" onclick="borrarChat()">Borrar conversación</button></div>` : ''}
    <div class="composer"><form onsubmit="event.preventDefault(); preguntar(this.q.value); this.q.value='';"><input name="q" placeholder="Escribe tu pregunta…" autocomplete="off" aria-label="Tu pregunta"><button type="submit" aria-label="Enviar">${I.send}</button></form></div>`;
}
function urgentBox(l){ return `<div class="alert-urgent"><strong>Esto puede necesitar atención ahora</strong>Mencionas ${esc(l)}. No esperes a la próxima cita: contacta con tu equipo médico o acude a urgencias. Si es grave, llama al <span class="tel">${esc(pais().emergencias)}</span>.</div>`; }
function borrarChat(){ chatMsgs().length = 0; chatPersist(); render(); }
function preguntarCon(q){ L.tab = 'preguntar'; saveLocal(); render(); setTimeout(() => preguntar(q), 50); }

function contextoIA(){
  const P = preg(), p = S.pregnancy, t = today(), me = yo();
  const citas = S.appointments.filter(a => !a.done && pd(a.date) >= t).slice(0,3).map(a => `${a.title} el ${fmtShort(a.date)} (${[a.doctor,a.clinic].filter(Boolean).join(', ')})${a.questions?.length ? ' · preguntas ya anotadas: ' + a.questions.join('; ') : ''}`);
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
- Pruebas pendientes: ${pendTests.join(' | ') || 'ninguna'}.
- Resultados guardados: ${res.join(' | ') || 'ninguno'}.
- Ecografías: ${ecos.join(' | ') || 'ninguna'}.
- Síntomas recientes: ${sint.join(' | ') || 'sin registros'}.
- Hitos completados: ${hitos.join(', ') || 'ninguno'}.`;
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
