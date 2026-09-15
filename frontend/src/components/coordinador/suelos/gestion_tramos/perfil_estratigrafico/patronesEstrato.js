/**
 * patronesEstrato.js
 * ---------------------------------------------------------------------------
 * Definiciones de patrones SVG tipo geología/Autodesk para el perfil
 * estratigráfico. El TIPO de patrón (patron_svg) y los colores vienen de la
 * base de datos (suelos_diccionario_nlp); aquí solo se dibujan.
 */

// Claves válidas de patrón (coinciden con el CHECK de la migración 047)
export const PATRON_KEYS = [
    'grava', 'grava_arena', 'arena', 'limo', 'arcilla',
    'roca', 'roca_fracturada', 'relleno', 'afirmado', 'generico'
];

// --- Utilidades de color ----------------------------------------------------

export const clampHex = (hex, fallback = '#999999') => {
    if (typeof hex !== 'string') return fallback;
    const h = hex.trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h) ? h : fallback;
};

export const hexARgb = (hex) => {
    const h = clampHex(hex).replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16)
    };
};

// Mezcla un color con blanco (factor 0 = color puro, 1 = blanco)
export const aclarar = (hex, factor) => {
    const { r, g, b } = hexARgb(hex);
    const mix = (c) => Math.round(c + (255 - c) * factor);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

// Oscurece un color (factor 0 = color puro, 1 = negro)
export const oscurecer = (hex, factor) => {
    const { r, g, b } = hexARgb(hex);
    const mix = (c) => Math.round(c * (1 - factor));
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

// --- Contenido de cada patrón ------------------------------------------------
// Cada función devuelve los elementos internos de un <pattern> de 1 tile.
// stroke/fill usan el color de trama del material.

const TRAMAS = {
    grava: (c) => (
        <>
            <circle cx="4" cy="4" r="3.1" fill="none" stroke={c} strokeWidth="1" />
            <circle cx="12.5" cy="8" r="2.6" fill="none" stroke={c} strokeWidth="1" />
            <circle cx="6" cy="11.5" r="1.7" fill="none" stroke={c} strokeWidth="0.9" />
            <circle cx="14.5" cy="2" r="1.4" fill="none" stroke={c} strokeWidth="0.8" />
        </>
    ),
    grava_arena: (c) => (
        <>
            <circle cx="4.5" cy="4.5" r="2.4" fill="none" stroke={c} strokeWidth="0.9" />
            <circle cx="12" cy="9" r="2" fill="none" stroke={c} strokeWidth="0.9" />
            <circle cx="10" cy="2.5" r="0.7" fill={c} />
            <circle cx="2" cy="10.5" r="0.7" fill={c} />
            <circle cx="14" cy="14" r="0.7" fill={c} />
            <circle cx="7" cy="14" r="0.55" fill={c} />
        </>
    ),
    arena: (c) => (
        <>
            <circle cx="3" cy="3" r="0.75" fill={c} />
            <circle cx="9.5" cy="5.5" r="0.75" fill={c} />
            <circle cx="14" cy="2.5" r="0.75" fill={c} />
            <circle cx="6" cy="9.5" r="0.75" fill={c} />
            <circle cx="12.5" cy="12" r="0.75" fill={c} />
            <circle cx="2.5" cy="13.5" r="0.75" fill={c} />
        </>
    ),
    limo: (c) => (
        <>
            <line x1="0" y1="3" x2="6" y2="3" stroke={c} strokeWidth="0.8" />
            <line x1="9" y1="3" x2="14" y2="3" stroke={c} strokeWidth="0.8" />
            <line x1="3" y1="8" x2="9" y2="8" stroke={c} strokeWidth="0.8" />
            <line x1="12" y1="8" x2="16" y2="8" stroke={c} strokeWidth="0.8" />
            <line x1="0" y1="13" x2="5" y2="13" stroke={c} strokeWidth="0.8" />
            <line x1="8" y1="13" x2="14" y2="13" stroke={c} strokeWidth="0.8" />
        </>
    ),
    arcilla: (c) => (
        <>
            <line x1="-2" y1="6" x2="6" y2="-2" stroke={c} strokeWidth="0.9" />
            <line x1="2" y1="12" x2="12" y2="2" stroke={c} strokeWidth="0.9" />
            <line x1="8" y1="18" x2="18" y2="8" stroke={c} strokeWidth="0.9" />
        </>
    ),
    roca: (c) => (
        <>
            <path d="M2,2 L7,1 L9,5 L5,7 Z" fill="none" stroke={c} strokeWidth="1.1" />
            <path d="M10,4 L15,3 L16,8 L11,9 Z" fill="none" stroke={c} strokeWidth="1.1" />
            <path d="M3,9 L8,8.5 L9.5,13 L4,14 Z" fill="none" stroke={c} strokeWidth="1.1" />
            <path d="M11,11 L15.5,10.5 L16,15 L11.5,15.5 Z" fill="none" stroke={c} strokeWidth="1.1" />
        </>
    ),
    roca_fracturada: (c) => (
        <>
            <path d="M2,2 L7,1 L9,5 L5,7 Z" fill="none" stroke={c} strokeWidth="1.1" />
            <path d="M10,4 L15,3 L16,8 L11,9 Z" fill="none" stroke={c} strokeWidth="1.1" />
            <path d="M3,9 L8,8.5 L9.5,13 L4,14 Z" fill="none" stroke={c} strokeWidth="1.1" />
            <line x1="0" y1="7.5" x2="16" y2="7.5" stroke={c} strokeWidth="0.7" strokeDasharray="3 2" />
            <line x1="8.5" y1="0" x2="9.5" y2="16" stroke={c} strokeWidth="0.7" strokeDasharray="3 2" />
        </>
    ),
    relleno: (c) => (
        <>
            <line x1="0" y1="0" x2="8" y2="8" stroke={c} strokeWidth="0.7" />
            <line x1="8" y1="0" x2="0" y2="8" stroke={c} strokeWidth="0.7" />
        </>
    ),
    afirmado: (c) => (
        <>
            <rect x="0" y="1" width="16" height="3" fill={c} opacity="0.85" />
            <rect x="0" y="9" width="16" height="2.2" fill={c} opacity="0.55" />
        </>
    ),
    generico: (c) => (
        <>
            <circle cx="4" cy="4" r="0.6" fill={c} />
            <circle cx="12" cy="4" r="0.6" fill={c} />
            <circle cx="4" cy="12" r="0.6" fill={c} />
            <circle cx="12" cy="12" r="0.6" fill={c} />
        </>
    )
};

// Tamaño del tile por patrón
const TILE = {
    grava: [16, 13],
    grava_arena: [16, 16],
    arena: [16, 15],
    limo: [16, 16],
    arcilla: [10, 10],
    roca: [18, 16],
    roca_fracturada: [18, 16],
    relleno: [8, 8],
    afirmado: [16, 14],
    generico: [16, 16]
};

/**
 * Construye las definiciones <pattern> para las combinaciones únicas
 * (patron_svg, color) presentes en los estratos visibles.
 * combos: array de { patron_svg, color } — devuelve JSX para <defs>.
 */
export const buildPatternDefs = (combos) => {
    const vistos = new Set();
    const defs = [];
    combos.forEach(({ patron_svg, color }) => {
        const key = PATRON_KEYS.includes(patron_svg) ? patron_svg : 'generico';
        const c = clampHex(color, '#7f8c8d');
        const id = patternId(key, c);
        const firma = `${id}`;
        if (vistos.has(firma)) return;
        vistos.add(firma);
        const [w, h] = TILE[key] || TILE.generico;
        const trama = TRAMAS[key] || TRAMAS.generico;
        defs.push(
            <pattern
                key={firma}
                id={id}
                patternUnits="userSpaceOnUse"
                width={w}
                height={h}
            >
                {trama(c)}
            </pattern>
        );
    });
    return defs;
};

// Id determinista de patrón para (clave, color)
export const patternId = (patronSvg, color) => {
    const key = PATRON_KEYS.includes(patronSvg) ? patronSvg : 'generico';
    const { r, g, b } = hexARgb(clampHex(color, '#7f8c8d'));
    return `pe-pat-${key}-${r}-${g}-${b}`;
};

// Fondo suave para un estrato (mezcla del color con blanco)
export const fondoEstrato = (color) => aclarar(clampHex(color, '#999999'), 0.88);

// Borde del estrato
export const bordeEstrato = (color) => oscurecer(clampHex(color, '#999999'), 0.25);

// Mini-swatch (JSX) para la leyenda
export const SwatchPatron = ({ patron_svg, color, width = 26, height = 16 }) => {
    const key = PATRON_KEYS.includes(patron_svg) ? patron_svg : 'generico';
    const c = clampHex(color, '#7f8c8d');
    const id = patternId(key, c);
    const [w, h] = TILE[key] || TILE.generico;
    const trama = TRAMAS[key] || TRAMAS.generico;
    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <defs>
                <pattern id={`${id}-ley`} patternUnits="userSpaceOnUse" width={w} height={h}>
                    {trama(c)}
                </pattern>
            </defs>
            <rect
                x="0.5" y="0.5" width={width - 1} height={height - 1}
                fill={`url(#${id}-ley)`}
                stroke={bordeEstrato(c)} strokeWidth="1"
            />
        </svg>
    );
};
