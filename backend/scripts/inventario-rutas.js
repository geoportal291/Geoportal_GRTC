/**
 * Inventario de rutas — red de seguridad para la limpieza del backend.
 *
 * Carga index.js SIN abrir puerto ni depender de la base de datos, recorre el
 * árbol de rutas que Express registró de verdad y vuelca una línea por ruta con
 * el orden de sus middlewares y un hash del código de cada handler.
 *
 * Uso:
 *   node scripts/inventario-rutas.js            -> regenera la línea base (scripts/inventario-rutas.txt)
 *   node scripts/inventario-rutas.js otro.txt   -> la escribe en otro sitio
 *   node scripts/inventario-rutas.js --verificar
 *        -> compara contra la línea base guardada SIN tocarla.
 *           Sale con código 0 si son idénticas, 1 si algo cambió.
 *
 * Flujo de un refactor: mover código, `--verificar`, y sólo regenerar la línea
 * base cuando el cambio de inventario sea deliberado (p.ej. borrar una ruta
 * duplicada en B2).
 *
 * El hash es de fn.toString(): mover un handler tal cual lo conserva, editarlo
 * lo cambia. Así la verificación distingue "moviste código" de "tocaste código".
 */

const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');

const BACKEND = path.join(__dirname, '..');
const LINEA_BASE = path.join(__dirname, 'inventario-rutas.txt');
const verificar = process.argv.includes('--verificar');
const salida = path.resolve(
    (!verificar && process.argv[2]) ? process.argv[2] : LINEA_BASE
);

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

// --- 5b. Pares con solape de patrón --------------------------------------
// Dos rutas distintas pueden casar con la misma URL concreta: /api/proyectos/:id
// se traga /api/proyectos/assigned-detailed si se registra antes. Ahí el orden
// relativo es comportamiento, no estilo. Esta lista es lo que hay que conservar
// al reordenar el archivo (fase B3): si un par cambia de sentido, una ruta
// desaparece en silencio.
const segmentos = (ruta) => ruta.split('/').filter(Boolean);
const esParam = (s) => s.startsWith(':') || s === '*';

// ¿`a` engulle a `b`? Es decir: ¿toda URL que casa con `b` casa también con `a`?
// Sólo eso es peligroso. Que dos patrones se rocen en algún caso raro no lo es:
// /api/ensayos/:id/base y /api/ensayos/full-assay/:id comparten únicamente la URL
// /api/ensayos/full-assay/base, y ninguna deja inalcanzable a la otra.
function engulle(a, b) {
    if (a.metodo !== b.metodo) return false;
    const sa = segmentos(a.ruta);
    const sb = segmentos(b.ruta);
    if (sa.length !== sb.length) return false;
    return sa.every((s, i) => esParam(s) || s === sb[i]);
}

const rutasOrdenadas = filas.filter((f) => f.tipo === 'RUTA');
const paresSolape = [];
for (let i = 0; i < rutasOrdenadas.length; i++) {
    for (let j = i + 1; j < rutasOrdenadas.length; j++) {
        const a = rutasOrdenadas[i];   // registrada antes
        const b = rutasOrdenadas[j];   // registrada después
        if (a.ruta === b.ruta) continue;              // eso es una tapada, ya marcada
        const aEngulleB = engulle(a, b);
        const bEngulleA = engulle(b, a);
        if (!aEngulleB && !bEngulleA) continue;

        const par = `${a.metodo} ${a.ruta}  ->  ${b.metodo} ${b.ruta}`;
        if (aEngulleB && bEngulleA) {
            // Mismo patrón con otro nombre de parámetro: la segunda es inalcanzable.
            paresSolape.push(`INALCANZABLE  ${par}   (mismo patrón, sólo cambia el nombre del parámetro)`);
        } else if (aEngulleB) {
            // La general va primero: se come a la específica.
            paresSolape.push(`INALCANZABLE  ${par}   (la primera engulle a la segunda)`);
        } else {
            // La específica va primero: correcto. Este orden hay que conservarlo.
            paresSolape.push(`ORDEN OK      ${par}   (la específica va antes que la general)`);
        }
    }
}
paresSolape.sort();

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

const bloqueSolapes = [
    '',
    '# ' + '='.repeat(76),
    `# ${paresSolape.length} PARES CON SOLAPE DE PATRÓN — aquí el orden relativo ES comportamiento.`,
    '# Si al reordenar el archivo un par cambia de sentido, la segunda ruta deja de',
    '# existir sin dar ningún error. Esta lista tiene que quedar igual tras B3/B4.',
    '# ' + '='.repeat(76),
    '',
].concat(paresSolape);

const contenido = cabecera.concat(lineas).concat(bloqueSolapes).join('\n') + '\n';

if (!verificar) {
    fs.writeFileSync(salida, contenido, 'utf8');
    console.log(`${rutas.length} rutas, ${tapadas.length} tapadas -> ${path.relative(BACKEND, salida)}`);
    process.exit(0);
}

// --- Modo verificación: comparar contra la línea base sin tocarla ---------
if (!fs.existsSync(LINEA_BASE)) {
    console.error(`FALLO: no existe la línea base ${path.relative(BACKEND, LINEA_BASE)}.`);
    console.error('Genérala primero con: node scripts/inventario-rutas.js');
    process.exit(1);
}

// Normalizamos CRLF: da igual cómo git haya dejado el archivo en disco.
const normalizar = (s) => s.split('\r\n').join('\n');
const base = normalizar(fs.readFileSync(LINEA_BASE, 'utf8')).split('\n');
const ahora = normalizar(contenido).split('\n');

const difs = [];
for (let i = 0; i < Math.max(base.length, ahora.length); i++) {
    if (base[i] !== ahora[i]) {
        difs.push({ n: i + 1, antes: base[i], despues: ahora[i] });
    }
}

if (difs.length === 0) {
    console.log(`OK: ${rutas.length} rutas idénticas a la línea base. Nada cambió.`);
    process.exit(0);
}

console.error(`FALLO: ${difs.length} línea(s) distintas respecto a la línea base.\n`);
for (const d of difs.slice(0, 40)) {
    if (d.antes !== undefined) console.error(`  ${String(d.n).padStart(4)} -  ${d.antes}`);
    if (d.despues !== undefined) console.error(`  ${String(d.n).padStart(4)} +  ${d.despues}`);
}
if (difs.length > 40) console.error(`  ... y ${difs.length - 40} más`);
console.error('\nSi el cambio es deliberado, regenera la línea base con:');
console.error('  node scripts/inventario-rutas.js');
process.exit(1);
