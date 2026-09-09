// Paso de build de Vercel: comprueba que public/ existe y corre los tests de la lógica. Si algo falla, el deploy no sale.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
if (!existsSync('public/index.html')) throw new Error('Falta public/index.html: ejecuta el build local (python3 build-prod.py) y sube los archivos.');
const r = spawnSync('node', ['tests/run.mjs'], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('Tests fallidos: no se despliega.');
console.log('public/ listo y tests en verde');
