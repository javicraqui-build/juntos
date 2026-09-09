// ====== PRODUCCIÓN: Supabase (auth + espacio compartido + realtime) y API de IA ======
const SB_URL = window.JUNTOS_CONFIG.supabaseUrl, SB_KEY = window.JUNTOS_CONFIG.supabaseKey;
if (typeof supabase === 'undefined') { document.getElementById('app').innerHTML = '<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">No se pudo cargar la app. Revisa la conexión y vuelve a intentarlo.</p><div class="grow"></div></div>'; throw new Error('supabase-js no cargó'); }
const sb = supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
let SESSION = null, WS = null, AUTH_READY = false, AI_OK = null, CHAN = null;

// --- render con puerta de autenticación ---
function render(){
  const app = $('#app');
  if (!AUTH_READY) { app.innerHTML = `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">Cargando…</p><div class="grow"></div></div>`; return; }
  if (!SESSION || RECOVERY) { app.innerHTML = renderLogin(); $('.tabbar')?.remove(); return; }
  if (!S || !S.pregnancy?.lmp) { app.innerHTML = renderOnboarding(); $('.tabbar')?.remove(); window.scrollTo(0,0); return; }
  if (OB.step === 5) { app.innerHTML = renderOnboarding(); $('.tabbar')?.remove(); window.scrollTo(0,0); return; }
  if (!L.role) { app.innerHTML = renderRolePick(); $('.tabbar')?.remove(); return; }
  const fn = { hoy: renderHoy, evolucion: renderEvolucion, salud: renderSalud, nosotros: renderNosotros, preguntar: renderPreguntar }[L.tab] || renderHoy;
  app.innerHTML = `<div class="screen ${L.tab==='preguntar'?'chat-screen':''}">${fn()}</div>`;
  hydrateFotos(app);
  let tb = $('.tabbar');
  if (!tb) { tb = document.createElement('div'); tb.className = 'tabbar'; document.body.appendChild(tb); }
  tb.innerHTML = `<nav>${TABS.map(([k,l,ic]) => `<button class="${L.tab===k?'on':''}" onclick="go('${k}')" aria-label="${l}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
  if (L.tab === 'preguntar') { const c = $('#chat'); if (c) window.scrollTo(0, document.body.scrollHeight); }
}

