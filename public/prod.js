// ====== PRODUCCIÓN: Supabase (auth + espacio compartido + realtime) y API de IA ======
const SB_URL = window.JUNTOS_CONFIG.supabaseUrl, SB_KEY = window.JUNTOS_CONFIG.supabaseKey;
if (typeof supabase === 'undefined') { document.getElementById('app').innerHTML = '<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">No se pudo cargar la app. Revisa la conexión y vuelve a intentarlo.</p><div class="grow"></div></div>'; throw new Error('supabase-js no cargó'); }
const sb = supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
let SESSION = null, WS = null, AUTH_READY = false, AI_OK = null, CHAN = null, MAIL_SENT = '';

// --- render con puerta de autenticación ---
function render(){
  const app = $('#app');
  if (!AUTH_READY) { app.innerHTML = `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">Cargando…</p><div class="grow"></div></div>`; return; }
  if (!SESSION) { app.innerHTML = renderLogin(); $('.tabbar')?.remove(); return; }
  if (!S || !S.pregnancy?.lmp) { app.innerHTML = renderOnboarding(); $('.tabbar')?.remove(); window.scrollTo(0,0); return; }
  if (OB.step === 5) { app.innerHTML = renderOnboarding(); $('.tabbar')?.remove(); window.scrollTo(0,0); return; }
  if (!L.role) { app.innerHTML = renderRolePick(); $('.tabbar')?.remove(); return; }
  const fn = { hoy: renderHoy, evolucion: renderEvolucion, salud: renderSalud, nosotros: renderNosotros, preguntar: renderPreguntar }[L.tab] || renderHoy;
  app.innerHTML = `<div class="screen ${L.tab==='preguntar'?'chat-screen':''}">${fn()}</div>`;
  let tb = $('.tabbar');
  if (!tb) { tb = document.createElement('div'); tb.className = 'tabbar'; document.body.appendChild(tb); }
  tb.innerHTML = `<nav>${TABS.map(([k,l,ic]) => `<button class="${L.tab===k?'on':''}" onclick="go('${k}')" aria-label="${l}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
  if (L.tab === 'preguntar') { const c = $('#chat'); if (c) window.scrollTo(0, document.body.scrollHeight); }
}

// --- login por enlace mágico ---
function renderLogin(){
  if (MAIL_SENT) return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">Revisa tu correo</p>
    <div class="card" style="margin-top:22px"><p class="sub">Te hemos enviado un enlace a <b>${esc(MAIL_SENT)}</b>. Ábrelo desde este mismo móvil y entrarás directamente.</p><p class="sub" style="margin-top:10px;font-size:13px;color:var(--ink3)">Si no llega en un par de minutos, mira en la carpeta de correo no deseado.</p></div>
    <div style="margin-top:14px"><button class="link" onclick="MAIL_SENT=''; render()">Usar otro correo</button></div><div class="grow"></div></div>`;
  const code = L.pendingCode ? `<div class="card accent" style="margin-bottom:16px"><span class="eyebrow">Invitación</span><p class="sub" style="margin-top:4px">Tienes un código para unirte al espacio de tu pareja: <b>${esc(L.pendingCode)}</b>. Entra con tu correo y te unimos.</p></div>` : '';
  return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">El embarazo, juntos.</p>
    <div class="welcome-art"><i style="width:120px;height:120px;background:var(--warm);left:-20px;top:40px;opacity:.85"></i><i style="width:70px;height:70px;background:var(--accent-soft);right:60px;top:30px;opacity:.9"></i><i style="width:36px;height:36px;background:#F2DCCB;right:110px;bottom:34px"></i></div>
    ${code}
    <form onsubmit="event.preventDefault(); login(this.email.value)">
      <div class="field"><label>Tu correo</label><input name="email" type="email" inputmode="email" autocomplete="email" required placeholder="tu@correo.com"></div>
      <button class="btn block" type="submit">Enviarme un enlace para entrar</button>
    </form>
    <p class="disclaimer">Sin contraseñas: te enviamos un enlace de acceso a tu correo. Tus datos solo los ven las dos personas del espacio.</p>
    <div class="grow"></div></div>`;
}
async function login(email){
  email = (email || '').trim(); if (!email) return;
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/' } });
  if (error) { alert('No se pudo enviar el enlace: ' + error.message); return; }
  MAIL_SENT = email; render();
}
async function logout(){ closeSheet(); await sb.auth.signOut(); SESSION = null; S = null; WS = null; L.role = null; saveLocal(); try { localStorage.removeItem('juntos.ws'); } catch(e){} render(); }

