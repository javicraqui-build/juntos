// ====== HOJAS (modales) ======
function openSheet(html){
  closeSheet();
  const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  o.addEventListener('click', e => { if (e.target === o) closeSheet(); });
  document.body.appendChild(o); document.body.style.overflow = 'hidden'; if (typeof hydrateFotos === 'function') hydrateFotos(o);
  swipeToClose(o.firstElementChild);
}
// Deslizar hacia abajo para cerrar: desde el asa siempre; desde el contenido solo si la hoja está arriba del todo.
function swipeToClose(sheet){
  let y0 = null, dy = 0, t0 = 0, activo = false;
  sheet.addEventListener('touchstart', e => {
    const t = e.target; if (['INPUT','TEXTAREA','SELECT'].includes(t.tagName)) return;
    if (sheet.scrollTop > 0 && !t.classList.contains('grab')) return;
    y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; activo = false;
  }, { passive:true });
  sheet.addEventListener('touchmove', e => {
    if (y0 == null) return; dy = e.touches[0].clientY - y0;
    if (dy < 0) { if (!activo) y0 = null; return; }
    if (!activo && dy > 8) { activo = true; sheet.classList.add('dragging'); }
    if (activo) { sheet.style.transform = `translateY(${dy}px)`; if (e.cancelable) e.preventDefault(); }
  }, { passive:false });
  const fin = () => {
    if (y0 == null) return;
    const rapido = dy / Math.max(1, Date.now() - t0) > 0.5;
    sheet.classList.remove('dragging');
    if (activo && (dy > 110 || (rapido && dy > 30))) { sheet.style.transform = `translateY(${sheet.offsetHeight}px)`; setTimeout(closeSheet, 180); }
    else sheet.style.transform = '';
    y0 = null; activo = false;
  };
  sheet.addEventListener('touchend', fin); sheet.addEventListener('touchcancel', fin);
}
function closeSheet(){ document.querySelectorAll('.overlay').forEach(o => o.remove()); document.body.style.overflow = ''; if (typeof PENDING_RENDER !== 'undefined' && PENDING_RENDER) { PENDING_RENDER = false; render(); } }
function getOrNew(list, id){ let x = id ? list.find(t => t.id === id) : null; if (!x) { x = { id: id || uid() }; list.push(x); } return x; }
function fd(form){ const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; }
function fld(label, name, type, val, extra){ return `<div class="field"><label>${label}</label><input name="${name}" type="${type||'text'}" value="${esc(val||'')}" ${extra||''}></div>`; }
function txt(label, name, val, ph){ return `<div class="field"><label>${label}</label><textarea name="${name}" placeholder="${esc(ph||'')}">${esc(val||'')}</textarea></div>`; }
function sel(label, name, opts, val){ return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(([k,l]) => `<option value="${k}" ${k===val?'selected':''}>${l}</option>`).join('')}</select></div>`; }
function esDoc(v){ return !!v && /\.pdf(\?|$)/i.test(v); }
function docLink(v, label){ return `<a class="doc" href="${fotoSrc(v)}" data-foto="${esc(v)}" target="_blank" rel="noopener">${I.doc} ${label || 'Ver documento'}</a>`; }
function photoField(name, val, docs){
  const doc = esDoc(val);
  return `<div class="field"><label>${docs ? 'Foto o documento' : 'Foto'}</label><div class="photo-in">${doc ? docLink(val, 'PDF guardado') : `<img id="prev-${name}" src="${fotoSrc(val||'')}" data-foto="${esc(val||'')}" alt="" ${val?'':'hidden'}>`}<input type="file" accept="${docs ? 'image/*,application/pdf' : 'image/*'}" onchange="loadPhoto(this,'${name}')" style="flex:1"><input type="hidden" name="${name}" value="${esc(val||'')}"></div><p class="hint">${docs ? 'Una foto o un PDF (por ejemplo, el informe del laboratorio).' : 'Se guarda en tamaño reducido para que la sincronización sea rápida.'}</p></div>`;
}
function loadPhoto(input, name){
  const f = input.files?.[0]; if (!f) return;
  const img = new Image(); const url = URL.createObjectURL(f);
  img.onload = () => { const max = 640, r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width*r); c.height = Math.round(img.height*r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); const data = c.toDataURL('image/jpeg', .72); const h = input.parentElement.querySelector(`input[name="${name}"]`); h.value = data; const p = $('#prev-'+name); p.src = data; p.hidden = false; URL.revokeObjectURL(url); };
  img.src = url;
}
function delBtn(fn){ return `<button type="button" class="btn danger" onclick="${fn}">Eliminar</button>`; }
function actions(saveLabel, delFn){ return `<div class="actions">${delFn ? delBtn(delFn) : `<button type="button" class="btn ghost" onclick="closeSheet()">Cancelar</button>`}<button type="submit" class="btn">${saveLabel||'Guardar'}</button></div>`; }

// --- Citas ---
function openCita(id, pre){
  const a = S.appointments.find(x => x.id === id) || Object.assign({ title:'', doctor:'', specialty:'', clinic:'', location:'', date: iso(addDays(today(), 7)) + 'T10:00', notes:'', questions:[], done:false, milestone:'' }, pre ? { title: pre.title || '', date: (pre.date || iso(addDays(today(), 7))) + 'T10:00', milestone: pre.milestone || '' } : {});
  openSheet(`<h2>${id ? 'Cita' : 'Nueva cita'}</h2><p class="sub">${id ? cap(fmtLong(a.date)) + (fmtTime(a.date) ? ' · ' + fmtTime(a.date) : '') + ' · ' + semanaTxt(Math.max(0,gaOf(a.date))) + (citaPasada(a) ? ' · <span class="chip sage" style="padding:2px 8px">ya fue</span>' : '') : 'Guarda la cita con las preguntas que quieran hacer. Pasa a "anteriores" sola cuando llegue la fecha y hora.'}</p>
    <form onsubmit="event.preventDefault(); saveCita('${id||''}', this)">
      ${fld('Título', 'title', 'text', a.title, 'required placeholder="Ecografía del primer trimestre"')}
      <div class="field-row">${fld('Fecha', 'date', 'date', a.date.slice(0,10), 'required')}${fld('Hora', 'time', 'time', a.date.slice(11,16))}</div>
      <div class="field-row">${fld('Médico/a', 'doctor', 'text', a.doctor)}${fld('Especialidad', 'specialty', 'text', a.specialty)}</div>
      <div class="field-row">${fld('Clínica', 'clinic', 'text', a.clinic)}${fld('Ubicación', 'location', 'text', a.location)}</div>
      ${txt('Preguntas para hacer (una por línea)', 'questions', (a.questions||[]).join('\n'), '¿Se confirma la fecha probable de parto?')}
      ${txt(citaPasada(a) ? 'Qué nos dijeron' : 'Notas', 'notes', a.notes, 'Qué nos dijeron, qué toca después…')}
      ${sel('Hito de la evolución que cubre esta cita', 'milestone', [['','Ninguno'], ...HITOS_BASE.filter(h => ['consulta1','eco1','nipt','eco12','eco20','intrauterino','latido','sexo'].includes(h.key)).map(h => [h.key, h.title])], a.milestone || '')}
      ${actions('Guardar', id ? `delCita('${id}')` : null)}
    </form>`);
}
function saveCita(id, form){ const f = fd(form); const a = getOrNew(S.appointments, id); Object.assign(a, { title:f.title, doctor:f.doctor, specialty:f.specialty, clinic:f.clinic, location:f.location, date: f.date + 'T' + (f.time || '09:00'), questions: f.questions.split('\n').map(s => s.trim()).filter(Boolean), notes:f.notes, milestone: f.milestone || '' }); delete a.done; if (a.milestone) { S.milestones[a.milestone] = Object.assign(S.milestones[a.milestone] || {}, { done: citaPasada(a), date: f.date }); } closeSheet(); commit(); toast(id ? 'Cita actualizada' : 'Cita guardada'); }
function delCita(id){ S.appointments = S.appointments.filter(x => x.id !== id); closeSheet(); commit(); }

// --- Análisis ---
function openAnalisis(id){
  const x = S.tests.find(t => t.id === id) || { name:'', kind:'sangre', date: iso(today()), result:'', status:'pendiente', interpretation:'', doctorNotes:'', photo:'' };
  const [l, cls] = STATUS[x.status] || STATUS.pendiente;
  openSheet(`<h2>${id ? esc(x.name) : 'Nuevo análisis'}</h2><p class="sub">${id ? `<span class="chip ${cls}">${l}</span> ${x.date ? cap(fmtShort(x.date)) + ' · ' + semanaTxt(Math.max(0,gaOf(x.date))) : ''}` : 'Guarda el resultado con una explicación sencilla.'}</p>
    ${id && x.interpretation ? `<div class="card accent" style="margin-bottom:16px"><span class="eyebrow">Qué significa</span><p class="sub" style="margin-top:4px">${esc(x.interpretation)}</p></div>` : ''}
    ${id && x.photo ? `<div style="margin-bottom:14px">${esDoc(x.photo) ? docLink(x.photo, 'Ver el informe (PDF)') : `<img src="${fotoSrc(x.photo)}" data-foto="${esc(x.photo)}" alt="Resultado" style="border-radius:16px;max-height:220px;object-fit:cover">`}</div>` : ''}
    <form onsubmit="event.preventDefault(); saveAnalisis('${id||''}', this)">
      ${fld('Nombre', 'name', 'text', x.name, 'required placeholder="Beta hCG, NIPT, glucosa…"')}
      <div class="field-row">${sel('Tipo', 'kind', Object.entries(KINDS), x.kind)}${fld('Fecha', 'date', 'date', x.date)}</div>
      ${fld('Resultado', 'result', 'text', x.result, 'placeholder="Valor o resumen"')}
      ${sel('Estado', 'status', Object.entries(STATUS).map(([k,v]) => [k, v[0]]), x.status)}
      ${txt('Interpretación sencilla', 'interpretation', x.interpretation, 'Qué mide y qué significa, en palabras simples')}
      ${txt('Notas del médico', 'doctorNotes', x.doctorNotes)}
      ${photoField('photo', x.photo, true)}
      ${actions('Guardar', id ? `delAnalisis('${id}')` : null)}
    </form>${disclaimer()}`);
}
function saveAnalisis(id, form){ const f = fd(form); const x = getOrNew(S.tests, id); Object.assign(x, f); closeSheet(); commit(); toast('Guardado'); }
function delAnalisis(id){ quitarFoto(S.tests.find(x => x.id === id)?.photo); S.tests = S.tests.filter(x => x.id !== id); closeSheet(); commit(); }

// --- Ecografías ---
function openEco(id){
  const e = S.ultrasounds.find(t => t.id === id) || { date: iso(today()), crl:'', fhr:'', comments:'', doctor:'', clinic:'', photo:'' };
  openSheet(`<h2>${id ? 'Ecografía · ' + semanaTxt(Math.max(0,gaOf(e.date))) : 'Nueva ecografía'}</h2><p class="sub">${id ? cap(fmtLong(e.date)) : 'Un momento importante. Guarda la imagen y lo que les dijeron.'}</p>
    ${id && e.photo ? (esDoc(e.photo) ? `<div style="margin-bottom:14px">${docLink(e.photo, 'Ver el informe (PDF)')}</div>` : `<img src="${fotoSrc(e.photo)}" data-foto="${esc(e.photo)}" alt="Ecografía" style="border-radius:16px;margin-bottom:14px">`) : ''}
    ${id ? `<div class="kv">${e.crl ? `<div><small>CRL</small><b class="num">${esc(e.crl)} mm</b></div>` : ''}${e.fhr ? `<div><small>Frecuencia cardíaca</small><b class="num">${esc(e.fhr)} lpm</b></div>` : ''}</div>` : ''}
    <form onsubmit="event.preventDefault(); saveEco('${id||''}', this)">
      ${fld('Fecha', 'date', 'date', e.date, 'required')}
      <div class="field-row">${fld('CRL (mm)', 'crl', 'number', e.crl, 'step="0.1" inputmode="decimal"')}${fld('Frecuencia cardíaca (lpm)', 'fhr', 'number', e.fhr, 'inputmode="numeric"')}</div>
      <div class="field-row">${fld('Médico/a', 'doctor', 'text', e.doctor)}${fld('Clínica', 'clinic', 'text', e.clinic)}</div>
      ${txt('Comentarios', 'comments', e.comments, 'Qué vieron, qué midieron, qué les dijeron')}
      ${photoField('photo', e.photo, true)}
      ${actions('Guardar', id ? `delEco('${id}')` : null)}
    </form>
    ${id ? `<div class="card soft" style="margin-top:14px"><span class="eyebrow">Fecha probable de parto</span><p class="sub" style="margin:4px 0 10px">Si en esta ecografía ajustaron la fecha, actualízala y se recalculan todos los hitos.</p><button class="btn ghost sm" onclick="openFPP()">Actualizar la fecha probable de parto</button></div>` : ''}`);
}
function saveEco(id, form){ const f = fd(form); const e = getOrNew(S.ultrasounds, id); Object.assign(e, f); if (!S.milestones.eco1?.done && S.ultrasounds.length === 1) { S.milestones.eco1 = { done:true, date:e.date }; if (e.fhr) S.milestones.latido = { done:true, date:e.date }; S.milestones.intrauterino = { done:true, date:e.date }; } closeSheet(); commit(); toast('Ecografía guardada'); }
function delEco(id){ quitarFoto(S.ultrasounds.find(x => x.id === id)?.photo); S.ultrasounds = S.ultrasounds.filter(x => x.id !== id); closeSheet(); commit(); }
function openFPP(){
  const P = preg();
  openSheet(`<h2>Fecha probable de parto</h2><p class="sub">Ahora mismo: ${cap(fmtLong(P.edd))}${S.pregnancy.eddOverride ? ' (ajustada por ecografía)' : ' (calculada por la última menstruación)'}.</p>
    <form onsubmit="event.preventDefault(); saveFPP(this)">${fld('Nueva fecha según la ecografía', 'edd', 'date', iso(P.edd), 'required')}
    <p class="hint" style="font-size:13px;color:var(--ink3)">La semana de embarazo y las fechas de los hitos futuros se recalculan. Los hitos ya vividos conservan su fecha.</p>
    <div class="actions">${S.pregnancy.eddOverride ? `<button type="button" class="btn ghost" onclick="S.pregnancy.eddOverride=null; closeSheet(); commit(); toast('Vuelve a calcularse por la última menstruación')">Volver a la FUM</button>` : `<button type="button" class="btn ghost" onclick="closeSheet()">Cancelar</button>`}<button type="submit" class="btn">Actualizar</button></div></form>`);
}
function saveFPP(form){ const f = fd(form); S.pregnancy.eddOverride = f.edd; closeSheet(); commit(); toast('Fecha actualizada y hitos recalculados'); }

// --- Síntomas ---
function openSintomas(dia){
  const t = dia || iso(today()); const esHoy = t === iso(today()); const s = S.symptoms.find(x => x.date === t) || { date:t, values:{}, note:'' };
  if (yo() !== 'mother') { openSheet(`<h2>Síntomas</h2><p class="sub">El registro de síntomas lo lleva ${esc(quien('mother'))}: es su cuerpo y su voz. Tú puedes leerlo para saber cómo está y llevarlo a la próxima cita.</p><div class="actions"><button class="btn ghost" onclick="closeSheet()">Cerrar</button></div>`); return; }
  openSheet(`<h2>${esHoy ? '¿Cómo te sientes hoy?' : `¿Cómo te sentiste el ${fmtShort(t)}?`}</h2><p class="sub">Marca solo lo que notes. Nada es obligatorio.</p>
    <div class="field"><label>Día</label><input type="date" value="${t}" max="${iso(today())}" onchange="openSintomas(this.value)"></div>
    <form onsubmit="event.preventDefault(); saveSintomas(this, '${t}')">
      <div class="card" style="padding:4px 16px;margin-bottom:14px">${SINTOMAS.map(x => `<div class="sym"><label>${x.l}</label><div class="scale" data-k="${x.k}">${ESCALA.map((l,i) => `<button type="button" class="${(s.values[x.k]||0)===i?'on l'+i:''}" onclick="pickScale(this,${i})" aria-label="${l}">${i===0?'—':l.slice(0,3)}</button>`).join('')}<input type="hidden" name="${x.k}" value="${s.values[x.k]||0}"></div></div>`).join('')}</div>
      ${txt('Otros / notas', 'note', s.note, 'Algo más que quieras recordar o contar en la próxima cita')}
      ${actions('Guardar', s.id ? `delSintomas('${s.id}')` : null)}
    </form>
    <p class="disclaimer">Este registro es para ti y para tu equipo médico. Si algo te preocupa o empeora, consulta sin esperar.</p>`);
}
function delSintomas(id){ S.symptoms = S.symptoms.filter(x => x.id !== id); closeSheet(); commit(); }
function pickScale(btn, i){ const sc = btn.parentElement; sc.querySelectorAll('button').forEach(b => b.className = ''); btn.className = 'on l' + i; sc.querySelector('input').value = i; }
function saveSintomas(form, dia){ const f = fd(form); const t = dia || iso(today()); let s = S.symptoms.find(x => x.date === t); if (!s) { s = { id: uid(), date:t, values:{}, note:'' }; S.symptoms.push(s); } SINTOMAS.forEach(x => s.values[x.k] = Number(f[x.k]||0)); s.note = f.note; closeSheet(); commit(); toast('Registrado'); }

// --- Hitos (evolución) ---
function openHito(id){
  const h = timeline().find(x => x.id === id); if (!h) return;
  const cita = h.citaId ? S.appointments.find(a => a.id === h.citaId) : null;
  openSheet(`<h2>${esc(h.title)}</h2><p class="sub">${cap(fmtLong(h.date))} · ${semanaTxt(Math.max(0,h.ga))}${h.estimated && !h.done ? ' · <span class="chip warm" style="padding:2px 8px">fecha estimada</span>' : ''}</p>
    <p class="sub" style="margin-bottom:14px">${esc(h.desc)}</p>
    ${h.porConfirmar ? `<div class="card soft" style="margin-bottom:14px"><span class="eyebrow">Fecha estimada ya pasada</span><p class="sub" style="margin:4px 0 10px">Nadie lo ha confirmado todavía. Si ya pasó, marca la fecha real y guárdalo como vivido; si no aplica a su embarazo, quítalo abajo.</p><button class="btn soft sm" onclick="confirmarHito('${id}')">Sí, ya pasó ese día</button></div>` : ''}
    ${cita ? `<div class="card accent" style="margin-bottom:14px"><span class="eyebrow">Cita vinculada</span><p class="sub" style="margin-top:4px">${esc(cita.title)} · ${cap(fmtLong(cita.date))}${fmtTime(cita.date) ? ' · ' + fmtTime(cita.date) : ''}${cita.clinic ? ' · ' + esc(cita.clinic) : ''}</p><button class="btn ghost sm" style="margin-top:10px" onclick="closeSheet(); openCita('${cita.id}')">Editar la cita</button></div>` : ''}
    <form onsubmit="event.preventDefault(); saveHito('${id}', ${h.custom}, this)">
      ${h.custom ? fld('Título', 'title', 'text', h.title, 'required') : ''}
      <div class="field-row">${fld(cita ? 'Fecha (la de la cita)' : 'Fecha', 'date', 'date', iso(h.date), cita ? 'required disabled' : 'required')}${sel('Estado', 'done', [['1','Vivido'],['0','Por venir']], h.done ? '1' : '0')}</div>
      ${txt('Notas', 'note', h.note, 'Cómo fue, qué sentimos, qué nos dijeron')}
      ${photoField('photo', h.photo)}
      ${actions('Guardar', h.custom ? `delHito('${id}')` : null)}
    </form>
    ${!cita && !h.custom && !h.done ? `<div style="margin-top:10px"><button class="btn soft sm block" onclick="closeSheet(); openCita(null, { milestone:'${id}', title:'${esc(h.title).replace(/'/g,"\\'")}', date: iso(pd('${iso(h.date)}')) })">Crear la cita con fecha y hora reales</button></div>` : ''}
    ${h.done ? `<div style="margin-top:10px"><button class="btn ghost sm block" onclick="closeSheet(); openRecuerdo(null, '${esc(h.title).replace(/'/g,"\\'")}', '${iso(h.date)}')">Guardar también como recuerdo</button></div>` : ''}
    ${!h.custom ? `<div style="margin-top:10px;text-align:center"><button class="link" style="color:var(--ink3)" onclick="ocultarHito('${id}')">Este hito no aplica a nuestro embarazo · quitar</button></div>` : ''}`);
}
function confirmarHito(id){ const h = timeline().find(x => x.id === id); if (!h) return; S.milestones[id] = Object.assign(S.milestones[id] || {}, { done:true, date: iso(h.date) }); closeSheet(); commit(); toast('Hito confirmado'); }
function ocultarHito(id){ if (!confirm('¿Quitar este hito de la línea de tiempo? Puedes volver a mostrarlo desde tu perfil.')) return; S.milestones[id] = Object.assign(S.milestones[id] || {}, { hidden:true }); closeSheet(); commit(); toast('Hito quitado'); }
function restaurarHitos(){ Object.values(S.milestones).forEach(m => { if (m) delete m.hidden; }); closeSheet(); commit(); toast('Hitos restaurados'); }
function saveHito(id, custom, form){ const f = fd(form); if (custom) { const c = getOrNew(S.customMilestones, id); Object.assign(c, { title:f.title, date:f.date, done: f.done === '1', note:f.note, photo:f.photo }); } else { const prev = S.milestones[id] || {}; S.milestones[id] = { date: f.date || prev.date || null, done: f.done === '1', note:f.note, photo:f.photo }; } closeSheet(); commit(); toast('Guardado'); }
function delHito(id){ quitarFoto(S.customMilestones.find(x => x.id === id)?.photo); S.customMilestones = S.customMilestones.filter(x => x.id !== id); closeSheet(); commit(); }
function openHitoNuevo(){
  openSheet(`<h2>Nuevo hito</h2><p class="sub">Los momentos que solo son suyos.</p>
    <div class="pillrow" style="margin-bottom:14px">${HITOS_SUGERIDOS.map(s => `<button type="button" onclick="document.querySelector('[name=title]').value='${esc(s).replace(/'/g,"\\'")}'">${esc(s)}</button>`).join('')}</div>
    <form onsubmit="event.preventDefault(); saveHitoNuevo(this)">
      ${fld('Título', 'title', 'text', '', 'required placeholder="Se lo contamos a los abuelos"')}
      ${fld('Fecha', 'date', 'date', iso(today()), 'required')}
      ${txt('Notas', 'note', '', 'Cómo fue')}
      ${photoField('photo', '')}
      ${actions('Añadir')}
    </form>`);
}
function saveHitoNuevo(form){ const f = fd(form); S.customMilestones.push({ id: uid(), title:f.title, date:f.date, done: pd(f.date) <= today(), note:f.note, photo:f.photo, desc:'' }); closeSheet(); commit(); toast('Hito añadido'); }

// --- Recuerdos ---
function openRecuerdo(id, title, date){
  const m = S.memories.find(x => x.id === id) || { title: title || '', text:'', date: date || iso(today()), author: yo(), photo:'', audio:false };
  openSheet(`<h2>${id ? 'Recuerdo' : 'Nuevo recuerdo'}</h2><p class="sub">${id ? `${esc(quien(m.author))} · ${cap(fmtLong(m.date))} · ${semanaTxt(Math.max(0,gaOf(m.date)))}` : 'Lo que quieran recordar dentro de veinte años.'}</p>
    ${!id ? `<div class="pillrow" style="margin-bottom:14px">${['El día que nos enteramos','Primera ecografía','Escuchamos el corazón','Se lo contamos a la familia','Elegimos el nombre','Primera patada','Primer regalo','Preparando la habitación'].map(s => `<button type="button" onclick="document.querySelector('[name=title]').value='${s}'">${s}</button>`).join('')}</div>` : ''}
    <form onsubmit="event.preventDefault(); saveRecuerdo('${id||''}', this)">
      ${fld('Título', 'title', 'text', m.title, 'required')}
      <div class="field-row">${fld('Fecha', 'date', 'date', m.date, 'required')}${sel('Quién lo cuenta', 'author', [['mother', quien('mother')],['partner', quien('partner')]], m.author)}</div>
      ${txt('Texto', 'text', m.text, 'Qué pasó, qué sentimos, qué dijo cada uno')}
      ${photoField('photo', m.photo)}
      ${sel('Audio', 'audio', [['0','Sin audio'],['1','Grabación guardada (próximamente en el móvil)']], m.audio ? '1' : '0')}
      ${actions('Guardar', id ? `delRecuerdo('${id}')` : null)}
    </form>`);
}
function saveRecuerdo(id, form){ const f = fd(form); const m = getOrNew(S.memories, id); Object.assign(m, { title:f.title, date:f.date, author:f.author, text:f.text, photo:f.photo, audio: f.audio === '1' }); closeSheet(); commit(); toast('Recuerdo guardado'); }
function delRecuerdo(id){ quitarFoto(S.memories.find(x => x.id === id)?.photo); S.memories = S.memories.filter(x => x.id !== id); closeSheet(); commit(); }

// --- Nombres ---
function openNombre(id){
  const n = S.names.find(x => x.id === id) || { name:'', meaning:'', origin:'', notes:'', addedBy: yo(), votes:{} };
  openSheet(`<h2>${id ? esc(n.name) : 'Nuevo nombre'}</h2><p class="sub">${id ? `Añadido por ${esc(quien(n.addedBy))}` : 'Cada uno vota después por su cuenta.'}</p>
    ${id ? `<div class="kv"><div><small>${esc(quien('mother'))}</small><b>${({like:'Le gusta',fav:'Favorito',no:'Descartado'})[n.votes?.mother] || 'Sin votar'}</b></div><div><small>${esc(quien('partner'))}</small><b>${({like:'Le gusta',fav:'Favorito',no:'Descartado'})[n.votes?.partner] || 'Sin votar'}</b></div></div>` : ''}
    <form onsubmit="event.preventDefault(); saveNombre('${id||''}', this)">
      ${fld('Nombre', 'name', 'text', n.name, 'required')}
      <div class="field-row">${fld('Origen', 'origin', 'text', n.origin)}${fld('Significado', 'meaning', 'text', n.meaning)}</div>
      ${txt('Notas', 'notes', n.notes, 'Por qué nos gusta, a quién recuerda…')}
      ${actions('Guardar', id ? `delNombre('${id}')` : null)}
    </form>`);
}
function saveNombre(id, form){ const f = fd(form); const n = getOrNew(S.names, id); if (!n.votes) { n.addedBy = yo(); n.votes = { [yo()]: 'like' }; } Object.assign(n, { name:f.name, origin:f.origin, meaning:f.meaning, notes:f.notes }); closeSheet(); commit(); toast('Nombre guardado'); }
function delNombre(id){ S.names = S.names.filter(x => x.id !== id); closeSheet(); commit(); }

// --- Familia ---
function openFamiliar(id){
  const f0 = S.family.find(x => x.id === id) || { group:'abuelos', name:'', knows:false, date:'', how:'', reaction:'' };
  openSheet(`<h2>${id ? esc(f0.name) : 'Nueva persona o grupo'}</h2><p class="sub">${id ? (f0.knows ? 'Ya lo sabe.' : 'Todavía no lo sabe.') : 'Quién queremos que lo sepa, y cuándo.'}</p>
    <form onsubmit="event.preventDefault(); saveFamiliar('${id||''}', this)">
      ${fld('Nombre', 'name', 'text', f0.name, 'required placeholder="Padres de…, hermana, primos de…"')}
      ${sel('Grupo', 'group', GRUPOS.map(g => [g, cap(g)]), f0.group)}
      ${sel('¿Ya lo sabe?', 'knows', [['0','Todavía no'],['1','Sí, ya lo sabe']], f0.knows ? '1' : '0')}
      <div class="field-row">${fld('Cuándo se lo contamos', 'date', 'date', f0.date)}${fld('Cómo', 'how', 'text', f0.how, 'placeholder="Con la eco, en una cena…"')}</div>
      ${txt('Reacción', 'reaction', f0.reaction, 'Qué dijo, qué hizo')}
      ${actions('Guardar', id ? `delFamiliar('${id}')` : null)}
    </form>`);
}
function saveFamiliar(id, form){ const f = fd(form); const x = getOrNew(S.family, id); Object.assign(x, { name:f.name, group:f.group, knows: f.knows === '1', date:f.date, how:f.how, reaction:f.reaction }); closeSheet(); commit(); toast('Guardado'); }
function delFamiliar(id){ S.family = S.family.filter(x => x.id !== id); closeSheet(); commit(); }

// --- Tareas ---
function openTarea(id){
  const x = S.tasks.find(t => t.id === id) || { title:'', owner: yo(), due:'', status:'pendiente', notes:'' };
  openSheet(`<h2>${id ? 'Tarea' : 'Nueva tarea'}</h2><p class="sub">Los dos son responsables. Aquí solo se reparte quién la lleva.</p>
    ${!id ? `<div class="pillrow" style="margin-bottom:14px">${['Pedir cita para la primera ecografía','Reservar el NIPT','Investigar maternidades','Revisar cobertura médica','Revisar licencia parental','Elegir cochecito','Preparar habitación','Preparar bolso del hospital'].map(s => `<button type="button" onclick="document.querySelector('[name=title]').value='${s}'">${s}</button>`).join('')}</div>` : ''}
    <form onsubmit="event.preventDefault(); saveTarea('${id||''}', this)">
      ${fld('Título', 'title', 'text', x.title, 'required')}
      <div class="field-row">${sel('Responsable', 'owner', [['mother', quien('mother')],['partner', quien('partner')],['both','Los dos']], x.owner)}${fld('Fecha límite', 'due', 'date', x.due)}</div>
      ${sel('Estado', 'status', [['pendiente','Pendiente'],['en_curso','En curso'],['hecha','Hecha']], x.status)}
      ${txt('Notas', 'notes', x.notes)}
      ${actions('Guardar', id ? `delTarea('${id}')` : null)}
    </form>`);
}
function saveTarea(id, form){ const f = fd(form); const x = getOrNew(S.tasks, id); Object.assign(x, f); closeSheet(); commit(); toast('Tarea guardada'); }
function delTarea(id){ S.tasks = S.tasks.filter(x => x.id !== id); closeSheet(); commit(); }

// --- Notificaciones ---
function openNotifs(){
  const n = notificaciones(); L.seen = notifFirma(n); saveLocal(); const b = document.querySelector('.topbar .dot'); if (b) b.remove();
  openSheet(`<h2>Notificaciones</h2><p class="sub">Solo lo que importa esta semana.</p><div class="card" style="padding:4px 18px">${n.map(x => `<div class="notif"><div class="ic">${x.ic}</div><div><p>${esc(x.txt)}</p><small>${esc(x.sub||'')}</small></div></div>`).join('')}</div>
    <p class="disclaimer">Las notificaciones se calculan con la semana de embarazo, las citas y los hitos guardados. Pocas y útiles, sin ruido.</p>`);
}

// --- Perfil / ajustes ---
function openPerfil(){
  const p = S.pregnancy, P = preg();
  openSheet(`<h2>${esc(quien('mother'))} y ${esc(quien('partner'))}</h2><p class="sub">Estás usando la app como <b>${esc(quien(yo()))}</b>. <button class="link" onclick="L.role=null; saveLocal(); closeSheet(); render()">Cambiar</button></p>
    <div class="card" style="margin-bottom:14px"><span class="eyebrow">Compartir con tu pareja</span><p class="sub" style="margin-top:4px">Los dos usan el mismo espacio. Tu pareja entra con su correo y este código:</p><div class="code">${esc(p.inviteCode)}</div><div class="sync on" id="sync"><i></i><span>Sincronizado en la nube</span></div><div class="actions" style="margin-top:10px"><button class="btn ghost sm" onclick="copiarInvitacion()">Copiar invitación</button><button class="link" style="font-size:13px" onclick="openUnirse()">Tengo un código de mi pareja</button></div></div>
    <form onsubmit="event.preventDefault(); savePerfil(this)">
      <div class="field-row">${fld('Nombre de ella', 'mother', 'text', p.names?.mother)}${fld('Nombre de la pareja', 'partner', 'text', p.names?.partner)}</div>
      ${fld('Primer día de la última menstruación', 'lmp', 'date', p.lmp, 'required')}
      <div class="field-row">${fld('Edad', 'maternalAge', 'number', p.maternalAge, 'inputmode="numeric" min="14" max="60"')}${sel('País', 'country', Object.entries(PAISES).map(([k,v]) => [k, v.nombre]), p.country)}</div>
      <div class="field-row">${sel('¿Primer embarazo?', 'firstPregnancy', [['1','Sí'],['0','No']], p.firstPregnancy === false ? '0' : '1')}${sel('Tipo', 'type', [['unico','Único'],['gemelar','Gemelar'],['nose','Todavía no sabemos']], p.type)}</div>
      <p class="hint" style="font-size:13px;color:var(--ink3);margin-bottom:12px">Fecha probable de parto actual: <b class="num">${cap(fmtLong(P.edd))}</b>${p.eddOverride ? ' (ajustada por ecografía)' : ''}. <button type="button" class="link" onclick="openFPP()">Ajustar por ecografía</button></p>
      <div class="actions"><button type="button" class="btn ghost" onclick="closeSheet()">Cerrar</button><button type="submit" class="btn">Guardar</button></div>
    </form>
    ${Object.values(S.milestones).some(m => m && m.hidden) ? `<div style="margin:8px 0"><button class="link" onclick="restaurarHitos()">Volver a mostrar los hitos quitados</button></div>` : ''}
    <div class="card soft" style="margin-top:18px"><span class="eyebrow">Cuenta</span><p class="sub" style="margin-top:4px;font-size:13px">Sesión: ${esc(SESSION?.user?.email || '')}</p><div class="actions" style="margin-top:10px"><button class="btn ghost sm" onclick="logout()">Cerrar sesión</button><button class="btn ghost sm" onclick="empezarDeCero()">Salir del espacio</button></div><p class="hint" style="font-size:12px;color:var(--ink3);margin-top:8px">Salir del espacio no borra nada mientras tu pareja siga dentro.</p></div>`);
}
function savePerfil(form){ const f = fd(form); Object.assign(S.pregnancy, { lmp:f.lmp, maternalAge: f.maternalAge ? Number(f.maternalAge) : null, country:f.country, firstPregnancy: f.firstPregnancy === '1', type:f.type, names:{ mother:f.mother, partner:f.partner } }); closeSheet(); commit(); toast('Guardado'); }

// ====== ONBOARDING ======
let OB = { step:0, role:null, mode:'lmp', lmp:'', edd:'', age:'', first:'1', type:'unico', country:'ES', mother:'', partner:'', join:false, code:'' };
function ob(step){ OB.step = step; render(); window.scrollTo(0,0); }
function renderRolePick(){
  return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">Este espacio ya está creado. ¿Quién eres?</p>
    <div class="opts" style="margin-top:22px">
      <button class="opt" onclick="L.role='mother'; saveLocal(); render()"><span class="r"></span><span><b>${esc(S.pregnancy.names?.mother || 'Estoy embarazada')}</b><small>Veré primero lo que me toca a mí</small></span></button>
      <button class="opt" onclick="L.role='partner'; saveLocal(); render()"><span class="r"></span><span><b>${esc(S.pregnancy.names?.partner || 'Soy la pareja')}</b><small>Veré primero cómo acompañar y de qué ocuparme</small></span></button>
    </div><div class="grow"></div></div>`;
}
function renderOnboarding(){
  const steps = (n) => `<div class="steps">${[1,2,3,4,5].map(i => `<i class="${i<=n?'on':''}"></i>`).join('')}</div>`;
  const back = (n) => `<button class="back" onclick="ob(${n})">${I.chevL} Atrás</button>`;
  if (OB.step === 0) return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">El embarazo, juntos.</p>
    <div class="welcome-art"><i style="width:120px;height:120px;background:var(--warm);left:-20px;top:40px;opacity:.85"></i><i style="width:70px;height:70px;background:var(--accent-soft);right:60px;top:30px;opacity:.9"></i><i style="width:36px;height:36px;background:#F2DCCB;right:110px;bottom:34px"></i></div>
    <p class="sub" style="margin-bottom:22px">Seguimiento médico, organización compartida y los recuerdos de estos meses, en un solo lugar para los dos.</p>
    <button class="btn block" onclick="ob(1)">Empezar</button>
    <div style="display:flex;justify-content:space-between;margin-top:14px"><button class="link" onclick="OB.join=true; ob(6)">Tengo un código de mi pareja</button><button class="link" style="color:var(--ink3)" onclick="crearDemo()">Ver con datos de ejemplo</button></div>
    <div class="grow"></div></div>`;
  if (OB.step === 1) return `<div class="onb">${steps(1)}<h1>¿Quién eres?</h1><p class="sub">Adaptamos lo que ves primero. Los dos verán todo.</p>
    <div class="opts">${[['mother','Estoy embarazada','Veré primero cómo puedo sentirme cada semana'],['partner','Soy la pareja','Veré primero cómo acompañar y de qué ocuparme'],['both','Estamos configurando esto juntos','Elegimos después quién usa cada teléfono']].map(([k,b,s]) => `<button class="opt ${OB.role===k?'on':''}" onclick="OB.role='${k}'; render()"><span class="r"></span><span><b>${b}</b><small>${s}</small></span></button>`).join('')}</div>
    <div class="grow"></div><button class="btn block" ${OB.role?'':'disabled'} onclick="ob(2)">Continuar</button></div>`;
  if (OB.step === 2) return `<div class="onb">${steps(2)}${back(1)}<h1>¿Desde cuándo?</h1><p class="sub">Con una de las dos fechas calculamos la semana de embarazo y la fecha probable de parto.</p>
    <div class="seg"><button class="${OB.mode==='lmp'?'on':''}" onclick="OB.mode='lmp'; render()">Última menstruación</button><button class="${OB.mode==='edd'?'on':''}" onclick="OB.mode='edd'; render()">Fecha probable de parto</button></div>
    ${OB.mode === 'lmp' ? `<div class="field"><label>Primer día de la última menstruación</label><input type="date" value="${OB.lmp}" max="${iso(today())}" oninput="OB.lmp=this.value; obPreview()"></div>` : `<div class="field"><label>Fecha probable de parto</label><input type="date" value="${OB.edd}" oninput="OB.edd=this.value; obPreview()"><p class="hint">La que les dio su equipo médico.</p></div>`}
    <div id="ob-preview">${obPreviewHtml()}</div>
    <div class="grow"></div><button class="btn block" id="ob-next" ${obLmp()?'':'disabled'} onclick="ob(3)">Continuar</button></div>`;
  if (OB.step === 3) return `<div class="onb">${steps(3)}${back(2)}<h1>Sobre el embarazo</h1><p class="sub">Sirve para adaptar la información y el asistente. Puedes cambiarlo después.</p>
    <div class="field-row"><div class="field"><label>Nombre de ella</label><input value="${esc(OB.mother)}" oninput="OB.mother=this.value" placeholder="Opcional"></div><div class="field"><label>Nombre de la pareja</label><input value="${esc(OB.partner)}" oninput="OB.partner=this.value" placeholder="Opcional"></div></div>
    <div class="field"><label>Edad de la persona embarazada</label><input type="number" inputmode="numeric" min="14" max="60" value="${OB.age}" oninput="OB.age=this.value" placeholder="34"></div>
    <div class="field"><label>¿Es el primer embarazo?</label><div class="pillrow">${[['1','Sí'],['0','No']].map(([k,l]) => `<button class="${OB.first===k?'on':''}" onclick="OB.first='${k}'; render()">${l}</button>`).join('')}</div></div>
    <div class="field"><label>Tipo de embarazo</label><div class="pillrow">${[['unico','Único'],['gemelar','Gemelar'],['nose','Todavía no sabemos']].map(([k,l]) => `<button class="${OB.type===k?'on':''}" onclick="OB.type='${k}'; render()">${l}</button>`).join('')}</div></div>
    <div class="grow"></div><button class="btn block" onclick="ob(4)">Continuar</button></div>`;
  if (OB.step === 4) return `<div class="onb">${steps(4)}${back(3)}<h1>¿En qué país?</h1><p class="sub">Adaptamos la terminología, el formato de fechas y los teléfonos de emergencia.</p>
    <div class="opts">${Object.entries(PAISES).map(([k,v]) => `<button class="opt ${OB.country===k?'on':''}" onclick="OB.country='${k}'; render()"><span class="r"></span><span><b>${v.nombre}</b><small>${k==='OT' ? 'Español neutro' : `${cap(v.matrona)} · emergencias ${v.emergencias}`}</small></span></button>`).join('')}</div>
    <div class="grow"></div><button class="btn block" onclick="crearEspacio()">Crear nuestro espacio</button></div>`;
  if (OB.step === 5) return `<div class="onb">${steps(5)}<h1>Invita a tu pareja</h1><p class="sub">Los dos entran al mismo espacio: mismas citas, mismos recuerdos, mismos nombres.</p>
    <div class="card"><span class="eyebrow">Código de invitación</span><div class="code">${esc(S.pregnancy.inviteCode)}</div><p class="sub" style="font-size:14px">Envía la invitación a tu pareja: entra con su correo y usa el código. Los dos verán y editarán lo mismo.</p>
    <div class="actions"><button class="btn ghost" onclick="copiarInvitacion()">Copiar invitación</button><button class="btn" onclick="compartirInvitacion()">Compartir</button></div></div>
    <div class="grow"></div><button class="btn block" onclick="OB.step=0; render()">Ir a Hoy</button></div>`;
  if (OB.step === 6) return `<div class="onb">${back(0)}<h1>Tengo un código</h1><p class="sub">Escribe el código que te pasó tu pareja para entrar al mismo espacio.</p>
    <div class="field"><label>Código</label><input value="${esc(OB.code)}" oninput="OB.code=this.value.toUpperCase()" placeholder="ABC123" style="letter-spacing:.2em;font-size:22px;text-align:center" autocapitalize="characters"></div>
    <div class="field"><label>¿Quién eres?</label><div class="pillrow">${[['partner','Soy la pareja'],['mother','Estoy embarazada']].map(([k,l]) => `<button class="${(OB.joinRole||'partner')===k?'on':''}" onclick="OB.joinRole='${k}'; render()">${l}</button>`).join('')}</div></div>
    <div class="grow"></div><button class="btn block" onclick="unirse()">Entrar</button></div>`;
  return '';
}
function obLmp(){ if (OB.mode === 'lmp') return OB.lmp || null; if (OB.edd) return iso(addDays(pd(OB.edd), -280)); return null; }
function obPreviewHtml(){ const l = obLmp(); if (!l) return ''; const lmp = pd(l); const days = diffDays(today(), lmp); if (days < 0 || days > 310) return `<p class="sub" style="color:var(--red)">Esa fecha no cuadra con un embarazo en curso. Revísala.</p>`; const edd = addDays(lmp, 280); return `<div class="card accent"><span class="eyebrow">Ahora mismo</span><h3 style="font-size:24px">${semanaTxt(days)}</h3><p class="sub">Fecha probable de parto: ${cap(fmtLong(edd))}. ${['','Primer','Segundo','Tercer'][days<98?1:days<196?2:3]} trimestre.</p></div>`; }
function obPreview(){ const el = $('#ob-preview'); if (el) el.innerHTML = obPreviewHtml(); const b = $('#ob-next'); const l = obLmp(); const ok = l && diffDays(today(), pd(l)) >= 0 && diffDays(today(), pd(l)) <= 310; if (b) b.disabled = !ok; }
function crearEspacio(){
  const W = emptyWorkspace();
  W.pregnancy = Object.assign(W.pregnancy, { lmp: obLmp(), eddOverride: OB.mode === 'edd' ? OB.edd : null, maternalAge: OB.age ? Number(OB.age) : null, firstPregnancy: OB.first === '1', type: OB.type, country: OB.country, names:{ mother: OB.mother.trim(), partner: OB.partner.trim() } });
  W.milestones.test = { done:true, date: iso(today()) <= iso(hitoFechaFor(W, 4, 3)) ? iso(today()) : iso(hitoFechaFor(W, 4, 3)) };
  S = W; persist(); OB.step = 5; render();
}
function hitoFechaFor(W, w, d){ const edd = W.pregnancy.eddOverride ? pd(W.pregnancy.eddOverride) : addDays(pd(W.pregnancy.lmp), 280); return addDays(addDays(edd, -280), w*7+d); }
function invitacionTxt(){ return `Estamos esperando un bebé y llevamos el embarazo juntos en esta app. Entra con el código ${S.pregnancy.inviteCode}: ${location.href}`; }
async function copiarInvitacion(){ try { await navigator.clipboard.writeText(invitacionTxt()); toast('Invitación copiada'); } catch(e){ prompt('Copia la invitación:', invitacionTxt()); } }
async function compartirInvitacion(){ if (navigator.share) { try { await navigator.share({ title:'juntos', text: invitacionTxt() }); } catch(e){} } else copiarInvitacion(); }
function unirse(){
  if (S && S.pregnancy?.lmp) { if (!OB.code || OB.code === S.pregnancy.inviteCode) { L.role = null; saveLocal(); render(); return; } alert('Ese código no coincide con el espacio compartido en esta página.'); return; }
  if (dbRef) { dbRef.get().then(snap => { const d = snap.exists ? snap.data() : null; if (d && d.pregnancy && (!OB.code || OB.code === d.pregnancy.inviteCode)) { S = d; persist(); L.role = null; saveLocal(); render(); } else alert('No encontramos un espacio con ese código. Pide a tu pareja que lo revise.'); }).catch(() => alert('No se pudo conectar ahora. Inténtalo en un momento.')); }
  else alert('Todavía no hay un espacio creado en esta página. Tu pareja puede crearlo primero, o pueden configurarlo juntos.');
}

