import os, re, json
import pathlib; B = str(pathlib.Path(__file__).parent); P = B
os.makedirs(f'{P}/public', exist_ok=True)
css = open(f'{B}/styles.css').read()
content = open(f'{B}/content.js').read()
core = open(f'{B}/app-core.js').read()
screens = open(f'{B}/app-screens.js').read()
sheets = open(f'{B}/app-sheets.js').read()
prod = open(f'{P}/src/prod.js').read()

def rep(s, old, new, must=True):
    if old not in s:
        if must: raise SystemExit('PATCH MISS: ' + old[:80])
        return s
    return s.replace(old, new)

# --- core: en prod no hay window.claude; boot lo define prod.js
core = rep(core, "async function boot(){", "async function boot_artifact(){")
# --- sheets: quitar arranque, patches de onboarding y perfil
sheets = rep(sheets, "\nboot();\n", "\n")
sheets = rep(sheets, """<button class="link" style="color:var(--ink3)" onclick="S=demoWorkspace(); L.role=null; saveLocal(); commit()">Ver con datos de ejemplo</button>""",
                     """<button class="link" style="color:var(--ink3)" onclick="crearDemo()">Ver con datos de ejemplo</button>""")
sheets = rep(sheets, """<button class="btn block" onclick="OB.step=0; L.role = OB.role==='partner' ? 'partner' : OB.role==='mother' ? 'mother' : null; saveLocal(); render()">Ir a Hoy</button>""",
                     """<button class="btn block" onclick="OB.step=0; render()">Ir a Hoy</button>""")
sheets = rep(sheets, """<p class="hint" style="font-size:13px;color:var(--ink3)">${dbOn ? 'Buscando el espacio compartido…' : 'Si tu pareja ya creó el espacio en esta misma página, aparecerá al entrar.'}</p>""",
                     """<div class="field"><label>¿Quién eres?</label><div class="pillrow">${[['partner','Soy la pareja'],['mother','Estoy embarazada']].map(([k,l]) => `<button class="${(OB.joinRole||'partner')===k?'on':''}" onclick="OB.joinRole='${k}'; render()">${l}</button>`).join('')}</div></div>""")
sheets = rep(sheets, """<div class="card soft" style="margin-top:18px"><span class="eyebrow">Datos</span><div class="actions" style="margin-top:10px"><button class="btn ghost sm" onclick="if(confirm('¿Cargar los datos de ejemplo? Se reemplaza lo guardado.')){S=demoWorkspace(); closeSheet(); commit();}">Cargar ejemplo</button><button class="btn ghost sm" onclick="if(confirm('¿Empezar de cero? Se borra todo lo guardado en este espacio.')){S=null; L.role=null; saveLocal(); try{localStorage.removeItem('juntos.ws')}catch(e){} if(dbRef) dbRef.delete().catch(()=>{}); closeSheet(); render();}">Empezar de cero</button></div></div>""",
                     """<div class="card soft" style="margin-top:18px"><span class="eyebrow">Cuenta</span><p class="sub" style="margin-top:4px;font-size:13px">Sesión: ${esc(SESSION?.user?.email || '')}</p><div class="actions" style="margin-top:10px"><button class="btn ghost sm" onclick="logout()">Cerrar sesión</button><button class="btn ghost sm" onclick="empezarDeCero()">Salir del espacio</button></div><p class="hint" style="font-size:12px;color:var(--ink3);margin-top:8px">Salir del espacio no borra nada mientras tu pareja siga dentro.</p></div>""")
sheets = rep(sheets, """Comparte esta página y el código. En el móvil de tu pareja, al abrir, elige "Tengo un código de mi pareja".""",
                     """Envía la invitación a tu pareja: entra con su correo y usa el código. Los dos verán y editarán lo mismo.""")
sheets = rep(sheets, """<p class="sub" style="margin-top:4px">Los dos usan el mismo espacio. Comparte esta página con el código:</p>""",
                     """<p class="sub" style="margin-top:4px">Los dos usan el mismo espacio. Tu pareja entra con su correo y este código:</p>""")
sheets = rep(sheets, """<div class="sync ${dbOn?'on':''}" id="sync"><i></i><span>${dbOn ? 'Sincronizado con tu pareja' : 'Guardado en este dispositivo'}</span></div></div>""",
                     """<div class="sync on" id="sync"><i></i><span>Sincronizado en la nube</span></div><div class="actions" style="margin-top:10px"><button class="btn ghost sm" onclick="copiarInvitacion()">Copiar invitación</button><button class="link" style="font-size:13px" onclick="openUnirse()">Tengo un código de mi pareja</button></div></div>""")
# --- screens: texto del asistente
screens = rep(screens, """${sampleFn ? '' : (window.claude?.use ? 'Conectando…' : 'En esta vista, respuestas de orientación general.')}""",
                       """${AI_OK === false ? 'El asistente con IA todavía no está configurado: respondo con orientación general.' : ''}""")

cfg = json.load(open(f'{P}/config.json'))
html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>juntos</title>
<meta name="description" content="El embarazo, juntos. Seguimiento, organización y recuerdos para los dos.">
<meta name="theme-color" content="#5E4468">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="juntos">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%235E4468'/%3E%3Ccircle cx='32' cy='34' r='12' fill='%23C6876A'/%3E%3C/svg%3E">
<link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%235E4468'/%3E%3Ccircle cx='32' cy='34' r='12' fill='%23C6876A'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Figtree:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<div id="app"></div>
<script>window.JUNTOS_CONFIG = {json.dumps(cfg)};</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js"></script>
<script src="/content.js"></script>
<script src="/app.js"></script>
<script src="/sheets.js"></script>
<script src="/prod.js"></script>
</body>
</html>
"""
open(f'{P}/public/index.html', 'w').write(html)
open(f'{P}/public/app.css', 'w').write(css)
open(f'{P}/public/content.js', 'w').write(content)
open(f'{P}/public/app.js', 'w').write(core + '\n' + screens)
open(f'{P}/public/sheets.js', 'w').write(sheets)
open(f'{P}/public/prod.js', 'w').write(prod)
print('ok', len(html))
