/**
 * PerfilEstratigraficoVista.jsx
 * ---------------------------------------------------------------------------
 * Visor de perfil estratigráfico estilo Autodesk para el tramo seleccionado:
 *  - Columnas por progresiva con estratos rayados según el patrón del material
 *    (diseño resuelto en BD: suelos_diccionario_nlp.patron_svg + colores).
 *  - Panel inferior con resultados de ensayos (LL, IP, AASHTO, Proctor,
 *    %pasa, Cu/Cc, CBR) calculados con el mismo motor de la vista de ensayos.
 *  - Selector de cantidad de progresivas visibles (default 20) con bloques.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import html2canvas from 'html2canvas';
import './PerfilEstratigraficoVista.css';
import {
    buildPatternDefs,
    patternId,
    fondoEstrato,
    bordeEstrato,
    clampHex,
    SwatchPatron,
    PATRON_KEYS
} from './patronesEstrato';
import {
    construirPanelEnsayos,
    resetCacheEnsayos
} from './ensayosPerfil';

const API_URL = process.env.REACT_APP_API_BASE || '';

// Dimensiones de la lámina (px)
const LABEL_W = 170;   // columna de etiquetas (sticky)
const COL_W = 46;      // ancho de cada columna de progresiva
const AXIS_W = 56;     // eje de profundidad derecho

const OPCIONES_LIMITE = [10, 20, 30, 40, 50, 100, 200];

const getAuthHeaders = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    return userData?.token ? { Authorization: `Bearer ${userData.token}` } : {};
};

const fmtCota = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '';
};

const estacionDeCodigo = (codigo) => {
    if (!codigo || typeof codigo !== 'string') return '';
    const partes = codigo.split('-');
    return partes.length > 1 ? partes[partes.length - 1] : codigo;
};

export default function PerfilEstratigraficoVista({ tramo }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(20);
    const [offset, setOffset] = useState(0);
    const [soloConDatos, setSoloConDatos] = useState(true); // default: solo progresivas con estratos
    const [exportando, setExportando] = useState(false);
    const [exportandoExcel, setExportandoExcel] = useState(false);
    const [exportandoDxf, setExportandoDxf] = useState(false);
    const [leyendaAbierta, setLeyendaAbierta] = useState(false);
    const [filtroLeyenda, setFiltroLeyenda] = useState('');
    const [hover, setHover] = useState(null); // { x, y, titulo, filas: [...] }

    const sheetRef = useRef(null);
    const rootRef = useRef(null);
    const tooltipRef = useRef(null);

    // --- Carga de datos -------------------------------------------------------
    const fetchPerfil = useCallback(async (signal) => {
        if (!tramo?.id) return;
        setLoading(true);
        setError(null);
        resetCacheEnsayos();
        try {
            const res = await axios.get(
                `${API_URL}/api/tramos/${tramo.id}/perfil-estratigrafico?limit=${limit}&offset=${offset}&soloConDatos=${soloConDatos}`,
                { headers: getAuthHeaders(), signal }
            );
            setData(res.data);
        } catch (err) {
            // Peticiones canceladas por un cambio de bloque/tramo: se ignoran
            if (axios.isCancel?.(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
            const msg = err.response?.data?.error || err.message;
            setError(msg);
            alertify.error(`Error al cargar el perfil estratigráfico: ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [tramo?.id, limit, offset, soloConDatos]);

    useEffect(() => {
        if (!tramo?.id) return undefined;
        const controller = new AbortController();
        fetchPerfil(controller.signal);
        return () => controller.abort();
    }, [fetchPerfil, tramo?.id]);

    // Cambiar límite resetea al primer bloque
    const handleLimitChange = (nuevo) => {
        setLimit(nuevo);
        setOffset(0);
    };

    // Alterna entre solo progresivas con datos y todas
    const handleToggleSoloConDatos = () => {
        setSoloConDatos((v) => !v);
        setOffset(0);
    };

    const total = data?.total ?? 0;
    const progresivas = data?.progresivas ?? [];
    const bloqueActual = Math.floor(offset / limit) + 1;
    const totalBloques = Math.max(1, Math.ceil(total / limit));

    // --- Geometría del gráfico ------------------------------------------------
    const maxDepth = useMemo(() => {
        let m = 0;
        for (const p of progresivas) {
            for (const e of p.estratos || []) {
                const f = Number(e.profundidad_final);
                if (Number.isFinite(f) && f > m) m = f;
            }
        }
        return Math.max(1.5, Math.ceil(m * 10) / 10);
    }, [progresivas]);

    const pxPerMeter = useMemo(() => {
        const px = 420 / maxDepth;
        return Math.max(90, Math.min(300, px));
    }, [maxDepth]);

    const chartH = Math.round(maxDepth * pxPerMeter);
    const sheetW = LABEL_W + progresivas.length * COL_W + AXIS_W;

    const { labelStep, minorStep } = useMemo(() => {
        let ls = 0.1;
        if (maxDepth > 8) ls = 1;
        else if (maxDepth > 4) ls = 0.5;
        else if (maxDepth > 2) ls = 0.2;
        let ms = ls / 5;
        if (pxPerMeter * ms < 6) ms = ls / 2;
        return { labelStep: ls, minorStep: ms };
    }, [maxDepth, pxPerMeter]);

    // Segmentos por columna (estratos + huecos rellenados con genérico)
    const columnas = useMemo(() => {
        return progresivas.map((p) => {
            const estratos = [...(p.estratos || [])]
                .filter((e) => Number(e.profundidad_final) > Number(e.profundidad_inicial))
                .sort((a, b) => Number(a.profundidad_inicial) - Number(b.profundidad_inicial));
            const segmentos = [];
            let cursor = 0;
            for (const e of estratos) {
                const ini = Number(e.profundidad_inicial);
                const fin = Math.min(Number(e.profundidad_final), maxDepth);
                if (ini > cursor + 0.001) {
                    segmentos.push({ tipo: 'hueco', desde: cursor, hasta: ini });
                }
                if (fin > cursor) {
                    segmentos.push({ tipo: 'estrato', desde: Math.max(ini, cursor), hasta: fin, estrato: e });
                    cursor = fin;
                }
                if (cursor >= maxDepth) break;
            }
            if (cursor < maxDepth) {
                segmentos.push({ tipo: 'hueco', desde: cursor, hasta: maxDepth });
            }
            return { progresiva: p, segmentos };
        });
    }, [progresivas, maxDepth]);

    // Defs de patrones para las combinaciones (tipo, color) visibles
    const patternDefs = useMemo(() => {
        const combos = [];
        columnas.forEach(({ segmentos }) => {
            segmentos.forEach((seg) => {
                if (seg.tipo === 'estrato') {
                    combos.push({
                        patron_svg: seg.estrato.patron?.patron_svg,
                        color: seg.estrato.patron?.color_hex_sugerido
                    });
                }
            });
        });
        return buildPatternDefs(combos);
    }, [columnas]);

    // Panel de ensayos compacto: filas desde results_config (BD), valores por
    // progresiva, filas sin ningún dato eliminadas y encabezados sin repetir
    const panelEnsayos = useMemo(
        () => construirPanelEnsayos(progresivas),
        [progresivas]
    );
    const filasEnsayo = panelEnsayos.filas;
    const valoresPorProgresiva = panelEnsayos.valoresPorProgresiva;

    // Leyenda: catálogo deduplicado + filtro de búsqueda
    const patronesLeyenda = useMemo(() => {
        const vistos = new Map();
        (data?.patrones || []).forEach((p) => {
            if (!vistos.has(p.nombre_original_excel)) vistos.set(p.nombre_original_excel, p);
        });
        return [...vistos.values()];
    }, [data]);

    const sinAcentos = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const patronesFiltrados = useMemo(() => {
        const q = sinAcentos(filtroLeyenda.trim());
        if (!q) return patronesLeyenda;
        return patronesLeyenda.filter((p) =>
            sinAcentos(p.nombre_original_excel).includes(q)
            || sinAcentos(p.clasificacion_sucs).includes(q)
            || sinAcentos(p.clasificacion_aashto).includes(q)
        );
    }, [patronesLeyenda, filtroLeyenda]);

    // Etiquetas del eje de profundidad (memorizadas: no dependen del render)
    const marcas = useMemo(() => {
        const lista = [];
        for (let d = 0; d <= maxDepth + 1e-9; d += minorStep) {
            const esMayor = Math.abs((d / labelStep) - Math.round(d / labelStep)) < 1e-6;
            lista.push({ d: Math.round(d * 100) / 100, esMayor });
        }
        return lista;
    }, [maxDepth, labelStep, minorStep]);

    // --- Interacción ----------------------------------------------------------
    // La POSICIÓN del tooltip se actualiza por ref (sin setState) para evitar
    // re-renderizar todo el SVG en cada mousemove; el ESTADO solo cambia al
    // entrar/salir de un estrato (contenido + highlight).
    const moverTooltip = (evt) => {
        const rect = rootRef.current?.getBoundingClientRect();
        const el = tooltipRef.current;
        if (!rect || !el) return;
        el.style.left = `${evt.clientX - rect.left + 14}px`;
        el.style.top = `${evt.clientY - rect.top + 12}px`;
    };

    const tooltipEstrato = (evt, progresiva, estrato) => {
        setHover((prev) => {
            if (prev?.estratoId === estrato.id) return prev;
            const patron = estrato.patron || {};
            const filas = [
                { k: 'Profundidad', v: `${Number(estrato.profundidad_inicial).toFixed(2)} – ${Number(estrato.profundidad_final).toFixed(2)} m` },
                { k: 'Clasificación', v: patron.clasificacion_sucs || '—' },
                { k: 'Patrón', v: patron.matched ? (patron.nombre_material || '—') : 'Genérico (sin match)' }
            ];
            (estrato.ensayos || []).forEach((ens) => {
                filas.push({ k: 'Ensayo', v: `${ens.tipo_ensayo_descripcion || ens.config_key || ''} · ${ens.nombre_ensayo || ens.codigo_ensayo || ''}` });
            });
            return {
                estratoId: estrato.id,
                titulo: `${progresiva.nombre || progresiva.codigo} — ${estrato.nombre || 'Sin material'}`,
                filas
            };
        });
        moverTooltip(evt);
    };

    const handleExportPNG = async () => {
        if (!sheetRef.current) return;
        setExportando(true);
        try {
            const canvas = await html2canvas(sheetRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `perfil_estratigrafico_tramo_${tramo?.codigo || 'export'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alertify.success('Perfil exportado como imagen.');
        } catch (err) {
            console.error('Error al exportar el perfil:', err);
            alertify.error('No se pudo exportar la imagen del perfil.');
        } finally {
            setExportando(false);
        }
    };

    // Exporta TODO el perfil estratigráfico del tramo a Excel (lámina estilo
    // web + detalle de estratos + leyenda). Los valores del panel se calculan
    // aquí con el mismo motor config-driven que la pantalla y el archivo lo
    // genera openpyxl en el worker Python del backend.
    const exportarExcel = async () => {
        if (!tramo?.id || exportandoExcel) return;
        setExportandoExcel(true);
        try {
            const headers = getAuthHeaders();
            const payload = await armarPayloadPerfil(headers);
            if (!payload) return;

            // 3. Generar y descargar
            const resp = await axios.post(
                `${API_URL}/api/tramos/${tramo.id}/perfil-estratigrafico/exportar-excel`,
                payload,
                { headers, responseType: 'blob' }
            );
            const url = URL.createObjectURL(resp.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `perfil_estratigrafico_${tramo.codigo || 'tramo'}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
            alertify.success('Excel del perfil estratigráfico exportado.');
        } catch (err) {
            console.error('Error al exportar el perfil a Excel:', err);
            alertify.error('No se pudo exportar el Excel del perfil.');
        } finally {
            setExportandoExcel(false);
        }
    };

    // Descarga todas las progresivas del tramo y arma el payload común del
    // perfil (mismo para el Excel y el DXF de AutoCAD). Devuelve null si
    // no hay progresivas.
    const armarPayloadPerfil = async (headers) => {
        const todas = [];
        let total = 0;
        let off = 0;
        do {
            const res = await axios.get(
                `${API_URL}/api/tramos/${tramo.id}/perfil-estratigrafico?limit=200&offset=${off}&soloConDatos=${soloConDatos}`,
                { headers }
            );
            total = res.data?.total ?? 0;
            todas.push(...(res.data?.progresivas || []));
            off += 200;
        } while (off < total && todas.length < total);

        if (todas.length === 0) {
            alertify.warning('No hay progresivas para exportar.');
            return null;
        }

        resetCacheEnsayos();
        const panel = construirPanelEnsayos(todas);
        const valores = {};
        const nEnsayos = {};
        panel.valoresPorProgresiva.forEach((info, pid) => {
            valores[String(pid)] = panel.filas.map((f) => info.valores.get(f.key) ?? '');
            nEnsayos[String(pid)] = info.nEnsayos;
        });

        return {
            tramo: { codigo: tramo.codigo, nombre: tramo.nombre },
            soloConDatos,
            totalProgresivas: total,
            fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
            patrones: (data?.patrones || []).map((p) => ({
                nombre_original_excel: p.nombre_original_excel,
                clasificacion_sucs: p.clasificacion_sucs,
                clasificacion_aashto: p.clasificacion_aashto,
                color_hex_sugerido: p.color_hex_sugerido,
                patron_svg: p.patron_svg
            })),
            progresivas: todas.map((p) => ({
                id: p.id,
                codigo: p.codigo,
                nombre: p.nombre,
                elevacion: p.elevacion,
                estratos: (p.estratos || []).map((e) => ({
                    id: e.id,
                    nombre: e.nombre,
                    descripcion: e.descripcion,
                    profundidad_inicial: e.profundidad_inicial,
                    profundidad_final: e.profundidad_final,
                    nlp_clasificacion_sucs: e.nlp_clasificacion_sucs,
                    nlp_clasificacion_aashto: e.nlp_clasificacion_aashto,
                    n_ensayos: (e.ensayos || []).length,
                    patron: e.patron
                }))
            })),
            panel: {
                filas: panel.filas.map((f) => ({
                    tipoDescripcion: f.tipoDescripcion,
                    groupTitle: f.groupTitle,
                    label: f.label,
                    mostrarTipo: f.mostrarTipo,
                    mostrarGrupo: f.mostrarGrupo
                })),
                valores,
                nEnsayos
            }
        };
    };

    const exportarDxf = async () => {
        if (!tramo?.id || exportandoDxf) return;
        setExportandoDxf(true);
        try {
            const headers = getAuthHeaders();
            const payload = await armarPayloadPerfil(headers);
            if (!payload) return;
            const resp = await axios.post(
                `${API_URL}/api/tramos/${tramo.id}/perfil-estratigrafico/exportar-dxf`,
                payload,
                { headers, responseType: 'blob' }
            );
            const url = URL.createObjectURL(resp.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `perfil_estratigrafico_${tramo.codigo || 'tramo'}.dxf`;
            link.click();
            URL.revokeObjectURL(url);
            alertify.success('DXF del perfil estratigráfico exportado (ábrela en AutoCAD).');
        } catch (err) {
            console.error('Error al exportar el perfil a DXF:', err);
            alertify.error('No se pudo exportar el DXF del perfil.');
        } finally {
            setExportandoDxf(false);
        }
    };

    // --- Render ----------------------------------------------------------------

    if (!tramo) {
        return (
            <div className="pe-root">
                <div className="pe-empty">
                    <i className="fas fa-layer-group"></i>
                    <p>Selecciona un tramo para ver su perfil estratigráfico.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pe-root" ref={rootRef}>
            {/* Cabecera y controles */}
            <div className="pe-toolbar">
                <div className="pe-titulo">
                    <h3>PERFIL ESTRATIGRÁFICO</h3>
                    <span className="pe-tramo-badge">
                        Tramo {tramo.codigo}{tramo.nombre ? ` — ${tramo.nombre}` : ''}
                    </span>
                </div>
                <div className="pe-controles">
                    <label>
                        Progresivas:
                        <select value={limit} onChange={(e) => handleLimitChange(Number(e.target.value))}>
                            {OPCIONES_LIMITE.map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </label>
                    <div className="pe-bloques">
                        <button
                            type="button"
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0 || loading}
                            title="Bloque anterior"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span>Bloque {bloqueActual} de {totalBloques}</span>
                        <button
                            type="button"
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= total || loading}
                            title="Bloque siguiente"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <button
                        type="button"
                        className={`pe-btn-toggle ${soloConDatos ? 'pe-btn-toggle-activo' : ''}`}
                        onClick={handleToggleSoloConDatos}
                        disabled={loading}
                        title={soloConDatos
                            ? 'Mostrando solo progresivas con estratos que tienen ensayos. Clic para ver todas.'
                            : 'Mostrando todas las progresivas. Clic para ver solo las que tienen ensayos.'}
                    >
                        <i className={`fas ${soloConDatos ? 'fa-filter' : 'fa-list'}`}></i>
                        {soloConDatos ? 'Solo con datos' : 'Todas las progresivas'}
                    </button>
                    <span className="pe-total">Total: {total} progresivas</span>
                    <button type="button" className="pe-btn-exportar" onClick={handleExportPNG} disabled={exportando || loading}>
                        <i className="fas fa-image"></i> {exportando ? 'Exportando…' : 'Exportar PNG'}
                    </button>
                    <button type="button" className="pe-btn-exportar" onClick={exportarExcel} disabled={exportandoExcel || loading}>
                        <i className="fas fa-file-excel"></i> {exportandoExcel ? 'Generando…' : 'Exportar Excel'}
                    </button>
                    <button type="button" className="pe-btn-exportar" onClick={exportarDxf} disabled={exportandoDxf || loading}
                        title="Descarga el perfil en DXF para abrir en AutoCAD (escala 1 m = 100 unidades)">
                        <i className="fas fa-drafting-compass"></i> {exportandoDxf ? 'Generando…' : 'Exportar DXF'}
                    </button>
                    <button type="button" className="pe-btn-leyenda" onClick={() => setLeyendaAbierta((v) => !v)}>
                        <i className="fas fa-map"></i> Leyenda
                    </button>
                </div>
            </div>

            {/* Leyenda flotante vertical (lado derecho) */}
            {leyendaAbierta && (
                <div className="pe-leyenda-flotante">
                    <div className="pe-leyenda-header">
                        <span>
                            <i className="fas fa-map"></i> Leyenda de materiales
                        </span>
                        <button
                            type="button"
                            className="pe-leyenda-cerrar"
                            onClick={() => setLeyendaAbierta(false)}
                            title="Cerrar leyenda"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <input
                        type="text"
                        className="pe-leyenda-buscar"
                        placeholder="Buscar material o clasificación…"
                        value={filtroLeyenda}
                        onChange={(e) => setFiltroLeyenda(e.target.value)}
                    />
                    <div className="pe-leyenda-lista custom-scrollbar">
                        {patronesFiltrados.length === 0 && (
                            <div className="pe-leyenda-vacia">Sin coincidencias.</div>
                        )}
                        {patronesFiltrados.map((p) => (
                            <div key={p.id} className="pe-leyenda-item" title={p.nombre_original_excel}>
                                <SwatchPatron patron_svg={p.patron_svg} color={p.color_hex_sugerido} width={32} height={20} />
                                <div className="pe-leyenda-textos">
                                    <span className="pe-leyenda-nombre">{p.nombre_original_excel}</span>
                                    <span className="pe-leyenda-clasif">
                                        {p.clasificacion_sucs || '—'}{p.clasificacion_aashto ? ` · ${p.clasificacion_aashto}` : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {patronesFiltrados.length < patronesLeyenda.length || !filtroLeyenda ? (
                            <div className="pe-leyenda-item pe-leyenda-generico" title="Material sin coincidencia en el catálogo">
                                <SwatchPatron patron_svg="generico" color="#B3B8BC" width={32} height={20} />
                                <div className="pe-leyenda-textos">
                                    <span className="pe-leyenda-nombre">Genérico (sin match)</span>
                                    <span className="pe-leyenda-clasif">—</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div className="pe-leyenda-footer">
                        {patronesLeyenda.length} materiales en el catálogo
                    </div>
                </div>
            )}

            {/* Contenido */}
            {loading ? (
                <div className="pe-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Cargando perfil estratigráfico…</p>
                </div>
            ) : error ? (
                <div className="pe-empty pe-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar el perfil: {error}</p>
                </div>
            ) : progresivas.length === 0 ? (
                <div className="pe-empty">
                    <i className="fas fa-layer-group"></i>
                    {soloConDatos ? (
                        <>
                            <p>Ninguna de las progresivas de este bloque tiene datos estratigráficos.</p>
                            <button type="button" className="pe-btn-toggle pe-btn-toggle-activo" onClick={handleToggleSoloConDatos}>
                                <i className="fas fa-list"></i> Ver todas las progresivas
                            </button>
                        </>
                    ) : (
                        <p>El tramo no tiene progresivas.</p>
                    )}
                </div>
            ) : (
                <div className="pe-scroll custom-scrollbar">
                    <div className="pe-sheet" ref={sheetRef} style={{ width: sheetW }}>

                        {/* Fila N° correlativo */}
                        <div className="pe-fila pe-fila-num">
                            <div className="pe-celda-label" style={{ width: LABEL_W }}>N°</div>
                            {progresivas.map((p, i) => (
                                <div key={p.id} className="pe-celda-col" style={{ width: COL_W }} title={p.codigo}>
                                    {offset + i + 1}
                                </div>
                            ))}
                            <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                        </div>

                        {/* Fila códigos de progresiva (rotados) */}
                        <div className="pe-fila pe-fila-codigos">
                            <div className="pe-celda-label" style={{ width: LABEL_W }}>Progresiva (km)</div>
                            {progresivas.map((p) => (
                                <div key={p.id} className="pe-celda-col pe-celda-rotada" style={{ width: COL_W }} title={`${p.codigo} · ${p.nombre || ''}`}>
                                    <span>{p.nombre || estacionDeCodigo(p.codigo)}</span>
                                </div>
                            ))}
                            <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                        </div>

                        {/* Gráfico SVG */}
                        <svg
                            className="pe-svg"
                            width={sheetW}
                            height={chartH}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>{patternDefs}</defs>

                            {/* Fondo */}
                            <rect x="0" y="0" width={sheetW} height={chartH} fill="#ffffff" />

                            {/* Grilla horizontal */}
                            {marcas.map(({ d, esMayor }) => (
                                <line
                                    key={`g-${d}`}
                                    x1={LABEL_W}
                                    x2={sheetW - AXIS_W}
                                    y1={d * pxPerMeter}
                                    y2={d * pxPerMeter}
                                    stroke={esMayor ? '#4a7ebb' : '#c9d8e8'}
                                    strokeWidth={esMayor ? 1 : 0.5}
                                />
                            ))}

                            {/* Etiquetas eje izquierdo y derecho */}
                            {marcas.filter(({ esMayor }) => esMayor).map(({ d }) => (
                                <g key={`t-${d}`}>
                                    <text x={LABEL_W - 6} y={d * pxPerMeter + 3} textAnchor="end" className="pe-eje-texto">
                                        {d.toFixed(2)}
                                    </text>
                                    <text x={sheetW - AXIS_W + 6} y={d * pxPerMeter + 3} textAnchor="start" className="pe-eje-texto">
                                        {d.toFixed(2)}
                                    </text>
                                </g>
                            ))}

                            {/* Columnas de estratos */}
                            {columnas.map(({ progresiva, segmentos }, idx) => {
                                const xCol = LABEL_W + idx * COL_W;
                                return (
                                    <g key={progresiva.id}>
                                        {segmentos.map((seg, si) => {
                                            const yIni = seg.desde * pxPerMeter;
                                            const alto = (seg.hasta - seg.desde) * pxPerMeter;
                                            if (alto <= 0.5) return null;

                                            if (seg.tipo === 'hueco') {
                                                return (
                                                    <rect
                                                        key={`s-${si}`}
                                                        x={xCol}
                                                        y={yIni}
                                                        width={COL_W}
                                                        height={alto}
                                                        fill={fondoEstrato('#B3B8BC')}
                                                        stroke="#c9d8e8"
                                                        strokeWidth="0.5"
                                                    />
                                                );
                                            }

                                            const patron = seg.estrato.patron || {};
                                            const key = PATRON_KEYS.includes(patron.patron_svg) ? patron.patron_svg : 'generico';
                                            const color = clampHex(patron.color_hex_sugerido, '#7f8c8d');
                                            const pid = patternId(key, color);
                                            const hoverId = hover?.estratoId === seg.estrato.id;

                                            return (
                                                <g key={`s-${si}`}>
                                                    <rect
                                                        x={xCol}
                                                        y={yIni}
                                                        width={COL_W}
                                                        height={alto}
                                                        fill={fondoEstrato(color)}
                                                    />
                                                    <rect
                                                        x={xCol}
                                                        y={yIni}
                                                        width={COL_W}
                                                        height={alto}
                                                        fill={`url(#${pid})`}
                                                    />
                                                    <rect
                                                        x={xCol}
                                                        y={yIni}
                                                        width={COL_W}
                                                        height={alto}
                                                        fill="none"
                                                        stroke={hoverId ? '#1a4d80' : bordeEstrato(color)}
                                                        strokeWidth={hoverId ? 2 : 0.8}
                                                    />
                                                    {alto >= 15 && (
                                                        <text
                                                            x={xCol + COL_W / 2}
                                                            y={yIni + alto / 2 + 2.5}
                                                            textAnchor="middle"
                                                            className="pe-estrato-texto"
                                                        >
                                                            {(patron.clasificacion_sucs || (seg.estrato.nombre || '').slice(0, 10)).slice(0, 10)}
                                                        </text>
                                                    )}
                                                    <rect
                                                        x={xCol}
                                                        y={yIni}
                                                        width={COL_W}
                                                        height={alto}
                                                        fill="transparent"
                                                        style={{ cursor: 'pointer' }}
                                                        onMouseEnter={(e) => tooltipEstrato(e, progresiva, seg.estrato)}
                                                        onMouseMove={moverTooltip}
                                                        onMouseLeave={() => setHover(null)}
                                                    />
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}

                            {/* Separadores verticales de columna */}
                            {progresivas.map((p, i) => (
                                <line
                                    key={`v-${p.id}`}
                                    x1={LABEL_W + i * COL_W}
                                    x2={LABEL_W + i * COL_W}
                                    y1={0}
                                    y2={chartH}
                                    stroke="#4a7ebb"
                                    strokeWidth="0.8"
                                />
                            ))}
                            <line x1={sheetW - AXIS_W} x2={sheetW - AXIS_W} y1={0} y2={chartH} stroke="#4a7ebb" strokeWidth="0.8" />

                            {/* Borde exterior */}
                            <rect x={LABEL_W} y={0} width={progresivas.length * COL_W} height={chartH} fill="none" stroke="#2c5f8a" strokeWidth="1.4" />
                        </svg>

                        {/* Fila cota de terreno */}
                        <div className="pe-fila pe-fila-cota">
                            <div className="pe-celda-label" style={{ width: LABEL_W }}>Cota terreno (msnm)</div>
                            {progresivas.map((p) => (
                                <div key={p.id} className="pe-celda-col" style={{ width: COL_W }}>
                                    {fmtCota(p.elevacion)}
                                </div>
                            ))}
                            <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                        </div>

                        {/* Panel de ensayos: filas generadas desde results_config (BD) */}
                        <div className="pe-ensayos">
                            <div className="pe-fila pe-fila-ensayo">
                                <div className="pe-celda-label" style={{ width: LABEL_W }}>Ensayos realizados (N°)</div>
                                {progresivas.map((p) => (
                                    <div
                                        key={p.id}
                                        className="pe-celda-col pe-celda-nsayos"
                                        style={{ width: COL_W }}
                                        title={`${p.nombre || p.codigo} — Ensayos realizados`}
                                    >
                                        {(valoresPorProgresiva.get(p.id) || {}).nEnsayos ?? 0}
                                    </div>
                                ))}
                                <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                            </div>

                            {filasEnsayo.map((fila) => (
                                <React.Fragment key={fila.key}>
                                    {fila.mostrarTipo && (
                                        <div className="pe-fila pe-fila-grupo-tipo">
                                            <div className="pe-celda-label" style={{ width: LABEL_W }}>{fila.tipoDescripcion}</div>
                                            {progresivas.map((p) => (
                                                <div key={p.id} className="pe-celda-col" style={{ width: COL_W }}></div>
                                            ))}
                                            <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                                        </div>
                                    )}
                                    {fila.mostrarGrupo && fila.groupTitle && (
                                        <div className="pe-fila pe-fila-grupo">
                                            <div className="pe-celda-label" style={{ width: LABEL_W }}>{fila.groupTitle}</div>
                                            {progresivas.map((p) => (
                                                <div key={p.id} className="pe-celda-col" style={{ width: COL_W }}></div>
                                            ))}
                                            <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                                        </div>
                                    )}
                                    <div className="pe-fila pe-fila-ensayo">
                                        <div className="pe-celda-label" style={{ width: LABEL_W }} title={fila.label}>{fila.label}</div>
                                        {progresivas.map((p) => (
                                            <div
                                                key={p.id}
                                                className="pe-celda-col"
                                                style={{ width: COL_W }}
                                                title={`${p.nombre || p.codigo} — ${fila.label}`}
                                            >
                                                {(valoresPorProgresiva.get(p.id) || {}).valores?.get(fila.key) ?? ''}
                                            </div>
                                        ))}
                                        <div className="pe-celda-eje" style={{ width: AXIS_W }}></div>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Tooltip */}
            {hover && (
                <div
                    ref={tooltipRef}
                    className="pe-tooltip"
                    onMouseLeave={() => setHover(null)}
                >
                    <div className="pe-tooltip-titulo">{hover.titulo}</div>
                    {hover.filas.map((f, i) => (
                        <div key={i} className="pe-tooltip-fila">
                            <span className="pe-tooltip-k">{f.k}:</span> {f.v}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
