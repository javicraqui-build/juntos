# juntos — El embarazo, juntos.

App web mobile-first de acompañamiento del embarazo para parejas. Todo en español.

## Estructura

```
public/          sitio estático (index.html, app.css, content.js, app.js, sheets.js, prod.js)
api/preguntar.js función serverless de Vercel: asistente con la API de Anthropic (verifica la sesión de Supabase)
supabase/migrations/0001_workspaces.sql   esquema v1: espacio compartido (jsonb) + membresías + RLS + RPCs + realtime
docs/schema_v2.sql                        esquema relacional normalizado (destino de migración cuando haga falta)
src/prod.js      capa de producción (auth, sync, realtime, invitaciones, llamada a la API)
config.json      URL y clave pública (publishable) de Supabase que se inyectan en index.html
vercel.json      cabeceras de seguridad
fetch.mjs        paso de build de Vercel (no-op con el repo conectado)
```

Los archivos de `public/` se generan con `python3 build-prod.py` desde las fuentes del prototipo
(`content.js`, `app-core.js`, `app-screens.js`, `app-sheets.js`, `styles.css`) más `src/prod.js`.
Si editas la app, edita esas fuentes y vuelve a generar; o edita `public/` directamente y olvida el build.

## Infraestructura

- **Supabase**: proyecto `juntos` (ref `eidspdbyvbyjntkxiavz`, org Pruebas, eu-west-1). Auth con correo y contraseña.
- **Vercel**: proyecto `juntos` en el equipo `craqui`. Producción: https://juntos-craqui.vercel.app
- **IA**: `api/preguntar.js` usa `ANTHROPIC_API_KEY` (y opcionalmente `ANTHROPIC_MODEL`) como variables de entorno en Vercel.

## Pasos pendientes de configuración (una sola vez)

1. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://juntos-craqui.vercel.app`
   - Redirect URLs: `https://juntos-craqui.vercel.app/**` (y el dominio propio cuando lo haya)
   Necesario para los enlaces de recuperación de contraseña.
2. **Supabase → Authentication → Email**: el SMTP por defecto tiene un límite muy bajo de correos por hora.
   Para uso real, configurar SMTP propio (Resend, Postmark, etc.) y personalizar la plantilla "Magic Link" en español.
3. **Vercel → Settings → Environment Variables**: `ANTHROPIC_API_KEY` (Production). Redeploy después de añadirla.
   Opcional: `ANTHROPIC_MODEL` si quieres otro modelo distinto del que trae por defecto el código.
4. **GitHub**: crea el repo, sube esta carpeta y en Vercel → Settings → Git conecta el repo al proyecto `juntos`
   (o crea el proyecto desde el repo). Con el repo conectado, cada push a `main` despliega.

## Avisos push

`api/notificar.js` corre dos veces al día por cron de Vercel (06:00 y 11:00 UTC; cada espacio recibe en la franja de su mañana) y manda a cada persona sus avisos (cita de mañana/hoy, semana nueva, tarea a su cargo, mal día de ella para la pareja, hito en una semana). Variables en Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY` (la pública está en `config.json`), `CRON_SECRET`. `GET /api/notificar?force=1` con el secreto ignora la franja horaria (para probar). `POST` con el JWT del usuario manda un aviso de prueba.

## Modelo de datos v2 (0005)

`workspaces.pregnancy` (jsonb) + una fila por ítem en `entries (workspace_id, collection, id, data)`. La app monta en memoria el mismo documento de siempre y al guardar solo viajan las filas que cambiaron; el realtime entrega la fila afectada. `workspaces.data` queda como copia histórica de la v1. La conversación con el asistente va en `ai_chats` (privada por persona) y las fotos en el bucket `fotos`.

## Modelo de datos v1 (histórico)

Un embarazo = una fila en `workspaces` con el documento JSON completo (`data`) y un `invite_code`.
Cada persona es una fila en `workspace_members` con rol `mother` o `partner`. RLS: solo los miembros leen y escriben.
RPCs: `create_workspace(p_data, p_role)`, `join_workspace(p_code, p_role)`, `leave_workspace(p_ws)`.
Realtime activado en `workspaces` para que la pareja vea los cambios al instante.

Cuando el producto lo pida (consultas por tipo, historial, adjuntos, notificaciones), migrar a `docs/schema_v2.sql`.