// --- acceso con correo y contraseña ---
let AUTH_MODE = 'login', AUTH_MSG = '', AUTH_BUSY = false, RECOVERY = false;
function renderLogin(){
  if (RECOVERY) return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">Elige una contraseña nueva</p>
    <form style="margin-top:22px" onsubmit="event.preventDefault(); nuevaContrasena(this.password.value)">
      <div class="field"><label>Contraseña nueva</label><input name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="Mínimo 8 caracteres"></div>
      ${AUTH_MSG ? `<p class="sub" style="color:var(--red);margin-bottom:12px">${esc(AUTH_MSG)}</p>` : ''}
      <button class="btn block" type="submit" ${AUTH_BUSY?'disabled':''}>Guardar y entrar</button>
    </form><div class="grow"></div></div>`;
  const signup = AUTH_MODE === 'signup';
  const code = L.pendingCode ? `<div class="card accent" style="margin-bottom:16px"><span class="eyebrow">Invitación</span><p class="sub" style="margin-top:4px">Tienes un código para unirte al espacio de tu pareja: <b>${esc(L.pendingCode)}</b>. Crea tu cuenta o entra y te unimos.</p></div>` : '';
  return `<div class="onb"><div class="grow"></div><div class="logo">juntos</div><p class="tag">El embarazo, juntos.</p>
    <div class="welcome-art"><i style="width:120px;height:120px;background:var(--warm);left:-20px;top:40px;opacity:.85"></i><i style="width:70px;height:70px;background:var(--accent-soft);right:60px;top:30px;opacity:.9"></i><i style="width:36px;height:36px;background:#F2DCCB;right:110px;bottom:34px"></i></div>
    ${code}
    <div class="seg"><button class="${!signup?'on':''}" onclick="AUTH_MODE='login'; AUTH_MSG=''; render()">Entrar</button><button class="${signup?'on':''}" onclick="AUTH_MODE='signup'; AUTH_MSG=''; render()">Crear cuenta</button></div>
    <form onsubmit="event.preventDefault(); acceder(this.email.value, this.password.value)">
      <div class="field"><label>Correo</label><input name="email" type="email" inputmode="email" autocomplete="email" required placeholder="tu@correo.com"></div>
      <div class="field"><label>Contraseña</label><input name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" required placeholder="${signup?'Mínimo 8 caracteres':'Tu contraseña'}"></div>
      ${AUTH_MSG ? `<p class="sub" style="color:var(--red);margin-bottom:12px">${esc(AUTH_MSG)}</p>` : ''}
      <button class="btn block" type="submit" ${AUTH_BUSY?'disabled':''}>${AUTH_BUSY ? 'Un momento…' : signup ? 'Crear cuenta' : 'Entrar'}</button>
    </form>
    ${signup ? '' : `<div style="margin-top:14px;text-align:center"><button class="link" style="color:var(--ink3)" onclick="recuperar()">¿Olvidaste la contraseña?</button></div>`}
    <p class="disclaimer">Tus datos solo los ven las dos personas del espacio. Sin publicidad ni terceros.</p>
    <div class="grow"></div></div>`;
}
function errorAuth(e){
  const m = (e?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese correo ya tiene cuenta. Usa "Entrar".';
  if (m.includes('password') && m.includes('least')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos seguidos. Espera un momento.';
  if (m.includes('not confirmed')) return 'Tu correo todavía no está confirmado. Revisa tu bandeja de entrada.';
  return 'No se pudo completar: ' + (e?.message || 'error desconocido');
}
async function acceder(email, password){
  email = (email || '').trim(); if (!email || !password) return;
  AUTH_BUSY = true; AUTH_MSG = ''; render();
  try {
    if (AUTH_MODE === 'signup') {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session) { AUTH_MSG = 'Cuenta creada. Confirma tu correo desde el enlace que te enviamos y vuelve a entrar.'; AUTH_MODE = 'login'; }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (e) { AUTH_MSG = errorAuth(e); }
  AUTH_BUSY = false; if (!SESSION) render();
}
async function recuperar(){
  const email = prompt('Escribe tu correo y te enviamos un enlace para cambiar la contraseña:'); if (!email) return;
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + '/' });
  AUTH_MSG = error ? errorAuth(error) : 'Te hemos enviado un enlace para cambiar la contraseña.'; render();
}
async function nuevaContrasena(password){
  AUTH_BUSY = true; render();
  const { error } = await sb.auth.updateUser({ password });
  AUTH_BUSY = false;
  if (error) { AUTH_MSG = errorAuth(error); render(); return; }
  RECOVERY = false; AUTH_MSG = ''; toast('Contraseña guardada'); if (SESSION) loadWorkspace(); else render();
}
async function logout(){ closeSheet(); await sb.auth.signOut(); SESSION = null; S = null; WS = null; L.role = null; saveLocal(); try { localStorage.removeItem('juntos.ws'); } catch(e){} render(); }

// --- carga del espacio y realtime ---
async function loadWorkspace(){
  const { data, error } = await sb.from('workspace_members').select('role, workspaces(*)').eq('user_id', SESSION.user.id).order('joined_at', { ascending:false }).limit(1);
  if (error) { console.warn(error); }
  const row = data && data[0];
  if (row && row.workspaces) {
    const w = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    if (L.pendingCode && L.pendingCode === w.invite_code) { L.pendingCode = null; saveLocal(); }
    adoptWorkspace(w, row.role);
    if (L.pendingCode) setTimeout(() => openUnirse(), 300);
  }
  else {
    S = null; WS = null; L.role = null; saveLocal();
    if (L.pendingCode) { OB.join = true; OB.code = L.pendingCode; OB.step = 6; }
    render();
  }
}
// BASE = última versión del documento confirmada por el servidor. Sirve para fusionar a tres vías
// (base, mío, remoto) y que dos personas editando a la vez no se pisen.
let BASE = null, PENDING_RENDER = false, PERSISTING = false, PERSIST_AGAIN = false;
const COLS = ['appointments','tests','ultrasounds','symptoms','memories','names','family','tasks','customMilestones','chat'];
const clone = o => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function mergeList(base, mine, theirs){
  base = base || []; mine = mine || []; theirs = theirs || [];
  const B = new Map(base.map(x => [x.id, x])), M = new Map(mine.map(x => [x.id, x])), T = new Map(theirs.map(x => [x.id, x]));
  const out = []; const seen = new Set();
  const pick = id => {
    const b = B.get(id), m = M.get(id), t = T.get(id);
    if (m && t) return same(m, b) ? t : m;           // los dos lo tienen: gana quien lo cambió (empate: el mío)
    if (m && !t) return b && same(m, b) ? null : m;  // ellos lo borraron y yo no lo toqué → borrado; si lo cambié, lo conservo
    if (!m && t) return b && same(t, b) ? null : t;  // yo lo borré y ellos no lo tocaron → borrado; si lo cambiaron, se conserva
    return null;
  };
  for (const x of [...mine, ...theirs]) { if (seen.has(x.id)) continue; seen.add(x.id); const v = pick(x.id); if (v) out.push(v); }
  return out;
}
function mergeMap(base, mine, theirs){
  base = base || {}; mine = mine || {}; theirs = theirs || {};
  const out = {};
  for (const k of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const b = base[k], m = mine[k], t = theirs[k];
    if (k in mine && k in theirs) out[k] = same(m, b) ? t : m;
    else if (k in mine) { if (!(k in base) || !same(m, b)) out[k] = m; }
    else { if (!(k in base) || !same(t, b)) out[k] = t; }
  }
  return out;
}
function merge3(base, mine, theirs){
  if (!base) return theirs;                      // sin base no podemos razonar: manda el servidor
  const out = Object.assign({}, theirs, mine);
  out.pregnancy = mergeMap(base.pregnancy, mine.pregnancy, theirs.pregnancy);
  out.milestones = mergeMap(base.milestones, mine.milestones, theirs.milestones);
  for (const c of COLS) out[c] = mergeList(base[c], mine[c], theirs[c]);
  out.chat.sort((a, b) => (a.at || '').localeCompare(b.at || ''));
  out.updatedAt = [mine.updatedAt, theirs.updatedAt].filter(Boolean).sort().pop() || null;
  return out;
}
function setLocal(){ try { localStorage.setItem('juntos.ws', JSON.stringify(S)); } catch(e){} }
function renderIfFree(){ if (!document.querySelector('.overlay') && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) { PENDING_RENDER = false; render(); } else PENDING_RENDER = true; }
function adoptWorkspace(w, role){
  if (Array.isArray(w)) w = w[0];
  WS = w; S = w.data; BASE = clone(w.data); L.role = role || null; if (S?.pregnancy) S.pregnancy.inviteCode = w.invite_code; saveLocal();
  setLocal(); dbOn = true; subscribe(); render(); setTimeout(migrarFotos, 1500);
}
function applyRemote(row){
  const d = row?.data; if (!d || !d.pregnancy || !WS) return;
  if (row.updated_at && row.updated_at === WS.updated_at) return;   // eco de mi propio guardado
  S = merge3(BASE, S, d); BASE = clone(d); WS.updated_at = row.updated_at || WS.updated_at;
  S.pregnancy.inviteCode = WS.invite_code; setLocal(); renderIfFree();
  if (!same(S, d)) persist();                                         // tenía cambios míos que el servidor no tiene
}
function subscribe(){
  if (CHAN) { sb.removeChannel(CHAN); CHAN = null; }
  if (!WS) return;
  CHAN = sb.channel('ws-' + WS.id).on('postgres_changes', { event:'UPDATE', schema:'public', table:'workspaces', filter:`id=eq.${WS.id}` }, p => applyRemote(p.new)).subscribe();
}
function persist(){
  S.updatedAt = new Date().toISOString(); setLocal();
  if (!WS) return;
  if (PERSISTING) { PERSIST_AGAIN = true; return; }
  flush();
}
async function flush(){
  PERSISTING = true;
  try {
    for (let i = 0; i < 4; i++) {
      const snapshot = clone(S);
      const { data, error } = await sb.from('workspaces').update({ data: snapshot }).eq('id', WS.id).eq('updated_at', WS.updated_at).select('updated_at');
      if (error) { console.warn(error); toast('No se pudo guardar. Revisa la conexión.'); break; }
      if (data && data.length) { WS.updated_at = data[0].updated_at; BASE = snapshot; break; }
      // Conflicto: alguien guardó antes. Releo, fusiono y reintento.
      const r = await sb.from('workspaces').select('data, updated_at').eq('id', WS.id).single();
      if (r.error || !r.data) { toast('No se pudo guardar. Revisa la conexión.'); break; }
      S = merge3(BASE, S, r.data.data); BASE = clone(r.data.data); WS.updated_at = r.data.updated_at; S.pregnancy.inviteCode = WS.invite_code; setLocal(); renderIfFree();
    }
  } finally { PERSISTING = false; if (PERSIST_AGAIN) { PERSIST_AGAIN = false; flush(); } }
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
  L.pendingCode = null; OB.step = 0; adoptWorkspace(data, role); toast('Ya están en el mismo espacio');
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
async function salirDelEspacio(silencioso){
  if (!silencioso && !confirm('¿Salir de este espacio? Dejarás de ver sus datos. Si tu pareja sigue dentro, lo conserva; si quedaba vacío, se borra.')) return false;
  closeSheet();
  if (WS) { const { error } = await sb.rpc('leave_workspace', { p_ws: WS.id }); if (error) { alert('No se pudo salir: ' + error.message); return false; } }
  if (CHAN) { sb.removeChannel(CHAN); CHAN = null; }
  S = null; WS = null; BASE = null; L.role = null; OB.step = 0; saveLocal(); try { localStorage.removeItem('juntos.ws'); } catch(e){}
  return true;
}
async function empezarDeCero(){ if (await salirDelEspacio()) render(); }
function openUnirse(){
  const code = L.pendingCode || '';
  openSheet(`<h2>Unirme al espacio de mi pareja</h2><p class="sub">${code ? 'Tienes una invitación pendiente.' : 'Si los dos crearon un espacio por separado, quédense con uno: entra con el código de tu pareja.'} Al unirte sales de tu espacio actual${WS ? ' (si queda vacío, se borra)' : ''}.</p>
    <form onsubmit="event.preventDefault(); unirseDesdePerfil(this.code.value, this.role.value)">
      <div class="field"><label>Código</label><input name="code" value="${esc(code)}" placeholder="ABC123" required style="letter-spacing:.2em;font-size:22px;text-align:center" autocapitalize="characters"></div>
      ${sel('¿Quién eres?', 'role', [['partner','Soy la pareja'],['mother','Estoy embarazada']], L.role || 'partner')}
      <div class="actions"><button type="button" class="btn ghost" onclick="L.pendingCode=null; saveLocal(); closeSheet()">${code ? 'Ignorar invitación' : 'Cancelar'}</button><button type="submit" class="btn">Unirme</button></div>
    </form>`);
}
async function unirseDesdePerfil(code, role){
  code = (code || '').trim().toUpperCase(); if (!code) return;
  if (WS && code === WS.invite_code) { L.pendingCode = null; saveLocal(); closeSheet(); toast('Ya estás en ese espacio'); return; }
  const chk = await sb.rpc('join_workspace', { p_code: code, p_role: role });
  if (chk.error) { alert(chk.error.message.includes('Código') ? 'No encontramos un espacio con ese código. Pide a tu pareja que lo revise.' : 'No se pudo entrar: ' + chk.error.message); return; }
  // Ya somos miembros del nuevo espacio; ahora dejamos el anterior.
  if (WS && WS.id !== (Array.isArray(chk.data) ? chk.data[0] : chk.data).id) { await sb.rpc('leave_workspace', { p_ws: WS.id }); }
  L.pendingCode = null; OB.step = 0; closeSheet(); adoptWorkspace(chk.data, role); toast('Ya están en el mismo espacio');
}
function invitacionTxt(){ return `Estamos esperando un bebé y llevamos el embarazo juntos en esta app. Crea tu cuenta con tu correo y usa el código ${S.pregnancy.inviteCode}: ${location.origin}/?invitar=${S.pregnancy.inviteCode}`; }

// --- fotos: bucket privado 'fotos', ruta <workspace>/<id>.jpg; en el documento se guarda "foto:<ruta>" ---
const FOTO_URL = new Map();   // ruta → { url, exp }
function fotoSrc(v){ if (!v) return ''; if (!v.startsWith('foto:')) return v; const c = FOTO_URL.get(v.slice(5)); return c && c.exp > Date.now() ? c.url : ''; }
async function fotoUrl(path){
  const c = FOTO_URL.get(path); if (c && c.exp > Date.now()) return c.url;
  const { data, error } = await sb.storage.from('fotos').createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) { console.warn('foto', error); return ''; }
  FOTO_URL.set(path, { url: data.signedUrl, exp: Date.now() + 50*60*1000 }); return data.signedUrl;
}
function hydrateFotos(root){
  (root || document).querySelectorAll('img[data-foto^="foto:"]').forEach(async img => {
    if (img.getAttribute('src')) return;
    const url = await fotoUrl(img.dataset.foto.slice(5)); if (url && img.isConnected) { img.src = url; img.hidden = false; }
  });
}
function reducirFoto(file){
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const max = 1280, r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width*r); c.height = Math.round(img.height*r); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('canvas')), 'image/jpeg', .82); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}
async function subirFoto(blob){
  if (!WS) throw new Error('sin espacio');
  const path = `${WS.id}/${uid()}${uid()}.jpg`;
  const { error } = await sb.storage.from('fotos').upload(path, blob, { contentType:'image/jpeg', upsert:false });
  if (error) throw error;
  return 'foto:' + path;
}
async function loadPhoto(input, name){
  const f = input.files?.[0]; if (!f) return;
  const form = input.closest('form'); const submit = form?.querySelector('button[type=submit]'); const hint = input.parentElement.parentElement.querySelector('.hint');
  const h = input.parentElement.querySelector(`input[name="${name}"]`); const p = $('#prev-'+name);
  if (submit) submit.disabled = true; if (hint) hint.textContent = 'Subiendo la foto…';
  try {
    const blob = await reducirFoto(f); const ref = await subirFoto(blob);
    h.value = ref; p.src = URL.createObjectURL(blob); p.hidden = false; if (hint) hint.textContent = 'Foto lista. Solo la ven las dos personas del espacio.';
  } catch (e) { console.warn(e); if (hint) hint.textContent = 'No se pudo subir la foto. Revisa la conexión e inténtalo de nuevo.'; input.value = ''; }
  if (submit) submit.disabled = false;
}
function dataUrlToBlob(d){ const [meta, b64] = d.split(','); const mime = (meta.match(/data:(.*?);/) || [])[1] || 'image/jpeg'; const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); }
// Fotos antiguas guardadas en base64 dentro del documento: se suben una vez y se reemplazan por la ruta.
async function migrarFotos(){
  if (!WS || !S) return;
  const items = [];
  for (const c of ['memories','tests','ultrasounds','customMilestones']) (S[c] || []).forEach(x => { if (x.photo && x.photo.startsWith('data:')) items.push(x); });
  Object.values(S.milestones || {}).forEach(m => { if (m && m.photo && m.photo.startsWith('data:')) items.push(m); });
  if (!items.length) return;
  let n = 0;
  for (const x of items) { try { x.photo = await subirFoto(dataUrlToBlob(x.photo)); n++; } catch (e) { console.warn('migrar foto', e); } }
  if (n) { commit(); toast(`${n} ${n === 1 ? 'foto pasada' : 'fotos pasadas'} al almacenamiento seguro`); }
}
function quitarFoto(ref){ borrarFoto(ref); }
async function borrarFoto(ref){ if (ref && ref.startsWith('foto:')) { try { await sb.storage.from('fotos').remove([ref.slice(5)]); } catch (e) {} } }

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
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { S.chat.pop(); setLocal(); SESSION = null; toast('Tu sesión caducó. Vuelve a entrar.'); render(); return; }
  try {
    const r = await fetch('/api/preguntar', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': 'Bearer ' + session.access_token }, body: JSON.stringify({ context: contextoIA(), history: S.chat.slice(-9, -1).map(m => ({ role: m.role, content: m.content })), question: q, urgent: urg ? urg.l : null }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { S.chat.pop(); setLocal(); await sb.auth.signOut(); SESSION = null; toast('Tu sesión caducó. Vuelve a entrar.'); render(); return; }
    if (r.status === 503 && j.error === 'no_key') { AI_OK = false; text = respuestaLocal(q, urg); }
    else if (!r.ok) { text = j.message || 'No he podido responder ahora. Inténtalo de nuevo en un momento.'; }
    else { AI_OK = true; text = j.text; }
  } catch (e) { text = 'No hay conexión ahora mismo. ' + respuestaLocal(q, urg); }
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
    if (ev === 'PASSWORD_RECOVERY') { SESSION = s; RECOVERY = true; render(); return; }
    if (ev === 'SIGNED_IN' && s && (!SESSION || SESSION.user.id !== s.user.id)) { SESSION = s; AUTH_MSG = ''; loadWorkspace(); }
    else if (ev === 'SIGNED_OUT') { SESSION = null; S = null; WS = null; render(); }
    else if (s) SESSION = s;
  });
  if (SESSION) await loadWorkspace(); else render();
  fetch('/api/preguntar').then(r => r.json()).then(j => { AI_OK = !!j.configured; }).catch(() => { AI_OK = false; });
}
boot();