// --- carga del espacio y realtime ---
async function loadWorkspace(){
  const { data, error } = await sb.from('workspace_members').select('role, workspaces(*)').eq('user_id', SESSION.user.id).limit(1);
  if (error) { console.warn(error); }
  const row = data && data[0];
  if (row && row.workspaces) { adoptWorkspace(row.workspaces, row.role); }
  else {
    S = null; WS = null; L.role = null; saveLocal();
    if (L.pendingCode) { OB.join = true; OB.code = L.pendingCode; OB.step = 6; }
    render();
  }
}
function adoptWorkspace(w, role){
  if (Array.isArray(w)) w = w[0];
  WS = w; S = w.data; L.role = role || null; if (S?.pregnancy) S.pregnancy.inviteCode = w.invite_code; saveLocal();
  try { localStorage.setItem('juntos.ws', JSON.stringify(S)); } catch(e){}
  dbOn = true; subscribe(); render();
}
function subscribe(){
  if (CHAN) { sb.removeChannel(CHAN); CHAN = null; }
  if (!WS) return;
  CHAN = sb.channel('ws-' + WS.id).on('postgres_changes', { event:'UPDATE', schema:'public', table:'workspaces', filter:`id=eq.${WS.id}` }, p => {
    if (syncing) return; const d = p.new?.data; if (!d || !d.pregnancy) return;
    if (!S?.updatedAt || (d.updatedAt && d.updatedAt > S.updatedAt)) { S = d; S.pregnancy.inviteCode = WS.invite_code; try { localStorage.setItem('juntos.ws', JSON.stringify(S)); } catch(e){}
      if (!document.querySelector('.overlay') && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) render(); }
  }).subscribe();
}
function persist(){
  S.updatedAt = new Date().toISOString();
  try { localStorage.setItem('juntos.ws', JSON.stringify(S)); } catch(e){}
  if (WS) { syncing = true; Promise.resolve(sb.from('workspaces').update({ data: S }).eq('id', WS.id)).then(({ error }) => { if (error) { console.warn(error); toast('No se pudo guardar. Revisa la conexión.'); } }).catch(e => console.warn(e)).finally(() => { syncing = false; }); }
}

