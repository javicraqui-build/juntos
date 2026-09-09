// Registro de errores de las funciones en app_errors (con la clave de servicio). Nunca lanza.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eidspdbyvbyjntkxiavz.supabase.co';
export async function registrarError(origen, e, extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!key) return;
  try {
    const mensaje = String(e?.message || e || 'error').slice(0, 500);
    const detalle = String(e?.stack || JSON.stringify(extra)).slice(0, 4000);
    await fetch(`${SUPABASE_URL}/rest/v1/app_errors`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ origen, mensaje, detalle, url: extra.url || null, user_id: extra.user_id || null, version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null }) });
  } catch {}
}
