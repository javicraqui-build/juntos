// Paso de build de Vercel. Con el repositorio conectado, public/ ya existe y este script no hace nada.
// (Solo el primer despliegue sin repo descargaba los archivos desde una tabla temporal.)
import { existsSync } from 'node:fs';
if (existsSync('public/index.html')) { console.log('public/ ya está en el repositorio, nada que hacer'); }
else { throw new Error('Falta public/index.html: ejecuta el build local (python3 build-prod.py) y sube los archivos.'); }