// --- onboarding: crear / unirse / rol ---
async function crearEspacio(){
  const W = emptyWorkspace();
  W.pregnancy = Object.assign(W.pregnancy, { lmp: obLmp(), eddOverride: OB.mode === 'edd' ? OB.edd : null, maternalAge: OB.age ? Number(OB.age) : null, firstPregnancy: OB.first === '1', type: OB.type, country: OB.country, names:{ mother: OB.mother.trim(), partner: OB.partner.trim() } });
  W.milestones.test = { done:true, date: iso(today()) <= iso(hitoFechaFor(W, 4, 3)) ? iso(today()) : iso(hitoFechaFor(W, 4, 3)) };
  W.updatedAt = new Date().toISOString();
  const role = OB.role === 'partner' ? 'partner' : 'mother';
  const { data, error } = await sb.rpc('create_workspace', { p_data: W, p_role: role });
  if (error) { alert('No se pudo crear el espacio: ' + error.message); return; }
  adoptWorkspace(data, OB.role === 'both' ? null : role); OB.step = 5; render();
}
async function crearDemo(){
  const W = demoWorkspace(); W.updatedAt = new Date().toISOString();
  const { data, error } = await sb.rpc('create_workspace', { p_data: W, p_role: 'mother' });
  if (error) { alert('No se pudo crear el espacio: ' + error.message); return; }
  adoptWorkspace(data, null); OB.step = 0; render();
}
async function unirse(){
  const code = (OB.code || '').trim().toUpperCase(); if (!code) { alert('Escribe el código.'); return; }
  const role = OB.joinRole || 'partner';
  const { data, error } = await sb.rpc('join_workspace', { p_code: code, p_role: role });
  if (error) { alert(error.message.includes('Código') ? 'No encontramos un espacio con ese código. Pide a tu pareja que lo revise.' : 'No se pudo entrar: ' + error.message); return; }
  L.pendingCode = null; OB.step = 0; adoptWorkspace(data, role); toast('Ya estáis en el mismo espacio');
}
async function setRole(role){
  if (!WS) return; L.role = role; saveLocal();
  const { error } = await sb.from('workspace_members').update({ role }).eq('workspace_id', WS.id).eq('user_id', SESSION.user.id);
  if (error) { const r = await sb.rpc('join_workspace', { p_code: WS.invite_code, p_role: role }); if (r.error) console.warn(r.error); }
  render();
}
function renderRolePick(){
  return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">Este espacio ya está creado. ¿Quién eres?</p>
    <div class="opts" style="margin-top:22px">
      <button class="opt" onclick="setRole('mother')"><span class="r"></span><span><b>${esc(S.pregnancy.names?.mother || 'Estoy embarazada')}</b><small>Veré primero lo que me toca a mí</small></span></button>
      <button class="opt" onclick="setRole('partner')"><span class="r"></span><span><b>${esc(S.pregnancy.names?.partner || 'Soy la pareja')}</b><small>Veré primero cómo acompañar y de qué ocuparme</small></span></button>
    </div><div class="grow"></div></div>`;
}
async function empezarDeCero(){
  if (!confirm('¿Empezar de cero? Se borra este espacio para las dos personas.')) return;
  closeSheet();
  if (WS) { const { error } = await sb.rpc('leave_workspace', { p_ws: WS.id }); if (error) { alert('No se pudo borrar: ' + error.message); return; } }
  if (CHAN) { sb.removeChannel(CHAN); CHAN = null; }
  S = null; WS = null; L.role = null; OB.step = 0; saveLocal(); try { localStorage.removeItem('juntos.ws'); } catch(e){} render();
}
function cargarEjemplo(){ if (!confirm('¿Cargar los datos de ejemplo? Se reemplaza lo guardado en este espacio.')) return; const code = WS?.invite_code; S = demoWorkspace(); if (code) S.pregnancy.inviteCode = code; closeSheet(); commit(); }
function invitacionTxt(){ return `Estamos esperando un bebé y llevamos el embarazo juntos en esta app. Entra con tu correo y usa el código ${S.pregnancy.inviteCode}: ${location.origin}/?invitar=${S.pregnancy.inviteCode}`; }

// --- asistente: API propia ---
async function preguntar(q){
  q = (q || '').trim(); if (!q) return;
  const urg = ALARMA.find(a => a.re.test(q));
  S.chat.push({ role:'user', content:q, at:new Date().toISOString() });
  persist(); render();
  const chat = $('#chat'); if (!chat) return;
  const box = document.createElement('div'); box.className = 'msg ai thinking'; box.textContent = 'Pensando…'; chat.appendChild(box); window.scrollTo(0, document.body.scrollHeight);
  if (urg) { const u = document.createElement('div'); u.innerHTML = urgentBox(urg.l); chat.insertBefore(u.firstChild, box); }
  let text = '';
  try {
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch('/api/preguntar', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer ' + session.access_token }, body: JSON.stringify({ context: contextoIA(), history: S.chat.slice(-9, -1).map(m => ({ role: m.role, content: m.content })), question: q, urgent: urg ? urg.l : null }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 503 && j.error === 'no_key') { AI_OK = false; text = respuestaLocal(q, urg); }
    else if (!r.ok) { text = j.message || 'No he podido responder ahora. Inténtalo de nuevo en un momento.'; }
    else { AI_OK = true; text = j.text; }
  } catch (e) { text = respuestaLocal(q, urg); }
  S.chat.push({ role:'assistant', content:text, urgent: urg ? urg.l : null, at:new Date().toISOString() });
  commit(); window.scrollTo(0, document.body.scrollHeight);
}

// --- arranque ---
async function boot(){
  const u = new URL(location.href); const inv = u.searchParams.get('invitar');
  if (inv) { L.pendingCode = inv.toUpperCase(); saveLocal(); history.replaceState(null, '', '/'); }
  render();
  const { data: { session } } = await sb.auth.getSession();
  SESSION = session; AUTH_READY = true;
  sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'SIGNED_IN' && s && (!SESSION || SESSION.user.id !== s.user.id)) { SESSION = s; MAIL_SENT = ''; loadWorkspace(); }
    else if (ev === 'SIGNED_OUT') { SESSION = null; S = null; WS = null; render(); }
    else if (s) SESSION = s;
  });
  if (SESSION) await loadWorkspace(); else render();
  fetch('/api/preguntar').then(r => r.json()).then(j => { AI_OK = !!j.configured; }).catch(() => { AI_OK = false; });
}
boot();
