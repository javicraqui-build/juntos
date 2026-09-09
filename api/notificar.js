// /api/notificar — avisos push.
//   GET  (cron diario de Vercel, cabecera Authorization: Bearer CRON_SECRET): calcula los avisos de hoy para cada
//        persona de cada espacio y los envía a sus dispositivos. No repite un aviso (push_log).
//   POST con el JWT del usuario y { test: true }: manda un aviso de prueba a los dispositivos de quien llama.
// Variables en Vercel: SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY, CRON_SECRET (y VAPID_SUBJECT opcional).
import webpush from 'web-push';
import { avisos, hoyEn, horaEn } from '../lib/embarazo.mjs';
import { readFileSync } from 'node:fs';
import { registrarError } from '../lib/errores.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eidspdbyvbyjntkxiavz.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_DTQwi_Yr3RK3oZa1qT_tVQ_Wd7VmZ66';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CFG = JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || CFG.vapidPublicKey;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:jsanchezprandi@gmail.com';

function admin(path, init = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, Object.assign({}, init, { headers: Object.assign({ apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json' }, init.headers || {}) }));
}
async function verifyUser(token) {
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` } });
  return r.ok ? r.json() : null;
}
function armarDoc(w) {
  const D = { pregnancy: w.pregnancy || {}, milestones: {}, appointments: [], tests: [], ultrasounds: [], symptoms: [], memories: [], names: [], family: [], tasks: [], customMilestones: [], kicks: [], contractions: [], vitals: [] };
  for (const r of w.entries || []) { if (r.collection === 'milestones') D.milestones[r.id] = r.data; else if (D[r.collection]) D[r.collection].push(Object.assign({ id: r.id }, r.data)); }
  return D;
}
async function enviar(subs, payload) {
  let ok = 0, caidas = [];
  for (const s of subs) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 6 * 3600 }); ok++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) caidas.push(s.endpoint); else console.warn('push', e.statusCode, e.body?.slice?.(0, 120)); }
  }
  if (caidas.length) await admin(`push_subs?endpoint=in.(${caidas.map(encodeURIComponent).join(',')})`, { method: 'DELETE' }).catch(() => {});
  return ok;
}

export default async function handler(req, res) {
  try { return await handlerReal(req, res); } catch (e) { console.error(e); registrarError('api/notificar', e); if (!res.headersSent) return res.status(500).json({ error: 'internal' }); }
}
async function handlerReal(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!SERVICE || !VAPID_PRIVATE) return res.status(503).json({ error: 'no_config', message: 'Faltan SUPABASE_SERVICE_ROLE_KEY o VAPID_PRIVATE_KEY en Vercel.' });
  webpush.setVapidDetails(SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  if (req.method === 'POST') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await verifyUser(token);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const subs = await (await admin(`push_subs?user_id=eq.${user.id}&select=endpoint,keys`)).json();
    if (!Array.isArray(subs) || !subs.length) return res.status(200).json({ sent: 0, message: 'Este usuario no tiene dispositivos con avisos activados.' });
    const n = await enviar(subs, { title: 'juntos', body: 'Los avisos funcionan. Te avisaremos de citas, semanas nuevas y tareas.', url: '/', tag: 'test' });
    return res.status(200).json({ sent: n });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'unauthorized' });

  const forzar = (req.query?.force === '1');   // ?force=1 (con el secreto) ignora la franja horaria: útil para probar
  let total = 0, personas = 0;
  // Errores nuevos de las últimas 24 h → un aviso al día al admin
  try {
    if (CFG.adminEmail) {
      const errs = await (await admin(`app_errors?select=origen,mensaje&at=gte.${new Date(Date.now() - 86400e3).toISOString()}&order=at.desc&limit=50`)).json();
      if (Array.isArray(errs) && errs.length) {
        const adm = await (await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } })).json();
        const u = (adm?.users || []).find(x => x.email === CFG.adminEmail);
        if (u) {
          const key = 'errores-' + new Date().toISOString().slice(0, 10);
          const ya = await (await admin(`push_log?user_id=eq.${u.id}&key=eq.${key}&select=key`)).json();
          const subs = ya?.length ? [] : await (await admin(`push_subs?user_id=eq.${u.id}&select=endpoint,keys`)).json();
          if (subs?.length) {
            const porOrigen = {}; errs.forEach(x => porOrigen[x.origen] = (porOrigen[x.origen] || 0) + 1);
            await admin('push_log', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: u.id, key }) });
            total += await enviar(subs, { title: `juntos: ${errs.length} ${errs.length === 1 ? 'error' : 'errores'} en 24 h`, body: Object.entries(porOrigen).map(([o, c]) => `${o}: ${c}`).join(' · ') + ' · ' + errs[0].mensaje.slice(0, 80), url: '/', tag: key });
          }
        }
      }
    }
  } catch (e) { console.warn('errores admin', e); }
  const r = await admin('workspaces?select=id,pregnancy,workspace_members(user_id,role),entries(collection,id,data)');
  const spaces = await r.json();
  if (!Array.isArray(spaces)) { console.error('workspaces', spaces); return res.status(502).json({ error: 'db' }); }
  const subsAll = await (await admin('push_subs?select=endpoint,keys,user_id')).json();
  const porUsuario = new Map(); for (const s of subsAll || []) { if (!porUsuario.has(s.user_id)) porUsuario.set(s.user_id, []); porUsuario.get(s.user_id).push(s); }
  for (const w of spaces) {
    const doc = armarDoc(w); const country = doc.pregnancy?.country || 'ES';
    // Hay dos crones (06:00 y 11:00 UTC) y cada espacio solo recibe en el que cae entre las 7 y las 11 de su mañana: España en el primero, Uruguay y el resto de América en el segundo
    const h = horaEn(country); if (!forzar && (h < 7 || h > 11)) continue;
    const t = hoyEn(country);
    for (const m of w.workspace_members || []) {
      const subs = porUsuario.get(m.user_id); if (!subs?.length) continue;
      const lista = avisos(doc, m.role, t); if (!lista.length) continue;
      personas++;
      const ya = new Set(((await (await admin(`push_log?user_id=eq.${m.user_id}&select=key`)).json()) || []).map(x => x.key));
      for (const a of lista) {
        if (ya.has(a.key)) continue;
        const ins = await admin('push_log', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: m.user_id, key: a.key }) });
        if (!ins.ok) continue;   // 409 = otra ejecución lo mandó ya
        total += await enviar(subs, { title: a.title, body: a.body, url: a.url, tag: a.key });
      }
    }
  }
  return res.status(200).json({ ok: true, espacios: spaces.length, personas, enviados: total });
}
