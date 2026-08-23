/**
 * Inventario de rutas — red de seguridad para la limpieza del backend.
 *
 * Carga index.js SIN abrir puerto ni depender de la base de datos, recorre el
 * árbol de rutas que Express registró de verdad y vuelca una línea por ruta con
 * el orden de sus middlewares y un hash del código de cada handler.
 *
 * Uso:
 *   node scripts/inventario-rutas.js                  -> escribe scripts/inventario-rutas.txt
 *   node scripts/inventario-rutas.js otro.txt         -> escribe otro.txt
 *
 * Para verificar un refactor:
 *   node scripts/inventario-rutas.js antes.txt        (antes de tocar nada)
 *   ...mover código...
 *   node scripts/inventario-rutas.js despues.txt
 *   diff antes.txt despues.txt                        -> tiene que salir vacío
 *
 * El hash es de fn.toString(): mover un handler tal cual lo conserva, editarlo
 * lo cambia. Así el diff distingue "moviste código" de "tocaste código".
 */

const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');

const BACKEND = path.join(__dirname, '..');
const salida = path.resolve(process.argv[2] || path.join(__dirname, 'inventario-rutas.txt'));

// --- 1. Que nada abra un puerto -------------------------------------------
net.Server.prototype.listen = function () { return this; };

// --- 2. Capturar la instancia de express que cree index.js ----------------
const expressPath = require.resolve('express', { paths: [BACKEND] });
const expressReal = require(expressPath);
const apps = [];
const expressEnvuelto = function (...args) {
    const app = expressReal(...args);
    apps.push(app);
    return app;
};
Object.assign(expressEnvuelto, expressReal);
require.cache[expressPath].exports = expressEnvuelto;

// --- 3. Cargar la app (silenciando su ruido de arranque) ------------------
const logReal = console.log;
console.log = () => { };
try {
    require(path.join(BACKEND, 'index.js'));
} finally {
    console.log = logReal;
}

if (apps.length === 0) {
    console.error('ERROR: index.js no creó ninguna app de express.');
    process.exit(1);
}
const app = apps[0];

// --- 4. Recorrer el árbol de capas ---------------------------------------
const hash = (fn) => crypto.createHash('sha1')
    .update(typeof fn === 'function' ? fn.toString() : String(fn))
    .digest('hex').slice(0, 8);

const nombre = (fn) => (fn && fn.name) ? fn.name.replace('bound ', '') : '<anon>';

// Express no guarda el path de montaje de un Router, sólo su regexp.
// Esto lo reconstruye, para que extraer rutas a un Router en la fase B4
// produzca el mismo inventario que tenerlas sueltas en index.js.
const BARRA_ESCAPADA = String.fromCharCode(92) + '/';

function pathDeRegexp(regexp) {
    if (!regexp || regexp.fast_slash) return '';
    let s = regexp.source.split(BARRA_ESCAPADA).join('/');
    if (s.startsWith('^')) s = s.slice(1);
    s = s.replace('/?(?=/|$)', '');
    if (s.endsWith('$')) s = s.slice(0, -1);
    return s;
}

const filas = [];

function recorrer(stack, prefijo) {
    for (const capa of stack) {
        if (capa.route) {
            const metodos = Object.keys(capa.route.methods)
                .filter((m) => capa.route.methods[m])
                .map((m) => m.toUpperCase())
                .sort();
            const cadena = capa.route.stack
                .map((c) => `${nombre(c.handle)}:${hash(c.handle)}`)
                .join(' > ');
            for (const metodo of metodos) {
                filas.push({
                    tipo: 'RUTA',
                    metodo,
                    ruta: prefijo + capa.route.path,
                    cadena,
                });
            }
        } else if (capa.name === 'router' && capa.handle && capa.handle.stack) {
            recorrer(capa.handle.stack, prefijo + pathDeRegexp(capa.regexp));
        } else {
            filas.push({
                tipo: 'USE',
                metodo: '',
                ruta: pathDeRegexp(capa.regexp) || '/',
                cadena: `${nombre(capa.handle)}:${hash(capa.handle)}`,
            });
        }
    }
}

const raiz = app._router || (app.router && app.router.stack ? app.router : null);
if (!raiz || !raiz.stack) {
    console.error('ERROR: no encontré el router raíz de la app.');
    process.exit(1);
}
recorrer(raiz.stack, '');

// --- 5. Marcar rutas tapadas (en express gana el primer registro) ---------
const vistas = new Map();
filas.forEach((f, i) => {
    if (f.tipo !== 'RUTA') return;
    const clave = `${f.metodo} ${f.ruta}`;
    if (vistas.has(clave)) {
        f.tapada = vistas.get(clave);
    } else {
        vistas.set(clave, i + 1);
    }
});

// --- 6. Volcar ------------------------------------------------------------
const lineas = filas.map((f, i) => {
    const n = String(i + 1).padStart(4, '0');
    if (f.tipo === 'USE') return `${n}  USE     ${f.ruta.padEnd(52)} ${f.cadena}`;
    const marca = f.tapada ? `   [TAPADA por #${String(f.tapada).padStart(4, '0')}]` : '';
    return `${n}  ${f.metodo.padEnd(7)} ${f.ruta.padEnd(52)} ${f.cadena}${marca}`;
});

const rutas = filas.filter((f) => f.tipo === 'RUTA');
const tapadas = rutas.filter((f) => f.tapada);
const cabecera = [
    '# Inventario de rutas de backend/index.js',
    `# ${rutas.length} rutas alcanzables + ${filas.length - rutas.length} middlewares de nivel app`,
    `# ${tapadas.length} rutas TAPADAS (registradas dos veces; en express gana la primera)`,
    '#',
    '# El orden es el de registro, y ese orden importa: no ordenar este archivo.',
    '',
];

fs.writeFileSync(salida, cabecera.concat(lineas).join('\n') + '\n', 'utf8');
console.log(`${rutas.length} rutas, ${tapadas.length} tapadas -> ${path.relative(BACKEND, salida)}`);
process.exit(0);
